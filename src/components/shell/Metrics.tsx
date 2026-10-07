import { useEffect, useRef, useState } from "react";

import { cn } from "@/lib/utils";
import { formatNumber } from "@/lib/scenarioEngine";

/** Counts up to `value` while respecting the device's motion preference. */
export function CountUp({ value, duration = 900 }: { value: number; duration?: number }) {
  const [display, setDisplay] = useState(value);
  const from = useRef(value);

  useEffect(() => {
    const reduced = typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const start = from.current;
    if (reduced || start === value) {
      setDisplay(value);
      from.current = value;
      return;
    }
    let raf = 0;
    const t0 = performance.now();
    const tick = (now: number) => {
      const p = Math.min(1, (now - t0) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setDisplay(Math.round(start + (value - start) * eased));
      if (p < 1) raf = requestAnimationFrame(tick);
      else from.current = value;
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, duration]);

  return <span className="tnum">{formatNumber(display)}</span>;
}

export function Metric({
  label,
  value,
  sub,
  tone = "default",
  className,
}: {
  label: string;
  value: React.ReactNode;
  sub?: React.ReactNode;
  tone?: "default" | "unlocked" | "muted";
  className?: string;
}) {
  return (
    <div className={cn("min-w-0", className)}>
      <p className="eyebrow">{label}</p>
      <p
        className={cn(
          "tnum mt-1 text-2xl font-semibold tracking-tight",
          tone === "unlocked" && "text-unlocked",
          tone === "muted" && "text-muted-foreground",
        )}
      >
        {value}
      </p>
      {sub ? <p className="mt-0.5 text-xs text-muted-foreground">{sub}</p> : null}
    </div>
  );
}

export function EvidenceBadge({
  level = "illustrative",
  className,
}: {
  level?: "illustrative" | "modeled" | "documented";
  className?: string;
}) {
  const label =
    level === "illustrative"
      ? "Illustrative"
      : level === "modeled"
        ? "Modeled cost"
        : "Documented";
  return (
    <span
      className={cn(
        "inline-flex items-center rounded border border-border bg-muted px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground",
        className,
      )}
    >
      {label}
    </span>
  );
}
