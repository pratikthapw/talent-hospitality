import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { republishJob, JOB_DURATION_OPTIONS } from "@/lib/jobs/job-posting-cycle";
import type { JobDurationDays } from "@/lib/jobs/job-posting-cycle";
import { requireVerifiedEmployer } from "@/lib/jobs/job-publication-policy";

interface RepublishRequestBody {
  durationDays: number;
}

function isValidRepublishRequestBody(data: unknown): data is RepublishRequestBody {
  if (typeof data !== "object" || data === null) {
    return false;
  }

  return "durationDays" in data && typeof data.durationDays === "number";
}

function isValidDurationDays(value: number): value is JobDurationDays {
  return (JOB_DURATION_OPTIONS as readonly number[]).includes(value);
}

function hasValidUserId(userId: string | undefined): userId is string {
  return userId !== undefined && userId !== "";
}

function getRepublishStatusCode(error: string): number {
  if (error.includes("not found")) {
    return 404;
  }

  if (error.includes("Insufficient") || error.includes("limit")) {
    return 403;
  }

  if (error.includes("expired") || error.includes("closed") || error.includes("fields")) {
    return 400;
  }

  return 500;
}

// POST — Republish an expired or closed job as a new posting cycle
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> },
) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session || !hasValidUserId(session.user.id)) {
      return NextResponse.json({ error: "Sign in to republish jobs." }, { status: 401 });
    }

    const employer = await requireVerifiedEmployer(session.user.id);

    const { jobId } = await params;
    if (!jobId) {
      return NextResponse.json({ error: "Job ID is required." }, { status: 400 });
    }

    const body = (await request.json()) as unknown;
    if (!isValidRepublishRequestBody(body)) {
      return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
    }

    const { durationDays } = body;

    if (!isValidDurationDays(durationDays)) {
      return NextResponse.json(
        { error: "Invalid duration. Choose 7, 14, or 30 days." },
        { status: 400 },
      );
    }

    const result = await republishJob({
      jobDraftId: jobId,
      employerProfileId: employer.id,
      durationDays,
      userId: session.user.id,
    });

    if (!result.success) {
      const statusCode = getRepublishStatusCode(result.error ?? "Unknown error");
      return NextResponse.json({ error: result.error ?? "Unknown error" }, { status: statusCode });
    }

    return NextResponse.json(
      {
        message: "Job republished successfully.",
        cycleId: result.cycleId,
        balanceNpr: result.balanceNpr,
      },
      { status: 200 },
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to republish job.";
    if (message.includes("verified") || message.includes("verification")) {
      return NextResponse.json({ error: message }, { status: 403 });
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
