import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Bus, GraduationCap, Landmark, Trees, type LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { scenario, getNode, getBarrier, getLink, getRoute, walkPaths, linkPaths, scenarioCenter } from "@/lib/scenarioEngine";
import { boundsOf, nodeLatLng, pathLatLngs, type LatLng } from "@/lib/geo";
import type { DestinationKind } from "@/types/scenario";
import type { MapPhase } from "@/components/map/NetworkMap";
import NetworkMap from "@/components/map/NetworkMap";

export interface GeoMapProps {
  repairedBarrierIds: Set<string>;
  highlightedBarrierIds?: Set<string>;
  activeRouteIds?: string[];
  blockedRouteId?: string;
  phase: MapPhase;
  focusNodeIds?: string[];
  onBarrierClick?: (barrierId: string) => void;
  className?: string;
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

/* ---------------------------------------------------------------- loader */

const BROWSER_KEY = import.meta.env["VITE_LOVABLE_CONNECTOR_GOOGLE_MAPS_BROWSER_KEY"] as
  | string
  | undefined;
const TRACKING_ID = import.meta.env["VITE_LOVABLE_CONNECTOR_GOOGLE_MAPS_TRACKING_ID"] as
  | string
  | undefined;

declare global {
  interface Window {
    google?: typeof google;
    __bbMapsReady?: () => void;
  }
}

let mapsPromise: Promise<void> | null = null;

function loadMaps(): Promise<void> {
  if (typeof window === "undefined") return Promise.reject(new Error("no window"));
  if (window.google?.maps) return Promise.resolve();
  if (mapsPromise) return mapsPromise;
  if (!BROWSER_KEY) return Promise.reject(new Error("Missing Google Maps browser key"));

  mapsPromise = new Promise<void>((resolve, reject) => {
    window.__bbMapsReady = () => resolve();
    const s = document.createElement("script");
    const channel = TRACKING_ID ? `&channel=${TRACKING_ID}` : "";
    s.src = `https://maps.googleapis.com/maps/api/js?key=${BROWSER_KEY}&loading=async&callback=__bbMapsReady${channel}`;
    s.async = true;
    s.onerror = () => reject(new Error("Google Maps failed to load"));
    document.head.appendChild(s);
  });
  return mapsPromise;
}

/* ------------------------------------------------------------ projection */

interface Projection {
  width: number;
  height: number;
  nw: { x: number; y: number };
  scale: number;
}

function worldPoint(lat: number, lng: number) {
  const siny = Math.min(Math.max(Math.sin((lat * Math.PI) / 180), -0.9999), 0.9999);
  return {
    x: 256 * (0.5 + lng / 360),
    y: 256 * (0.5 - Math.log((1 + siny) / (1 - siny)) / (4 * Math.PI)),
  };
}

/** Muted civic basemap: streets legible, everything else quiet. */
const mapStyles: google.maps.MapTypeStyle[] = [
  { elementType: "geometry", stylers: [{ color: "#f4f6f8" }] },
  { elementType: "labels.icon", stylers: [{ visibility: "off" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#8a93a1" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#ffffff" }] },
  { featureType: "poi", stylers: [{ visibility: "off" }] },
  { featureType: "transit", stylers: [{ visibility: "off" }] },
  { featureType: "administrative", elementType: "geometry", stylers: [{ visibility: "off" }] },
  { featureType: "landscape", elementType: "geometry", stylers: [{ color: "#f1f3f6" }] },
  { featureType: "road", elementType: "geometry", stylers: [{ color: "#ffffff" }] },
  { featureType: "road", elementType: "geometry.stroke", stylers: [{ color: "#e4e8ee" }] },
  { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#ffffff" }] },
  { featureType: "road.local", elementType: "labels", stylers: [{ visibility: "simplified" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#dce8ef" }] },
];

export function GeoMap({
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
}: GeoMapProps) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const [projection, setProjection] = useState<Projection | null>(null);

  /* map creation */
  useEffect(() => {
    let cancelled = false;
    loadMaps()
      .then(() => {
        if (cancelled || !hostRef.current || mapRef.current) return;
        const map = new window.google!.maps.Map(hostRef.current, {
          center: scenarioCenter(),
          zoom: 14,
          clickableIcons: false,
          disableDefaultUI: true,
          zoomControl: !compact,
          gestureHandling: compact ? "none" : "greedy",
          keyboardShortcuts: !compact,
          styles: mapStyles,
        });
        mapRef.current = map;
        const sync = () => {
          const b = map.getBounds();
          const div = hostRef.current;
          if (!b || !div) return;
          const width = div.clientWidth;
          const height = div.clientHeight;
          const ne = b.getNorthEast();
          const sw = b.getSouthWest();
          const nwWorld = worldPoint(ne.lat(), sw.lng());
          const neWorld = worldPoint(ne.lat(), ne.lng());
          const dx = neWorld.x - nwWorld.x;
          if (dx <= 0 || width <= 0) return;
          setProjection({ width, height, nw: nwWorld, scale: width / dx });
        };
        map.addListener("bounds_changed", sync);
        map.addListener("idle", sync);
        window.google!.maps.event.addListenerOnce(map, "idle", () => {
          if (!cancelled) setReady(true);
          sync();
        });
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });
    return () => {
      cancelled = true;
    };
  }, [compact]);

  /* camera */
  const focusKey = focusNodeIds.join(",");
  const fitCamera = useCallback(() => {
    const map = mapRef.current;
    if (!map) return;
    const ids = focusKey ? focusKey.split(",") : scenario.nodes.map((n) => n.id);
    const pts = ids.map(nodeLatLng).filter(Boolean) as LatLng[];
    const b = boundsOf(pts);
    if (!b) return;
    const padLat = Math.max((b.north - b.south) * 0.2, 0.0014);
    const padLng = Math.max((b.east - b.west) * 0.2, 0.002);
    map.fitBounds(
      {
        north: b.north + padLat,
        south: b.south - padLat,
        east: b.east + padLng,
        west: b.west - padLng,
      },
      compact ? 6 : 20,
    );
  }, [focusKey, compact]);

  useEffect(() => {
    if (ready) fitCamera();
  }, [ready, fitCamera]);

  /* keep the camera framed when the container resizes */
  useEffect(() => {
    const div = hostRef.current;
    if (!div || !ready || typeof ResizeObserver === "undefined") return;
    let frame = 0;
    const ro = new ResizeObserver(() => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => fitCamera());
    });
    ro.observe(div);
    return () => {
      cancelAnimationFrame(frame);
      ro.disconnect();
    };
  }, [ready, fitCamera]);

  const toPx = useCallback(
    (p: LatLng) => {
      if (!projection) return null;
      const w = worldPoint(p.lat, p.lng);
      return {
        x: (w.x - projection.nw.x) * projection.scale,
        y: (w.y - projection.nw.y) * projection.scale,
      };
    },
    [projection],
  );

  const line = useCallback(
    (pts: LatLng[]) => {
      const px = pts.map(toPx).filter(Boolean) as { x: number; y: number }[];
      return px.length ? `M ${px.map((p) => `${p.x},${p.y}`).join(" L ")}` : "";
    },
    [toPx],
  );

  const walkLine = useCallback(
    (routeId: string, blocked: boolean) => {
      const stored = walkPaths[routeId];
      const geom = blocked ? stored?.blocked : stored?.full;
      if (geom?.length) return line(geom.map(([lat, lng]) => ({ lat, lng })));
      const r = getRoute(routeId);
      if (!r) return "";
      return line(pathLatLngs(r.path, blocked ? r.blockedAt : undefined));
    },
    [line],
  );

  /* animated route drawing */
  const routeRefs = useRef<Record<string, SVGPathElement | null>>({});
  const [routeLengths, setRouteLengths] = useState<Record<string, number>>({});
  const activeKey = activeRouteIds.join(",");
  useEffect(() => {
    const next: Record<string, number> = {};
    for (const [id, el] of Object.entries(routeRefs.current)) {
      if (el) next[id] = el.getTotalLength();
    }
    setRouteLengths(next);
  }, [activeKey, projection]);

  const dimBase = phase === "evaluating" || phase === "selecting";
  // The overview shows the full candidate inventory. Once the map is telling
  // a specific plan or journey story, show only its highlighted or funded
  // barriers so every visible diamond has a corresponding outcome.
  const scopedBarrierView =
    phase !== "before" ||
    Boolean(blockedRouteId) ||
    activeRouteIds.length > 0 ||
    Boolean(highlightedBarrierIds?.size);

  // Links that lie on an unlocked route: their barriers are cleared by the
  // trip itself, so they must not stay red under the green line.
  const activeLinkIds = useMemo(() => {
    const set = new Set<string>();
    for (const rid of activeRouteIds) {
      const r = getRoute(rid);
      if (!r) continue;
      for (let i = 0; i < r.path.length - 1; i++) {
        const from = r.path[i]!;
        const to = r.path[i + 1]!;
        const link = scenario.links.find(
          (l) => (l.from === from && l.to === to) || (l.from === to && l.to === from),
        );
        if (link) set.add(link.id);
      }
    }
    return set;
  }, [activeKey]);

  /* home-area hover: which modeled trips start here and what the current
     plan's repairs unlock for the people living in this area */
  const [hoverOriginId, setHoverOriginId] = useState<string | null>(null);
  const [hoverBarrierId, setHoverBarrierId] = useState<string | null>(null);
  const repairedKey = [...repairedBarrierIds].sort().join(",");
  const originStats = useMemo(() => {
    const funded = (repairIds: string[]) => repairIds.every((id) => repairedBarrierIds.has(id));
    const map = new Map<
      string,
      { total: number; unlocked: number; trips: { destination: string; unlocked: boolean }[] }
    >();
    for (const o of scenario.origins) {
      const trips = scenario.routes
        .filter((r) => r.originId === o.id)
        .map((r) => {
          const dest = scenario.destinations.find((d) => d.id === r.destinationId);
          const bundle = scenario.bundles.find((b) => b.witnessRouteId === r.id);
          return {
            destination: dest?.label ?? r.destinationId,
            unlocked: bundle ? funded(bundle.repairIds) : false,
          };
        });
      map.set(o.id, { total: trips.length, unlocked: trips.filter((t) => t.unlocked).length, trips });
    }
    return map;
  }, [repairedKey]);

  const barrierPoints = useMemo(() => {
    return scenario.barriers
      .map((barrier) => {
        const link = getLink(barrier.linkId);
        if (!link) return null;
        // Crossings and curb ramps happen at intersections — pin them to the
        // corner node so they line up with the route and the repair checklist.
        // Gaps and grade problems are mid-block, so use the street midpoint.
        const atIntersection =
          barrier.kind === "unsignalized-crossing" || barrier.kind === "missing-curb-ramp";
        if (atIntersection) {
          const stored = linkPaths[link.id];
          if (stored?.length) {
            // Sit just inside the barrier's own street so the marker never
            // lands exactly on a shared corner of an unrelated route.
            const p = stored[Math.min(stored.length - 1, Math.floor(stored.length * 0.15))]!;
            return { barrier, at: { lat: p[0], lng: p[1] } };
          }
          const corner = nodeLatLng(link.from);
          if (corner) return { barrier, at: corner };
        }

        const stored = linkPaths[link.id];
        if (stored?.length) {
          const mid = stored[Math.floor(stored.length / 2)]!;
          return { barrier, at: { lat: mid[0], lng: mid[1] } };
        }
        const a = nodeLatLng(link.from);
        const b = nodeLatLng(link.to);
        if (!a || !b) return null;
        return { barrier, at: { lat: (a.lat + b.lat) / 2, lng: (a.lng + b.lng) / 2 } };
      })
      .filter(Boolean) as { barrier: (typeof scenario.barriers)[number]; at: LatLng }[];
  }, []);

  if (failed) {
    return (
      <NetworkMap
        repairedBarrierIds={repairedBarrierIds}
        {...(highlightedBarrierIds ? { highlightedBarrierIds } : {})}
        activeRouteIds={activeRouteIds}
        {...(blockedRouteId ? { blockedRouteId } : {})}
        phase={phase}
        focusNodeIds={focusNodeIds}
        {...(onBarrierClick ? { onBarrierClick } : {})}
        {...(className ? { className } : {})}
        statusText={statusText}
        compact={compact}
      />
    );
  }

  return (
    <div className={cn("relative h-full w-full overflow-hidden bg-map-bg", className)}>
      <div ref={hostRef} className="absolute inset-0" aria-hidden="true" />

      <svg
        className="pointer-events-none absolute inset-0 h-full w-full"
        role="img"
        aria-label={statusText}
      >
        <defs>
          <filter id="bbg-glow" x="-60%" y="-60%" width="220%" height="220%">
            <feGaussianBlur stdDeviation="7" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Origin areas — hover/focus reveals household + impact stats */}
        <g opacity={dimBase ? 0.45 : 1} className="transition-opacity duration-500">
          {scenario.origins.map((o) => {
            const p = nodeLatLng(o.nodeId);
            const px = p && toPx(p);
            if (!px) return null;
            const stats = originStats.get(o.id);
            const hovered = hoverOriginId === o.id;
            return (
              <g
                key={o.id}
                style={{ pointerEvents: "auto" }}
                className="cursor-pointer focus:outline-none"
                role="button"
                tabIndex={compact ? -1 : 0}
                aria-label={`${o.label}. ${o.households.toLocaleString()} households. ${stats?.unlocked ?? 0} of ${stats?.total ?? 0} modeled trips unlocked by the current plan.`}
                onMouseEnter={() => setHoverOriginId(o.id)}
                onMouseLeave={() => setHoverOriginId((id) => (id === o.id ? null : id))}
                onFocus={() => setHoverOriginId(o.id)}
                onBlur={() => setHoverOriginId((id) => (id === o.id ? null : id))}
              >
                <circle
                  cx={px.x}
                  cy={px.y}
                  r={hovered ? 36 : 30}
                  fill="var(--origin)"
                  opacity={hovered ? 0.18 : 0.1}
                  className="[transition:all_180ms_ease]"
                />
                <circle
                  cx={px.x}
                  cy={px.y}
                  r={hovered ? 19 : 15}
                  fill="var(--origin)"
                  opacity={hovered ? 0.3 : 0.16}
                  className="[transition:all_180ms_ease]"
                />
                <circle
                  cx={px.x}
                  cy={px.y}
                  r={36}
                  fill="none"
                  stroke="var(--origin)"
                  strokeWidth={1.6}
                  opacity={hovered ? 0.8 : 0}
                  className="[transition:opacity_180ms_ease]"
                />
              </g>
            );
          })}
        </g>

        {/* Network links */}
        <g strokeLinecap="round">
          {scenario.links.map((link) => {
            // Trace the real street; fall back to a straight segment.
            const stored = linkPaths[link.id];
            const pts =
              stored?.length
                ? stored.map(([lat, lng]) => ({ lat, lng }))
                : ([nodeLatLng(link.from), nodeLatLng(link.to)].filter(Boolean) as LatLng[]);
            const d = line(pts);
            if (!d) return null;
            const barrier = link.barrierId ? getBarrier(link.barrierId) : undefined;
            const repaired = barrier
              ? repairedBarrierIds.has(barrier.id)
              : activeLinkIds.has(link.id);
            const blocked = Boolean(barrier) && !repaired;
            const unknown = barrier?.condition === "unknown" && !repaired;

            let stroke = "var(--network)";
            let width = 4;
            let dash: string | undefined;
            let opacity = dimBase ? 0.45 : 0.85;

            if (blocked) {
              stroke = unknown ? "var(--network)" : "var(--barrier)";
              dash = unknown ? "8 8" : "12 9";
              width = 5;
            } else if (repaired) {
              stroke = "var(--unlocked)";
              width = 6;
              opacity = 1;
            }

            return (
              <path
                key={link.id}
                d={d}
                fill="none"
                stroke={stroke}
                strokeWidth={width}
                strokeDasharray={dash}
                opacity={opacity}
                className="[transition:opacity_200ms_ease]"
              />
            );
          })}
        </g>

        {/* Blocked / unlocked walking routes (real geometry) */}
        <g fill="none" strokeLinecap="round" strokeLinejoin="round">
          {blockedRouteId &&
            (() => {
              const r = getRoute(blockedRouteId);
              const stop = r?.blockedAt;
              const stopPt = stop ? nodeLatLng(stop) : undefined;
              const px = stopPt && toPx(stopPt);
              return (
                <>
                  <path
                    d={walkLine(blockedRouteId, true)}
                    stroke="var(--foreground)"
                    strokeOpacity={0.3}
                    strokeWidth={9}
                  />
                  {px && (
                    <g>
                      <circle cx={px.x} cy={px.y} r={14} fill="var(--barrier)" opacity={0.18} />
                      <path
                        d={`M ${px.x - 7} ${px.y - 7} L ${px.x + 7} ${px.y + 7} M ${px.x + 7} ${px.y - 7} L ${px.x - 7} ${px.y + 7}`}
                        stroke="var(--barrier)"
                        strokeWidth={3.5}
                      />
                    </g>
                  )}
                </>
              );
            })()}

          {activeRouteIds.map((rid) => {
            const d = walkLine(rid, false);
            if (!d) return null;
            const len = routeLengths[rid];
            return (
              <g key={rid}>
                <path
                  d={d}
                  stroke="var(--unlocked)"
                  strokeOpacity={0.22}
                  strokeWidth={16}
                  filter="url(#bbg-glow)"
                />
                <path
                  ref={(el) => {
                    routeRefs.current[rid] = el;
                  }}
                  d={d}
                  stroke="var(--unlocked)"
                  strokeWidth={7}
                  className="route-draw"
                  style={len ? ({ "--route-length": len } as React.CSSProperties) : undefined}
                />
              </g>
            );
          })}
        </g>

        {/* Barriers */}
        <g className="pointer-events-auto">
          {barrierPoints.map(({ barrier, at }) => {
            const px = toPx(at);
            if (!px) return null;
            // A route passing through a link does not itself repair its barrier.
            // Keep marker state tied only to the barrier ID so the same marker
            // changes state in place instead of being inferred from route geometry.
            const repaired = repairedBarrierIds.has(barrier.id);
            const highlighted = highlightedBarrierIds?.has(barrier.id) ?? false;
            if (scopedBarrierView && !repaired && !highlighted) return null;
            const fill = repaired ? "var(--repair)" : "var(--barrier)";
            const hovered = hoverBarrierId === barrier.id;

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
                <circle
                  cx={px.x}
                  cy={px.y}
                  r={hovered ? 17 : 14}
                  fill={fill}
                  opacity={hovered ? 0.16 : 0}
                  className="[transition:all_180ms_ease]"
                />
                {(highlighted || (repaired && phase !== "before")) && (
                  <circle cx={px.x} cy={px.y} r={12} fill={fill} opacity={0.18} className="pulse-marker" />
                )}
                <g opacity={dimBase && !highlighted ? 0.55 : 1}>
                  {/* The marker shell never moves or changes shape. Repairing a
                      barrier changes only its color and adds the check. */}
                  <rect
                    x={px.x - 6.5}
                    y={px.y - 6.5}
                    width={13}
                    height={13}
                    rx={2.5}
                    transform={`rotate(45 ${px.x} ${px.y})`}
                    fill={repaired ? "var(--repair)" : "var(--surface)"}
                    stroke={repaired ? "var(--surface)" : "var(--barrier)"}
                    strokeWidth={2.6}
                  />
                  {repaired && (
                    <path
                      d={`M ${px.x - 3.5} ${px.y} l 2.5 2.6 l 4.6 -5.2`}
                      stroke="var(--surface)"
                      strokeWidth={2.2}
                      fill="none"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  )}
                </g>
              </g>
            );
          })}
        </g>

        {/* Destinations */}
        <g>
          {scenario.destinations.map((d) => {
            const p = nodeLatLng(d.nodeId);
            const px = p && toPx(p);
            if (!px) return null;
            const Icon = destinationIcons[d.kind];
            const color = destinationColorVar[d.kind];
            return (
              <g key={d.id}>
                <rect
                  x={px.x - 14}
                  y={px.y - 14}
                  width={28}
                  height={28}
                  rx={8}
                  fill="var(--surface)"
                  stroke={color}
                  strokeWidth={2}
                />
                <g transform={`translate(${px.x - 8}, ${px.y - 8})`} color={color}>
                  <Icon width={16} height={16} strokeWidth={2} />
                </g>
                {!compact && (
                  <text
                    x={px.x}
                    y={px.y - 20}
                    textAnchor="middle"
                    fontSize="12"
                    fontWeight={600}
                    className="fill-foreground"
                    paintOrder="stroke"
                    stroke="var(--surface)"
                    strokeWidth={4}
                  >
                    {d.label}
                  </text>
                )}
              </g>
            );
          })}
        </g>
      </svg>

      {/* Home-area hover card */}
      {!compact &&
        hoverOriginId &&
        (() => {
          const o = scenario.origins.find((x) => x.id === hoverOriginId);
          const p = o && nodeLatLng(o.nodeId);
          const px = p && toPx(p);
          const stats = o && originStats.get(o.id);
          if (!o || !px || !stats) return null;
          return (
            <div
              className="pointer-events-none absolute z-20 w-60 rounded-lg border border-border bg-surface/95 p-3 shadow-lg backdrop-blur"
              style={{
                left: Math.min(Math.max(px.x, 130), (projection?.width ?? px.x) - 130),
                top: Math.max(px.y - 48, 150),
                transform: "translate(-50%, -100%)",
              }}
            >
              <p className="text-xs font-semibold leading-snug">{o.label}</p>
              <dl className="mt-2 space-y-1 text-xs">
                <div className="flex items-baseline justify-between gap-2">
                  <dt className="text-muted-foreground">Households</dt>
                  <dd className="font-medium tabular-nums">{o.households.toLocaleString()}</dd>
                </div>
                <div className="flex items-baseline justify-between gap-2">
                  <dt className="text-muted-foreground">Trips unlocked by plan</dt>
                  <dd className="font-medium tabular-nums">
                    {stats.unlocked} of {stats.total}
                  </dd>
                </div>
              </dl>
              {stats.trips.length > 0 && (
                <ul className="mt-2 space-y-1 border-t border-border pt-2">
                  {stats.trips.map((t) => (
                    <li
                      key={t.destination}
                      className="flex items-center gap-1.5 text-[11px] text-muted-foreground"
                    >
                      <span
                        className="inline-block h-1.5 w-1.5 shrink-0 rounded-full"
                        style={{ background: t.unlocked ? "var(--unlocked)" : "var(--barrier)" }}
                      />
                      <span className="truncate">{t.destination}</span>
                    </li>
                  ))}
                </ul>
              )}
              <p className="mt-2 text-[10px] text-muted-foreground/70">Illustrative, modeled data</p>
            </div>
          );
        })()}

      {/* Barrier hover card */}
      {!compact &&
        hoverBarrierId &&
        (() => {
          const point = barrierPoints.find(({ barrier }) => barrier.id === hoverBarrierId);
          const px = point && toPx(point.at);
          if (!point || !px) return null;
          const { barrier } = point;
          const repaired = repairedBarrierIds.has(barrier.id);
          return (
            <div
              className="pointer-events-none absolute z-20 w-64 rounded-lg border border-border bg-surface/95 p-3 shadow-lg backdrop-blur"
              style={{
                left: Math.min(Math.max(px.x, 138), (projection?.width ?? px.x) - 138),
                top: Math.max(px.y - 24, 130),
                transform: "translate(-50%, -100%)",
              }}
            >
              <div className="flex items-start justify-between gap-3">
                <p className="text-xs font-semibold leading-snug">{barrier.label}</p>
                <span className={cn("shrink-0 text-[10px] font-semibold", repaired ? "text-unlocked" : "text-barrier")}>
                  {repaired ? "Selected" : "Blocked"}
                </span>
              </div>
              <dl className="mt-2 space-y-1 text-xs">
                <div className="flex items-baseline justify-between gap-2"><dt className="text-muted-foreground">Barrier type</dt><dd className="text-right font-medium">{barrier.kind.replaceAll("-", " ")}</dd></div>
                <div className="flex items-baseline justify-between gap-2"><dt className="text-muted-foreground">Condition</dt><dd className="font-medium capitalize">{barrier.condition}</dd></div>
                <div className="flex items-baseline justify-between gap-2"><dt className="text-muted-foreground">Estimated cost</dt><dd className="font-medium tabular-nums">${barrier.cost.toLocaleString()}</dd></div>
                <div className="flex items-baseline justify-between gap-2"><dt className="text-muted-foreground">Priority score</dt><dd className="font-medium tabular-nums">{barrier.standaloneScore}/100</dd></div>
              </dl>
              <p className="mt-2 text-[10px] text-muted-foreground/70">Illustrative, modeled data · select for details</p>
            </div>
          );
        })()}

      {!compact && (
        <p className="pointer-events-none absolute left-1/2 top-3 max-w-[92%] -translate-x-1/2 rounded-md border border-border bg-surface/90 px-2.5 py-1 text-[11px] font-medium text-muted-foreground shadow-sm backdrop-blur">
          Real {scenario.city.replace(", WA", "")} streets · barriers, costs and trip counts are synthetic and illustrative
        </p>
      )}

      <p className="sr-only" aria-live="polite">
        {statusText}
      </p>
    </div>
  );
}

export default GeoMap;
