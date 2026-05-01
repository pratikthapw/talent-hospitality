import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { eq, and } from "drizzle-orm";

import { auth } from "@/lib/auth";
import { cvDocument, employeeProfile, userRoles } from "@/lib/auth-schema";
import { db } from "@/lib/db";
import {
  deactivateActiveCVs,
  saveUploadedCV,
  saveBuilderCV,
} from "@/lib/profile/active-cv-manager";

const ALLOWED_FILE_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
] as const;

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

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

/** POST /api/employee/cv/[cvId]/replace — Replace a specific CV with a new one */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ cvId: string }> },
) {
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

  const { cvId } = await params;

  // Verify the CV belongs to this employee
  const existing = await db
    .select()
    .from(cvDocument)
    .where(and(eq(cvDocument.id, cvId), eq(cvDocument.employeeProfileId, profileId)))
    .limit(1);

  if (existing.length === 0) {
    return NextResponse.json({ error: "CV not found or access denied." }, { status: 404 });
  }

  try {
    const contentType = request.headers.get("content-type") ?? "";

    // Parse request based on content type
    let newCV: Awaited<ReturnType<typeof saveUploadedCV | typeof saveBuilderCV>>;
    if (contentType.includes("multipart/form-data")) {
      // File upload replacement
      const formData = await request.formData();
      const file = formData.get("file");

      if (!(file instanceof File)) {
        return NextResponse.json({ error: "No file provided." }, { status: 400 });
      }

      if (file.size > MAX_FILE_SIZE) {
        return NextResponse.json(
          { error: "File too large. Maximum size is 5MB." },
          { status: 400 },
        );
      }

      // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
      if (!ALLOWED_FILE_TYPES.includes(file.type as (typeof ALLOWED_FILE_TYPES)[number])) {
        return NextResponse.json(
          { error: "Invalid file type. Accepted: PDF, DOC, DOCX." },
          { status: 400 },
        );
      }

      const arrayBuffer = await file.arrayBuffer();
      const base64 = Buffer.from(arrayBuffer).toString("base64");
      const dataUrl = `data:${file.type};base64,${base64}`;

      newCV = await saveUploadedCV({
        employeeProfileId: profileId,
        fileName: file.name,
        fileUrl: dataUrl,
        fileSize: file.size,
        mimeType: file.type,
      });
    } else {
      // Builder replacement
      // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
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

      newCV = await saveBuilderCV({
        employeeProfileId: profileId,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
        builderContent: builderContent as Record<string, unknown>,
      });
    }

    // Deactivate all active CVs (starts retention window on prior active)
    await deactivateActiveCVs(profileId);

    // Mark target CV as replaced
    await db
      .update(cvDocument)
      .set({
        isActive: false,
        replacedAt: new Date(),
        retentionExpiresAt: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
      })
      .where(eq(cvDocument.id, cvId));

    return NextResponse.json(
      {
        cv: newCV,
        replacedCVId: cvId,
        message: "CV replaced successfully. Previous CV is retained for 60 days.",
      },
      { status: 201 },
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to replace CV.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
