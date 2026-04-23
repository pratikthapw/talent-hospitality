"use client"

import { Language, translations } from "@/lib/translations"
import { Button } from "@/components/ui/button"
import { HugeiconsIcon } from "@hugeicons/react"
import { ArrowDown01Icon } from "@hugeicons/core-free-icons"
import heroImage from "@/public/hero-image.webp"

interface HeroProps {
  language: Language
}

export function Hero({ language }: HeroProps) {
  const t = translations[language].hero

  return (
    <section className="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-foreground pt-20">
      <div className="absolute inset-0">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={heroImage.src} alt="" className="size-full object-cover" />
      </div>

      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/20" />

      <div className="relative z-10 mx-auto max-w-4xl px-4 py-20 text-center sm:px-6 lg:px-8">
        <h1 className="animate-fade-in-up mb-6 text-4xl font-bold text-background sm:text-5xl lg:text-6xl">
          <span className="block">{t.headline}</span>
        </h1>

        <p className="animate-fade-in-up mx-auto mb-8 max-w-2xl text-lg leading-relaxed text-background sm:text-xl">
          {t.subheading}
        </p>

        <Button
          size="lg"
          className="animate-fade-in-up rounded-lg bg-primary px-8 py-3 text-lg font-bold text-primary-foreground transition hover:opacity-90"
        >
          {t.button}
        </Button>

        <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-3 sm:gap-4">
          {t.stats.map((stat, index) => (
            <div
              key={index}
              className="animate-fade-in-up rounded-xl bg-white/[0.08] p-4 backdrop-blur-md"
            >
              <div className="mb-2 text-2xl font-bold text-primary sm:text-3xl">
                {stat.number}
              </div>
              <div className="text-xs text-background/80 sm:text-sm">
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce text-primary">
        <HugeiconsIcon icon={ArrowDown01Icon} className="size-6" />
      </div>
    </section>
  )
}
