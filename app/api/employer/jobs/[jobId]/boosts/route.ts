import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { eq, and } from "drizzle-orm";

import { auth } from "@/lib/auth";
import { jobPostingCycle, jobDraft } from "@/lib/auth-schema";
import { db } from "@/lib/db";
import { purchaseBoost, BOOST_DURATION_OPTIONS } from "@/lib/jobs/boost-lifecycle";
import type { BoostType, BoostDurationDays } from "@/lib/jobs/boost-lifecycle";
import { requireVerifiedEmployer } from "@/lib/jobs/job-publication-policy";

interface BoostRequestBody {
  boostType: string;
  durationDays: number;
}

function parseRequestBody(data: unknown): BoostRequestBody | null {
  if (typeof data !== "object" || data === null) {
    return null;
  }
  const obj = data as { boostType?: unknown; durationDays?: unknown };
  if (typeof obj.boostType !== "string" || typeof obj.durationDays !== "number") {
    return null;
  }
  return { boostType: obj.boostType, durationDays: obj.durationDays };
}

function isValidBoostType(value: string): value is BoostType {
  return value === "featured" || value === "urgent";
}

function isValidBoostDuration(value: number): value is BoostDurationDays {
  return (BOOST_DURATION_OPTIONS as readonly number[]).includes(value);
}

function getStatusCodeForError(error: string | undefined): number {
  if (error === undefined || error === "") {
    return 400;
  }
  if (error.includes("plan") || error.includes("Insufficient")) {
    return 403;
  }
  if (error.includes("active boost")) {
    return 409;
  }
  return 400;
}

async function getActiveCycle(jobId: string, employerId: string) {
  const cycles = await db
    .select({ id: jobPostingCycle.id })
    .from(jobPostingCycle)
    .innerJoin(jobDraft, eq(jobPostingCycle.jobDraftId, jobDraft.id))
    .where(
      and(
        eq(jobDraft.id, jobId),
        eq(jobPostingCycle.employerId, employerId),
        eq(jobPostingCycle.status, "active"),
      ),
    )
    .limit(1);

  return cycles.at(0);
}

async function handleBoostPurchase(
  jobId: string,
  employerId: string,
  userId: string,
  boostType: BoostType,
  durationDays: BoostDurationDays,
) {
  const activeCycle = await getActiveCycle(jobId, employerId);

  if (!activeCycle) {
    return NextResponse.json(
      { error: "No active posting cycle found for this job. Only published jobs can be boosted." },
      { status: 404 },
    );
  }

  const result = await purchaseBoost({
    jobPostingCycleId: activeCycle.id,
    employerProfileId: employerId,
    boostType,
    durationDays,
    userId,
  });

  if (!result.success) {
    return NextResponse.json(
      { error: result.error ?? "Unknown error" },
      { status: getStatusCodeForError(result.error) },
    );
  }

  return NextResponse.json(
    {
      message: `${boostType.charAt(0).toUpperCase() + boostType.slice(1)} boost applied successfully.`,
      boostId: result.boostId,
      balanceNpr: result.balanceNpr,
    },
    { status: 200 },
  );
}

function validateBoostRequest(body: BoostRequestBody): NextResponse | null {
  const { boostType, durationDays } = body;

  if (!isValidBoostType(boostType)) {
    return NextResponse.json(
      { error: "Invalid boost type. Choose 'featured' or 'urgent'." },
      { status: 400 },
    );
  }

  if (!isValidBoostDuration(durationDays)) {
    return NextResponse.json(
      { error: `Invalid boost duration. Choose from: ${BOOST_DURATION_OPTIONS.join(", ")} days.` },
      { status: 400 },
    );
  }

  return null;
}

async function authenticateAndValidate(
  request: NextRequest,
  params: { jobId: string },
): Promise<{ employerId: string; userId: string; jobId: string } | NextResponse> {
  const session = await auth.api.getSession({ headers: request.headers });
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition, @typescript-eslint/prefer-optional-chain, @typescript-eslint/strict-boolean-expressions
  if (!session || !session.user || !session.user.id) {
    return NextResponse.json({ error: "Sign in to boost jobs." }, { status: 401 });
  }

  const employer = await requireVerifiedEmployer(session.user.id);

  const { jobId } = params;
  if (!jobId) {
    return NextResponse.json({ error: "Job ID is required." }, { status: 400 });
  }

  return { employerId: employer.id, userId: session.user.id, jobId };
}

// POST — Purchase a boost for a published job
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> },
) {
  try {
    const authResult = await authenticateAndValidate(request, await params);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const body = parseRequestBody(await request.json());
    if (!body) {
      return NextResponse.json(
        { error: "Invalid request body. Provide boostType and durationDays." },
        { status: 400 },
      );
    }

    const validationError = validateBoostRequest(body);
    if (validationError) {
      return validationError;
    }

    const { boostType, durationDays } = body;
    if (!isValidBoostType(boostType) || !isValidBoostDuration(durationDays)) {
      return NextResponse.json({ error: "Invalid boost type or duration." }, { status: 400 });
    }

    return await handleBoostPurchase(
      authResult.jobId,
      authResult.employerId,
      authResult.userId,
      boostType,
      durationDays,
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to purchase boost.";
    if (message.includes("verified") || message.includes("verification")) {
      return NextResponse.json({ error: message }, { status: 403 });
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
