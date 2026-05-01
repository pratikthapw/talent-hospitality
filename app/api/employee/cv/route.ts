import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { eq, and } from "drizzle-orm";

import { auth } from "@/lib/auth";
import { employeeProfile, userRoles } from "@/lib/auth-schema";
import { db } from "@/lib/db";
import {
  getActiveCV,

  /* eslint-disable @typescript-eslint/no-unsafe-type-assertion, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-argument */
  getAllCVs,
  activateCV,
  saveUploadedCV,
  saveBuilderCV,
} from "@/lib/profile/active-cv-manager";

async function requireEmployee(request: NextRequest): Promise<string | null> {
  const session = await auth.api.getSession({ headers: request.headers });
  if (session === null || typeof session.user.id !== "string") {
    return null;
  }
  const userId = session.user.id;
  const rows = await db
    .select({ role: userRoles.role })
    .from(userRoles)
    .where(and(eq(userRoles.userId, userId), eq(userRoles.role, "employee")))
    .limit(1);
  return rows.length > 0 ? userId : null;
}

async function getEmployeeProfileId(userId: string): Promise<string | null> {
  const rows = await db
    .select({ id: employeeProfile.id })
    .from(employeeProfile)
    .where(eq(employeeProfile.userId, userId))
    .limit(1);
  return rows.length > 0 ? rows[0].id : null;
}

/** GET /api/employee/cv — List all CVs and active one */
export async function GET(request: NextRequest) {
  const userId = await requireEmployee(request);
  if (userId === null) {
    return NextResponse.json({ error: "Employee access required." }, { status: 401 });
  }

  const profileId = await getEmployeeProfileId(userId);
  if (profileId === null) {
    return NextResponse.json({ cvs: [], activeCV: null });
  }

  try {
    const cvs = await getAllCVs(profileId);
    const active = await getActiveCV(profileId);

    return NextResponse.json({
      cvs,
      activeCV: active,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to fetch CVs.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

const ALLOWED_FILE_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
] as const;

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

async function handleFileUpload(request: NextRequest, profileId: string): Promise<NextResponse> {
  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file provided." }, { status: 400 });
  }

  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json({ error: "File too large. Maximum size is 5MB." }, { status: 400 });
  }

  if (!ALLOWED_FILE_TYPES.includes(file.type as (typeof ALLOWED_FILE_TYPES)[number])) {
    return NextResponse.json(
      { error: "Invalid file type. Accepted: PDF, DOC, DOCX." },
      { status: 400 },
    );
  }

  const arrayBuffer = await file.arrayBuffer();
  const base64 = Buffer.from(arrayBuffer).toString("base64");
  const dataUrl = `data:${file.type};base64,${base64}`;

  const cv = await saveUploadedCV({
    employeeProfileId: profileId,
    fileName: file.name,
    fileUrl: dataUrl,
    fileSize: file.size,
    mimeType: file.type,
  });

  return NextResponse.json(
    { cv, message: "CV uploaded and activated successfully." },
    { status: 201 },
  );
}

async function handleBuilderSave(request: NextRequest, profileId: string): Promise<NextResponse> {
  const body = (await request.json()) as Record<string, unknown>;

  if (body.source !== "builder") {
    return NextResponse.json(
      {
        error:
          "Invalid source. Use multipart/form-data for uploads or source: 'builder' for builder.",
      },
      { status: 400 },
    );
  }

  const builderContent = body.content;
  if (
    builderContent === undefined ||
    typeof builderContent !== "object" ||
    builderContent === null
  ) {
    return NextResponse.json({ error: "Builder content is required." }, { status: 400 });
  }

  const cv = await saveBuilderCV({
    employeeProfileId: profileId,
    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
    builderContent: builderContent as Record<string, unknown>,
  });

  return NextResponse.json(
    { cv, message: "CV created and activated successfully." },
    { status: 201 },
  );
}

/** POST /api/employee/cv — Create a new CV (upload or builder) */
export async function POST(request: NextRequest) {
  const userId = await requireEmployee(request);
  if (userId === null) {
    return NextResponse.json({ error: "Employee access required." }, { status: 401 });
  }

  const profileId = await getEmployeeProfileId(userId);
  if (profileId === null) {
    return NextResponse.json(
      { error: "Employee profile not found. Please complete your profile first." },
      { status: 400 },
    );
  }

  try {
    const contentType = request.headers.get("content-type") ?? "";
    const handler = contentType.includes("multipart/form-data")
      ? handleFileUpload
      : handleBuilderSave;
    return await handler(request, profileId);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to save CV.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/** PATCH /api/employee/cv — Activate a specific CV */
export async function PATCH(request: NextRequest) {
  const userId = await requireEmployee(request);
  if (userId === null) {
    return NextResponse.json({ error: "Employee access required." }, { status: 401 });
  }

  const profileId = await getEmployeeProfileId(userId);
  if (profileId === null) {
    return NextResponse.json({ error: "Employee profile not found." }, { status: 400 });
  }

  try {
    const _ = (await request.json()) as Record<string, unknown>;

    if (cvId === undefined || cvId.trim() === "") {
      return NextResponse.json({ error: "cvId is required." }, { status: 400 });
    }

    const cv = await activateCV(cvId, profileId);

    return NextResponse.json({ cv, message: "CV activated successfully." });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to activate CV.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
