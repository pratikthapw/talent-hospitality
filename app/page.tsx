"use client"

import { useState } from "react"
import { Language } from "@/lib/translations"
import { Navigation } from "@/components/sections/Navigation"
import { Hero } from "@/components/sections/Hero"
import { HowItWorks } from "@/components/sections/HowItWorks"
import { FeaturesGrid } from "@/components/sections/FeaturesGrid"
import { JobCategories } from "@/components/sections/JobCategories"
import { SpotlightJobs } from "@/components/sections/SpotlightJobs"
import { CTASection } from "@/components/sections/CTASection"
import { Testimonials } from "@/components/sections/Testimonials"
import { PricingTeaser } from "@/components/sections/PricingTeaser"
import { Footer } from "@/components/sections/Footer"

export default function Page() {
  const [language, setLanguage] = useState<Language>("en")

  return (
    <main className="w-full">
      <Navigation language={language} onLanguageChange={setLanguage} />
      <Hero language={language} />
      <HowItWorks language={language} />
      <FeaturesGrid language={language} />
      <JobCategories language={language} />
      <SpotlightJobs language={language} />
      <CTASection language={language} />
      <Testimonials language={language} />
      <PricingTeaser language={language} />
      <Footer language={language} />
    </main>
  )
}
