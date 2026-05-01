import { eq, and } from "drizzle-orm";

import { cvDocument } from "@/lib/auth-schema";
import { db } from "@/lib/db";

/**
 * Get the active CV for an employee profile.
 */
export async function getActiveCV(employeeProfileId: string) {
  const rows = await db
    .select()
    .from(cvDocument)
    .where(and(eq(cvDocument.employeeProfileId, employeeProfileId), eq(cvDocument.isActive, true)))
    .limit(1);
  return rows.length > 0 ? rows[0] : null;
}

/**
 * Check if an employee has an active CV.
 */
export async function hasActiveCV(employeeProfileId: string): Promise<boolean> {
  const cv = await getActiveCV(employeeProfileId);
  return cv !== null;
}

/**
 * Get all CV documents for an employee profile.
 */
export async function getAllCVs(employeeProfileId: string) {
  return db
    .select()
    .from(cvDocument)
    .where(eq(cvDocument.employeeProfileId, employeeProfileId))
    .orderBy(cvDocument.createdAt);
}

/**
 * Deactivate any currently active CVs for the given employee profile.
 * Sets replacedAt timestamp on the deactivated CV (starts the 60-day retention window).
 */
async function deactivateActiveCVs(employeeProfileId: string): Promise<void> {
  await db
    .update(cvDocument)
    .set({
      isActive: false,
      replacedAt: new Date(),
    })
    .where(and(eq(cvDocument.employeeProfileId, employeeProfileId), eq(cvDocument.isActive, true)));
}

/**
 * Activate a specific CV document. Deactivates any prior active CV first.
 */
export async function activateCV(cvId: string, employeeProfileId: string) {
  // Verify ownership
  const rows = await db
    .select()
    .from(cvDocument)
    .where(and(eq(cvDocument.id, cvId), eq(cvDocument.employeeProfileId, employeeProfileId)))
    .limit(1);

  if (rows.length === 0) {
    throw new Error("CV document not found or access denied.");
  }

  // Deactivate prior active CV
  await deactivateActiveCVs(employeeProfileId);

  // Activate the specified CV
  const [updated] = await db
    .update(cvDocument)
    .set({
      isActive: true,
      replacedAt: null,
      updatedAt: new Date(),
    })
    .where(eq(cvDocument.id, cvId))
    .returning();

  return updated;
}

/**
 * Save a new uploaded CV file and make it active.
 */
export async function saveUploadedCV(params: {
  employeeProfileId: string;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  mimeType: string;
}) {
  // Deactivate prior active CV
  await deactivateActiveCVs(params.employeeProfileId);

  // Create new active uploaded CV
  const [created] = await db
    .insert(cvDocument)
    .values({
      employeeProfileId: params.employeeProfileId,
      sourceType: "upload",
      fileName: params.fileName,
      fileUrl: params.fileUrl,
      fileSize: params.fileSize,
      mimeType: params.mimeType,
      isActive: true,
    })
    .returning();

  return created;
}

/**
 * Save a new builder CV and make it active.
 */
export async function saveBuilderCV(params: {
  employeeProfileId: string;
  builderContent: Record<string, unknown>;
}) {
  // Deactivate prior active CV
  await deactivateActiveCVs(params.employeeProfileId);

  // Create new active builder CV
  const [created] = await db
    .insert(cvDocument)
    .values({
      employeeProfileId: params.employeeProfileId,
      sourceType: "builder",
      builderContent: params.builderContent,
      isActive: true,
    })
    .returning();

  return created;
}
