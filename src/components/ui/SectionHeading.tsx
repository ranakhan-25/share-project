"use client";

import type { Bi } from "@/lib/i18n";
import { useLang } from "@/lib/i18n";
import { Reveal } from "./Reveal";

export function SectionHeading({
  eyebrow,
  title,
  subtitle,
  align = "center",
  dark = false,
}: {
  eyebrow: Bi;
  title: Bi;
  subtitle?: Bi;
  align?: "center" | "left";
  dark?: boolean;
}) {
  const { t } = useLang();
  return (
    <Reveal className={`max-w-3xl ${align === "center" ? "mx-auto text-center" : ""}`}>
      <span
        className={`inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] ${
          dark
            ? "bg-emerald-400/10 text-emerald-300 ring-1 ring-emerald-400/25"
            : "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200"
        }`}
      >
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
        {t(eyebrow)}
      </span>
      <h2
        className={`mt-5 text-3xl font-bold leading-[1.2] tracking-tight sm:text-4xl lg:text-[44px] ${
          dark ? "text-white" : "text-slate-900"
        }`}
      >
        {t(title)}
      </h2>
      {subtitle && (
        <p className={`mt-4 text-base leading-relaxed sm:text-lg ${dark ? "text-white/60" : "text-slate-600"}`}>
          {t(subtitle)}
        </p>
      )}
    </Reveal>
  );
}
