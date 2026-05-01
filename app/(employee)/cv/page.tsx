import { headers } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";

import { ArrowLeft02Icon, File02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { and, eq } from "drizzle-orm";

import { CVManagerClient } from "@/components/profile/cv-manager-client";
import { auth } from "@/lib/auth";
import { userRoles } from "@/lib/auth-schema";
import { db } from "@/lib/db";

export const metadata = { title: "My CV - Employee - THP" };

export default async function EmployeeCVPage() {
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
        <h1 className="mb-4 text-2xl font-bold tracking-tight text-foreground">My CV</h1>
        <p className="text-muted-foreground">
          Please complete your employee onboarding before managing your CV.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-8 px-4 py-8 sm:px-6 lg:px-8">
      {/* Back link */}
      <Link
        href="/employee"
        className="inline-flex items-center text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        <HugeiconsIcon icon={ArrowLeft02Icon} className="mr-1.5 h-4 w-4" />
        Back to Dashboard
      </Link>

      {/* Page header */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
          <HugeiconsIcon icon={File02Icon} className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">My CV</h1>
          <p className="mt-1 text-muted-foreground">
            Upload or build your CV to apply for hospitality jobs.
          </p>
        </div>
      </div>

      {/* CV Manager */}
      <CVManagerClient />
    </div>
  );
}
