"use client"

import { Language, translations } from "@/lib/translations"
import { HugeiconsIcon } from "@hugeicons/react"
import { StarIcon } from "@hugeicons/core-free-icons"

interface TestimonialsProps {
  language: Language
}

export function Testimonials({ language }: TestimonialsProps) {
  const t = translations[language].testimonials

  return (
    <section className="bg-background px-4 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <h2 className="mb-16 text-center text-4xl font-bold text-foreground sm:text-5xl">
          {t.title}
        </h2>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          {t.items.map((testimonial, index) => (
            <div
              key={index}
              className="rounded-xl border-2 border-primary bg-card p-8 shadow-lg transition-all duration-300 hover:shadow-xl"
            >
              <div className="mb-4 flex gap-1">
                {[...Array(5)].map((_, i) => (
                  <HugeiconsIcon
                    key={i}
                    icon={StarIcon}
                    className="size-5 text-primary"
                  />
                ))}
              </div>

              <p className="mb-6 leading-relaxed text-muted-foreground italic">
                &ldquo;{testimonial.quote}&rdquo;
              </p>

              <div className="flex items-center gap-4">
                <div className="flex size-12 items-center justify-center rounded-full bg-primary text-lg font-bold text-primary-foreground">
                  {testimonial.initials}
                </div>
                <div>
                  <p className="font-bold text-foreground">
                    {testimonial.name}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {testimonial.role} &bull; {testimonial.company}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
