import { useMemo } from "react";

import { cn } from "@/lib/utils";
import { impactFrontier, jumpBundleId, formatCurrency, getBundle } from "@/lib/scenarioEngine";
import type { PriorityId, StrategyId } from "@/types/scenario";

/**
 * Impact frontier: budget on X, modeled connections on Y.
 * The steps make non-linear value visible — clicking a step highlights the
 * unlock set responsible for it.
 */
export function ImpactFrontier({
  strategy,
  priority,
  budget,
  onSelectBudget,
  onHighlightBundle,
}: {
  strategy: StrategyId;
  priority: PriorityId;
  budget: number;
  onSelectBudget: (budget: number) => void;
  onHighlightBundle: (bundleId?: string) => void;
}) {
  const points = useMemo(() => impactFrontier(strategy, priority), [strategy, priority]);
  const max = Math.max(...points.map((p) => p.connections), 1);
  const w = 240;
  const h = 62;

  const coords = points.map((p, i) => ({
    ...p,
    x: (i / (points.length - 1)) * w,
    y: h - (p.connections / max) * h,
  }));

  const line = coords.map((c, i) => `${i === 0 ? "M" : "L"} ${c.x} ${c.y}`).join(" ");
  const area = `${line} L ${w} ${h} L 0 ${h} Z`;

  return (
    <div>
      <div className="flex items-baseline justify-between">
        <p className="eyebrow">Impact frontier</p>
        <p className="text-[11px] text-muted-foreground">connections vs budget</p>
      </div>
      <svg
        viewBox={`0 -6 ${w} ${h + 18}`}
        className="mt-2 w-full"
        role="img"
        aria-label={`Impact frontier. ${coords
          .map((c) => `${formatCurrency(c.budget)}: ${c.connections} connections`)
          .join(". ")}`}
      >
        <path d={area} fill="var(--repair)" opacity={0.1} />
        <path d={line} fill="none" stroke="var(--repair)" strokeWidth={2} />
        {coords.map((c, i) => {
          const active = c.budget === budget;
          const jump = jumpBundleId(strategy, priority, i);
          const bundle = jump ? getBundle(jump) : undefined;
          return (
            <g key={c.budget}>
              <circle
                cx={c.x}
                cy={c.y}
                r={active ? 5 : 3.5}
                fill={active ? "var(--repair)" : "var(--surface)"}
                stroke="var(--repair)"
                strokeWidth={2}
              />
              <rect
                x={c.x - 18}
                y={-6}
                width={36}
                height={h + 18}
                fill="transparent"
                className="cursor-pointer"
                role="button"
                tabIndex={0}
                aria-label={`Set budget to ${formatCurrency(c.budget)} — ${c.connections} modeled connections${
                  bundle ? `, driven by ${bundle.name}` : ""
                }`}
                onClick={() => {
                  onSelectBudget(c.budget);
                  onHighlightBundle(jump);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onSelectBudget(c.budget);
                    onHighlightBundle(jump);
                  }
                }}
                onMouseEnter={() => onHighlightBundle(jump)}
                onMouseLeave={() => onHighlightBundle(undefined)}
              />
              <text
                x={c.x}
                y={h + 12}
                textAnchor="middle"
                fontSize="8"
                className={cn(
                  "tnum",
                  active ? "fill-foreground font-semibold" : "fill-muted-foreground",
                )}
              >
                {formatCurrency(c.budget)}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

export default ImpactFrontier;
