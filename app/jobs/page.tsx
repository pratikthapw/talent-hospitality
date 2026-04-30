import type { Metadata } from "next";

import { getPublishedJobs } from "@/lib/jobs/job-posting-cycle";

export const metadata: Metadata = {
  title: "Jobs — Talent Hospitality Platform",
  description: "Browse available positions on Talent Hospitality Platform.",
};

function capitalizeEmploymentType(type: string): string {
  return type
    .split(/[-_\s]/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join("-");
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

  const fmt = (n: number) => n.toLocaleString("en-US", { minimumFractionDigits: 0 });

  const currencySymbol = currency !== null && currency === "USD" ? "$" : (currency ?? "");
  const range = (() => {
    if (min !== null && max !== null) {
      return `${currencySymbol}${fmt(min)} – ${currencySymbol}${fmt(max)}`;
    }
    if (min !== null) {
      return `From ${currencySymbol}${fmt(min)}`;
    }
    return `Up to ${currencySymbol}${fmt(max!)}`;
  })();

  const suffix = period !== null ? ` / ${period.toLowerCase()}` : "";
  return `${range}${suffix}`;
}

function truncateDescription(text: string, maxLen = 200): string {
  if (text.length <= maxLen) {
    return text;
  }
  return text.slice(0, maxLen).replace(/\s+\S*$/, "") + "…";
}

export default async function JobsPage() {
  const jobs = await getPublishedJobs();

  if (jobs.length === 0) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <h1 className="mb-8 text-3xl font-bold text-gray-900">Available Jobs</h1>
        <div className="py-16 text-center text-gray-500">
          No jobs available right now. Check back soon!
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="mb-8 text-3xl font-bold text-gray-900">Available Jobs</h1>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {jobs.map((job) => {
          const salary = formatSalary(
            job.salaryMin,
            job.salaryMax,
            job.salaryCurrency,
            job.salaryPeriod,
          );

          return (
            <article
              key={job.id}
              className="flex flex-col rounded-lg border border-gray-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
            >
              <div className="flex items-start justify-between gap-3">
                <h2 className="text-xl leading-snug font-semibold text-gray-900">{job.title}</h2>
                <span className="inline-flex shrink-0 items-center rounded-full bg-indigo-100 px-2.5 py-0.5 text-xs font-medium whitespace-nowrap text-indigo-800">
                  {job.durationDays} days
                </span>
              </div>

              <p className="mt-1 text-sm text-gray-500">{job.companyName}</p>

              <p className="mt-2 text-sm text-gray-600">
                {job.location}
                <span className="mx-1.5 text-gray-300">·</span>
                {capitalizeEmploymentType(job.employmentType)}
              </p>

              {salary !== null && (
                <p className="mt-1.5 text-sm font-medium text-green-700">{salary}</p>
              )}

              <p className="mt-2 line-clamp-3 text-sm text-gray-600">
                {truncateDescription(job.description)}
              </p>

              <div className="mt-auto flex items-center justify-between pt-3 text-xs text-gray-400">
                <span>Published {job.publishedAt.toLocaleDateString()}</span>
                <span>Expires {job.expiresAt.toLocaleDateString()}</span>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
