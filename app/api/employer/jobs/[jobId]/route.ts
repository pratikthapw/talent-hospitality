/* eslint-disable @typescript-eslint/no-unnecessary-condition, @typescript-eslint/strict-boolean-expressions, @typescript-eslint/prefer-optional-chain, @typescript-eslint/no-unsafe-type-assertion, @typescript-eslint/no-unsafe-member-access -- session.user can be null even if session is not null */
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { requireVerifiedEmployer } from "@/lib/jobs/job-publication-policy";
import { updateLiveJob } from "@/lib/jobs/job-state-machine";

const VALID_EMPLOYMENT_TYPES = [
  "full-time",
  "part-time",
  "contract",
  "seasonal",
  "internship",
] as const;

const EDITABLE_FIELDS = [
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

type EditableField = (typeof EDITABLE_FIELDS)[number];

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> },
) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session) {
      return NextResponse.json({ error: "Sign in to edit jobs." }, { status: 401 });
    }

    if (!session.user || !session.user.id) {
      return NextResponse.json({ error: "Sign in to edit jobs." }, { status: 401 });
    }

    const employer = await requireVerifiedEmployer(session.user.id);

    const { jobId } = await params;
    if (!jobId) {
      return NextResponse.json({ error: "Job ID is required." }, { status: 400 });
    }

    const body = (await request.json()) as unknown;

    if (typeof body !== "object" || body === null) {
      return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
    }

    // Extract only allowed fields from the body
    const updates: Partial<Record<EditableField, unknown>> = {};
    for (const field of EDITABLE_FIELDS) {
      if ((body as Record<string, unknown>)[field] !== undefined) {
        updates[field] = (body as Record<string, unknown>)[field];
      }
    }

    // Validate employmentType if provided
    if (
      updates.employmentType !== undefined &&
      !VALID_EMPLOYMENT_TYPES.includes(
        updates.employmentType as (typeof VALID_EMPLOYMENT_TYPES)[number],
      )
    ) {
      return NextResponse.json({ error: "Invalid employment type." }, { status: 400 });
    }

    const result = await updateLiveJob(jobId, employer.id, updates);

    if (!result.success) {
      const error = result.error ?? "Failed to update job.";

      if (error.includes("not found") || error.includes("do not own")) {
        return NextResponse.json({ error }, { status: 404 });
      }

      return NextResponse.json({ error }, { status: 400 });
    }

    return NextResponse.json({
      message: "Job updated successfully.",
      draft: result.draft,
      warnings: result.warnings,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to update job.";
    if (message.includes("verified") || message.includes("verification")) {
      return NextResponse.json({ error: message }, { status: 403 });
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
