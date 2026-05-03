import "server-only";
import { eq, desc, and } from "drizzle-orm";

import { creditLedger, creditWallet } from "../auth-schema";
import { db } from "../db";

type DbTransaction = Parameters<Parameters<typeof db.transaction>[0]>[0];

export type CreditSourceType =
  | "signup_grant"
  | "subscription_grant"
  | "yearly_monthly_grant"
  | "top_up_purchase"
  | "admin_adjustment"
  | "admin_refund"
  | "publish_cost"
  | "boost_cost";

export interface AppendLedgerInput {
  employerProfileId: string;
  amountNpr: number;
  sourceType: CreditSourceType;
  referenceId: string;
  reason: string;
  actorId?: string | null;
}

/** Appends a ledger entry. Throws if referenceId already exists (idempotency guard). */
export async function appendLedger(input: AppendLedgerInput) {
  const [entry] = await db
    .insert(creditLedger)
    .values({
      employerProfileId: input.employerProfileId,
      amountNpr: input.amountNpr,
      sourceType: input.sourceType,
      referenceId: input.referenceId,
      reason: input.reason,
      actorId: input.actorId ?? null,
    })
    .returning();
  return entry;
}

export interface LedgerEntry {
  id: string;
  amountNpr: number;
  sourceType: CreditSourceType;
  referenceId: string;
  reason: string;
  createdAt: Date;
}

export interface FullLedgerEntry extends LedgerEntry {
  actorId: string | null;
}

/** Returns ALL ledger entries for an employer, newest first (includes actorId). */
export async function getFullWalletHistory(
  employerProfileId: string,
  limit = 50,
  offset = 0,
): Promise<FullLedgerEntry[]> {
  return db
    .select({
      id: creditLedger.id,
      amountNpr: creditLedger.amountNpr,
      sourceType: creditLedger.sourceType,
      referenceId: creditLedger.referenceId,
      reason: creditLedger.reason,
      createdAt: creditLedger.createdAt,
      actorId: creditLedger.actorId,
    })
    .from(creditLedger)
    .where(eq(creditLedger.employerProfileId, employerProfileId))
    .orderBy(desc(creditLedger.createdAt))
    .limit(limit)
    .offset(offset);
}

/** Returns paginated ledger history for an employer profile, newest first. */
export async function getLedgerHistory(
  employerProfileId: string,
  limit = 50,
  offset = 0,
): Promise<LedgerEntry[]> {
  return db
    .select({
      id: creditLedger.id,
      amountNpr: creditLedger.amountNpr,
      sourceType: creditLedger.sourceType,
      referenceId: creditLedger.referenceId,
      reason: creditLedger.reason,
      createdAt: creditLedger.createdAt,
    })
    .from(creditLedger)
    .where(eq(creditLedger.employerProfileId, employerProfileId))
    .orderBy(desc(creditLedger.createdAt))
    .limit(limit)
    .offset(offset);
}

/** Returns only subscription-grant entries for the given employer. */
export async function getSubscriptionGrantHistory(
  employerProfileId: string,
  limit = 50,
  offset = 0,
): Promise<LedgerEntry[]> {
  return db
    .select({
      id: creditLedger.id,
      amountNpr: creditLedger.amountNpr,
      sourceType: creditLedger.sourceType,
      referenceId: creditLedger.referenceId,
      reason: creditLedger.reason,
      createdAt: creditLedger.createdAt,
    })
    .from(creditLedger)
    .where(
      and(
        eq(creditLedger.employerProfileId, employerProfileId),
        eq(creditLedger.sourceType, "subscription_grant"),
      ),
    )
    .orderBy(desc(creditLedger.createdAt))
    .limit(limit)
    .offset(offset);
}

/**
 * Deduct credits for a publish action within an existing transaction.
 * Amount should be NEGATIVE (e.g. -500).
 * Uses the wallet row-lock pattern for concurrent safety.
 */
export async function deductCredits(
  tx: DbTransaction,
  params: {
    employerProfileId: string;
    amountNpr: number;
    referenceId: string;
    reason: string;
    actorId?: string | null;
    sourceType?: CreditSourceType;
  },
): Promise<{ balanceNpr: number }> {
  const { employerProfileId, amountNpr, referenceId, reason, actorId } = params;

  // Lock wallet row for concurrent safety
  const walletResults = await tx
    .select()
    .from(creditWallet)
    .where(eq(creditWallet.employerProfileId, employerProfileId))
    .for("update");

  if (walletResults.length === 0) {
    throw new Error("Credit wallet not found. Ensure the employer has a wallet before publishing.");
  }

  const wallet = walletResults[0];

  if (wallet.balanceNpr + amountNpr < 0) {
    throw new Error(
      `Insufficient credits. Current balance: ${wallet.balanceNpr}, required: ${Math.abs(amountNpr)}.`,
    );
  }

  // Append ledger entry (negative amount)
  await tx.insert(creditLedger).values({
    employerProfileId,
    amountNpr,
    sourceType: params.sourceType ?? "publish_cost",
    referenceId,
    reason,
    actorId: actorId ?? null,
  });

  // Update wallet balance
  const newBalance = wallet.balanceNpr + amountNpr;
  await tx
    .update(creditWallet)
    .set({ balanceNpr: newBalance, updatedAt: new Date() })
    .where(eq(creditWallet.employerProfileId, employerProfileId));

  return { balanceNpr: newBalance };
}
