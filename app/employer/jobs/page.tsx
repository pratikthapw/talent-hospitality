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
  draft: "DRAFT",
  published: "PUBLISHED",
  paused: "PAUSED",
  closed: "CLOSED",
  expired: "EXPIRED",
};

const STATUS_BADGE: Record<string, string> = {
  draft:
    "inline-flex items-center rounded-sm bg-accent-blue px-[8px] py-[2px] text-[11px] font-semibold tracking-[1px] uppercase text-on-dark",
  published:
    "inline-flex items-center rounded-sm bg-brand-green px-[8px] py-[2px] text-[11px] font-semibold tracking-[1px] uppercase text-on-primary",
  paused:
    "inline-flex items-center rounded-sm bg-accent-orange px-[8px] py-[2px] text-[11px] font-semibold tracking-[1px] uppercase text-on-dark",
  closed:
    "inline-flex items-center rounded-sm bg-hairline-strong px-[8px] py-[2px] text-[11px] font-semibold tracking-[1px] uppercase text-ink",
  expired:
    "inline-flex items-center rounded-sm bg-hairline-soft px-[8px] py-[2px] text-[11px] font-semibold tracking-[1px] uppercase text-slate",
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

  let cur = "";
  if (currency === "NPR") {
    cur = "₹";
  } else if (currency === "USD") {
    cur = "$";
  }

  let per = "";
  if (period === "yearly") {
    per = "/yr";
  } else if (period === "monthly") {
    per = "/mo";
  }

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
    <div className="min-h-screen bg-canvas font-sans selection:bg-brand-green/30">
      {/* Header Area */}
      <section className="text-on-dark bg-brand-teal-deep px-6 py-12 md:px-12 lg:px-24">
        <div className="mx-auto max-w-5xl">
          <Link
            href="/employer"
            className="mb-8 inline-flex items-center text-[14px] font-medium text-brand-green hover:underline"
          >
            <HugeiconsIcon icon={ArrowLeft02Icon} className="mr-1.5 h-4 w-4" />
            Back to Dashboard
          </Link>

          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-brand-teal-mid text-brand-green">
                <HugeiconsIcon icon={Briefcase02Icon} className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-[36px] leading-[1.25] font-medium tracking-[-0.5px] lg:text-[48px] lg:leading-[1.20]">
                  My Jobs
                </h1>
                <p className="text-on-dark-muted mt-1 text-[16px]">
                  Manage your job listings and posting cycles.
                </p>
              </div>
            </div>

            <Link href="/employer/jobs/new">
              <Button size="lg" className="rounded-full">
                <HugeiconsIcon icon={Add01Icon} className="mr-1.5 h-4 w-4" />
                Create New Job
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Main Canvas */}
      <section className="mx-auto w-full max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
        {jobs.length === 0 ? (
          <div className="rounded-[12px] border-[1px] border-hairline bg-surface p-[48px] text-center">
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-hairline-soft">
              <HugeiconsIcon icon={Briefcase02Icon} className="h-8 w-8 text-stone" />
            </div>
            <h2 className="mb-2 text-[22px] font-medium text-ink">No jobs yet</h2>
            <p className="mb-8 text-[16px] text-steel">
              Create your first job listing to start hiring talent.
            </p>
            <Link href="/employer/jobs/new">
              <Button className="rounded-full">Create Job</Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-[24px]">
            {jobs.map((job) => {
              const cycles = cycleLineageMap.get(job.jobDraftId) ?? [];
              const expiryDate = formatDate(job.currentCycleExpiresAt);
              const badgeClasses = STATUS_BADGE[job.status] ?? STATUS_BADGE.draft;

              return (
                <div
                  key={job.jobDraftId}
                  className="rounded-[12px] border-[1px] border-hairline bg-canvas p-[24px] shadow-[0_1px_2px_rgba(0,30,43,0.04)] transition-shadow duration-200 hover:shadow-[0_4px_12px_rgba(0,30,43,0.08)]"
                >
                  <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-3">
                        <h2 className="text-[22px] leading-[1.35] font-medium text-ink">
                          {job.title}
                        </h2>
                        <span className={badgeClasses}>
                          {STATUS_LABEL[job.status] ?? job.status}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[14px] text-steel">
                        {job.location && (
                          <span className="flex items-center gap-1.5">
                            <HugeiconsIcon icon={Location01Icon} className="h-4 w-4 text-stone" />
                            {job.location}
                          </span>
                        )}
                        {job.employmentType && (
                          <span className="flex items-center gap-1.5">
                            <span className="h-1.5 w-1.5 rounded-full bg-brand-green-mid" />
                            {EMPLOYMENT_TYPE_LABEL[job.employmentType] ?? job.employmentType}
                          </span>
                        )}
                        {formatSalary(job.salaryMin, job.salaryMax, null, null) !== null && (
                          <span className="font-medium text-brand-teal">
                            {formatSalary(job.salaryMin, job.salaryMax, null, null)}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-3 md:flex-col md:items-end md:gap-2">
                      {job.cycleCount > 0 && (
                        <span className="inline-flex items-center rounded-full border-[1px] border-hairline-soft bg-surface-soft px-[10px] py-[4px] text-[13px] font-semibold text-slate">
                          {job.cycleCount} {job.cycleCount === 1 ? "cycle" : "cycles"}
                        </span>
                      )}
                      {(job.status === "published" || job.status === "paused") && (
                        <Link href={`/employer/jobs/${job.jobDraftId}/edit`}>
                          <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            className="rounded-full"
                          >
                            Edit Listing
                          </Button>
                        </Link>
                      )}
                    </div>
                  </div>

                  {job.currentCycleStatus === "active" && expiryDate !== null && (
                    <div className="mt-6 flex items-center gap-2 rounded-[8px] border-[1px] border-brand-green-soft bg-surface-feature p-[12px] text-[14px] text-brand-green-dark">
                      <span className="flex h-2 w-2 animate-pulse rounded-full bg-brand-green" />
                      <span>
                        Expires on <strong>{expiryDate}</strong>
                      </span>
                    </div>
                  )}

                  {cycles.length > 0 && (
                    <div className="mt-8 border-t-[1px] border-hairline-soft pt-6">
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
      </section>
    </div>
  );
}
