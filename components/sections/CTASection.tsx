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
    <section
      className="bg-background px-4 py-20 sm:px-6 lg:px-8"
      id="employers"
    >
      <div className="mx-auto max-w-6xl">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
          <div className="flex flex-col items-center justify-center rounded-2xl bg-primary p-8 text-center text-primary-foreground sm:p-12">
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
              className="rounded-lg bg-background px-8 py-3 font-bold text-primary transition hover:opacity-90"
            >
              {t.forJobSeekers.button}
            </Button>
          </div>

          <div className="flex flex-col items-center justify-center rounded-2xl bg-foreground p-8 text-center text-background sm:p-12">
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
              className="rounded-lg bg-background px-8 py-3 font-bold text-foreground transition hover:opacity-90"
            >
              {t.forEmployers.button}
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}
