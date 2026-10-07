import { useMemo, useRef, useEffect, useState } from "react";
import {
  Bus,
  GraduationCap,
  Landmark,
  Trees,
  type LucideIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";
import {
  scenario,
  getNode,
  getBarrier,
  getLink,
  getRoute,
} from "@/lib/scenarioEngine";
import type { DestinationKind } from "@/types/scenario";

export type MapPhase = "before" | "evaluating" | "selecting" | "unlocking" | "after";

export interface NetworkMapProps {
  /** Barrier ids the current plan repairs. */
  repairedBarrierIds: Set<string>;
  /** Barrier ids being highlighted (candidate / selected bundle). */
  highlightedBarrierIds?: Set<string>;
  /** Route ids to draw as unlocked journeys. */
  activeRouteIds?: string[];
  /** Draw the route as blocked (stops at `blockedAt`) instead of complete. */
  blockedRouteId?: string;
  phase: MapPhase;
  /** Camera focus: node ids to fit. Empty = whole city. */
  focusNodeIds?: string[];
  onBarrierClick?: (barrierId: string) => void;
  className?: string;
  /** Text equivalent announced to screen readers when state changes. */
  statusText: string;
  compact?: boolean;
}

const destinationIcons: Record<DestinationKind, LucideIcon> = {
  transit: Bus,
  school: GraduationCap,
  civic: Landmark,
  park: Trees,
};

const destinationColorVar: Record<DestinationKind, string> = {
  transit: "var(--transit)",
  school: "var(--school)",
  civic: "var(--civic)",
  park: "var(--park)",
};

const VIEW = { w: 1200, h: 820 };

function pathFor(nodeIds: string[], stopAt?: string) {
  const pts: string[] = [];
  for (const id of nodeIds) {
    const n = getNode(id);
    if (!n) continue;
    pts.push(`${n.x},${n.y}`);
    if (stopAt && id === stopAt) break;
  }
  return pts.length ? `M ${pts.join(" L ")}` : "";
}

export function NetworkMap({
  repairedBarrierIds,
  highlightedBarrierIds,
  activeRouteIds = [],
  blockedRouteId,
  phase,
  focusNodeIds = [],
  onBarrierClick,
  className,
  statusText,
  compact = false,
}: NetworkMapProps) {
  const routeRefs = useRef<Record<string, SVGPathElement | null>>({});
  const [routeLengths, setRouteLengths] = useState<Record<string, number>>({});
  const [hoverBarrierId, setHoverBarrierId] = useState<string | null>(null);

  useEffect(() => {
    const next: Record<string, number> = {};
    for (const [id, el] of Object.entries(routeRefs.current)) {
      if (el) next[id] = el.getTotalLength();
    }
    setRouteLengths(next);
  }, [activeRouteIds.join(","), blockedRouteId]);

  const viewBox = useMemo(() => {
    if (!focusNodeIds.length) return `-40 -40 ${VIEW.w + 80} ${VIEW.h + 80}`;
    const nodes = focusNodeIds.map(getNode).filter(Boolean) as { x: number; y: number }[];
    if (!nodes.length) return `-40 -40 ${VIEW.w + 80} ${VIEW.h + 80}`;
    const pad = 190;
    let minX = Math.min(...nodes.map((n) => n.x)) - pad;
    let maxX = Math.max(...nodes.map((n) => n.x)) + pad;
    let minY = Math.min(...nodes.map((n) => n.y)) - pad;
    let maxY = Math.max(...nodes.map((n) => n.y)) + pad;
    // Keep the camera readable: never zoom past a comfortable neighbourhood view,
    // and keep the frame roughly the shape of the full city plane.
    const minW = 860;
    const minH = 590;
    if (maxX - minX < minW) {
      const cx = (minX + maxX) / 2;
      minX = cx - minW / 2;
      maxX = cx + minW / 2;
    }
    if (maxY - minY < minH) {
      const cy = (minY + maxY) / 2;
      minY = cy - minH / 2;
      maxY = cy + minH / 2;
    }
    return `${minX} ${minY} ${maxX - minX} ${maxY - minY}`;
  }, [focusNodeIds.join(",")]);

  const dimBase = phase === "evaluating" || phase === "selecting";
  const scopedBarrierView = phase !== "before" || Boolean(blockedRouteId) || activeRouteIds.length > 0 || Boolean(highlightedBarrierIds?.size);

  return (
    <div className={cn("relative h-full w-full overflow-hidden bg-map-bg", className)}>
      <svg
        viewBox={viewBox}
        className="h-full w-full [transition:all_900ms_cubic-bezier(0.22,1,0.36,1)]"
        role="img"
        aria-label={statusText}
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          <pattern id="bb-parcels" width="60" height="60" patternUnits="userSpaceOnUse">
            <rect width="60" height="60" fill="var(--map-bg)" />
            <path d="M0 60 L60 60 M60 0 L60 60" stroke="var(--map-parcel)" strokeWidth="1.5" />
          </pattern>
          <pattern
            id="bb-unknown"
            width="8"
            height="8"
            patternUnits="userSpaceOnUse"
            patternTransform="rotate(45)"
          >
            <rect width="8" height="8" fill="transparent" />
            <line x1="0" y1="0" x2="0" y2="8" stroke="var(--network)" strokeWidth="3" />
          </pattern>
          <filter id="bb-glow" x="-60%" y="-60%" width="220%" height="220%">
            <feGaussianBlur stdDeviation="9" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Basemap */}
        <rect x="-200" y="-200" width={VIEW.w + 400} height={VIEW.h + 400} fill="url(#bb-parcels)" />
        <ellipse cx="1010" cy="600" rx="150" ry="92" fill="var(--map-water)" />
        <text x="1010" y="605" textAnchor="middle" className="fill-muted-foreground" fontSize="17">
          Pine Lake
        </text>
        <ellipse cx="205" cy="140" rx="112" ry="66" fill="var(--map-water)" />

        {/* Origin areas */}
        <g opacity={dimBase ? 0.4 : 1} className="transition-opacity duration-500">
          {scenario.origins.map((o) => (
            <g key={o.id}>
              <circle cx={o.x} cy={o.y} r={54} fill="var(--origin)" opacity={0.09} />
              <circle cx={o.x} cy={o.y} r={30} fill="var(--origin)" opacity={0.13} />
              {!compact && (
                <text
                  x={o.x}
                  y={o.y + 78}
                  textAnchor="middle"
                  fontSize="16"
                  className="fill-muted-foreground"
                >
                  {o.label}
                </text>
              )}
            </g>
          ))}
        </g>

        {/* Links */}
        <g strokeLinecap="round">
          {scenario.links.map((link) => {
            const a = getNode(link.from);
            const b = getNode(link.to);
            if (!a || !b) return null;
            const barrier = link.barrierId ? getBarrier(link.barrierId) : undefined;
            const repaired = barrier ? repairedBarrierIds.has(barrier.id) : false;
            const blocked = Boolean(barrier) && !repaired;
            const unknown = barrier?.condition === "unknown" && !repaired;

            let stroke = "var(--network)";
            let width = 7;
            let dash: string | undefined;
            let opacity = dimBase ? 0.5 : 1;

            if (blocked) {
              stroke = unknown ? "var(--network)" : "var(--barrier)";
              dash = unknown ? "10 10" : "16 12";
              width = 7;
            } else if (repaired) {
              stroke = "var(--unlocked)";
              width = 9;
              opacity = 1;
            }

            return (
              <line
                key={link.id}
                x1={a.x}
                y1={a.y}
                x2={b.x}
                y2={b.y}
                stroke={stroke}
                strokeWidth={width}
                strokeDasharray={dash}
                opacity={opacity}
                className="[transition:opacity_200ms_ease]"
              />
            );
          })}
        </g>

        {/* Intersections */}
        <g>
          {scenario.nodes.map((n) => (
            <circle key={n.id} cx={n.x} cy={n.y} r={4} fill="var(--network-soft)" />
          ))}
        </g>

        {/* Unlocked / blocked routes */}
        <g fill="none" strokeLinecap="round" strokeLinejoin="round">
          {blockedRouteId &&
            (() => {
              const r = getRoute(blockedRouteId);
              if (!r) return null;
              const stop = r.blockedAt ?? r.path[Math.max(0, r.path.length - 2)];
              return (
                <>
                  <path
                    d={pathFor(r.path, stop)}
                    stroke="var(--foreground)"
                    strokeOpacity={0.28}
                    strokeWidth={13}
                  />
                  {(() => {
                    const n = stop ? getNode(stop) : undefined;
                    return n ? (
                      <g>
                        <circle cx={n.x} cy={n.y} r={17} fill="var(--barrier)" opacity={0.18} />
                        <path
                          d={`M ${n.x - 9} ${n.y - 9} L ${n.x + 9} ${n.y + 9} M ${n.x + 9} ${n.y - 9} L ${n.x - 9} ${n.y + 9}`}
                          stroke="var(--barrier)"
                          strokeWidth={4}
                        />
                      </g>
                    ) : null;
                  })()}
                </>
              );
            })()}

          {activeRouteIds.map((rid) => {
            const r = getRoute(rid);
            if (!r) return null;
            const len = routeLengths[rid];
            return (
              <g key={rid}>
                <path
                  d={pathFor(r.path)}
                  stroke="var(--unlocked)"
                  strokeOpacity={0.22}
                  strokeWidth={20}
                  filter="url(#bb-glow)"
                />
                <path
                  ref={(el) => {
                    routeRefs.current[rid] = el;
                  }}
                  d={pathFor(r.path)}
                  stroke="var(--unlocked)"
                  strokeWidth={9}
                  className="route-draw"
                  style={len ? ({ "--route-length": len } as React.CSSProperties) : undefined}
                />
              </g>
            );
          })}
        </g>

        {/* Barriers */}
        <g>
          {scenario.barriers.map((barrier) => {
            const link = getLink(barrier.linkId);
            const a = link && getNode(link.from);
            const b = link && getNode(link.to);
            if (!a || !b) return null;
            const cx = (a.x + b.x) / 2;
            const cy = (a.y + b.y) / 2;
            const repaired = repairedBarrierIds.has(barrier.id);
            const highlighted = highlightedBarrierIds?.has(barrier.id) ?? false;
            if (scopedBarrierView && !repaired && !highlighted) return null;
            const fill = repaired ? "var(--repair)" : "var(--barrier)";

            return (
              <g
                key={barrier.id}
                role={onBarrierClick ? "button" : undefined}
                tabIndex={onBarrierClick ? 0 : undefined}
                aria-label={`${barrier.label}. ${repaired ? "Recommended repair" : "Currently blocked"}`}
                className={cn(onBarrierClick && "cursor-pointer focus:outline-none")}
                onMouseEnter={() => setHoverBarrierId(barrier.id)}
                onMouseLeave={() => setHoverBarrierId((id) => (id === barrier.id ? null : id))}
                onFocus={() => setHoverBarrierId(barrier.id)}
                onBlur={() => setHoverBarrierId((id) => (id === barrier.id ? null : id))}
                onClick={() => onBarrierClick?.(barrier.id)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onBarrierClick?.(barrier.id);
                  }
                }}
              >
                <circle cx={cx} cy={cy} r={hoverBarrierId === barrier.id ? 22 : 17} fill={fill} opacity={hoverBarrierId === barrier.id ? 0.16 : 0} className="[transition:all_180ms_ease]" />
                {(highlighted || (repaired && phase !== "before")) && (
                  <circle cx={cx} cy={cy} r={14} fill={fill} className="pulse-marker" />
                )}
                {repaired ? (
                  <g className="[transition:all_500ms_ease]">
                    <circle cx={cx} cy={cy} r={12} fill="var(--surface)" />
                    <circle cx={cx} cy={cy} r={9} fill="var(--repair)" />
                    <path
                      d={`M ${cx - 4.2} ${cy} l 3 3 l 5.4 -6`}
                      stroke="var(--surface)"
                      strokeWidth={2.4}
                      fill="none"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </g>
                ) : (
                  <g opacity={dimBase && !highlighted ? 0.55 : 1}>
                    <rect
                      x={cx - 8}
                      y={cy - 8}
                      width={16}
                      height={16}
                      rx={3}
                      transform={`rotate(45 ${cx} ${cy})`}
                      fill="var(--surface)"
                      stroke="var(--barrier)"
                      strokeWidth={3}
                    />
                  </g>
                )}
              </g>
            );
          })}
        </g>

        {/* Destinations */}
        <g>
          {scenario.destinations.map((d) => {
            const Icon = destinationIcons[d.kind];
            const color = destinationColorVar[d.kind];
            return (
              <g key={d.id}>
                <rect
                  x={d.x - 17}
                  y={d.y - 17}
                  width={34}
                  height={34}
                  rx={9}
                  fill="var(--surface)"
                  stroke={color}
                  strokeWidth={2}
                />
                <g transform={`translate(${d.x - 9}, ${d.y - 9})`} color={color}>
                  <Icon width={18} height={18} strokeWidth={2} />
                </g>
                {!compact && (
                  <text
                    x={d.x}
                    y={d.y - 27}
                    textAnchor="middle"
                    fontSize="16"
                    fontWeight={600}
                    className="fill-foreground"
                  >
                    {d.label}
                  </text>
                )}
              </g>
            );
          })}
        </g>
      </svg>

      {!compact && hoverBarrierId && (() => {
        const barrier = getBarrier(hoverBarrierId);
        if (!barrier) return null;
        return (
          <div className="pointer-events-none absolute left-1/2 top-4 z-20 w-64 -translate-x-1/2 rounded-lg border border-border bg-surface/95 p-3 shadow-lg">
            <div className="flex items-start justify-between gap-3"><p className="text-xs font-semibold leading-snug">{barrier.label}</p><span className={cn("text-[10px] font-semibold", repairedBarrierIds.has(barrier.id) ? "text-unlocked" : "text-barrier")}>{repairedBarrierIds.has(barrier.id) ? "Selected" : "Blocked"}</span></div>
            <p className="mt-2 text-xs text-muted-foreground capitalize">{barrier.kind.replaceAll("-", " ")} · {barrier.condition} condition</p>
            <p className="mt-1 text-xs font-medium tabular-nums">${barrier.cost.toLocaleString()} estimated cost · score {barrier.standaloneScore}/100</p>
          </div>
        );
      })()}

      <p className="sr-only" aria-live="polite">
        {statusText}
      </p>
    </div>
  );
}

export default NetworkMap;
