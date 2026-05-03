"use client";

import { useState } from "react";

import { CTASection } from "@/components/sections/cta-section";
import { Footer } from "@/components/sections/footer";
import { Hero } from "@/components/sections/hero";
import { HowItWorks } from "@/components/sections/how-it-works";
import { Navigation } from "@/components/sections/navigation";
import { SpotlightJobs } from "@/components/sections/spotlight-jobs";
import type { Language } from "@/lib/translations";

export default function Page() {
  const [language, setLanguage] = useState<Language>("en");

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground selection:bg-primary/30">
      <Navigation language={language} onLanguageChange={setLanguage} />
      <main className="flex w-full flex-1 flex-col items-center justify-center overflow-hidden">
        <Hero language={language} />
        <SpotlightJobs language={language} />
        <HowItWorks language={language} />
        <CTASection language={language} />
      </main>
      <Footer language={language} />
    </div>
  );
}
