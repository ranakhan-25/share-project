"use client";

import { animate, useInView } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { useLang } from "@/lib/i18n";

export function CountUp({
  to,
  duration = 1.8,
  decimals = 0,
  prefix = "",
  suffix = "",
  className,
  compact = false,
}: {
  to: number;
  duration?: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  className?: string;
  compact?: boolean;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const [value, setValue] = useState(0);
  const { num } = useLang();

  useEffect(() => {
    if (!inView) return;
    const controls = animate(0, to, {
      duration,
      ease: "easeOut",
      onUpdate: (v) => setValue(v),
    });
    return () => controls.stop();
  }, [inView, to, duration]);

  return (
    <span ref={ref} className={className}>
      {prefix}
      {num(value, {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
        notation: compact ? "compact" : "standard",
      })}
      {suffix}
    </span>
  );
}
