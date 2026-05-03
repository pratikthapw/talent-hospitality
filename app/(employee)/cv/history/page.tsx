import { headers } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";

import { ArrowLeft02Icon, File02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { and, eq } from "drizzle-orm";

import { CVHistoryClient } from "@/components/profile/cv-history-client";
import { auth } from "@/lib/auth";
import { userRoles } from "@/lib/auth-schema";
import { db } from "@/lib/db";

export const metadata = { title: "CV History - Employee - THP" };

export default async function CVHistoryPage() {
  // Auth guard
  const session = await auth.api.getSession({ headers: await headers() });
  if (session === null) {
    redirect("/sign-in");
  }

  // Employee role check
  const roleRows = await db
    .select({ role: userRoles.role })
    .from(userRoles)
    .where(and(eq(userRoles.userId, session.user.id), eq(userRoles.role, "employee")))
    .limit(1);

  if (roleRows.length === 0) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-12 text-center sm:px-6 lg:px-8">
        <h1 className="mb-4 text-2xl font-bold tracking-tight text-foreground">CV History</h1>
        <p className="text-muted-foreground">
          Please complete your employee onboarding before viewing your CV history.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-8 px-4 py-8 sm:px-6 lg:px-8">
      {/* Back link */}
      <Link
        href="/cv"
        className="inline-flex items-center text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        <HugeiconsIcon icon={ArrowLeft02Icon} className="mr-1.5 h-4 w-4" />
        Back to CV Manager
      </Link>

      {/* Page header */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
          <HugeiconsIcon icon={File02Icon} className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">CV History</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            View all CV versions and their retention status. Replaced CVs are retained for 60 days.
          </p>
        </div>
      </div>

      {/* Retention Notice */}
      <div className="rounded-lg border border-chart-5/30 bg-chart-5/10 p-4">
        <p className="text-sm text-chart-5">
          <strong>CV Retention Window:</strong> When you replace your active CV, the previous
          version is retained for 60 days. During this period, employers who previously unlocked
          your profile can still access the older CV. After 60 days, retained CVs are permanently
          removed.
        </p>
      </div>

      {/* Client-side history */}
      <CVHistoryClient />
    </div>
  );
}
