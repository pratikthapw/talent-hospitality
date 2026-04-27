import { enTranslations } from "@/lib/locales/en";
import { neTranslations } from "@/lib/locales/ne";

export type Language = "en" | "ne";

export const translations = {
  en: enTranslations,
  ne: neTranslations,
} as const;
