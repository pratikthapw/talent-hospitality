import { and, lt, gt, eq, isNotNull } from "drizzle-orm";

import { cvDocument } from "@/lib/auth-schema";
import { db } from "@/lib/db";

/** CV Retention Window is 60 days from replacement. */
export const RETENTION_WINDOW_DAYS = 60;

/**
 * Calculate the retention expiry timestamp for a CV replaced at the given time.
 */
export function calculateRetentionExpiry(replacedAt: Date): Date {
  return new Date(replacedAt.getTime() + RETENTION_WINDOW_DAYS * 24 * 60 * 60 * 1000);
}

/**
 * Check if a retained CV is still within its retention window.
 * Returns true if the CV has been replaced and its retention window has not expired.
 */
export function isWithinRetentionWindow(cv: {
  replacedAt: Date | null;
  retentionExpiresAt: Date | null;
}): boolean {
  if (cv.replacedAt === null || cv.retentionExpiresAt === null) {
    return false;
  }
  return new Date() < new Date(cv.retentionExpiresAt);
}

/**
 * Get all retained (inactive) CVs for an employee profile that are still
 * within their retention window.
 */
export async function getRetainedCVs(employeeProfileId: string) {
  return db
    .select()
    .from(cvDocument)
    .where(
      and(
        eq(cvDocument.employeeProfileId, employeeProfileId),
        eq(cvDocument.isActive, false),
        isNotNull(cvDocument.replacedAt),
        gt(cvDocument.retentionExpiresAt, new Date()),
      ),
    )
    .orderBy(cvDocument.replacedAt);
}

/**
 * Get all expired retained CVs (past retention window) for cleanup.
 */
export async function getExpiredRetainedCVs() {
  return db
    .select()
    .from(cvDocument)
    .where(
      and(
        eq(cvDocument.isActive, false),
        isNotNull(cvDocument.replacedAt),
        lt(cvDocument.retentionExpiresAt, new Date()),
      ),
    );
}

/**
 * Get all retained CVs for an employee profile regardless of retention status.
 * Used in the CV history page.
 */
export async function getCVHistory(employeeProfileId: string) {
  return db
    .select()
    .from(cvDocument)
    .where(eq(cvDocument.employeeProfileId, employeeProfileId))
    .orderBy(cvDocument.createdAt);
}

/**
 * Filter CVs to only those accessible to a given viewer.
 * - Active CVs are always accessible to the owning employee.
 * - Retained CVs are accessible if within the 60-day retention window.
 * - Expired retained CVs are not accessible (content should be considered deleted).
 */
export function filterAccessibleCVs(
  cvs: {
    isActive: boolean;
    replacedAt: Date | null;
    retentionExpiresAt: Date | null;
  }[],
) {
  return cvs.filter((cv) => {
    // Active CVs are always accessible
    if (cv.isActive) {
      return true;
    }
    // Retained CVs are accessible if within retention window
    return isWithinRetentionWindow(cv);
  });
}
