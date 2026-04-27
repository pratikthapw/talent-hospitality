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
  );
}
