"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import type { Language } from "@/lib/i18n";
import { getTranslations } from "@/lib/i18n";

interface LanguageContextType {
  language: Language;
  setLanguage: (language: Language) => void;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const LANGUAGE_STORAGE_KEY = "app-language";
const DEFAULT_LANGUAGE: Language = "en";
const SUPPORTED_LANGUAGES: Language[] = ["ca", "es", "en"];

function isLanguage(value: string | null | undefined): value is Language {
  return SUPPORTED_LANGUAGES.includes(value as Language);
}

function getCookieLanguage() {
  if (typeof document === "undefined") return null;

  const language = document.cookie
    .split("; ")
    .find((cookie) => cookie.startsWith(`${LANGUAGE_STORAGE_KEY}=`))
    ?.split("=")[1];

  return isLanguage(language) ? language : null;
}

export function LanguageProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [language, setLanguageState] =
    useState<Language>(DEFAULT_LANGUAGE);

  useEffect(() => {
    const storedLanguage = localStorage.getItem(LANGUAGE_STORAGE_KEY);
    const cookieLanguage = getCookieLanguage();
    const resolvedLanguage = isLanguage(storedLanguage)
      ? storedLanguage
      : cookieLanguage;

    if (resolvedLanguage) {
      setLanguageState(resolvedLanguage);
      localStorage.setItem(LANGUAGE_STORAGE_KEY, resolvedLanguage);
      document.cookie = `${LANGUAGE_STORAGE_KEY}=${resolvedLanguage}; path=/; max-age=${365 * 24 * 60 * 60}`;
    }
  }, []);

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  const setLanguage = (newLanguage: Language) => {
    setLanguageState(newLanguage);
    localStorage.setItem(LANGUAGE_STORAGE_KEY, newLanguage);
    // Also set cookie for server-side access
    document.cookie = `${LANGUAGE_STORAGE_KEY}=${newLanguage}; path=/; max-age=${365 * 24 * 60 * 60}`;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);

  if (!context) {
    throw new Error(
      "useLanguage must be used within LanguageProvider"
    );
  }

  return context;
}

export function useTranslations() {
  const { language } = useLanguage();
  return getTranslations(language);
}
