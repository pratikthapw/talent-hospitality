import type { Metadata } from "next";
import Link from "next/link";

import { getRankedPublishedJobs } from "@/lib/jobs/job-ranking-policy";

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

function BoostBadge({ boostType }: { boostType: "featured" | "urgent" | null }) {
  if (boostType === null) {
    return null;
  }

  if (boostType === "urgent") {
    return (
      <span className="text-on-dark inline-flex shrink-0 items-center rounded-sm bg-accent-orange px-[8px] py-[2px] text-[13px] font-semibold tracking-wide whitespace-nowrap uppercase">
        URGENT
      </span>
    );
  }

  return (
    <span className="text-on-dark inline-flex shrink-0 items-center rounded-sm bg-accent-purple px-[8px] py-[2px] text-[13px] font-semibold tracking-wide whitespace-nowrap uppercase">
      FEATURED
    </span>
  );
}

export default async function JobsPage() {
  const jobs = await getRankedPublishedJobs();

  return (
    <div className="flex min-h-screen flex-col bg-canvas font-sans selection:bg-brand-green/30">
      {/* Hero Band */}
      <section className="text-on-dark bg-brand-teal-deep px-6 py-20 md:px-12 lg:px-24 xl:px-32 xl:py-[120px]">
        <div className="mx-auto max-w-7xl">
          <h1 className="text-[36px] leading-[1.25] font-medium tracking-[-0.5px] md:text-[48px] lg:text-[72px] lg:leading-[1.10] lg:tracking-[-1.5px]">
            Find your next role.
          </h1>
          <p className="text-on-dark-muted mt-6 max-w-2xl text-[18px] leading-[1.50] font-normal">
            Browse open positions at top hospitality brands. Apply in minutes and manage your career
            directly.
          </p>
        </div>
      </section>

      {/* Main Canvas */}
      <section className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
        {jobs.length === 0 ? (
          <div className="py-24 text-center">
            <h2 className="text-[28px] font-medium text-ink">No open positions</h2>
            <p className="mt-2 text-[16px] text-steel">Check back later for new opportunities.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-[24px] md:grid-cols-2 lg:grid-cols-3">
            {jobs.map((job) => {
              const salary = formatSalary(
                job.salaryMin,
                job.salaryMax,
                job.salaryCurrency,
                job.salaryPeriod,
              );

              const isBoosted = job.boostType !== null;
              // Add a subtle border or highlight for featured jobs using MongoDB's palette
              const cardBorder = isBoosted
                ? "border-[2px] border-brand-green"
                : "border-[1px] border-hairline hover:shadow-[0_4px_12px_rgba(0,30,43,0.08)]";
              const cardBg =
                isBoosted && job.boostType === "featured" ? "bg-surface-feature" : "bg-canvas";

              return (
                <article
                  key={job.id}
                  className={`flex flex-col rounded-[12px] p-[24px] transition-all duration-200 ${cardBorder} ${cardBg}`}
                >
                  {/* Category Tag Area */}
                  <div className="mb-4 flex flex-wrap gap-2">
                    <BoostBadge boostType={job.boostType} />
                    <span className="inline-flex items-center rounded-sm bg-brand-green-soft px-[8px] py-[2px] text-[13px] font-semibold whitespace-nowrap text-brand-green-dark">
                      {job.durationDays} DAYS LEFT
                    </span>
                  </div>

                  <div className="flex flex-col gap-1">
                    <h2 className="text-[22px] leading-[1.35] font-medium text-ink">{job.title}</h2>
                    <p className="text-[16px] text-steel">{job.companyName}</p>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-x-3 gap-y-2 text-[14px] text-steel">
                    <span>{job.location}</span>
                    <span className="text-hairline-strong">•</span>
                    <span>{capitalizeEmploymentType(job.employmentType)}</span>
                  </div>

                  {salary !== null && (
                    <p className="mt-3 text-[14px] font-medium text-brand-green-dark">{salary}</p>
                  )}

                  <p className="mt-4 line-clamp-3 text-[14px] leading-[1.50] text-slate">
                    {truncateDescription(job.description)}
                  </p>

                  <div className="mt-8 flex items-center justify-between border-t border-hairline-soft pt-4">
                    <div className="text-[13px] text-stone">
                      Posted {job.publishedAt.toLocaleDateString()}
                    </div>
                    <Link
                      href={`/jobs/${job.id}`}
                      className="text-[14px] font-semibold text-brand-green-dark hover:underline"
                    >
                      View Details →
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
