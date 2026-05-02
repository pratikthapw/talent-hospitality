import { headers } from "next/headers";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { ArrowLeft02Icon, FileEditIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { eq, and } from "drizzle-orm";

import { auth } from "@/lib/auth";
import { jobDraft } from "@/lib/auth-schema";
import { db } from "@/lib/db";
import { getEmployerByUserId } from "@/lib/verification/employer-verification";

import { EditJobHandler } from "./edit-job-handler";

export const metadata = {
  title: "Edit Job - Employer - THP",
};

const STATUS_BADGE: Record<string, string> = {
  published:
    "inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800 dark:bg-green-900/50 dark:text-green-300",
  paused:
    "inline-flex items-center rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-800 dark:bg-amber-900/50 dark:text-amber-300",
};

const STATUS_LABEL: Record<string, string> = {
  published: "Published",
  paused: "Paused",
};

export default async function EditJobPage({ params }: { params: Promise<{ jobId: string }> }) {
  const { jobId } = await params;

  const session = await auth.api.getSession({ headers: await headers() });
  if (session === null) {
    redirect("/sign-in");
  }

  // Verify the employer is verified
  const employer = await getEmployerByUserId(session.user.id);
  if (employer?.verificationStatus !== "verified") {
    redirect("/employer/jobs");
  }

  // Load the job and verify ownership + editable status
  const result = await db
    .select()
    .from(jobDraft)
    .where(and(eq(jobDraft.id, jobId), eq(jobDraft.employerId, employer.id)));
  const found = result.at(0);

  if (found === undefined) {
    notFound();
  }

  if (found.status !== "published" && found.status !== "paused") {
    redirect("/employer/jobs");
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
            <div className="flex items-center gap-2">
              <h1 className="text-3xl font-bold tracking-tight text-foreground">Edit Job</h1>
              <span className={STATUS_BADGE[found.status] ?? ""}>{STATUS_LABEL[found.status]}</span>
            </div>
            <p className="mt-1 text-muted-foreground">
              Update your job posting details. Changes will be visible to candidates immediately.
            </p>
          </div>
        </div>
      </div>

      {/* Edit form + status controls */}
      <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
        <EditJobHandler
          jobId={found.id}
          currentStatus={found.status}
          initialData={{
            title: found.title,
            description: found.description,
            location: found.location,
            employmentType: found.employmentType,
            salaryMin: found.salaryMin,
            salaryMax: found.salaryMax,
            salaryCurrency: found.salaryCurrency ?? "USD",
            salaryPeriod: found.salaryPeriod ?? "yearly",
            requirements: found.requirements,
            benefits: found.benefits,
          }}
        />
      </div>
    </div>
  );
}
