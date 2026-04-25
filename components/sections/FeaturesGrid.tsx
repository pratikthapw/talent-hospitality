"use client";

import {
  CheckmarkBadge01Icon,
  SmileIcon,
  Search01Icon,
  Shield01Icon,
  SmartPhone01Icon,
  HeadphonesIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

import type { Language} from "@/lib/translations";
import { translations } from "@/lib/translations";

interface FeaturesGridProps {
  language: Language;
}

const featureIcons = [
  CheckmarkBadge01Icon,
  SmileIcon,
  Search01Icon,
  Shield01Icon,
  SmartPhone01Icon,
  HeadphonesIcon,
];

export function FeaturesGrid({ language }: FeaturesGridProps) {
  const t = translations[language].features;

  return (
    <section className="bg-card px-4 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <h2 className="mb-16 text-center text-4xl font-bold text-foreground sm:text-5xl">
          {t.title}
        </h2>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
          {t.items.map((feature, index) => (
            <div
              key={index}
              className="rounded-xl border-2 border-primary bg-background p-8 transition-all duration-300 hover:scale-105 hover:shadow-lg"
            >
              <div className="mb-4 flex size-12 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <HugeiconsIcon icon={featureIcons[index]} className="size-6" />
              </div>

              <h3 className="mb-3 text-xl font-bold text-foreground">{feature.title}</h3>

              <p className="text-sm leading-relaxed text-muted-foreground">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
