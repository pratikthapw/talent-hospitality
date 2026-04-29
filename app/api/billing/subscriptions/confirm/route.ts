import { headers } from "next/headers";
import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { confirmSubscriptionPayment } from "@/lib/billing/payment-confirmation";

// POST /api/billing/subscriptions/confirm
export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const paymentId = validatePaymentId(raw);
  if (paymentId === null) {
    return NextResponse.json({ error: "paymentId is required" }, { status: 400 });
  }

  const result = await confirmSubscriptionPayment(paymentId, session.user.id);

  if (!result.success) {
    return NextResponse.json({ error: result.message }, { status: 400 });
  }

  return NextResponse.json({
    success: true,
    paymentId: result.paymentId,
    walletBalanceNpr: result.walletBalanceNpr,
    ledgerEntryId: result.ledgerEntryId,
    message: result.message,
  });
}

function validatePaymentId(value: unknown): string | null {
  if (typeof value === "object" && value !== null && "paymentId" in value) {
    const candidate = (value as { paymentId: unknown }).paymentId;
    if (typeof candidate === "string" && candidate.length > 0) {
      return candidate;
    }
  }
  return null;
}
