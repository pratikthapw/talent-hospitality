import "server-only";
import { eq } from "drizzle-orm";

import { subscriptionPayment, creditWallet } from "../auth-schema";
import { db } from "../db";
import { appendLedger } from "./credit-ledger";
import { ensureWallet } from "./wallet-balance";

export interface ConfirmPaymentResult {
  success: boolean;
  paymentId: string;
  walletBalanceNpr: number;
  ledgerEntryId?: string;
  message: string;
}

/**
 * Confirms a payment and grants credits to the employer wallet.
 * Idempotent: calling twice with the same paymentId is safe.
 * Only processes payments in "pending" or "confirmed" status.
 */
export async function confirmSubscriptionPayment(
  paymentId: string,
  actorId?: string,
): Promise<ConfirmPaymentResult> {
  // 1. Load the payment with plan info to get the monthly credit grant amount
  const payment = await db.query.subscriptionPayment.findFirst({
    where: eq(subscriptionPayment.id, paymentId),
    with: { plan: true },
  });

  if (!payment) {
    return { success: false, paymentId, walletBalanceNpr: 0, message: "Payment not found." };
  }

  if (payment.status === "failed") {
    return {
      success: false,
      paymentId,
      walletBalanceNpr: 0,
      message: "Cannot confirm a failed payment.",
    };
  }

  // Idempotency: if already confirmed, return current wallet balance without re-granting
  if (payment.status === "confirmed") {
    const wallet = await ensureWallet(payment.employerProfileId);
    return {
      success: true,
      paymentId,
      walletBalanceNpr: wallet.balanceNpr,
      message: "Payment was already confirmed. No duplicate grant issued.",
    };
  }

  // 2. Transaction: confirm payment, grant credits, update wallet
  const creditAmount = payment.plan.monthlyCreditGrant;
  const reason = `Subscription grant: ${payment.plan.displayName} (${payment.billingTerm})`;
  const ledgerRefId = `sub_grant_${paymentId}`;

  return db.transaction(async (tx) => {
    // 2a. Mark payment confirmed
    await tx
      .update(subscriptionPayment)
      .set({ status: "confirmed", confirmedAt: new Date() })
      .where(eq(subscriptionPayment.id, paymentId));

    // 2b. Ensure wallet exists
    const wallet = await ensureWallet(payment.employerProfileId);

    // 2c. Append ledger entry (throws if referenceId already exists due to unique index)
    // This is the idempotency guard at the database level
    const entry = await appendLedger({
      employerProfileId: payment.employerProfileId,
      amountNpr: creditAmount,
      sourceType: "subscription_grant",
      referenceId: ledgerRefId,
      reason,
      actorId,
    });

    // 2d. Update wallet balance
    const newBalance = wallet.balanceNpr + creditAmount;
    await tx
      .update(creditWallet)
      .set({ balanceNpr: newBalance })
      .where(eq(creditWallet.employerProfileId, payment.employerProfileId));

    return {
      success: true,
      paymentId,
      walletBalanceNpr: newBalance,
      ledgerEntryId: entry.id,
      message: `Granted ${creditAmount} credits. New wallet balance: ${newBalance}.`,
    };
  });
}

/**
 * Creates a pending subscription payment record.
 * This is called when an employer initiates a subscription purchase (before payment confirmation).
 */
export async function createPendingPayment(params: {
  employerProfileId: string;
  planId: string;
  billingTerm: "monthly" | "yearly";
  amountNpr: number;
  paymentMethod: string;
  paymentRef: string;
  subscriptionId?: string;
}): Promise<string> {
  const [payment] = await db
    .insert(subscriptionPayment)
    .values({
      employerProfileId: params.employerProfileId,
      planId: params.planId,
      billingTerm: params.billingTerm,
      amountNpr: params.amountNpr,
      status: "pending",
      paymentMethod: params.paymentMethod,
      paymentRef: params.paymentRef,
      subscriptionId: params.subscriptionId ?? null,
    })
    .returning({ id: subscriptionPayment.id });
  return payment.id;
}
