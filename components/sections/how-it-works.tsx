"use client";

import type { Language } from "@/lib/translations";
import { translations } from "@/lib/translations";

interface HowItWorksProps {
  language: Language;
}

export function HowItWorks({ language }: HowItWorksProps) {
  const t = translations[language].howItWorks;

  return (
    <section className="bg-[#f9fbfa] px-4 py-24 sm:px-6 lg:px-8" id="about">
      <div className="mx-auto max-w-6xl">
        <h2 className="mb-16 text-center text-4xl font-medium tracking-tight text-[#001e2b] sm:text-5xl">
          {t.title}
        </h2>

        <div className="grid grid-cols-1 gap-16 md:grid-cols-2">
          <div>
            <h3 className="mb-10 text-2xl font-medium text-[#001e2b]">{t.forJobSeekers.title}</h3>
            <div className="flex flex-col gap-10">
              {t.forJobSeekers.steps.map((step) => (
                <div key={step.number} className="flex gap-6">
                  <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-[#00ed64] text-[18px] font-semibold text-[#001e2b]">
                    {step.number}
                  </div>
                  <div className="flex-1 pt-2">
                    <h4 className="mb-2 text-[22px] leading-[1.35] font-medium text-[#001e2b]">
                      {step.title}
                    </h4>
                    <p className="text-[16px] leading-[1.55] text-[#5c6c7a]">{step.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h3 className="mb-10 text-2xl font-medium text-[#001e2b]">{t.forEmployers.title}</h3>
            <div className="flex flex-col gap-10">
              {t.forEmployers.steps.map((step) => (
                <div key={step.number} className="flex gap-6">
                  <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-[#c3f0d2] text-[18px] font-semibold text-[#00684a]">
                    {step.number}
                  </div>
                  <div className="flex-1 pt-2">
                    <h4 className="mb-2 text-[22px] leading-[1.35] font-medium text-[#001e2b]">
                      {step.title}
                    </h4>
                    <p className="text-[16px] leading-[1.55] text-[#5c6c7a]">{step.description}</p>
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
