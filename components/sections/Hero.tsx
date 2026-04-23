"use client"

import Image from "next/image"
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
        <Image
          src={heroImage}
          alt="Hero Background"
          fill
          priority
          sizes="100vw"
          quality={85}
          className="object-cover"
        />
      </div>

      <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/60 to-black/80" />

      <div className="relative z-10 mx-auto max-w-4xl px-4 py-20 text-center sm:px-6 lg:px-8">
        <h1 className="animate-fade-in-up mb-6 text-4xl font-bold text-white sm:text-5xl lg:text-6xl">
          <span className="block">{t.headline}</span>
        </h1>

        <p className="animate-fade-in-up mx-auto mb-8 max-w-2xl text-lg leading-relaxed text-white/90 sm:text-xl">
          {t.subheading}
        </p>

        <Button
          size="lg"
          className="animate-fade-in-up rounded-lg bg-primary px-8 py-3 text-lg font-bold text-primary-foreground transition hover:opacity-90"
        >
          {t.button}
        </Button>

        <div className="mt-16 grid grid-cols-1 gap-6 sm:grid-cols-3 sm:gap-8">
          {t.stats.map((stat, index) => (
            <div
              key={index}
              className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:border-white/20 hover:bg-white/10 hover:shadow-[0_8px_30px_rgb(0,0,0,0.12)]"
              style={{
                animationFillMode: "both",
                animationDelay: `${index * 150 + 300}ms`,
              }}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
              <div className="relative z-10 flex flex-col items-center justify-center space-y-2">
                <div className="text-4xl font-extrabold tracking-tight text-white drop-shadow-sm sm:text-5xl">
                  {stat.number}
                </div>
                <div className="text-sm font-medium tracking-wider text-white/70 uppercase">
                  {stat.label}
                </div>
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
