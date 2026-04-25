"use client";

import { CheckmarkCircle01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

import { Button } from "@/components/ui/button";
import type { Language} from "@/lib/translations";
import { translations } from "@/lib/translations";

interface PricingTeaserProps {
  language: Language;
}

export function PricingTeaser({ language }: PricingTeaserProps) {
  const t = translations[language].pricing;

  return (
    <section className="bg-background px-4 py-20 sm:px-6 lg:px-8" id="pricing">
      <div className="mx-auto max-w-6xl">
        <h2 className="mb-16 text-center text-4xl font-bold text-foreground sm:text-5xl">
          {t.title}
        </h2>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
          <div className="rounded-xl border-2 border-primary p-8 text-center transition-all duration-300 hover:scale-105 hover:shadow-xl">
            <h3 className="mb-2 text-2xl font-bold text-foreground">{t.jobSeeker.title}</h3>
            <p className="mb-6 text-5xl font-bold text-primary">{t.jobSeeker.price}</p>
            <ul className="mb-8 flex flex-col gap-3 text-left">
              {t.jobSeeker.features.map((feature, index) => (
                <li key={index} className="flex items-center gap-3 text-foreground/80">
                  <HugeiconsIcon
                    icon={CheckmarkCircle01Icon}
                    className="size-5 shrink-0 text-primary"
                  />
                  {feature}
                </li>
              ))}
            </ul>
            <Button
              size="lg"
              className="w-full rounded-lg bg-primary py-3 font-bold text-primary-foreground transition hover:opacity-90"
            >
              Get Started
            </Button>
          </div>

          <div className="rounded-xl border-2 border-destructive p-8 text-center transition-all duration-300 hover:scale-105 hover:shadow-xl">
            <h3 className="mb-2 text-2xl font-bold text-foreground">{t.employer.title}</h3>
            <p className="mb-6 text-5xl font-bold text-destructive">{t.employer.price}</p>
            <ul className="mb-8 flex flex-col gap-3 text-left">
              {t.employer.features.map((feature, index) => (
                <li key={index} className="flex items-center gap-3 text-foreground/80">
                  <HugeiconsIcon
                    icon={CheckmarkCircle01Icon}
                    className="size-5 shrink-0 text-destructive"
                  />
                  {feature}
                </li>
              ))}
            </ul>
            <Button
              size="lg"
              className="text-destructive-foreground w-full rounded-lg bg-destructive py-3 font-bold transition hover:opacity-90"
            >
              Contact Sales
            </Button>
          </div>
        </div>

        <div className="mt-12 text-center">
          <p className="mb-4 text-lg text-muted-foreground">Ready to get started?</p>
          <p className="text-muted-foreground">
            Join thousands of professionals and employers using THP today.
          </p>
        </div>
      </div>
    </section>
  );
}
