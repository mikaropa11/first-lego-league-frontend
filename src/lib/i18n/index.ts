import { ca } from "./ca";
import { es } from "./es";
import { en } from "./en";
import type { Translations, Language } from "./types";

export type { Translations, Language };

export const translations: Record<Language, Translations> = {
  ca,
  es,
  en,
};

export function getTranslations(language: Language): Translations {
  return translations[language] || translations.en;
}
