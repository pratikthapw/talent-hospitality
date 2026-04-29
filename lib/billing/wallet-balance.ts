import { eq } from "drizzle-orm";

import { creditWallet } from "../auth-schema";
import { db } from "../db";

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
