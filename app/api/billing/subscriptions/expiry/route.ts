import { headers } from "next/headers";
import { NextResponse } from "next/server";

import { eq } from "drizzle-orm";

import { auth } from "@/lib/auth";
import { employerProfile, employerSubscription, userRoles } from "@/lib/auth-schema";
import { db } from "@/lib/db";

interface ExpireRenewBody {
  action: "expire" | "renew";
  billingTerm?: "monthly" | "yearly";
}

async function getEmployerProfile(userId: string) {
  const roleRow = await db
    .select({ role: userRoles.role })
    .from(userRoles)
    .where(eq(userRoles.userId, userId))
    .then((rows) => rows[0] as { role: string } | undefined);

  if (roleRow?.role !== "employer") {
    return null;
  }

  return db
    .select({ id: employerProfile.id })
    .from(employerProfile)
    .where(eq(employerProfile.userId, userId))
    .then((rows) => rows[0] as { id: string } | undefined);
}

function isExpireRenewBody(raw: unknown): raw is ExpireRenewBody {
  if (typeof raw !== "object" || raw === null) {
    return false;
  }
  if (!("action" in raw)) {
    return false;
  }
  const action = raw.action;
  if (action !== "expire" && action !== "renew") {
    return false;
  }
  return true;
}

function extractBody(raw: unknown): ExpireRenewBody | null {
  if (!isExpireRenewBody(raw)) {
    return null;
  }
  const billingTerm =
    "billingTerm" in raw && (raw.billingTerm === "monthly" || raw.billingTerm === "yearly")
      ? raw.billingTerm
      : undefined;
  return { action: raw.action, billingTerm };
}

async function expireSubscription(sub: typeof employerSubscription.$inferSelect) {
  if (sub.status !== "active") {
    return NextResponse.json({ error: "Cannot expire a non-active subscription" }, { status: 400 });
  }

  const [updated] = await db
    .update(employerSubscription)
    .set({ status: "expired", updatedAt: new Date() })
    .where(eq(employerSubscription.id, sub.id))
    .returning();

  return NextResponse.json({ subscription: updated });
}

async function renewSubscription(
  sub: typeof employerSubscription.$inferSelect,
  billingTerm?: "monthly" | "yearly",
) {
  if (sub.status !== "expired" && sub.status !== "cancelled") {
    return NextResponse.json(
      { error: "Cannot renew a subscription that is not expired or cancelled" },
      { status: 400 },
    );
  }

  const now = new Date();
  const term = billingTerm ?? sub.billingTerm;
  const daysToAdd = term === "yearly" ? 365 : 30;
  const newExpiresAt = new Date(now.getTime() + daysToAdd * 24 * 60 * 60 * 1000);

  const [updated] = await db
    .update(employerSubscription)
    .set({ status: "active", expiresAt: newExpiresAt, billingTerm: term, updatedAt: now })
    .where(eq(employerSubscription.id, sub.id))
    .returning();

  return NextResponse.json({ subscription: updated });
}

// POST /api/billing/subscriptions/expiry
export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (session === null) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const profile = await getEmployerProfile(session.user.id);
  if (profile === undefined || profile === null) {
    return NextResponse.json({ error: "Employer profile not found or forbidden" }, { status: 403 });
  }

  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const body = extractBody(rawBody);
  if (body === null) {
    return NextResponse.json({ error: 'action must be "expire" or "renew"' }, { status: 400 });
  }

  const sub = await db.query.employerSubscription.findFirst({
    where: eq(employerSubscription.employerProfileId, profile.id),
  });

  if (sub === undefined) {
    return NextResponse.json({ error: "No subscription found" }, { status: 404 });
  }

  return body.action === "expire"
    ? expireSubscription(sub)
    : renewSubscription(sub, body.billingTerm);
}
