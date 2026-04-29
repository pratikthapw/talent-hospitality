import { eq } from "drizzle-orm";

import { creditWallet } from "../auth-schema";
import { db } from "../db";
import { appendLedger } from "./credit-ledger";
import type { LedgerEntry } from "./credit-ledger";

/** Returns the current wallet balance in NPR minor units for an Employer Profile. */
export async function getWalletBalance(employerProfileId: string): Promise<number> {
  const wallet = await db.query.creditWallet.findFirst({
    where: eq(creditWallet.employerProfileId, employerProfileId),
  });
  return wallet?.balanceNpr ?? 0;
}

/** Ensures a wallet row exists for the employer profile. Returns the wallet. */
export async function ensureWallet(employerProfileId: string) {
  const existing = await db.query.creditWallet.findFirst({
    where: eq(creditWallet.employerProfileId, employerProfileId),
  });
  if (existing) {
    return existing;
  }

  const [wallet] = await db
    .insert(creditWallet)
    .values({ employerProfileId, balanceNpr: 0 })
    .returning();
  return wallet;
}

/** Applies a top-up purchase: ensures wallet, appends ledger entry, updates balance. */
export async function applyTopUp(
  employerProfileId: string,
  amountNpr: number,
): Promise<{ balanceNpr: number; entry: LedgerEntry }> {
  return db.transaction(async (tx) => {
    const wallet = await ensureWallet(employerProfileId);

    const referenceId = `top_up_${Date.now()}_${crypto.randomUUID().slice(0, 8)}`;
    const entry = await appendLedger({
      employerProfileId,
      amountNpr,
      sourceType: "top_up_purchase",
      referenceId,
      reason: "Top-up purchase",
    });

    const newBalance = wallet.balanceNpr + amountNpr;
    await tx
      .update(creditWallet)
      .set({ balanceNpr: newBalance })
      .where(eq(creditWallet.employerProfileId, employerProfileId));

    return { balanceNpr: newBalance, entry };
  });
}

/** Applies an admin adjustment or refund: ensures wallet, appends ledger entry with actor, updates balance. */
export async function applyAdminAdjustment(
  employerProfileId: string,
  amountNpr: number,
  reason: string,
  adjustmentType: "admin_adjustment" | "admin_refund",
  actorId: string,
): Promise<{ balanceNpr: number; entry: LedgerEntry }> {
  return db.transaction(async (tx) => {
    const wallet = await ensureWallet(employerProfileId);

    const referenceId = `admin_${Date.now()}_${crypto.randomUUID().slice(0, 8)}`;
    const entry = await appendLedger({
      employerProfileId,
      amountNpr,
      sourceType: adjustmentType,
      referenceId,
      reason,
      actorId,
    });

    const newBalance = wallet.balanceNpr + amountNpr;
    await tx
      .update(creditWallet)
      .set({ balanceNpr: newBalance })
      .where(eq(creditWallet.employerProfileId, employerProfileId));

    return { balanceNpr: newBalance, entry };
  });
}
