import { NextResponse } from "next/server";

import { getPlanCatalog } from "@/lib/billing/plan-entitlement-policy";

export async function GET() {
  try {
    const plans = await getPlanCatalog();
    return NextResponse.json({ plans });
  } catch {
    return NextResponse.json({ error: "Failed to load plan catalog" }, { status: 500 });
  }
}
