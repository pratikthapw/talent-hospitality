import "server-only";
import { eq, desc, and } from "drizzle-orm";

import { creditLedger } from "../auth-schema";
import { db } from "../db";

export type CreditSourceType =
  | "signup_grant"
  | "subscription_grant"
  | "yearly_monthly_grant"
  | "top_up_purchase"
  | "admin_adjustment"
  | "admin_refund";

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
