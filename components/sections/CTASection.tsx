"use client"

import { Language, translations } from "@/lib/translations"
import { Button } from "@/components/ui/button"
import { HugeiconsIcon } from "@hugeicons/react"
import { UserGroupIcon, Building03Icon } from "@hugeicons/core-free-icons"

interface CTASectionProps {
  language: Language
}

export function CTASection({ language }: CTASectionProps) {
  const t = translations[language].cta

  return (
    <section className="bg-white px-4 py-20 sm:px-6 lg:px-8" id="employers">
      <div className="mx-auto max-w-6xl">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
          <div
            className="flex flex-col items-center justify-center rounded-2xl p-8 text-center text-white sm:p-12"
            style={{ backgroundColor: "var(--thp-gold)" }}
          >
            <HugeiconsIcon
              icon={UserGroupIcon}
              className="mx-auto mb-6 size-16"
            />
            <h3 className="mb-4 text-3xl font-bold">{t.forJobSeekers.title}</h3>
            <p className="mb-8 text-lg opacity-90">
              {t.forJobSeekers.description}
            </p>
            <Button
              size="lg"
              className="rounded-lg bg-white px-8 py-3 font-bold transition hover:opacity-90"
              style={{ color: "var(--thp-gold)" }}
            >
              {t.forJobSeekers.button}
            </Button>
          </div>

          <div
            className="flex flex-col items-center justify-center rounded-2xl p-8 text-center text-white sm:p-12"
            style={{ backgroundColor: "var(--thp-charcoal)" }}
          >
            <HugeiconsIcon
              icon={Building03Icon}
              className="mx-auto mb-6 size-16"
            />
            <h3 className="mb-4 text-3xl font-bold">{t.forEmployers.title}</h3>
            <p className="mb-8 text-lg opacity-90">
              {t.forEmployers.description}
            </p>
            <Button
              size="lg"
              className="rounded-lg bg-white px-8 py-3 font-bold transition hover:opacity-90"
              style={{ color: "var(--thp-charcoal)" }}
            >
              {t.forEmployers.button}
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}
