"use client";

import { useState } from "react";

import { CTASection } from "@/components/sections/cta-section";
import { FeaturesGrid } from "@/components/sections/features-grid";
import { Footer } from "@/components/sections/footer";
import { Hero } from "@/components/sections/hero";
import { HowItWorks } from "@/components/sections/how-it-works";
import { JobCategories } from "@/components/sections/job-categories";
import { Navigation } from "@/components/sections/navigation";
import { PricingTeaser } from "@/components/sections/pricing-teaser";
import { SpotlightJobs } from "@/components/sections/spotlight-jobs";
import { Testimonials } from "@/components/sections/testimonials";
import type { Language } from "@/lib/translations";

export default function Page() {
  const [language, setLanguage] = useState<Language>("en");

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground selection:bg-primary/30">
      <Navigation language={language} onLanguageChange={setLanguage} />
      <main className="flex w-full flex-1 flex-col items-center justify-center overflow-hidden">
        <Hero language={language} />
        <HowItWorks language={language} />
        <FeaturesGrid language={language} />
        <JobCategories language={language} />
        <SpotlightJobs language={language} />
        <Testimonials language={language} />
        <PricingTeaser language={language} />
        <CTASection language={language} />
      </main>
      <Footer language={language} />
    </div>
  );
}
