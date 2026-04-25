"use client";

import { useState } from "react";

import { Menu02Icon, Cancel01Icon, Globe02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

import { Button } from "@/components/ui/button";
import type { Language} from "@/lib/translations";
import { translations } from "@/lib/translations";

interface NavigationProps {
  language: Language;
  onLanguageChange: (lang: Language) => void;
}

export function Navigation({ language, onLanguageChange }: NavigationProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const t = translations[language].nav;

  return (
    <header className="fixed top-0 right-0 left-0 z-50 border-b border-border bg-background/95 backdrop-blur-md">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-2">
          <div className="flex size-10 items-center justify-center rounded-lg bg-primary text-lg font-bold text-primary-foreground">
            {t.logo}
          </div>
          <span className="hidden text-xl font-bold text-foreground sm:inline">THP</span>
        </div>

        <div className="hidden items-center gap-8 md:flex">
          {[
            { href: "#about", label: t.about },
            { href: "#jobs", label: t.browse },
            { href: "#employers", label: t.employers },
            { href: "#pricing", label: t.pricing },
          ].map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-foreground transition hover:opacity-70"
            >
              {link.label}
            </a>
          ))}
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={() => onLanguageChange(language === "en" ? "ne" : "en")}
            className="flex items-center gap-1.5 rounded-lg border border-primary px-3 py-2 text-xs font-medium text-primary transition hover:bg-muted sm:text-sm"
          >
            <HugeiconsIcon icon={Globe02Icon} className="size-4" />
            {t.language}
          </button>

          <Button
            size="lg"
            className="hidden rounded-lg bg-primary px-6 py-2 font-medium text-primary-foreground sm:inline-flex"
          >
            {t.postJob}
          </Button>

          <button
            className="p-2 text-foreground md:hidden"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            <HugeiconsIcon icon={isMenuOpen ? Cancel01Icon : Menu02Icon} className="size-6" />
          </button>
        </div>

        {isMenuOpen && (
          <div className="absolute top-full right-0 left-0 border-b border-border bg-background md:hidden">
            <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-4">
              {[
                { href: "#about", label: t.about },
                { href: "#jobs", label: t.browse },
                { href: "#employers", label: t.employers },
                { href: "#pricing", label: t.pricing },
              ].map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  className="text-sm font-medium text-foreground transition hover:opacity-70"
                >
                  {link.label}
                </a>
              ))}
              <Button size="lg" className="w-full bg-primary font-medium text-primary-foreground">
                {t.postJob}
              </Button>
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}
