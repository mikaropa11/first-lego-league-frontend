import { cookies } from "next/headers";
import { getTranslations } from "./index";
import type { Language, Translations } from "./types";

const LANGUAGE_STORAGE_KEY = "app-language";

export async function getServerLanguage(): Promise<Language> {
  const cookieStore = await cookies();

  const language = cookieStore.get(LANGUAGE_STORAGE_KEY)?.value;

  if (language && ["ca", "es", "en"].includes(language)) {
    return language as Language;
  }

  return "en";
}

export async function getServerTranslations(): Promise<Translations> {
  const language = await getServerLanguage();

  return getTranslations(language);
}