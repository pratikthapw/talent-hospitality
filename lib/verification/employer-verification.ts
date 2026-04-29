import { eq, desc } from "drizzle-orm";

import { employerProfile, auditLog } from "@/lib/auth-schema";
import { db } from "@/lib/db";

export type EmployerVerificationStatus = "pending_review" | "verified" | "rejected";

const ALLOWED_STATUSES: readonly EmployerVerificationStatus[] = [
  "pending_review",
  "verified",
  "rejected",
];

interface TransitionResult {
  success: boolean;
  error?: string;
}

/** Validate a status transition for Employer Verification. */
function isValidTransition(
  currentStatus: EmployerVerificationStatus,
  newStatus: EmployerVerificationStatus,
): boolean {
  return currentStatus !== newStatus && (ALLOWED_STATUSES as readonly string[]).includes(newStatus);
}

/** Get all Employer Profiles ordered by most recent verification update. */
export async function getEmployersForReview() {
  return db
    .select({
      id: employerProfile.id,
      userId: employerProfile.userId,
      companyName: employerProfile.companyName,
      companyType: employerProfile.companyType,
      verificationStatus: employerProfile.verificationStatus,
      verificationNotes: employerProfile.verificationNotes,
      verifiedBy: employerProfile.verifiedBy,
      verifiedAt: employerProfile.verifiedAt,
      verificationUpdatedAt: employerProfile.verificationUpdatedAt,
      createdAt: employerProfile.createdAt,
    })
    .from(employerProfile)
    .orderBy(desc(employerProfile.verificationUpdatedAt));
}

/** Get pending-review Employer Profiles for the admin queue. */
export async function getPendingEmployers() {
  return db
    .select({
      id: employerProfile.id,
      userId: employerProfile.userId,
      companyName: employerProfile.companyName,
      companyType: employerProfile.companyType,
      verificationStatus: employerProfile.verificationStatus,
      verificationNotes: employerProfile.verificationNotes,
      createdAt: employerProfile.createdAt,
    })
    .from(employerProfile)
    .where(eq(employerProfile.verificationStatus, "pending_review"))
    .orderBy(desc(employerProfile.createdAt));
}

/** Get a single Employer Profile by userId. */
export async function getEmployerByUserId(userId: string) {
  const rows = await db
    .select()
    .from(employerProfile)
    .where(eq(employerProfile.userId, userId))
    .limit(1);
  return rows.length > 0 ? rows[0] : null;
}

/** Get verification status for an Employer. Returns null if no profile exists. */
export async function getEmployerVerificationStatus(
  userId: string,
): Promise<EmployerVerificationStatus | null> {
  const profile = await getEmployerByUserId(userId);
  return profile ? (profile.verificationStatus as EmployerVerificationStatus) : null;
}

/** Check if an Employer is verified. */
export async function isEmployerVerified(userId: string): Promise<boolean> {
  const status = await getEmployerVerificationStatus(userId);
  return status === "verified";
}

/**
 * Transition an Employer's verification status.
 * Validates the transition and records an audit log entry.
 */
export async function transitionEmployerVerification(
  userId: string,
  adminId: string,
  newStatus: EmployerVerificationStatus,
  notes?: string,
): Promise<TransitionResult> {
  const profile = await getEmployerByUserId(userId);

  if (!profile) {
    return { success: false, error: "Employer Profile not found" };
  }

  const currentStatus = profile.verificationStatus as EmployerVerificationStatus;

  if (!isValidTransition(currentStatus, newStatus)) {
    return {
      success: false,
      error: `Invalid transition from '${currentStatus}' to '${newStatus}'`,
    };
  }

  const updateValues: Record<string, unknown> = {
    verificationStatus: newStatus,
    verificationUpdatedAt: new Date(),
  };

  if (newStatus === "verified") {
    updateValues.verifiedBy = adminId;
    updateValues.verifiedAt = new Date();
  } else {
    updateValues.verifiedBy = null;
    updateValues.verifiedAt = null;
  }

  if (notes !== undefined) {
    updateValues.verificationNotes = notes;
  }

  await db.update(employerProfile).set(updateValues).where(eq(employerProfile.userId, userId));

  // Record audit log
  await db.insert(auditLog).values({
    actorId: adminId,
    targetType: "employer_profile",
    targetId: userId,
    action: `employer_verification_${newStatus}`,
    details: JSON.stringify({
      previousStatus: currentStatus,
      newStatus,
      notes: notes ?? null,
    }),
  });

  return { success: true };
}

/**
 * Enforcement guard: blocks non-verified Employers from job publishing.
 * Returns true if the Employer is NOT verified (action should be blocked).
 */
export async function enforceEmployerVerificationBlock(userId: string): Promise<boolean> {
  return !(await isEmployerVerified(userId));
}
