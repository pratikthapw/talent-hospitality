"use client"

import { Language, translations } from "@/lib/translations"
import { Button } from "@/components/ui/button"

interface SpotlightJobsProps {
  language: Language
}

export function SpotlightJobs({ language }: SpotlightJobsProps) {
  const t = translations[language].spotlightJobs

  return (
    <section id="jobs" className="bg-foreground px-4 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-16 text-center">
          <h2 className="mb-4 text-4xl font-bold text-primary sm:text-5xl">
            {t.title}
          </h2>
          <p className="text-lg text-background">{t.description}</p>
        </div>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
          {t.jobs.map((job, index) => (
            <div
              key={index}
              className="animate-fade-in-up flex flex-col rounded-xl border border-border bg-background p-6 transition-all duration-300 hover:scale-105 hover:shadow-2xl"
            >
              <div className="mb-4">
                <h3 className="mb-2 text-xl font-bold text-foreground">
                  {job.title}
                </h3>
                <p className="font-semibold text-primary">{job.company}</p>
                <p className="text-sm text-muted-foreground">{job.location}</p>
              </div>

              <div className="mb-4 flex-1">
                <p className="mb-4 text-sm text-muted-foreground">
                  {job.description}
                </p>
                <div className="flex flex-wrap gap-2">
                  <span className="rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground">
                    {job.type}
                  </span>
                  <span className="text-destructive-foreground rounded-full bg-destructive px-3 py-1 text-xs font-semibold">
                    NPR {job.salary}/mo
                  </span>
                </div>
              </div>

              <Button
                size="lg"
                className="mt-auto w-full rounded-lg bg-primary py-2 font-semibold text-primary-foreground transition hover:opacity-90"
              >
                View Details
              </Button>
            </div>
          ))}
        </div>

        <div className="mt-12 text-center">
          <Button
            size="lg"
            className="rounded-lg border border-primary bg-primary px-8 py-3 text-lg font-bold text-primary-foreground transition hover:opacity-90"
          >
            View All Jobs
          </Button>
        </div>
      </div>
    </section>
  )
}
