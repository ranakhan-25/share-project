"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type Lang = "bn" | "en";
export type Bi = { bn: string; en: string };

const STORAGE_KEY = "share-project:lang";

type LangContextValue = {
  lang: Lang;
  setLang: (lang: Lang) => void;
  /** Pick the string for the active language. */
  t: (value: Bi) => string;
  /** Locale-aware number formatting (Bengali digits in Bangla mode). */
  num: (value: number, options?: Intl.NumberFormatOptions) => string;
  /** Format as Bangladeshi Taka. */
  taka: (value: number, compact?: boolean) => string;
};

const LangContext = createContext<LangContextValue | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  // Bangla is the default language.
  const [lang, setLangState] = useState<Lang>("bn");

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved === "bn" || saved === "en") setLangState(saved);
    } catch {
      /* storage unavailable */
    }
  }, []);

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  const setLang = useCallback((next: Lang) => {
    setLangState(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* ignore */
    }
  }, []);

  const value = useMemo<LangContextValue>(() => {
    const locale = lang === "bn" ? "bn-BD" : "en-US";
    const num = (n: number, options?: Intl.NumberFormatOptions) =>
      new Intl.NumberFormat(locale, options).format(n);
    return {
      lang,
      setLang,
      t: (v) => v[lang],
      num,
      taka: (n, compact = false) =>
        "৳" +
        new Intl.NumberFormat(locale, {
          notation: compact ? "compact" : "standard",
          maximumFractionDigits: compact ? 1 : 0,
        }).format(n),
    };
  }, [lang, setLang]);

  return <LangContext.Provider value={value}>{children}</LangContext.Provider>;
}

export function useLang(): LangContextValue {
  const ctx = useContext(LangContext);
  if (!ctx) throw new Error("useLang must be used inside <LanguageProvider>");
  return ctx;
}

/** Inline bilingual text: <T bn="হোম" en="Home" /> */
export function T({ bn, en }: Bi) {
  const { lang } = useLang();
  return <>{lang === "bn" ? bn : en}</>;
}
