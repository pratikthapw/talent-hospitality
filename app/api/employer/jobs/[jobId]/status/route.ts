/* eslint-disable @typescript-eslint/no-unnecessary-condition, @typescript-eslint/strict-boolean-expressions, @typescript-eslint/prefer-optional-chain, @typescript-eslint/no-unsafe-type-assertion, @typescript-eslint/no-unsafe-member-access -- session.user can be null even if session is not null */
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { requireVerifiedEmployer } from "@/lib/jobs/job-publication-policy";
import { closeJob, pauseJob, resumeJob } from "@/lib/jobs/job-state-machine";

const VALID_ACTIONS = ["pause", "resume", "close"] as const;
type ValidAction = (typeof VALID_ACTIONS)[number];

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> },
) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session) {
      return NextResponse.json({ error: "Sign in to change job status." }, { status: 401 });
    }

    if (!session.user || !session.user.id) {
      return NextResponse.json({ error: "Sign in to change job status." }, { status: 401 });
    }

    const employer = await requireVerifiedEmployer(session.user.id);

    const { jobId } = await params;
    if (!jobId) {
      return NextResponse.json({ error: "Job ID is required." }, { status: 400 });
    }

    const body = (await request.json()) as unknown;

    if (typeof body !== "object" || body === null) {
      return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
    }

    const action = (body as Record<string, unknown>).action;

    if (!action || typeof action !== "string") {
      return NextResponse.json(
        { error: "Action is required. Valid actions: pause, resume, close." },
        { status: 400 },
      );
    }

    if (!VALID_ACTIONS.includes(action as ValidAction)) {
      return NextResponse.json(
        { error: `Invalid action '${action}'. Valid actions: pause, resume, close.` },
        { status: 400 },
      );
    }

    let result: { success: boolean; error?: string };

    switch (action as ValidAction) {
      case "pause": {
        result = await pauseJob(jobId, employer.id);
        break;
      }
      case "resume": {
        result = await resumeJob(jobId, employer.id);
        break;
      }
      case "close": {
        result = await closeJob(jobId, employer.id);
        break;
      }
      default: {
        return NextResponse.json(
          { error: `Invalid action '${action}'. Valid actions: pause, resume, close.` },
          { status: 400 },
        );
      }
    }

    if (!result.success) {
      const error = result.error ?? "Failed to update job status.";

      if (error.includes("not found") || error.includes("do not own")) {
        return NextResponse.json({ error }, { status: 404 });
      }

      if (
        error.includes("Invalid transition") ||
        error.includes("terminal state") ||
        error.includes("must be published") ||
        error.includes("No active")
      ) {
        return NextResponse.json({ error }, { status: 400 });
      }

      return NextResponse.json({ error }, { status: 400 });
    }

    const actionLabels: Record<ValidAction, string> = {
      pause: "paused",
      resume: "resumed",
      close: "closed",
    };

    return NextResponse.json({
      message: `Job ${actionLabels[action as ValidAction]} successfully.`,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to update job status.";
    if (message.includes("verified") || message.includes("verification")) {
      return NextResponse.json({ error: message }, { status: 403 });
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
