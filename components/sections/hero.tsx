"use client";

import { Button } from "@/components/ui/button";
import type { Language } from "@/lib/translations";
import { translations } from "@/lib/translations";

interface HeroProps {
  language: Language;
}

export function Hero({ language }: HeroProps) {
  const t = translations[language].hero;

  return (
    <section className="flex min-h-[70vh] w-full items-center justify-center bg-[#001e2b] px-4 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl text-center">
        <h1 className="mb-6 text-5xl font-medium tracking-tight text-white sm:text-6xl lg:text-[72px] lg:leading-[1.1]">
          {t.headline}
        </h1>

        <p className="mx-auto mb-10 max-w-2xl text-lg text-white/90 sm:text-xl">{t.subheading}</p>

        <Button
          size="lg"
          className="rounded-full bg-[#00ed64] px-8 py-6 text-lg font-semibold text-[#001e2b] hover:bg-[#00b545]"
        >
          {t.button}
        </Button>
      </div>
    </section>
  );
}
