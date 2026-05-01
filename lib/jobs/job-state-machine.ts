import "server-only";
import { eq, and } from "drizzle-orm";

import { jobDraft, jobPostingCycle } from "@/lib/auth-schema";
import { db } from "@/lib/db";
import { expireBoostsForCycle } from "@/lib/jobs/boost-lifecycle";
import { validatePublishFields } from "@/lib/jobs/job-publication-policy";

// ---------------------------------------------------------------------------
// Transition maps
// ---------------------------------------------------------------------------

const JOB_DRAFT_TRANSITIONS: Record<string, Record<string, string>> = {
  published: { paused: "pause", closed: "close" },
  paused: { published: "resume", closed: "close" },
};

const POSTING_CYCLE_TRANSITIONS: Record<string, Record<string, string>> = {
  active: { paused: "pause", closed: "close" },
  paused: { active: "resume", closed: "close" },
};

// ---------------------------------------------------------------------------
// Pure validation helpers
// ---------------------------------------------------------------------------

export function validateJobDraftTransition(
  currentStatus: string,
  targetStatus: string,
): { valid: boolean; error?: string } {
  if (currentStatus === "expired" || currentStatus === "closed") {
    return {
      valid: false,
      error: `Cannot transition from '${currentStatus}' — it is a terminal state.`,
    };
  }

  if (currentStatus === "draft") {
    return {
      valid: false,
      error: "Draft jobs must be published before they can be paused or closed.",
    };
  }

  const allowed = JOB_DRAFT_TRANSITIONS[currentStatus];
  if (allowed[targetStatus]) {
    return { valid: true };
  }

  return {
    valid: false,
    error: `Invalid transition: '${currentStatus}' → '${targetStatus}'.`,
  };
}

