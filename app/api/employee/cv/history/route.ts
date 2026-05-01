import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { eq, and } from "drizzle-orm";

import { auth } from "@/lib/auth";
import { employeeProfile, userRoles } from "@/lib/auth-schema";
import { db } from "@/lib/db";
import { isWithinRetentionWindow, getCVHistory } from "@/lib/profile/cv-retention-policy";

async function requireEmployee(request: NextRequest): Promise<string | null> {
  const session = await auth.api.getSession({ headers: request.headers });
  if (session === null || typeof session.user.id !== "string") {
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

async function getEmployeeProfileId(userId: string): Promise<string | null> {
  const rows = await db
    .select({ id: employeeProfile.id })
    .from(employeeProfile)
    .where(eq(employeeProfile.userId, userId))
    .limit(1);
  return rows.length > 0 ? rows[0].id : null;
}

function getRetentionStatus(cv: {
  isActive: boolean;
  replacedAt: Date | null;
}): "active" | "retained" | "expired" | "inactive" {
  if (cv.isActive) {
    return "active";
  }
  if (cv.replacedAt === null) {
    return "inactive";
  }
  return isWithinRetentionWindow(cv) ? "retained" : "expired";
}

/** GET /api/employee/cv/history — CV history with retention status */
export async function GET(request: NextRequest) {
  const userId = await requireEmployee(request);
  if (userId === null) {
    return NextResponse.json({ error: "Employee access required." }, { status: 401 });
  }

  const profileId = await getEmployeeProfileId(userId);
  if (profileId === null) {
    return NextResponse.json({ history: [] });
  }

  try {
    const allCVs = await getCVHistory(profileId);

    const history = allCVs.map((cv) => ({
      ...cv,
      retentionStatus: getRetentionStatus(cv),
    }));

    return NextResponse.json({ history });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to fetch CV history.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
