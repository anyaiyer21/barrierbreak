import { MapPin, Route as RouteIcon, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { EvidenceBadge } from "@/components/shell/Metrics";
import ComplementarityDiagram from "@/components/inspector/ComplementarityDiagram";
import {
  destinationKindLabels,
  formatCurrency,
  formatNumber,
  getBarrier,
  getDestination,
  getOrigin,
  getRoute,
  barrierKindLabels,
} from "@/lib/scenarioEngine";
import type { DestinationKind, RepairBundle } from "@/types/scenario";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export function BundleInspector({
  bundle,
  onClose,
  onShowRoute,
  routeShown,
}: {
  bundle: RepairBundle;
  onClose: () => void;
  onShowRoute: () => void;
  routeShown: boolean;
}) {
  const repairs = bundle.repairIds.map((id) => getBarrier(id)!).filter(Boolean);
  const route = bundle.witnessRouteId ? getRoute(bundle.witnessRouteId) : undefined;
  const origin = route ? getOrigin(route.originId) : undefined;
  const destination = route ? getDestination(route.destinationId) : undefined;
  const breakdown = Object.entries(bundle.breakdown) as [DestinationKind, number][];

  return (
    <aside
      className="flex h-full min-h-0 w-full flex-col overflow-y-auto border-l bg-surface"
      aria-label={`Why ${bundle.name} was recommended`}
    >
      <header className="sticky top-0 z-10 flex items-start gap-3 border-b bg-surface/95 px-5 py-4 backdrop-blur">
        <div className="min-w-0 flex-1">
          <p className="eyebrow">Why these repairs?</p>
          <h2 className="mt-1 text-[17px] font-semibold leading-tight tracking-tight">
            {bundle.name}
          </h2>
          <p className="mt-1 text-[12px] text-muted-foreground">
            {bundle.repairIds.length} coordinated repair
            {bundle.repairIds.length > 1 ? "s" : ""}
          </p>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close inspector">
          <X className="size-4" />
        </Button>
      </header>

      <div className="space-y-6 p-5">
        <section>
          <p className="eyebrow">Locations</p>
          <ul className="mt-2 space-y-2">
            {repairs.map((r) => (
              <li key={r.id} className="flex gap-2.5 rounded-md border bg-background p-2.5">
                <MapPin className="mt-0.5 size-4 shrink-0 text-barrier" aria-hidden />
                <div className="min-w-0">
                  <p className="text-[13px] font-medium leading-snug">{r.label}</p>
                  <p className="tnum mt-0.5 text-[11px] text-muted-foreground">
                    {barrierKindLabels[r.kind]} · condition {r.condition} ·{" "}
                    {formatCurrency(r.cost)}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </section>

        <section>
          <div className="flex items-center gap-2">
            <p className="eyebrow">Investment</p>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button type="button" aria-label="About this cost">
                    <EvidenceBadge level="modeled" />
                  </button>
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  Illustrative planning cost. Actual engineering cost estimates from the city's
                  capital program will replace this.
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <p className="tnum mt-1 text-3xl font-semibold tracking-tight">
            {formatCurrency(bundle.cost)}
          </p>
          <p className="text-[11px] text-muted-foreground">modeled planning cost</p>
        </section>

        {bundle.complementarity ? (
          <section>
            <p className="eyebrow mb-2">Standalone vs joint value</p>
            <ComplementarityDiagram bundle={bundle} />
          </section>
        ) : (
          <section className="rounded-lg border bg-background p-3">
            <p className="text-[12px] leading-relaxed text-muted-foreground">
              This unlock set is a single repair: it completes a journey on its own because every
              other element of the route is already accessible in this scenario.
            </p>
          </section>
        )}

        {breakdown.length > 0 && (
          <section>
            <p className="eyebrow">What becomes reachable</p>
            <ul className="mt-2 space-y-1.5">
              {breakdown.map(([kind, value]) => (
                <li key={kind} className="flex items-center justify-between gap-3 text-[13px]">
                  <span className="flex items-center gap-2 text-muted-foreground">
                    <span
                      className="size-2 rounded-full"
                      style={{ backgroundColor: `var(--${kind === "school" ? "school" : kind})` }}
                      aria-hidden
                    />
                    {destinationKindLabels[kind]}
                  </span>
                  <span className="tnum font-medium">
                    {formatNumber(value)} household connections
                  </span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {origin && destination && (
          <section>
            <p className="eyebrow">Representative route</p>
            <p className="mt-1.5 text-[13px] leading-relaxed">
              {origin.label} → {destination.label}
            </p>
            <p className="mt-1 text-[11px] text-muted-foreground">{route?.summary}</p>
            <Button variant="outline" size="sm" className="mt-3 gap-2" onClick={onShowRoute}>
              <RouteIcon className="size-4" aria-hidden />
              {routeShown ? "Reset map view" : "Show unlocked route"}
            </Button>
          </section>
        )}

        <section>
          <p className="eyebrow">Why it was selected</p>
          <p className="mt-1.5 text-[13px] leading-relaxed text-muted-foreground">
            {bundle.rationale}
          </p>
        </section>

        <section className="rounded-lg border border-dashed p-3">
          <div className="flex items-center gap-2">
            <p className="eyebrow">Prototype evidence level</p>
            <EvidenceBadge />
          </div>
          <p className="mt-1.5 text-[12px] leading-relaxed text-muted-foreground">
            Barrier conditions and costs in this scenario are illustrative. Final analysis will use
            municipal GIS and documented cost sources.
          </p>
        </section>
      </div>
    </aside>
  );
}

export default BundleInspector;
