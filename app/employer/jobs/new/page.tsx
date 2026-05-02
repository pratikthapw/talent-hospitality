import { headers } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";

import { ArrowLeft02Icon, FileEditIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

import { auth } from "@/lib/auth";
import { getEmployerByUserId } from "@/lib/verification/employer-verification";

import { NewJobDraftHandler } from "./new-job-draft-handler";

export const metadata = {
  title: "Create Job Draft - Employer - THP",
};

export default async function CreateJobDraftPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (session === null) {
    redirect("/sign-in");
  }

  const employer = await getEmployerByUserId(session.user.id);

  if (employer === null) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-12 text-center sm:px-6 lg:px-8">
        <h1 className="mb-4 text-2xl font-bold tracking-tight text-foreground">
          Complete Onboarding
        </h1>
        <p className="text-muted-foreground">
          Please complete your Employer Profile setup before creating job drafts.
        </p>
      </div>
    );
  }

  if (employer.verificationStatus !== "verified") {
    const statusMessages: Record<string, string> = {
      pending_review:
        "Your Employer Profile is currently under review. You will be able to create job drafts once verification is complete.",
      rejected:
        "Your Employer Verification was not approved. Please review the notes on your verification page or contact support.",
    };

    return (
      <div className="mx-auto max-w-2xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Create Job Draft</h1>
          <p className="mt-2 text-lg text-muted-foreground">
            Save a draft job posting you can publish later.
          </p>
        </div>

        <div className="rounded-lg border border-amber-200 bg-amber-50 p-6 shadow-sm dark:border-amber-900 dark:bg-amber-950/50">
          <h2 className="mb-2 text-lg font-semibold text-amber-800 dark:text-amber-200">
            Employer Verification Required
          </h2>
          <p className="mb-4 text-sm text-amber-700 dark:text-amber-300">
            {statusMessages[employer.verificationStatus as string] ??
              "You need to complete Employer Verification before creating job drafts."}
          </p>
          <Link
            href="/employer/settings/verification"
            className="inline-flex items-center text-sm font-medium text-amber-800 underline underline-offset-4 hover:text-amber-900 dark:text-amber-200 dark:hover:text-amber-100"
          >
            View Verification Status
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-8 px-4 py-8 sm:px-6 lg:px-8">
      {/* Back link */}
      <Link
        href="/employer/jobs"
        className="inline-flex items-center text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        <HugeiconsIcon icon={ArrowLeft02Icon} className="mr-1.5 h-4 w-4" />
        Back to Jobs
      </Link>

      <div>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
            <HugeiconsIcon icon={FileEditIcon} className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Create Job Draft</h1>
            <p className="mt-1 text-muted-foreground">
              Save a draft of your job posting. No credits will be charged until you publish.
            </p>
          </div>
        </div>
      </div>

      {/* Draft notice */}
      <div className="rounded-md border border-border bg-muted/50 px-4 py-3">
        <p className="text-sm text-muted-foreground">
          <span className="font-medium text-foreground">Draft mode:</span> This job posting will be
          saved as a draft. You can edit it anytime without spending credits. When you are ready to
          make it visible to candidates, publish it from your jobs list.
        </p>
      </div>

      {/* Form */}
      <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
        <NewJobDraftHandler />
      </div>
    </div>
  );
}
