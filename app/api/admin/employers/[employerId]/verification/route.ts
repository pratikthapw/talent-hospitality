/* oxlint-disable typescript-eslint/no-unsafe-assignment, typescript-eslint/no-unsafe-type-assertion, typescript-eslint/prefer-optional-chain, typescript-eslint/no-unnecessary-condition */
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { and, eq } from "drizzle-orm";

import { auth } from "@/lib/auth";
import { userRoles } from "@/lib/auth-schema";
import { db } from "@/lib/db";
import {
  transitionEmployerVerification,
  getEmployerByUserId,
} from "@/lib/verification/employer-verification";

const ALLOWED_STATUSES = ["pending_review", "verified", "rejected"] as const;

type VerificationStatus = (typeof ALLOWED_STATUSES)[number];

function isValidStatus(value: unknown): value is VerificationStatus {
  return typeof value === "string" && (ALLOWED_STATUSES as readonly string[]).includes(value);
}

/** Check the requesting User has the Admin role. Returns admin userId or null. */
async function requireAdmin(request: NextRequest): Promise<string | null> {
  const session = await auth.api.getSession({
    headers: request.headers,
  });

  if (session === null || session.user === null || typeof session.user.id !== "string") {
    return null;
  }

  const userId = session.user.id;

  const adminRows = await db
    .select({ role: userRoles.role })
    .from(userRoles)
    .where(and(eq(userRoles.userId, userId), eq(userRoles.role, "admin")))
    .limit(1);

  if (adminRows.length === 0) {
    return null;
  }

  return userId;
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ employerId: string }> },
) {
  const { employerId } = await params;

  // 1. Require admin access
  const adminId = await requireAdmin(request);
  if (adminId === null) {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }

  try {
    // 2. Parse and validate request body
    const body = await request.json();
    if (typeof body !== "object" || body === null) {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }
    const { status, notes } = body as Record<string, unknown>;

    if (!isValidStatus(status)) {
      return NextResponse.json(
        {
          error: `Invalid Employer Verification status. Must be one of: ${ALLOWED_STATUSES.join(", ")}`,
        },
        { status: 400 },
      );
    }

    // 3. Check Employer Profile exists
    const employer = await getEmployerByUserId(employerId);
    if (!employer) {
      return NextResponse.json({ error: "Employer Profile not found" }, { status: 404 });
    }

    // 4. Transition verification status
    const result = await transitionEmployerVerification(
      employerId,
      adminId,
      status,
      typeof notes === "string" ? notes : undefined,
    );

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    // 5. Return updated profile
    const updatedEmployer = await getEmployerByUserId(employerId);

    return NextResponse.json({
      message: `Employer Verification status updated to '${status}'`,
      employerProfile: updatedEmployer,
    });
  } catch (error) {
    console.error("Employer verification update failed:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
