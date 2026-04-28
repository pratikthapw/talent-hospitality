/* oxlint-disable typescript-eslint/no-unsafe-assignment, typescript-eslint/no-unsafe-type-assertion, typescript-eslint/prefer-optional-chain, typescript-eslint/no-unnecessary-condition */
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { and, eq, isNull } from "drizzle-orm";

import { auth } from "@/lib/auth";
import { userRoles, suspendedUser, auditLog } from "@/lib/auth-schema";
import { db } from "@/lib/db";

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

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> },
) {
  const { userId } = await params;

  // 1. Require admin access
  const adminId = await requireAdmin(request);
  if (adminId === null) {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }

  try {
    const body = await request.json();
    if (typeof body !== "object" || body === null) {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }
    const record = body as Record<string, unknown>;
    const action = record.action;

    if (action === "suspend") {
      const reason = record.reason;
      return await handleSuspend(userId, adminId, typeof reason === "string" ? reason : "");
    }

    if (action === "unsuspend") {
      return await handleUnsuspend(userId, adminId);
    }

    return NextResponse.json(
      { error: "Invalid action. Must be 'suspend' or 'unsuspend'" },
      { status: 400 },
    );
  } catch (error) {
    console.error("Suspension action failed:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

async function handleSuspend(userId: string, adminId: string, reason: string) {
  if (reason.trim().length === 0) {
    return NextResponse.json({ error: "Suspension reason is required" }, { status: 400 });
  }

  // Check if already actively suspended
  const activeRows = await db
    .select({ id: suspendedUser.id })
    .from(suspendedUser)
    .where(and(eq(suspendedUser.userId, userId), isNull(suspendedUser.unsuspendedAt)))
    .limit(1);

  if (activeRows.length > 0) {
    return NextResponse.json({ error: "User is already suspended" }, { status: 409 });
  }

  // Check if a record exists from a previous suspension (re-suspend case)
  const existingRows = await db
    .select({ id: suspendedUser.id })
    .from(suspendedUser)
    .where(eq(suspendedUser.userId, userId))
    .limit(1);

  const hasExisting = existingRows.length > 0;

  // Re-suspend or first suspension
  await (hasExisting
    ? db
        .update(suspendedUser)
        .set({
          suspendedBy: adminId,
          reason: reason.trim(),
          suspendedAt: new Date(),
          unsuspendedAt: null,
          unsuspendedBy: null,
        })
        .where(eq(suspendedUser.userId, userId))
    : db.insert(suspendedUser).values({
        userId,
        suspendedBy: adminId,
        reason: reason.trim(),
      }));

  // Record audit log
  await db.insert(auditLog).values({
    actorId: adminId,
    targetType: "user",
    targetId: userId,
    action: "user_suspended",
    details: JSON.stringify({ reason: reason.trim() }),
  });

  return NextResponse.json({
    message: "User suspended successfully",
    userId,
  });
}

async function handleUnsuspend(userId: string, adminId: string) {
  // Check if there's an active suspension
  const activeRows = await db
    .select({ id: suspendedUser.id })
    .from(suspendedUser)
    .where(and(eq(suspendedUser.userId, userId), isNull(suspendedUser.unsuspendedAt)))
    .limit(1);

  if (activeRows.length === 0) {
    return NextResponse.json({ error: "User is not suspended" }, { status: 409 });
  }

  // Mark suspension as resolved
  await db
    .update(suspendedUser)
    .set({
      unsuspendedAt: new Date(),
      unsuspendedBy: adminId,
    })
    .where(and(eq(suspendedUser.userId, userId), isNull(suspendedUser.unsuspendedAt)));

  // Record audit log
  await db.insert(auditLog).values({
    actorId: adminId,
    targetType: "user",
    targetId: userId,
    action: "user_unsuspended",
  });

  return NextResponse.json({
    message: "User unsuspended successfully",
    userId,
  });
}
