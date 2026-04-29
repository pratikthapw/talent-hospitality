import { headers } from "next/headers";
import { NextResponse } from "next/server";

import { and, eq } from "drizzle-orm";

import { auth } from "@/lib/auth";
import { userRoles } from "@/lib/auth-schema";
import { applyAdminAdjustment } from "@/lib/billing/wallet-balance";
import { db } from "@/lib/db";

// POST /api/admin/wallet-adjustments
export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Verify admin role
  const adminRows = await db
    .select({ role: userRoles.role })
    .from(userRoles)
    .where(and(eq(userRoles.userId, session.user.id), eq(userRoles.role, "admin")))
    .limit(1);

  if (adminRows.length === 0) {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }

  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = parseAdjustmentInput(raw);
  if (!parsed) {
    return NextResponse.json(
      {
        error:
          "employerProfileId (string), amountNpr (non-zero number), reason (string), and adjustmentType ('admin_adjustment' | 'admin_refund') are required",
      },
      { status: 400 },
    );
  }

  try {
    const { balanceNpr, entry } = await applyAdminAdjustment(
      parsed.employerProfileId,
      parsed.amountNpr,
      parsed.reason,
      parsed.adjustmentType,
      session.user.id,
    );
    return NextResponse.json({ success: true, balanceNpr, entry });
  } catch (error) {
    console.error("Admin wallet adjustment failed:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

interface AdjustmentInput {
  employerProfileId: string;
  amountNpr: number;
  reason: string;
  adjustmentType: "admin_adjustment" | "admin_refund";
}

function parseAdjustmentInput(value: unknown): AdjustmentInput | null {
  if (typeof value !== "object" || value === null) {
    return null;
  }

  const obj: Record<string, unknown> = { ...value };

  if (typeof obj.employerProfileId !== "string" || obj.employerProfileId.length === 0) {
    return null;
  }
  if (typeof obj.amountNpr !== "number" || obj.amountNpr === 0) {
    return null;
  }
  if (typeof obj.reason !== "string" || obj.reason.length === 0) {
    return null;
  }
  if (obj.adjustmentType !== "admin_adjustment" && obj.adjustmentType !== "admin_refund") {
    return null;
  }

  return {
    employerProfileId: obj.employerProfileId,
    amountNpr: obj.amountNpr,
    reason: obj.reason,
    adjustmentType: obj.adjustmentType,
  };
}
