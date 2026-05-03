"use client";

import { Button } from "@/components/ui/button";
import type { Language } from "@/lib/translations";
import { translations } from "@/lib/translations";

interface SpotlightJobsProps {
  language: Language;
}

export function SpotlightJobs({ language }: SpotlightJobsProps) {
  const t = translations[language].spotlightJobs;

  return (
    <section id="jobs" className="bg-white px-4 py-24 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-16">
          <h2 className="mb-4 text-4xl font-medium tracking-tight text-[#001e2b] md:text-[48px]">
            {t.title}
          </h2>
          <p className="text-[18px] text-[#5c6c7a]">{t.description}</p>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {t.jobs.map((job) => (
            <div
              key={`${job.title}-${job.company}`}
              className="flex flex-col rounded-[12px] border border-[#e1e5e8] bg-white p-8 transition-shadow hover:shadow-[0_4px_12px_rgba(0,30,43,0.08)]"
            >
              <div className="mb-6">
                <h3 className="mb-2 text-[22px] leading-[1.35] font-medium text-[#001e2b]">
                  {job.title}
                </h3>
                <p className="text-[16px] text-[#5c6c7a]">{job.company}</p>
                <p className="text-[14px] text-[#7c8c9a]">{job.location}</p>
              </div>

              <div className="mb-8 flex-1">
                <div className="flex flex-wrap gap-2">
                  <span className="rounded-sm bg-[#c3f0d2] px-2 py-0.5 text-[13px] font-semibold text-[#00684a]">
                    {job.type}
                  </span>
                  <span className="rounded-sm bg-[#eceff1] px-2 py-0.5 text-[13px] font-semibold text-[#3d4f5b]">
                    NPR {job.salary}/mo
                  </span>
                </div>
              </div>

              <Button
                variant="outline"
                className="w-fit rounded-full border-[#c1ccd6] px-6 py-2 text-[14px] font-semibold text-[#001e2b] hover:bg-[#f9fbfa]"
              >
                View Details
              </Button>
            </div>
          ))}
        </div>

        <div className="mt-16 text-center">
          <Button
            size="lg"
            className="rounded-full bg-[#00ed64] px-8 py-6 text-[16px] font-semibold text-[#001e2b] hover:bg-[#00b545]"
          >
            View All Jobs
          </Button>
        </div>
      </div>
    </section>
  );
}
