"use client"

import { useRef } from "react"
import { Language, translations } from "@/lib/translations"
import { HugeiconsIcon } from "@hugeicons/react"
import { ArrowLeft01Icon, ArrowRight01Icon } from "@hugeicons/core-free-icons"

interface JobCategoriesProps {
  language: Language
}

export function JobCategories({ language }: JobCategoriesProps) {
  const categories = translations[language].jobCategories
  const scrollContainerRef = useRef<HTMLDivElement>(null)

  const scroll = (direction: "left" | "right") => {
    if (scrollContainerRef.current) {
      const scrollAmount = 300
      scrollContainerRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      })
    }
  }

  return (
    <section className="bg-white px-4 py-16 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <h2
          className="mb-12 text-center text-3xl font-bold sm:text-4xl"
          style={{ color: "var(--thp-charcoal)" }}
        >
          {language === "en"
            ? "Browse by Category"
            : "श्रेणी अनुसार ब्राउज गर्नुहोस्"}
        </h2>

        <div className="relative">
          <button
            onClick={() => scroll("left")}
            className="absolute top-1/2 left-0 z-10 hidden -translate-x-4 -translate-y-1/2 items-center justify-center rounded-full transition hover:opacity-70 sm:flex lg:-translate-x-12"
            style={{ backgroundColor: "var(--thp-gold)" }}
          >
            <HugeiconsIcon
              icon={ArrowLeft01Icon}
              className="size-6 text-white"
            />
          </button>

          <div
            ref={scrollContainerRef}
            className="flex gap-4 overflow-x-auto pb-2"
            style={{ scrollBehavior: "smooth" }}
          >
            {categories.map((category, index) => (
              <button
                key={index}
                className="shrink-0 rounded-full px-6 py-3 text-sm font-semibold whitespace-nowrap transition-all duration-300 hover:scale-110"
                style={{
                  backgroundColor:
                    index === 0 ? "var(--thp-gold)" : "var(--thp-ivory)",
                  color: index === 0 ? "white" : "var(--thp-charcoal)",
                  border: "2px solid var(--thp-gold)",
                }}
              >
                {category}
              </button>
            ))}
          </div>

          <button
            onClick={() => scroll("right")}
            className="absolute top-1/2 right-0 z-10 hidden translate-x-4 -translate-y-1/2 items-center justify-center rounded-full transition hover:opacity-70 sm:flex lg:translate-x-12"
            style={{ backgroundColor: "var(--thp-gold)" }}
          >
            <HugeiconsIcon
              icon={ArrowRight01Icon}
              className="size-6 text-white"
            />
          </button>
        </div>
      </div>
    </section>
  )
}
