"use client";

import { motion } from "motion/react";
import { useLang, type Lang } from "@/lib/i18n";

const OPTIONS: { value: Lang; label: string }[] = [
  { value: "bn", label: "বাংলা" },
  { value: "en", label: "EN" },
];

export function LangSwitch({
  id = "lang",
  tone = "dark",
}: {
  /** unique id per instance so the sliding thumb animates independently */
  id?: string;
  tone?: "dark" | "light";
}) {
  const { lang, setLang } = useLang();
  const dark = tone === "dark";
  return (
    <div
      role="group"
      aria-label="Language"
      className={`relative inline-flex rounded-full p-0.5 text-xs font-semibold ${
        dark ? "bg-white/10 ring-1 ring-white/15" : "bg-slate-100 ring-1 ring-slate-200"
      }`}
    >
      {OPTIONS.map((o) => {
        const active = lang === o.value;
        return (
          <button
            key={o.value}
            type="button"
            onClick={() => setLang(o.value)}
            aria-pressed={active}
            className={`relative z-10 rounded-full px-3 py-1.5 transition-colors ${
              active
                ? dark
                  ? "text-ink-950"
                  : "text-white"
                : dark
                  ? "text-white/70 hover:text-white"
                  : "text-slate-500 hover:text-slate-900"
            }`}
          >
            {active && (
              <motion.span
                layoutId={`${id}-thumb`}
                className={`absolute inset-0 -z-10 rounded-full ${
                  dark ? "bg-white" : "bg-slate-900"
                }`}
                transition={{ type: "spring", stiffness: 420, damping: 32 }}
              />
            )}
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
