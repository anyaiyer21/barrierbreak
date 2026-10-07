import { useState } from "react";

import { cn } from "@/lib/utils";
import { getBarrier, getDestination, getOrigin, getRoute, formatNumber } from "@/lib/scenarioEngine";
import type { RepairBundle } from "@/types/scenario";

type Mode = 0 | 1 | 2;

/**
 * The core teaching interaction: A alone, B alone, A + B.
 * Deterministic — every number comes from the frozen bundle object.
 */
export function ComplementarityDiagram({ bundle }: { bundle: RepairBundle }) {
  const [mode, setMode] = useState<Mode>(2);
  const comp = bundle.complementarity;
  if (!comp || bundle.repairIds.length < 2) return null;

  const route = bundle.witnessRouteId ? getRoute(bundle.witnessRouteId) : undefined;
  const origin = route ? getOrigin(route.originId) : undefined;
  const destination = route ? getDestination(route.destinationId) : undefined;

  const [a, b] = bundle.repairIds;
  const labels = ["A only", "B only", "A + B"] as const;
  const connections = mode === 2 ? bundle.connections : comp.standalone[mode]?.connections ?? 0;

  const firstFixed = mode === 0 || mode === 2;
  const secondFixed = mode === 1 || mode === 2;

  const seg = (fixed: boolean) => (fixed ? "var(--unlocked)" : "var(--barrier)");
  const dash = (fixed: boolean) => (fixed ? undefined : "9 7");

  return (
    <div className="rounded-lg border bg-surface p-3">
      <div className="flex gap-1" role="tablist" aria-label="Standalone versus joint value">
        {labels.map((label, i) => (
          <button
            key={label}
            role="tab"
            aria-selected={mode === i}
            onClick={() => setMode(i as Mode)}
            className={cn(
              "flex-1 rounded-md px-2 py-1.5 text-[12px] font-medium transition-colors",
              mode === i
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:text-foreground",
            )}
          >
            {label}
          </button>
        ))}
      </div>

      <svg viewBox="0 0 320 76" className="mt-3 w-full" role="img" aria-label={
        `${labels[mode]}: ${formatNumber(connections)} modeled connections unlocked.`
      }>
        {/* origin */}
        <circle cx="20" cy="38" r="9" fill="var(--origin)" opacity={0.25} />
        <circle cx="20" cy="38" r="4" fill="var(--origin)" />
        {/* segment 1 */}
        <line
          x1="29"
          y1="38"
          x2="151"
          y2="38"
          stroke={seg(firstFixed)}
          strokeDasharray={dash(firstFixed)}
          strokeWidth="6"
          strokeLinecap="round"
          className="[transition:stroke_400ms_ease]"
        />
        <text x="90" y="22" textAnchor="middle" fontSize="10" className="fill-muted-foreground">
          Repair A
        </text>
        {/* middle node */}
        <circle cx="160" cy="38" r="5" fill="var(--network)" />
        {/* segment 2 */}
        <line
          x1="169"
          y1="38"
          x2="291"
          y2="38"
          stroke={seg(secondFixed)}
          strokeDasharray={dash(secondFixed)}
          strokeWidth="6"
          strokeLinecap="round"
          className="[transition:stroke_400ms_ease]"
        />
        <text x="230" y="22" textAnchor="middle" fontSize="10" className="fill-muted-foreground">
          Repair B
        </text>
        {/* destination */}
        <rect x="291" y="29" width="18" height="18" rx="5" fill="var(--surface)" stroke="var(--transit)" strokeWidth="2" />
        {/* stop marker */}
        {mode !== 2 && (
          <g>
            <circle cx={mode === 0 ? 160 : 92} cy="38" r="11" fill="var(--barrier)" opacity={0.16} />
            <path
              d={`M ${(mode === 0 ? 160 : 92) - 5} 33 L ${(mode === 0 ? 160 : 92) + 5} 43 M ${(mode === 0 ? 160 : 92) + 5} 33 L ${(mode === 0 ? 160 : 92) - 5} 43`}
              stroke="var(--barrier)"
              strokeWidth="2.5"
            />
          </g>
        )}
        <text x="20" y="64" textAnchor="middle" fontSize="9" className="fill-muted-foreground">
          Origin
        </text>
        <text x="300" y="64" textAnchor="end" fontSize="9" className="fill-muted-foreground">
          Destination
        </text>
      </svg>

      <div className="mt-1 flex items-baseline gap-2">
        <span
          className={cn(
            "tnum text-2xl font-semibold",
            connections > 0 ? "text-unlocked" : "text-muted-foreground",
          )}
        >
          {formatNumber(connections)}
        </span>
        <span className="text-xs text-muted-foreground">
          modeled connections unlocked{" "}
          {mode === 2 ? "with both repairs" : `with ${labels[mode].replace(" only", "")} alone`}
        </span>
      </div>

      <p className="mt-2 text-[12px] leading-relaxed text-muted-foreground">{comp.sentence}</p>

      <dl className="mt-3 grid grid-cols-2 gap-2 text-[11px]">
        <div>
          <dt className="text-muted-foreground">Repair A</dt>
          <dd className="font-medium">{a ? getBarrier(a)?.label : null}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Repair B</dt>
          <dd className="font-medium">{b ? getBarrier(b)?.label : null}</dd>
        </div>
      </dl>

      {origin && destination && (
        <p className="mt-3 text-[11px] text-muted-foreground">
          Representative journey: {origin.label} → {destination.label}
        </p>
      )}
    </div>
  );
}

export default ComplementarityDiagram;
