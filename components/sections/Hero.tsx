"use client"

import { Language, translations } from "@/lib/translations"
import { SVGMountain } from "@/components/SVGMountain"
import { Button } from "@/components/ui/button"
import { HugeiconsIcon } from "@hugeicons/react"
import { ArrowDown01Icon } from "@hugeicons/core-free-icons"

interface HeroProps {
  language: Language
}

export function Hero({ language }: HeroProps) {
  const t = translations[language].hero

  return (
    <section
      className="relative flex min-h-screen w-full items-center justify-center overflow-hidden pt-20"
      style={{ backgroundColor: "var(--thp-charcoal)" }}
    >
      <div className="absolute inset-0 opacity-20">
        <SVGMountain className="size-full" color="var(--thp-gold)" />
      </div>

      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/20" />

      <div className="relative z-10 mx-auto max-w-4xl px-4 py-20 text-center sm:px-6 lg:px-8">
        <h1 className="animate-fade-in-up mb-6 text-4xl font-bold sm:text-5xl lg:text-6xl">
          <span style={{ color: "var(--thp-ivory)" }} className="block">
            {t.headline}
          </span>
        </h1>

        <p
          className="animate-fade-in-up mx-auto mb-8 max-w-2xl text-lg leading-relaxed sm:text-xl"
          style={{
            color: "var(--thp-ivory)",
            animationDelay: "0.1s",
          }}
        >
          {t.subheading}
        </p>

        <Button
          size="lg"
          className="animate-fade-in-up rounded-lg px-8 py-3 text-lg font-bold text-white transition hover:opacity-90"
          style={{
            backgroundColor: "var(--thp-gold)",
            animationDelay: "0.2s",
          }}
        >
          {t.button}
        </Button>

        <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-3 sm:gap-4">
          {t.stats.map((stat, index) => (
            <div
              key={index}
              className="animate-fade-in-up rounded-xl p-4 backdrop-blur-md"
              style={{
                backgroundColor: "rgba(255, 255, 255, 0.08)",
                animationDelay: `${0.3 + index * 0.1}s`,
              }}
            >
              <div
                className="mb-2 text-2xl font-bold sm:text-3xl"
                style={{ color: "var(--thp-gold)" }}
              >
                {stat.number}
              </div>
              <div
                className="text-xs sm:text-sm"
                style={{ color: "var(--thp-ivory)", opacity: 0.8 }}
              >
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div
        className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce"
        style={{ color: "var(--thp-gold)" }}
      >
        <HugeiconsIcon icon={ArrowDown01Icon} className="size-6" />
      </div>
    </section>
  )
}
