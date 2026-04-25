"use client";

import { useState } from "react";

import { CTASection } from "@/components/sections/CTASection";
import { FeaturesGrid } from "@/components/sections/FeaturesGrid";
import { Footer } from "@/components/sections/Footer";
import { Hero } from "@/components/sections/Hero";
import { HowItWorks } from "@/components/sections/HowItWorks";
import { JobCategories } from "@/components/sections/JobCategories";
import { Navigation } from "@/components/sections/Navigation";
import { PricingTeaser } from "@/components/sections/PricingTeaser";
import { SpotlightJobs } from "@/components/sections/SpotlightJobs";
import { Testimonials } from "@/components/sections/Testimonials";
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
