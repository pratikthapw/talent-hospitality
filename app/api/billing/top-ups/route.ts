import { headers } from "next/headers";
import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { applyTopUp } from "@/lib/billing/wallet-balance";
import { getEmployerByUserId } from "@/lib/verification/employer-verification";

// POST /api/billing/top-ups
export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.redirect(new URL("/sign-in", request.url));
  }

  const employer = await getEmployerByUserId(session.user.id);
  if (!employer) {
    return NextResponse.json({ error: "Employer profile not found" }, { status: 404 });
  }

  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const amountNpr = parseAmount(raw);
  if (amountNpr === null) {
    return NextResponse.json({ error: "amountNpr must be a positive number" }, { status: 400 });
  }

  try {
    const { balanceNpr, entry } = await applyTopUp(employer.id, amountNpr);
    return NextResponse.json({ success: true, balanceNpr, entry });
  } catch (error) {
    console.error("Top-up failed:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

function parseAmount(value: unknown): number | null {
  if (typeof value === "object" && value !== null && "amountNpr" in value) {
    const candidate = (value as { amountNpr: unknown }).amountNpr;
    if (typeof candidate === "number" && candidate > 0) {
      return candidate;
    }
  }
  return null;
}
