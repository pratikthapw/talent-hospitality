/* oxlint-disable typescript-eslint/no-unsafe-assignment, typescript-eslint/no-unsafe-type-assertion, typescript-eslint/prefer-optional-chain, typescript-eslint/no-unnecessary-condition */
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { and, eq } from "drizzle-orm";

import { auth } from "@/lib/auth";
import { employeeProfile, userRoles, auditLog } from "@/lib/auth-schema";
import { db } from "@/lib/db";

const ALLOWED_STATUSES = ["unverified", "pending_review", "verified", "rejected"] as const;

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
  { params }: { params: Promise<{ employeeId: string }> },
) {
  const { employeeId } = await params;

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
          error: `Invalid verification status. Must be one of: ${ALLOWED_STATUSES.join(", ")}`,
        },
        { status: 400 },
      );
    }

    // 3. Check employee profile exists for this user
    const profileRows = await db
      .select({
        verificationStatus: employeeProfile.verificationStatus,
      })
      .from(employeeProfile)
      .where(eq(employeeProfile.userId, employeeId))
      .limit(1);

    if (profileRows.length === 0) {
      return NextResponse.json({ error: "Employee profile not found" }, { status: 404 });
    }

    const profile = profileRows[0];

    // 4. Build update values
    const updateValues: Record<string, unknown> = {
      verificationStatus: status,
      verificationUpdatedAt: new Date(),
    };

    if (status === "verified") {
      updateValues.verifiedBy = adminId;
      updateValues.verifiedAt = new Date();
    } else {
      // Clear verification metadata for non-verified transitions
      updateValues.verifiedBy = null;
      updateValues.verifiedAt = null;
    }

    if (notes !== undefined) {
      updateValues.verificationNotes = notes;
    }

    // 5. Apply update
    await db
      .update(employeeProfile)
      .set(updateValues)
      .where(eq(employeeProfile.userId, employeeId));

    // 6. Record audit log
    await db.insert(auditLog).values({
      actorId: adminId,
      targetType: "employee",
      targetId: employeeId,
      action: `employee_verification_${status}`,
      details: JSON.stringify({
        previousStatus: profile.verificationStatus,
        newStatus: status,
        notes: typeof notes === "string" ? notes : null,
      }),
    });

    // 7. Return updated profile
    const updatedRows = await db
      .select()
      .from(employeeProfile)
      .where(eq(employeeProfile.userId, employeeId))
      .limit(1);

    return NextResponse.json({
      message: "Employee verification status updated",
      employeeProfile: updatedRows[0],
    });
  } catch (error) {
    console.error("Employee verification update failed:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
