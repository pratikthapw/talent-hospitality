import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { publishDraftJob } from "@/lib/jobs/job-posting-cycle";
import type { JobDurationDays } from "@/lib/jobs/job-posting-cycle";
import { requireVerifiedEmployer } from "@/lib/jobs/job-publication-policy";

interface PublishRequestBody {
  durationDays: number;
}

function isValidPublishRequestBody(data: unknown): data is PublishRequestBody {
  if (typeof data !== "object" || data === null) {
    return false;
  }

  return "durationDays" in data && typeof data.durationDays === "number";
}

function isValidDurationDays(value: number): value is JobDurationDays {
  return [7, 14, 30].includes(value);
}

function hasValidUserId(userId: string | undefined): userId is string {
  return userId !== undefined && userId !== "";
}

function getPublishStatusCode(error: string): number {
  if (error.includes("not found")) {
    return 404;
  }

  if (error.includes("Insufficient") || error.includes("limit")) {
    return 403;
  }

  if (error.includes("draft") || error.includes("fields")) {
    return 400;
  }

  return 500;
}

function handlePublishError(error: unknown): NextResponse {
  const message = error instanceof Error ? error.message : "Failed to publish job.";
  if (message.includes("verified") || message.includes("verification")) {
    return NextResponse.json({ error: message }, { status: 403 });
  }
  return NextResponse.json({ error: message }, { status: 500 });
}

// POST — Publish a draft job
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> },
) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session || !hasValidUserId(session.user.id)) {
      return NextResponse.json({ error: "Sign in to publish jobs." }, { status: 401 });
    }

    const employer = await requireVerifiedEmployer(session.user.id);

    const { jobId } = await params;
    if (!jobId) {
      return NextResponse.json({ error: "Job ID is required." }, { status: 400 });
    }

    const body = (await request.json()) as unknown;
    if (!isValidPublishRequestBody(body)) {
      return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
    }

    const { durationDays } = body;

    if (!isValidDurationDays(durationDays)) {
      return NextResponse.json(
        { error: "Invalid duration. Choose 7, 14, or 30 days." },
        { status: 400 },
      );
    }

    const result = await publishDraftJob({
      jobDraftId: jobId,
      employerProfileId: employer.id,
      durationDays,
      userId: session.user.id,
    });

    if (!result.success) {
      const statusCode = getPublishStatusCode(result.error ?? "Unknown error");
      return NextResponse.json({ error: result.error ?? "Unknown error" }, { status: statusCode });
    }

    return NextResponse.json(
      {
        message: "Job published successfully.",
        cycleId: result.cycleId,
        balanceNpr: result.balanceNpr,
      },
      { status: 200 },
    );
  } catch (error: unknown) {
    return handlePublishError(error);
  }
}
