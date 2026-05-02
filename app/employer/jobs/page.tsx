import { headers } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";

import {
  Add01Icon,
  ArrowLeft02Icon,
  Briefcase02Icon,
  Location01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

import { JobCycleHistory } from "@/components/jobs/job-cycle-history";
import { Button } from "@/components/ui/button";
import { auth } from "@/lib/auth";
import { getCycleLineage, getEmployerJobsWithCycles } from "@/lib/jobs/job-posting-cycle";
import type { CycleLineageEntry } from "@/lib/jobs/job-posting-cycle";
import { getEmployerByUserId } from "@/lib/verification/employer-verification";

export const metadata = {
  title: "My Jobs - Employer - THP",
};

const STATUS_LABEL: Record<string, string> = {
  draft: "Draft",
  published: "Published",
  paused: "Paused",
  closed: "Closed",
  expired: "Expired",
};

const STATUS_BADGE: Record<string, string> = {
  draft:
    "inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800 dark:bg-blue-900/50 dark:text-blue-300",
  published:
    "inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800 dark:bg-green-900/50 dark:text-green-300",
  paused:
    "inline-flex items-center rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-800 dark:bg-amber-900/50 dark:text-amber-300",
  closed:
    "inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-800 dark:bg-red-900/50 dark:text-red-300",
  expired:
    "inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-800 dark:bg-gray-900/50 dark:text-gray-300",
};

const EMPLOYMENT_TYPE_LABEL: Record<string, string> = {
  full_time: "Full-time",
  part_time: "Part-time",
  contract: "Contract",
  internship: "Internship",
  temporary: "Temporary",
};

function formatDate(value: Date | string | null): string | null {
  if (value === null) {
    return null;
  }
  const date = typeof value === "string" ? new Date(value) : value;
  return new Intl.DateTimeFormat("en-US", { dateStyle: "medium" }).format(date);
}

function formatSalary(
  min: number | null,
  max: number | null,
  currency: string | null,
  period: string | null,
): string | null {
  if (min === null && max === null) {
    return null;
  }
  const cur = currency === "NPR" ? "₹" : currency === "USD" ? "$" : "";
  const per = period === "yearly" ? "/yr" : period === "monthly" ? "/mo" : "";
  if (min !== null && max !== null) {
    return `${cur}${min.toLocaleString()} – ${cur}${max.toLocaleString()}${per}`;
  }
  if (min !== null) {
    return `From ${cur}${min.toLocaleString()}${per}`;
  }
  return `Up to ${cur}${max!.toLocaleString()}${per}`;
}

export default async function EmployerJobsPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (session === null) {
    redirect("/sign-in");
  }

  const employer = await getEmployerByUserId(session.user.id);
  if (employer?.verificationStatus !== "verified") {
    redirect("/employer/jobs");
  }

  const jobs = await getEmployerJobsWithCycles(employer.id);

  const cycleLineageMap = new Map<string, CycleLineageEntry[]>();
  await Promise.all(
    jobs.map(async (job) => {
      const lineage = await getCycleLineage(job.jobDraftId);
      cycleLineageMap.set(job.jobDraftId, lineage);
    }),
  );

  return (
    <div className="mx-auto max-w-5xl space-y-8 px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div>
        <Link
          href="/employer"
          className="inline-flex items-center text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <HugeiconsIcon icon={ArrowLeft02Icon} className="mr-1.5 h-4 w-4" />
          Back to Dashboard
        </Link>

        <div className="mt-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
              <HugeiconsIcon icon={Briefcase02Icon} className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-foreground">My Jobs</h1>
              <p className="mt-1 text-muted-foreground">
                Manage your job listings and posting cycles.
              </p>
            </div>
          </div>

          <Link href="/employer/jobs/new">
            <Button size="lg">
              <HugeiconsIcon icon={Add01Icon} className="mr-1.5 h-4 w-4" />
              Create New Job
            </Button>
          </Link>
        </div>
      </div>

      {/* Job List */}
      {jobs.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border bg-card p-12 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
            <HugeiconsIcon icon={Briefcase02Icon} className="h-6 w-6 text-muted-foreground" />
          </div>
          <p className="mb-4 text-muted-foreground">
            No jobs yet. Create your first job listing to start hiring.
          </p>
          <Link href="/employer/jobs/new">
            <Button>Create Job</Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {jobs.map((job) => {
            const cycles = cycleLineageMap.get(job.jobDraftId) ?? [];
            const expiryDate = formatDate(job.currentCycleExpiresAt);
            const badgeClasses = STATUS_BADGE[job.status] ?? STATUS_BADGE.draft;

            return (
              <div
                key={job.jobDraftId}
                className="rounded-lg border border-border bg-card p-6 shadow-sm"
              >
                {/* Card header */}
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h2 className="text-lg font-semibold text-foreground">{job.title}</h2>
                      <span className={badgeClasses}>{STATUS_LABEL[job.status] ?? job.status}</span>
                    </div>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                      {job.location && (
                        <span className="flex items-center gap-1">
                          <HugeiconsIcon icon={Location01Icon} className="h-3.5 w-3.5" />
                          {job.location}
                        </span>
                      )}
                      {job.employmentType && (
                        <span>
                          {EMPLOYMENT_TYPE_LABEL[job.employmentType] ?? job.employmentType}
                        </span>
                      )}
                      {formatSalary(job.salaryMin, job.salaryMax, null, null) !== null && (
                        <span>{formatSalary(job.salaryMin, job.salaryMax, null, null)}</span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {job.cycleCount > 0 && (
                      <span className="inline-flex items-center rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
                        {job.cycleCount} {job.cycleCount === 1 ? "cycle" : "cycles"}
                      </span>
                    )}
                    {(job.status === "published" || job.status === "paused") && (
                      <Link href={`/employer/jobs/${job.jobDraftId}/edit`}>
                        <Button type="button" variant="outline" size="sm">
                          Edit
                        </Button>
                      </Link>
                    )}
                  </div>
                </div>

                {/* Active cycle expiry */}
                {job.currentCycleStatus === "active" && expiryDate !== null && (
                  <p className="mt-2 text-sm text-muted-foreground">
                    Expires on <span className="font-medium text-foreground">{expiryDate}</span>
                  </p>
                )}

                {/* Cycle history */}
                {cycles.length > 0 && (
                  <div className="mt-4 border-t border-border pt-4">
                    <JobCycleHistory
                      cycles={cycles}
                      jobTitle={job.title}
                      jobDraftId={job.jobDraftId}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
