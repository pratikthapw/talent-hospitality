"use client";

import { useRef } from "react";

import { ArrowLeft01Icon, ArrowRight01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

import type { Language} from "@/lib/translations";
import { translations } from "@/lib/translations";

interface JobCategoriesProps {
  language: Language;
}

export function JobCategories({ language }: JobCategoriesProps) {
  const categories = translations[language].jobCategories;
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: "left" | "right") => {
    if (scrollContainerRef.current) {
      const scrollAmount = 300;
      scrollContainerRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  };

  return (
    <section className="bg-background px-4 py-16 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <h2 className="mb-12 text-center text-3xl font-bold text-foreground sm:text-4xl">
          {language === "en" ? "Browse by Category" : "श्रेणी अनुसार ब्राउज गर्नुहोस्"}
        </h2>

        <div className="relative">
          <button
            onClick={() => scroll("left")}
            className="absolute top-1/2 left-0 z-10 hidden -translate-x-4 -translate-y-1/2 items-center justify-center rounded-full bg-primary text-primary-foreground transition hover:bg-muted sm:flex lg:-translate-x-12"
          >
            <HugeiconsIcon icon={ArrowLeft01Icon} className="size-6" />
          </button>

          <div ref={scrollContainerRef} className="flex gap-4 overflow-x-auto pb-2">
            {categories.map((category, index) => (
              <button
                key={index}
                className="shrink-0 rounded-full border-2 border-primary bg-primary px-6 py-3 text-sm font-semibold whitespace-nowrap text-primary-foreground transition-all duration-300 hover:scale-110"
              >
                {category}
              </button>
            ))}
          </div>

          <button
            onClick={() => scroll("right")}
            className="absolute top-1/2 right-0 z-10 hidden translate-x-4 -translate-y-1/2 items-center justify-center rounded-full bg-primary text-primary-foreground transition hover:bg-muted sm:flex lg:translate-x-12"
          >
            <HugeiconsIcon icon={ArrowRight01Icon} className="size-6" />
          </button>
        </div>
      </div>
    </section>
  );
}
