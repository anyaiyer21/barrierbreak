import { useState } from "react";
import { ChevronDown } from "lucide-react";

import { cn } from "@/lib/utils";

const items: { label: string; color: string; dashed?: boolean; shape?: "line" | "dot" | "diamond" }[] =
  [
    { label: "Accessible network today", color: "var(--network)", shape: "line" },
    { label: "Blocked link (barrier)", color: "var(--barrier)", shape: "line", dashed: true },
    { label: "Recommended repair", color: "var(--repair)", shape: "dot" },
    { label: "Newly accessible link", color: "var(--unlocked)", shape: "line" },
    { label: "Condition unknown", color: "var(--network)", shape: "line", dashed: true },
    { label: "Residential origin area", color: "var(--origin)", shape: "dot" },
    { label: "Transit", color: "var(--transit)", shape: "diamond" },
    { label: "School", color: "var(--school)", shape: "diamond" },
    { label: "Civic / library", color: "var(--civic)", shape: "diamond" },
    { label: "Park", color: "var(--park)", shape: "diamond" },
  ];

export function MapLegend({ className }: { className?: string }) {
  const [open, setOpen] = useState(false);

  return (
    <div
      className={cn(
        "w-56 rounded-lg border bg-surface/95 p-2.5 text-[11px] shadow-sm backdrop-blur",
        className,
      )}
    >
      <button
        type="button"
        className="flex w-full items-center justify-between"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        <span className="eyebrow">Map legend</span>
        <ChevronDown
          className={cn("size-3.5 text-muted-foreground transition-transform", open && "rotate-180")}
          aria-hidden
        />
      </button>
      <ul className={cn("mt-2 space-y-1.5", !open && "hidden")}>
        {items.map((i) => (
          <li key={i.label} className="flex items-center gap-2 text-muted-foreground">
            <svg width="18" height="10" aria-hidden>
              {i.shape === "line" && (
                <line
                  x1="1"
                  y1="5"
                  x2="17"
                  y2="5"
                  stroke={i.color}
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeDasharray={i.dashed ? "4 3" : undefined}
                />
              )}
              {i.shape === "dot" && <circle cx="9" cy="5" r="4" fill={i.color} />}
              {i.shape === "diamond" && (
                <rect
                  x="5"
                  y="1"
                  width="8"
                  height="8"
                  rx="2"
                  fill="none"
                  stroke={i.color}
                  strokeWidth="2"
                />
              )}
            </svg>
            {i.label}
          </li>
        ))}
      </ul>
      {!open && (
        <p className="mt-1 leading-snug text-muted-foreground">
          Gray = accessible today · red dashes = blocked · green = unlocked by the plan
        </p>
      )}
    </div>
  );
}

export default MapLegend;
