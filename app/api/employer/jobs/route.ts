/* eslint-disable @typescript-eslint/no-unnecessary-condition, @typescript-eslint/strict-boolean-expressions, @typescript-eslint/prefer-optional-chain, @typescript-eslint/no-unsafe-type-assertion, @typescript-eslint/no-unsafe-member-access -- session.user can be null even if session is not null */
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { eq, and } from "drizzle-orm";

import { auth } from "@/lib/auth";
import { jobDraft } from "@/lib/auth-schema";
import { db } from "@/lib/db";
import {
  canCreateDraft,
  requireVerifiedEmployer,
  validatePublishFields,
} from "@/lib/jobs/job-publication-policy";

const VALID_EMPLOYMENT_TYPES = [
  "full-time",
  "part-time",
  "contract",
  "seasonal",
  "internship",
] as const;

type ValidEmploymentType = (typeof VALID_EMPLOYMENT_TYPES)[number];

interface CreateJobDraftBody {
  title: string;
  description: string;
  location: string;
  employmentType: ValidEmploymentType;
  salaryMin?: number | null;
  salaryMax?: number | null;
  salaryCurrency?: string;
  salaryPeriod?: string | null;
  requirements?: string | null;
  benefits?: string | null;
}

interface UpdateJobDraftBody extends Partial<CreateJobDraftBody> {
  id: string;
}

function validateCreateDraftBody(body: unknown): {
  valid: boolean;
  error?: string;
  data?: CreateJobDraftBody;
} {
  if (typeof body !== "object" || body === null) {
    return { valid: false, error: "Invalid request body." };
  }

  const partialBody = body as Partial<CreateJobDraftBody>;

  if (partialBody.title === undefined || partialBody.title.trim() === "") {
    return { valid: false, error: "Job title is required." };
  }

  if (partialBody.description === undefined || partialBody.description.trim() === "") {
    return { valid: false, error: "Job description is required." };
  }

  if (partialBody.location === undefined || partialBody.location.trim() === "") {
    return { valid: false, error: "Job location is required." };
  }

  if (partialBody.employmentType === undefined || partialBody.employmentType === null) {
    return { valid: false, error: "Employment type is required." };
  }

  if (!VALID_EMPLOYMENT_TYPES.includes(partialBody.employmentType)) {
    return { valid: false, error: "Invalid employment type." };
  }

  return { valid: true, data: partialBody as CreateJobDraftBody };
}

function validateEmploymentType(employmentType: unknown): employmentType is ValidEmploymentType {
  if (typeof employmentType !== "string") {
    return false;
  }
  return VALID_EMPLOYMENT_TYPES.includes(employmentType as ValidEmploymentType);
}

function validateUpdateDraftBody(body: unknown): {
  valid: boolean;
  error?: string;
  data?: UpdateJobDraftBody;
} {
  if (typeof body !== "object" || body === null) {
    return { valid: false, error: "Invalid request body." };
  }

  const partialBody = body as Partial<UpdateJobDraftBody>;

  if (partialBody.id === undefined || partialBody.id === null || partialBody.id === "") {
    return { valid: false, error: "Job draft ID is required." };
  }

  return { valid: true, data: partialBody as UpdateJobDraftBody };
}

// POST — Create a new job draft
export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session) {
      return NextResponse.json({ error: "Sign in to create job drafts." }, { status: 401 });
    }

    // session.user could still be null even if session is not null
    if (!session.user || !session.user.id) {
      return NextResponse.json({ error: "Sign in to create job drafts." }, { status: 401 });
    }

    const employer = await requireVerifiedEmployer(session.user.id);

    const { allowed, reason } = await canCreateDraft(employer.id);
    if (!allowed) {
      return NextResponse.json({ error: reason }, { status: 403 });
    }

    const body = (await request.json()) as unknown;
    const validation = validateCreateDraftBody(body);

    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const data = validation.data!;
    const [newDraft] = await db
      .insert(jobDraft)
      .values({
        employerId: employer.id,
        title: data.title.trim(),
        description: data.description.trim(),
        location: data.location.trim(),
        employmentType: data.employmentType,
        salaryMin: data.salaryMin ?? null,
        salaryMax: data.salaryMax ?? null,
        salaryCurrency: data.salaryCurrency ?? "USD",
        salaryPeriod: data.salaryPeriod ?? null,
        requirements: data.requirements ?? null,
        benefits: data.benefits ?? null,
        status: "draft",
      })
      .returning();

    return NextResponse.json({ draft: newDraft }, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to create job draft.";
    if (message.includes("verified") || message.includes("verification")) {
      return NextResponse.json({ error: message }, { status: 403 });
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// PATCH — Update an existing draft
export async function PATCH(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session) {
      return NextResponse.json({ error: "Sign in to update job drafts." }, { status: 401 });
    }

    // session.user could still be null even if session is not null
    if (!session.user || !session.user.id) {
      return NextResponse.json({ error: "Sign in to update job drafts." }, { status: 401 });
    }

    const employer = await requireVerifiedEmployer(session.user.id);

    const body = (await request.json()) as unknown;
    const validation = validateUpdateDraftBody(body);

    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const { id, ...updates } = validation.data!;

    // Verify ownership and draft status
    const results = await db
      .select()
      .from(jobDraft)
      .where(and(eq(jobDraft.id, id), eq(jobDraft.employerId, employer.id)));

    if (results.length === 0) {
      return NextResponse.json({ error: "Job draft not found." }, { status: 404 });
    }

    const [existing] = results;

    if (existing.status !== "draft") {
      return NextResponse.json({ error: "Only draft jobs can be edited." }, { status: 400 });
    }

    const allowedFields = [
      "title",
      "description",
      "location",
      "employmentType",
      "salaryMin",
      "salaryMax",
      "salaryCurrency",
      "salaryPeriod",
      "requirements",
      "benefits",
    ] as const;

    const cleanUpdates: Record<string, unknown> = {};
    for (const field of allowedFields) {
      if (updates[field] !== undefined) {
        cleanUpdates[field] = updates[field];
      }
    }

    // Trim string fields
    if (typeof cleanUpdates.title === "string") {
      cleanUpdates.title = cleanUpdates.title.trim();
    }
    if (typeof cleanUpdates.description === "string") {
      cleanUpdates.description = cleanUpdates.description.trim();
    }
    if (typeof cleanUpdates.location === "string") {
      cleanUpdates.location = cleanUpdates.location.trim();
    }

    if (cleanUpdates.employmentType !== undefined) {
      if (!validateEmploymentType(cleanUpdates.employmentType)) {
        return NextResponse.json({ error: "Invalid employment type." }, { status: 400 });
      }
    }

    // Validate publish fields on merged draft for warnings
    const mergedDraft = { ...existing, ...cleanUpdates };
    const warnings = validatePublishFields(mergedDraft);

    cleanUpdates.updatedAt = new Date();

    const [updated] = await db
      .update(jobDraft)
      .set(cleanUpdates)
      .where(eq(jobDraft.id, id))
      .returning();

    return NextResponse.json({ draft: updated, warnings });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to update job draft.";
    if (message.includes("verified") || message.includes("verification")) {
      return NextResponse.json({ error: message }, { status: 403 });
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
