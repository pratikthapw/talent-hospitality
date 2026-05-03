"use client";

import { UserGroupIcon, Building03Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

import { Button } from "@/components/ui/button";
import type { Language } from "@/lib/translations";
import { translations } from "@/lib/translations";

interface CTASectionProps {
  language: Language;
}

export function CTASection({ language }: CTASectionProps) {
  const t = translations[language].cta;

  return (
    <section className="bg-white px-4 py-24 sm:px-6 lg:px-8" id="employers">
      <div className="mx-auto max-w-6xl">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div className="flex flex-col items-center justify-center rounded-[12px] border border-[#e1e5e8] bg-[#f9fbfa] p-12 text-center text-[#001e2b]">
            <HugeiconsIcon icon={UserGroupIcon} className="mx-auto mb-6 size-12 text-[#00a35c]" />
            <h3 className="mb-4 text-[28px] leading-[1.3] font-medium">{t.forJobSeekers.title}</h3>
            <p className="mb-8 text-[16px] leading-[1.55] text-[#5c6c7a]">
              {t.forJobSeekers.description}
            </p>
            <Button
              size="lg"
              className="rounded-full bg-[#00ed64] px-8 py-6 text-[14px] font-semibold text-[#001e2b] hover:bg-[#00b545]"
            >
              {t.forJobSeekers.button}
            </Button>
          </div>

          <div className="flex flex-col items-center justify-center rounded-[12px] bg-[#001e2b] p-12 text-center text-white">
            <HugeiconsIcon icon={Building03Icon} className="mx-auto mb-6 size-12 text-[#00ed64]" />
            <h3 className="mb-4 text-[28px] leading-[1.3] font-medium">{t.forEmployers.title}</h3>
            <p className="mb-8 text-[16px] leading-[1.55] text-white/80">
              {t.forEmployers.description}
            </p>
            <Button
              size="lg"
              className="rounded-full bg-[#00ed64] px-8 py-6 text-[14px] font-semibold text-[#001e2b] hover:bg-[#00b545]"
            >
              {t.forEmployers.button}
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
