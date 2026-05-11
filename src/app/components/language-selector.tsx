"use client";

import type { Language } from "@/lib/i18n";
import { useLanguage, useTranslations } from "@/lib/languageContext";
import { Globe } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function LanguageSelector() {
  const { language, setLanguage } = useLanguage();
  const t = useTranslations();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);

  const languages: { code: Language; label: string; nativeLabel: string }[] = [
    { code: "ca", label: t.language.catalan, nativeLabel: "Catala" },
    { code: "es", label: t.language.spanish, nativeLabel: "Espanol" },
    { code: "en", label: t.language.english, nativeLabel: "English" },
  ];

  const handleLanguageChange = (newLanguage: Language) => {
    setLanguage(newLanguage);
    router.refresh();
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-label={t.language.changeLanguage}
        className="flex items-center gap-2 rounded-md border border-border px-3 py-1.5 text-sm text-muted-foreground hover:bg-secondary hover:text-foreground cursor-pointer transition-colors"
      >
        <Globe size={16} aria-hidden="true" />
        <span className="uppercase font-medium">{language}</span>
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40 cursor-default bg-transparent"
            onClick={() => setIsOpen(false)}
            onKeyDown={(e) => {
              if (e.key === "Escape") {
                setIsOpen(false);
              }
            }}
            role="button"
            tabIndex={-1}
            aria-label={t.language.closeMenu}
          />

          <div className="absolute right-0 top-full pt-2 w-56 z-50 animate-in fade-in zoom-in-95">
            <div className="flex flex-col rounded-md border border-border bg-card p-1 shadow-lg">
              {languages.map((lang) => (
                <button
                  key={lang.code}
                  type="button"
                  onClick={() => handleLanguageChange(lang.code)}
                  className={`block w-full text-left rounded-md px-3 py-2 text-sm transition-colors ${
                    language === lang.code
                      ? "bg-accent/20 text-accent font-medium"
                      : "hover:bg-secondary"
                  }`}
                >
                  <div className="font-medium">{lang.nativeLabel}</div>
                  <div className="text-xs text-muted-foreground">
                    {lang.label}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
