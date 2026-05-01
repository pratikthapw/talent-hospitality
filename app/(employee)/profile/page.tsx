import { headers } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";

import {
  ArrowLeft02Icon,
  Cancel01Icon,
  CheckmarkCircle01Icon,
  UserCircleIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { and, eq } from "drizzle-orm";

import { ProfileForm } from "@/components/profile/profile-form";
import { auth } from "@/lib/auth";
import { employeeProfile, userRoles } from "@/lib/auth-schema";
import { db } from "@/lib/db";
import { hasActiveCV } from "@/lib/profile/active-cv-manager";
import {
  checkProfileCompleteness,
  getCompletenessPercentage,
} from "@/lib/profile/profile-completeness-policy";
import type { EmployeeProfileData } from "@/lib/profile/profile-completeness-policy";

export const metadata = { title: "My Profile - Employee - THP" };

async function buildProfileData(
  row: typeof employeeProfile.$inferSelect | null,
): Promise<EmployeeProfileData> {
  if (row === null) {
    return {
      fullName: null,
      phone: null,
      currentLocation: null,
      preferredCategory: null,
      experienceLevel: null,
      skills: null,
      languages: null,
      educationSummary: null,
      workHistorySummary: null,
      hasActiveCV: false,
    };
  }
  const cvActive = await hasActiveCV(row.id);
  return {
    fullName: row.fullName,
    phone: row.phone,
    currentLocation: row.currentLocation,
    preferredCategory: row.preferredCategory,
    experienceLevel: row.experienceLevel,
    skills: row.skills,
    languages: row.languages,
    educationSummary: row.educationSummary,
    workHistorySummary: row.workHistorySummary,
    hasActiveCV: cvActive,
  };
}

export default async function EmployeeProfilePage() {
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
        <h1 className="mb-4 text-2xl font-bold tracking-tight text-foreground">Employee Profile</h1>
        <p className="text-muted-foreground">
          Please complete your employee onboarding before accessing your profile.
        </p>
      </div>
    );
  }

  // Fetch employee profile data
  const profiles = await db
    .select()
    .from(employeeProfile)
    .where(eq(employeeProfile.userId, session.user.id))
    .limit(1);

  const profile = profiles.length > 0 ? profiles[0] : null;

  // Completeness check
  const profileData = await buildProfileData(profile);
  const completeness = checkProfileCompleteness(profileData);
  const completenessPct = getCompletenessPercentage(completeness);

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
          <HugeiconsIcon icon={UserCircleIcon} className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">My Profile</h1>
          <p className="mt-1 text-muted-foreground">
            Keep your profile complete to start applying for jobs.
          </p>
        </div>
      </div>

      {/* Readiness status card */}
      {completeness.isReadyToApply ? (
        <div className="rounded-lg border border-green-200 bg-green-50 p-6 shadow-sm dark:border-green-900 dark:bg-green-950/50">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/60">
              <HugeiconsIcon
                icon={CheckmarkCircle01Icon}
                className="h-5 w-5 text-green-600 dark:text-green-400"
              />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-green-800 dark:text-green-200">
                You&apos;re Ready to Apply!
              </h2>
              <p className="mt-0.5 text-sm text-green-700 dark:text-green-300">
                Your profile is complete. Employers can now see your full profile when you apply.
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-6 shadow-sm dark:border-amber-900 dark:bg-amber-950/50">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/60">
              <HugeiconsIcon
                icon={Cancel01Icon}
                className="h-5 w-5 text-amber-600 dark:text-amber-400"
              />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-amber-800 dark:text-amber-200">
                Complete Your Profile to Apply
              </h2>
              <p className="mt-0.5 text-sm text-amber-700 dark:text-amber-300">
                Fill in all required fields below to unlock job applications.
              </p>
            </div>
          </div>

          {/* Progress bar */}
          <div className="mt-5">
            <div className="mb-1.5 flex items-center justify-between text-sm">
              <span className="font-medium text-amber-800 dark:text-amber-200">
                {completeness.completedCount} of {completeness.totalRequired} required fields
              </span>
              <span className="font-semibold text-amber-900 dark:text-amber-100">
                {completenessPct}%
              </span>
            </div>
            <div className="h-2.5 overflow-hidden rounded-full bg-amber-200 dark:bg-amber-900">
              <div
                className="h-full rounded-full bg-amber-500 transition-all duration-300 dark:bg-amber-400"
                style={{ width: `${completenessPct}%` }}
              />
            </div>
          </div>

          {/* Missing fields list */}
          {completeness.missingFields.length > 0 && (
            <ul className="mt-4 space-y-2">
              {completeness.missingFields.map((field) => (
                <li key={field.field} className="flex items-start gap-2 text-sm">
                  <span className="mt-0.5 inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500 dark:bg-amber-400" />
                  <span>
                    <span className="font-medium text-amber-800 dark:text-amber-200">
                      {field.label}
                    </span>
                    <span className="text-amber-700 dark:text-amber-300"> — {field.hint}</span>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Profile form */}
      <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
        <ProfileForm
          profile={
            profile !== null
              ? {
                  fullName: profile.fullName,
                  phone: profile.phone,
                  currentLocation: profile.currentLocation,
                  preferredCategory: profile.preferredCategory,
                  experienceLevel: profile.experienceLevel,
                  skills: profile.skills,
                  languages: profile.languages,
                  educationSummary: profile.educationSummary,
                  workHistorySummary: profile.workHistorySummary,
                  profilePhoto: profile.profilePhoto,
                  expectedSalary: profile.expectedSalary,
                  trainingCertificates: profile.trainingCertificates,
                  personalSummary: profile.personalSummary,
                }
              : {
                  fullName: null,
                  phone: null,
                  currentLocation: null,
                  preferredCategory: null,
                  experienceLevel: null,
                  skills: null,
                  languages: null,
                  educationSummary: null,
                  workHistorySummary: null,
                  profilePhoto: null,
                  expectedSalary: null,
                  trainingCertificates: null,
                  personalSummary: null,
                }
          }
        />
      </div>
    </div>
  );
}
