import { and, eq, isNull } from "drizzle-orm";

import { suspendedUser, auditLog } from "@/lib/auth-schema";
import { db } from "@/lib/db";

/** Check if a User is currently suspended (has an active suspension record with no unsuspension). */
export async function isUserSuspended(userId: string): Promise<boolean> {
  const rows = await db
    .select({ id: suspendedUser.id })
    .from(suspendedUser)
    .where(and(eq(suspendedUser.userId, userId), isNull(suspendedUser.unsuspendedAt)))
    .limit(1);
  return rows.length > 0;
}

/** Get the current active Suspension record for a User, or null. */
export async function getActiveSuspension(userId: string) {
  const rows = await db
    .select()
    .from(suspendedUser)
    .where(and(eq(suspendedUser.userId, userId), isNull(suspendedUser.unsuspendedAt)))
    .limit(1);
  return rows.length > 0 ? rows[0] : null;
}

/**
 * Suspend a User (admin action). Records an audit log entry.
 * Handles both first-time suspension (INSERT) and re-suspension (UPDATE)
 * because suspendedUser.userId has a unique constraint.
 */
export async function suspendUser(userId: string, adminId: string, reason: string): Promise<void> {
  const existing = await db
    .select({ id: suspendedUser.id })
    .from(suspendedUser)
    .where(eq(suspendedUser.userId, userId))
    .limit(1);

  const hasExisting = existing.length > 0;

  await (hasExisting
    ? db
        .update(suspendedUser)
        .set({
          suspendedBy: adminId,
          reason,
          suspendedAt: new Date(),
          unsuspendedAt: null,
          unsuspendedBy: null,
        })
        .where(eq(suspendedUser.userId, userId))
    : db.insert(suspendedUser).values({
        userId,
        suspendedBy: adminId,
        reason,
      }));

  // Record audit log
  await db.insert(auditLog).values({
    actorId: adminId,
    targetType: "user",
    targetId: userId,
    action: "user_suspended",
    details: JSON.stringify({ reason }),
  });
}

/** Unsuspend a User (admin action). Records an audit log entry. */
export async function unsuspendUser(userId: string, adminId: string): Promise<void> {
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
}

/**
 * Enforcement guard: blocks suspended Users from publish, search,
 * and new application actions. Call this at the start of any action
 * that must be blocked for suspended Users.
 * Returns true if the action should be blocked.
 */
export async function enforceSuspensionBlock(userId: string): Promise<boolean> {
  return isUserSuspended(userId);
}