export function validatePostingCycleTransition(
  currentStatus: string,
  targetStatus: string,
): { valid: boolean; error?: string } {
  if (currentStatus === "expired" || currentStatus === "closed") {
    return {
      valid: false,
      error: `Cannot transition from '${currentStatus}' — it is a terminal state.`,
    };
  }

  const allowed = POSTING_CYCLE_TRANSITIONS[currentStatus];
  if (allowed[targetStatus]) {
    return { valid: true };
  }

  return {
    valid: false,
    error: `Invalid transition: '${currentStatus}' → '${targetStatus}'.`,
  };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

type JobPostingCycleSelect = typeof jobPostingCycle.$inferSelect;

async function loadJobDraftAndActiveCycle(
  jobDraftId: string,
  employerProfileId: string,
): Promise<{ draft: JobDraftSelect; cycle: JobPostingCycleSelect } | { error: string }> {
  const draftRows = await db
    .select()
    .from(jobDraft)
    .where(and(eq(jobDraft.id, jobDraftId), eq(jobDraft.employerId, employerProfileId)));

  const draftResult = draftRows.at(0);
  if (!draftResult) {
    return { error: "Job not found or you do not own it." };
  }

  // Get all cycles and find the most recent non-expired one
  const cycles = await db
    .select()
    .from(jobPostingCycle)
    .where(
      and(
        eq(jobPostingCycle.jobDraftId, jobDraftId),
        eq(jobPostingCycle.employerId, employerProfileId),
      ),
    );

  const activeCycle = cycles.find((c) => c.status === "active" || c.status === "paused");

  if (!activeCycle) {
    return { error: "No active or paused posting cycle found for this job." };
  }

  return { draft: draftResult, cycle: activeCycle };
}

// ---------------------------------------------------------------------------
// State-change operations
// ---------------------------------------------------------------------------

export async function pauseJob(
  jobDraftId: string,
  employerProfileId: string,
): Promise<{ success: boolean; error?: string }> {
  const result = await loadJobDraftAndActiveCycle(jobDraftId, employerProfileId);
  if ("error" in result) {
    return { success: false, error: result.error };
  }
  const { draft, cycle } = result;

  const draftValidation = validateJobDraftTransition(draft.status, "paused");
  if (!draftValidation.valid) {
    return { success: false, error: draftValidation.error };
  }

  const cycleValidation = validatePostingCycleTransition(cycle.status, "paused");
  if (!cycleValidation.valid) {
    return { success: false, error: cycleValidation.error };
  }

  try {
    await db.transaction(async (tx) => {
      await tx
        .update(jobDraft)
        .set({ status: "paused", updatedAt: new Date() })
        .where(eq(jobDraft.id, jobDraftId));

      await tx
        .update(jobPostingCycle)
        .set({ status: "paused" })
        .where(eq(jobPostingCycle.id, cycle.id));

      await expireBoostsForCycle(cycle.id);
    });

    return { success: true };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to pause job.";
    return { success: false, error: message };
  }
}

export async function resumeJob(
  jobDraftId: string,
  employerProfileId: string,
): Promise<{ success: boolean; error?: string }> {
  const result = await loadJobDraftAndActiveCycle(jobDraftId, employerProfileId);
  if ("error" in result) {
    return { success: false, error: result.error };
  }
  const { draft, cycle } = result;

  const draftValidation = validateJobDraftTransition(draft.status, "published");
  if (!draftValidation.valid) {
    return { success: false, error: draftValidation.error };
  }

  const cycleValidation = validatePostingCycleTransition(cycle.status, "active");
  if (!cycleValidation.valid) {
    return { success: false, error: cycleValidation.error };
  }

  try {
    await db.transaction(async (tx) => {
      await tx
        .update(jobDraft)
        .set({ status: "published", updatedAt: new Date() })
        .where(eq(jobDraft.id, jobDraftId));

      await tx
        .update(jobPostingCycle)
        .set({ status: "active" })
        .where(eq(jobPostingCycle.id, cycle.id));
    });

    return { success: true };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to resume job.";
    return { success: false, error: message };
  }
}

export async function closeJob(
  jobDraftId: string,
  employerProfileId: string,
): Promise<{ success: boolean; error?: string }> {
  const result = await loadJobDraftAndActiveCycle(jobDraftId, employerProfileId);
  if ("error" in result) {
    return { success: false, error: result.error };
  }
  const { draft, cycle } = result;

  const draftValidation = validateJobDraftTransition(draft.status, "closed");
  if (!draftValidation.valid) {
    return { success: false, error: draftValidation.error };
  }

  const cycleValidation = validatePostingCycleTransition(cycle.status, "closed");
  if (!cycleValidation.valid) {
    return { success: false, error: cycleValidation.error };
  }

  try {
    await db.transaction(async (tx) => {
      await tx
        .update(jobDraft)
        .set({ status: "closed", updatedAt: new Date() })
        .where(eq(jobDraft.id, jobDraftId));

      await tx
        .update(jobPostingCycle)
        .set({ status: "closed", closedAt: new Date() })
        .where(eq(jobPostingCycle.id, cycle.id));

      await expireBoostsForCycle(cycle.id);
    });

    return { success: true };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to close job.";
    return { success: false, error: message };
  }
}

// ---------------------------------------------------------------------------
// Edit live job
// ---------------------------------------------------------------------------

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

type JobDraftSelect = typeof jobDraft.$inferSelect;

interface UpdateLiveJobResult {
  success: boolean;
  draft?: JobDraftSelect;
  warnings?: { field: string; message: string }[];
  error?: string;
}

export async function updateLiveJob(
  jobDraftId: string,
  employerProfileId: string,
  updates: Partial<Record<EditableField, unknown>>,
): Promise<UpdateLiveJobResult> {
  // Load and verify ownership
  const existingRows = await db
    .select()
    .from(jobDraft)
    .where(and(eq(jobDraft.id, jobDraftId), eq(jobDraft.employerId, employerProfileId)));

  const existing = existingRows.at(0);
  if (!existing) {
    return { success: false, error: "Job not found or you do not own it." };
  }

  if (existing.status !== "published" && existing.status !== "paused") {
    return {
      success: false,
      error: "Only published or paused jobs can be edited.",
    };
  }

  // Build clean update set from allowed fields only
  const cleanUpdates: Record<string, unknown> = {};
  for (const field of EDITABLE_FIELDS) {
    if (updates[field] !== undefined) {
      cleanUpdates[field] = updates[field];
    }
  }

  // Trim string fields
  if (typeof cleanUpdates.title === "string") {
    cleanUpdates.title = cleanUpdates.title.trim();
  }
  if (typeof cleanUpdates.description === "string") {
    cleanUpdates.description = cleanUpdates.description.trim();
  }
  if (typeof cleanUpdates.location === "string") {
    cleanUpdates.location = cleanUpdates.location.trim();
  }

  // Validate employment type if provided
  const VALID_EMPLOYMENT_TYPES = [
    "full-time",
    "part-time",
    "contract",
    "seasonal",
    "internship",
  ] as const;
  if (
    typeof cleanUpdates.employmentType === "string" &&
    !(VALID_EMPLOYMENT_TYPES as readonly string[]).includes(cleanUpdates.employmentType)
  ) {
    return { success: false, error: "Invalid employment type." };
  }

  // Validate publish fields on merged draft — produce warnings (not errors)
  const mergedDraft = { ...existing, ...cleanUpdates };
  const warnings = validatePublishFields(mergedDraft);

  cleanUpdates.updatedAt = new Date();

  try {
    const [updated] = await db
      .update(jobDraft)
      .set(cleanUpdates)
      .where(eq(jobDraft.id, jobDraftId))
      .returning();

    return { success: true, draft: updated, warnings };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to update job.";
    return { success: false, error: message };
  }
}
