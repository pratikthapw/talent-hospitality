"use client"

import { Language, translations } from "@/lib/translations"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Facebook02Icon,
  TwitterIcon,
  Linkedin02Icon,
} from "@hugeicons/core-free-icons"

interface FooterProps {
  language: Language
}

export function Footer({ language }: FooterProps) {
  const t = translations[language].footer

  return (
    <footer
      id="contact"
      className="bg-foreground px-4 py-16 text-white sm:px-6 lg:px-8"
    >
      <div className="mx-auto max-w-6xl">
        <div className="mb-12 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-5">
          <div>
            <div className="mb-4 flex items-center gap-2">
              <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-sm font-bold text-primary-foreground">
                THP
              </div>
              <span className="font-bold">THP</span>
            </div>
            <p className="text-sm opacity-75">
              Nepal&apos;s premier hospitality jobs marketplace connecting
              talent with opportunity.
            </p>
          </div>

          <div>
            <h4 className="mb-4 font-bold text-primary">Company</h4>
            <ul className="flex flex-col gap-2 text-sm">
              <li>
                <a
                  href="#about"
                  className="opacity-75 transition hover:opacity-100"
                >
                  {t.about}
                </a>
              </li>
              <li>
                <a
                  href="#careers"
                  className="opacity-75 transition hover:opacity-100"
                >
                  {t.careers}
                </a>
              </li>
              <li>
                <a
                  href="#blog"
                  className="opacity-75 transition hover:opacity-100"
                >
                  {t.blog}
                </a>
              </li>
              <li>
                <a
                  href="#press"
                  className="opacity-75 transition hover:opacity-100"
                >
                  {t.press}
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="mb-4 font-bold text-primary">Legal</h4>
            <ul className="flex flex-col gap-2 text-sm">
              <li>
                <a
                  href="#privacy"
                  className="opacity-75 transition hover:opacity-100"
                >
                  {t.privacy}
                </a>
              </li>
              <li>
                <a
                  href="#terms"
                  className="opacity-75 transition hover:opacity-100"
                >
                  {t.terms}
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="mb-4 font-bold text-primary">Support</h4>
            <ul className="flex flex-col gap-2 text-sm">
              <li>
                <a
                  href="#contact"
                  className="opacity-75 transition hover:opacity-100"
                >
                  {t.contact}
                </a>
              </li>
              <li>
                <a
                  href="mailto:hello@thp.nepal"
                  className="opacity-75 transition hover:opacity-100"
                >
                  hello@thp.nepal
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="mb-4 font-bold text-primary">{t.followUs}</h4>
            <div className="flex gap-4">
              <a
                href="#facebook"
                className="opacity-75 transition hover:opacity-100"
              >
                <HugeiconsIcon icon={Facebook02Icon} className="size-6" />
              </a>
              <a
                href="#twitter"
                className="opacity-75 transition hover:opacity-100"
              >
                <HugeiconsIcon icon={TwitterIcon} className="size-6" />
              </a>
              <a
                href="#linkedin"
                className="opacity-75 transition hover:opacity-100"
              >
                <HugeiconsIcon icon={Linkedin02Icon} className="size-6" />
              </a>
            </div>
          </div>
        </div>

        <div className="border-t border-border pt-8 text-center text-sm opacity-75">
          <p>© 2024 Talent Hospitality Platform. {t.copyright}</p>
        </div>
      </div>
    </footer>
  )
}
