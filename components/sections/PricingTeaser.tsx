"use client"

import { Language, translations } from "@/lib/translations"
import { Button } from "@/components/ui/button"
import { HugeiconsIcon } from "@hugeicons/react"
import { CheckmarkCircle01Icon } from "@hugeicons/core-free-icons"

interface PricingTeaserProps {
  language: Language
}

export function PricingTeaser({ language }: PricingTeaserProps) {
  const t = translations[language].pricing

  return (
    <section className="bg-white px-4 py-20 sm:px-6 lg:px-8" id="pricing">
      <div className="mx-auto max-w-6xl">
        <h2
          className="mb-16 text-center text-4xl font-bold sm:text-5xl"
          style={{ color: "var(--thp-charcoal)" }}
        >
          {t.title}
        </h2>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
          <div
            className="rounded-xl border-2 p-8 text-center transition-all duration-300 hover:scale-105 hover:shadow-xl"
            style={{ borderColor: "var(--thp-gold)" }}
          >
            <h3
              className="mb-2 text-2xl font-bold"
              style={{ color: "var(--thp-charcoal)" }}
            >
              {t.jobSeeker.title}
            </h3>
            <p
              className="mb-6 text-5xl font-bold"
              style={{ color: "var(--thp-gold)" }}
            >
              {t.jobSeeker.price}
            </p>
            <ul className="mb-8 flex flex-col gap-3 text-left">
              {t.jobSeeker.features.map((feature, index) => (
                <li
                  key={index}
                  className="flex items-center gap-3 text-gray-700"
                >
                  <HugeiconsIcon
                    icon={CheckmarkCircle01Icon}
                    className="size-5 shrink-0"
                    style={{ color: "var(--thp-gold)" }}
                  />
                  {feature}
                </li>
              ))}
            </ul>
            <Button
              size="lg"
              className="w-full rounded-lg py-3 font-bold text-white transition hover:opacity-90"
              style={{ backgroundColor: "var(--thp-gold)" }}
            >
              Get Started
            </Button>
          </div>

          <div
            className="rounded-xl border-2 p-8 text-center transition-all duration-300 hover:scale-105 hover:shadow-xl"
            style={{ borderColor: "var(--thp-terracotta)" }}
          >
            <h3
              className="mb-2 text-2xl font-bold"
              style={{ color: "var(--thp-charcoal)" }}
            >
              {t.employer.title}
            </h3>
            <p
              className="mb-6 text-5xl font-bold"
              style={{ color: "var(--thp-terracotta)" }}
            >
              {t.employer.price}
            </p>
            <ul className="mb-8 flex flex-col gap-3 text-left">
              {t.employer.features.map((feature, index) => (
                <li
                  key={index}
                  className="flex items-center gap-3 text-gray-700"
                >
                  <HugeiconsIcon
                    icon={CheckmarkCircle01Icon}
                    className="size-5 shrink-0"
                    style={{ color: "var(--thp-terracotta)" }}
                  />
                  {feature}
                </li>
              ))}
            </ul>
            <Button
              size="lg"
              className="w-full rounded-lg py-3 font-bold text-white transition hover:opacity-90"
              style={{ backgroundColor: "var(--thp-terracotta)" }}
            >
              Contact Sales
            </Button>
          </div>
        </div>

        <div className="mt-12 text-center">
          <p className="mb-4 text-lg text-gray-600">Ready to get started?</p>
          <p className="text-gray-500">
            Join thousands of professionals and employers using THP today.
          </p>
        </div>
      </div>
    </section>
  )
}
