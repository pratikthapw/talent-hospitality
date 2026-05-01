/* oxlint-disable typescript-eslint/no-unsafe-assignment, typescript-eslint/no-unsafe-type-assertion, typescript-eslint/no-unsafe-member-access, typescript-eslint/no-unnecessary-condition, typescript-eslint/prefer-optional-chain */
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { eq, and } from "drizzle-orm";

import { auth } from "@/lib/auth";
import { employeeProfile, userRoles } from "@/lib/auth-schema";
import { db } from "@/lib/db";
import { getSearchEligibility } from "@/lib/profile/search-visibility-policy";

async function requireEmployee(request: NextRequest): Promise<string | null> {
  const session = await auth.api.getSession({ headers: request.headers });
  if (session === null || session.user === null || typeof session.user.id !== "string") {
    return null;
  }

  const userId = session.user.id;

  const rows = await db
    .select({ role: userRoles.role })
    .from(userRoles)
    .where(and(eq(userRoles.userId, userId), eq(userRoles.role, "employee")))
    .limit(1);

  return rows.length > 0 ? userId : null;
}

export async function GET(request: NextRequest) {
  const userId = await requireEmployee(request);
  if (userId === null) {
    return NextResponse.json({ error: "Employee access required." }, { status: 401 });
  }

  try {
    const rows = await db
      .select({
        searchVisible: employeeProfile.searchVisible,
        verificationStatus: employeeProfile.verificationStatus,
      })
      .from(employeeProfile)
      .where(eq(employeeProfile.userId, userId))
      .limit(1);

    if (rows.length === 0) {
      return NextResponse.json({ error: "Profile not found." }, { status: 404 });
    }

    const { searchVisible, verificationStatus } = rows[0];
    const eligibility = getSearchEligibility(verificationStatus, searchVisible);

    return NextResponse.json({
      searchVisible: eligibility.searchVisible,
      verificationStatus: eligibility.verificationStatus,
      isEligible: eligibility.isEligible,
      explanation: eligibility.explanation,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to fetch search visibility.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  const userId = await requireEmployee(request);
  if (userId === null) {
    return NextResponse.json({ error: "Employee access required." }, { status: 401 });
  }

  try {
    const body = (await request.json()) as Record<string, unknown>;

    if (typeof body.searchVisible !== "boolean") {
      return NextResponse.json(
        { error: "searchVisible must be a boolean." },
        { status: 400 },
      );
    }

    const profileRows = await db
      .select({ id: employeeProfile.id })
      .from(employeeProfile)
      .where(eq(employeeProfile.userId, userId))
      .limit(1);

    if (profileRows.length === 0) {
      return NextResponse.json({ error: "Profile not found." }, { status: 404 });
    }

    await db
      .update(employeeProfile)
      .set({ searchVisible: body.searchVisible })
      .where(eq(employeeProfile.id, profileRows[0].id));

    const rows = await db
      .select({
        searchVisible: employeeProfile.searchVisible,
        verificationStatus: employeeProfile.verificationStatus,
      })
      .from(employeeProfile)
      .where(eq(employeeProfile.userId, userId))
      .limit(1);

    const { searchVisible, verificationStatus } = rows[0];
    const eligibility = getSearchEligibility(verificationStatus, searchVisible);

    return NextResponse.json({
      searchVisible: eligibility.searchVisible,
      verificationStatus: eligibility.verificationStatus,
      isEligible: eligibility.isEligible,
      explanation: eligibility.explanation,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to update search visibility.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
