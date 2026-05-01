import { headers } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";

import { ArrowLeft02Icon, Shield01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { and, eq } from "drizzle-orm";

import { SearchVisibilityToggle } from "@/components/profile/search-visibility-toggle";
import { auth } from "@/lib/auth";
import { employeeProfile, userRoles } from "@/lib/auth-schema";
import { db } from "@/lib/db";
import type { SearchEligibilityResult } from "@/lib/profile/search-visibility-policy";
import { getSearchEligibility } from "@/lib/profile/search-visibility-policy";

type VerificationStatus = "unverified" | "pending_review" | "verified" | "rejected";

export const metadata = { title: "Privacy Settings - Employee - THP" };

export default async function EmployeePrivacyPage() {
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
        <h1 className="mb-4 text-2xl font-bold tracking-tight text-foreground">
          Privacy Settings
        </h1>
        <p className="text-muted-foreground">
          Please complete your employee onboarding before accessing privacy settings.
        </p>
      </div>
    );
  }

  // Fetch employee profile for visibility and verification data
  const profiles = await db
    .select({
      searchVisible: employeeProfile.searchVisible,
      verificationStatus: employeeProfile.verificationStatus,
    })
    .from(employeeProfile)
    .where(eq(employeeProfile.userId, session.user.id))
    .limit(1);

  const raw = profiles.length > 0 ? profiles[0] : null;
  const searchVisible = raw?.searchVisible ?? false;
  const verificationStatus: VerificationStatus = (raw?.verificationStatus ?? "unverified") as VerificationStatus;

  // Compute eligibility
  const eligibility: SearchEligibilityResult = getSearchEligibility(
    verificationStatus,
    searchVisible,
  );

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
          <HugeiconsIcon icon={Shield01Icon} className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Privacy Settings
          </h1>
          <p className="mt-1 text-muted-foreground">
            Control how employers discover your profile.
          </p>
        </div>
      </div>

      {/* Search Visibility Toggle */}
      <SearchVisibilityToggle
        searchVisible={eligibility.searchVisible}
        verificationStatus={eligibility.verificationStatus}
        isEligible={eligibility.isEligible}
        explanation={eligibility.explanation}
      />
    </div>
  );
}
