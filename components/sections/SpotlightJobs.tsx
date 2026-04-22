"use client"

import { Language, translations } from "@/lib/translations"
import { Button } from "@/components/ui/button"

interface SpotlightJobsProps {
  language: Language
}

export function SpotlightJobs({ language }: SpotlightJobsProps) {
  const t = translations[language].spotlightJobs

  return (
    <section
      id="jobs"
      className="px-4 py-20 sm:px-6 lg:px-8"
      style={{ backgroundColor: "var(--thp-charcoal)" }}
    >
      <div className="mx-auto max-w-6xl">
        <div className="mb-16 text-center">
          <h2
            className="mb-4 text-4xl font-bold sm:text-5xl"
            style={{ color: "var(--thp-gold)" }}
          >
            {t.title}
          </h2>
          <p className="text-lg" style={{ color: "var(--thp-ivory)" }}>
            {t.description}
          </p>
        </div>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
          {t.jobs.map((job, index) => (
            <div
              key={index}
              className="animate-fade-in-up flex flex-col rounded-xl border border-gray-200 bg-white p-6 transition-all duration-300 hover:scale-105 hover:shadow-2xl"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="mb-4">
                <h3
                  className="mb-2 text-xl font-bold"
                  style={{ color: "var(--thp-charcoal)" }}
                >
                  {job.title}
                </h3>
                <p
                  className="font-semibold"
                  style={{ color: "var(--thp-gold)" }}
                >
                  {job.company}
                </p>
                <p className="text-sm text-gray-500">{job.location}</p>
              </div>

              <div className="mb-4 flex-1">
                <p className="mb-4 text-sm text-gray-600">{job.description}</p>
                <div className="flex flex-wrap gap-2">
                  <span
                    className="rounded-full px-3 py-1 text-xs font-semibold text-white"
                    style={{ backgroundColor: "var(--thp-gold)" }}
                  >
                    {job.type}
                  </span>
                  <span
                    className="rounded-full px-3 py-1 text-xs font-semibold text-white"
                    style={{ backgroundColor: "var(--thp-terracotta)" }}
                  >
                    NPR {job.salary}/mo
                  </span>
                </div>
              </div>

              <Button
                size="lg"
                className="mt-auto w-full rounded-lg py-2 font-semibold text-white transition hover:opacity-90"
                style={{ backgroundColor: "var(--thp-gold)" }}
              >
                View Details
              </Button>
            </div>
          ))}
        </div>

        <div className="mt-12 text-center">
          <Button
            size="lg"
            className="rounded-lg px-8 py-3 text-lg font-bold text-white transition hover:opacity-90"
            style={{
              backgroundColor: "var(--thp-gold)",
              borderColor: "var(--thp-gold)",
            }}
          >
            View All Jobs
          </Button>
        </div>
      </div>
    </section>
  )
}
