"use client";

import type { Language} from "@/lib/translations";
import { translations } from "@/lib/translations";

interface HowItWorksProps {
  language: Language;
}

export function HowItWorks({ language }: HowItWorksProps) {
  const t = translations[language].howItWorks;

  return (
    <section className="bg-background px-4 py-20 sm:px-6 lg:px-8" id="about">
      <div className="mx-auto max-w-6xl">
        <h2 className="mb-16 text-center text-4xl font-bold text-foreground sm:text-5xl">
          {t.title}
        </h2>

        <div className="grid grid-cols-1 gap-12 md:grid-cols-2">
          <div>
            <h3 className="mb-8 text-center text-2xl font-bold text-primary">
              {t.forJobSeekers.title}
            </h3>
            <div className="flex flex-col gap-8">
              {t.forJobSeekers.steps.map((step, index) => (
                <div key={index} className="flex gap-6">
                  <div className="flex size-16 shrink-0 items-center justify-center rounded-full bg-primary text-xl font-bold text-primary-foreground">
                    {step.number}
                  </div>
                  <div className="flex-1">
                    <h4 className="mb-2 text-lg font-bold text-foreground">{step.title}</h4>
                    <p className="text-muted-foreground">{step.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h3 className="mb-8 text-center text-2xl font-bold text-destructive">
              {t.forEmployers.title}
            </h3>
            <div className="flex flex-col gap-8">
              {t.forEmployers.steps.map((step, index) => (
                <div key={index} className="flex gap-6">
                  <div className="text-destructive-foreground flex size-16 shrink-0 items-center justify-center rounded-full bg-destructive text-xl font-bold">
                    {step.number}
                  </div>
                  <div className="flex-1">
                    <h4 className="mb-2 text-lg font-bold text-foreground">{step.title}</h4>
                    <p className="text-muted-foreground">{step.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
