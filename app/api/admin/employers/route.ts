/* oxlint-disable typescript-eslint/no-unsafe-assignment, typescript-eslint/no-unsafe-type-assertion, typescript-eslint/prefer-optional-chain, typescript-eslint/no-unnecessary-condition */
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { and, eq } from "drizzle-orm";

import { auth } from "@/lib/auth";
import { userRoles } from "@/lib/auth-schema";
import { db } from "@/lib/db";
import { getEmployersForReview } from "@/lib/verification/employer-verification";

/** Check the requesting User has the Admin role. Returns admin userId or null. */
async function requireAdmin(request: NextRequest): Promise<string | null> {
  const session = await auth.api.getSession({
    headers: request.headers,
  });

  if (session === null || session.user === null || typeof session.user.id !== "string") {
    return null;
  }

  const userId = session.user.id;

  const adminRows = await db
    .select({ role: userRoles.role })
    .from(userRoles)
    .where(and(eq(userRoles.userId, userId), eq(userRoles.role, "admin")))
    .limit(1);

  if (adminRows.length === 0) {
    return null;
  }

  return userId;
}

export async function GET(request: NextRequest) {
  const adminId = await requireAdmin(request);
  if (adminId === null) {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }

  try {
    const employers = await getEmployersForReview();
    return NextResponse.json({ employers });
  } catch (error) {
    console.error("Failed to fetch employer records:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
