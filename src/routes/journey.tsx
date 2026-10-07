import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ArrowRight, Check, Circle, MapPin, Route as RouteIcon } from "lucide-react";

import AppShell, { InlineLink } from "@/components/shell/AppShell";
import GeoMap from "@/components/map/GeoMap";
import MapLegend from "@/components/map/MapLegend";
import { Metric } from "@/components/shell/Metrics";
import { Button } from "@/components/ui/button";
import { leastCostJourney, networkImpact } from "@/lib/graphEngine";
import { useRepairSelection } from "@/lib/repairSelection";
import { formatCurrency, formatNumber, getBarrier, getBundle, getDestination, getOrigin, getRoute, scenario } from "@/lib/scenarioEngine";

export const Route = createFileRoute("/journey")({
  head: () => ({ meta: [
    { title: "Connect One Trip — BarrierBreak" },
    { name: "description", content: "Follow a single walking trip from blocked to connected, and see exactly which repairs it takes." },
    { property: "og:title", content: "Connect One Trip — BarrierBreak" },
    { property: "og:description", content: "Use a cost-weighted path search to identify the barriers blocking a complete pedestrian journey." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" },
  ] }), component: JourneyPage,
});

function JourneyPage() {
  const { selected, apply } = useRepairSelection();
  const [journeyId, setJourneyId] = useState(scenario.journeys[0]?.id ?? "");
  const journey = scenario.journeys.find((item) => item.id === journeyId) ?? scenario.journeys[0];
  const origin = journey ? getOrigin(journey.originId) : undefined;
  const destination = journey ? getDestination(journey.destinationId) : undefined;
  const solution = useMemo(() => origin && destination ? leastCostJourney(scenario, origin, destination, new Set()) : undefined, [origin, destination]);
  const authoredBundle = journey ? getBundle(journey.requiredBundleId) : undefined;
  const route = authoredBundle?.witnessRouteId ? getRoute(authoredBundle.witnessRouteId) : undefined;
  const required = solution?.repairIds ?? [];
  const needed = required.filter((id) => !selected.has(id));
  const completed = required.length - needed.length;
  const allApplied = needed.length === 0;
  const currentImpact = useMemo(() => networkImpact(scenario, selected), [selected]);
  const completedPlan = useMemo(() => new Set([...selected, ...needed]), [selected, needed.join(",")]);
  const completedImpact = useMemo(() => networkImpact(scenario, completedPlan), [completedPlan]);
  const currentDestinations = origin ? currentImpact.reachableByOrigin[origin.id]?.length ?? 0 : 0;
  const completedDestinations = origin ? completedImpact.reachableByOrigin[origin.id]?.length ?? 0 : 0;
  const addedConnections = completedImpact.score - currentImpact.score;
  const remainingCost = needed.reduce((sum, id) => sum + (getBarrier(id)?.cost ?? 0), 0);

  return (
    <AppShell>
      <div className="grid h-full min-h-0 grid-cols-1 lg:grid-cols-[400px_minmax(0,1fr)]">
        <aside className="min-h-0 overflow-y-auto border-r bg-sidebar p-5">
          <p className="eyebrow">Connect one trip</p><h1 className="mt-1 text-xl font-semibold">See what it takes to complete a walking route.</h1>
          <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">Choose a trip. BarrierBreak finds the lowest-cost group of repairs that connects it. Want to plan across the whole city instead? <InlineLink to="/">Open the Planner</InlineLink>.</p>
          <div className="mt-5 space-y-2">
            {scenario.journeys.map((item) => {
              const o = getOrigin(item.originId); const d = getDestination(item.destinationId); const active = item.id === journey?.id;
              return <Button key={item.id} variant={active ? "secondary" : "outline"} className="h-auto w-full justify-start whitespace-normal px-3 py-3 text-left" onClick={() => setJourneyId(item.id)}><span className="flex min-w-0 items-start gap-2"><MapPin className="mt-0.5 size-3.5 shrink-0" /><span><span className="block text-xs font-medium">{o?.label} → {d?.label}</span><span className="mt-1 block text-[11px] font-normal text-muted-foreground">{item.blockedSummary}</span></span></span></Button>;
            })}
          </div>

          <section className="mt-6 overflow-hidden rounded-md border bg-surface">
            <div className="border-b p-4">
              <div className="flex items-center justify-between gap-3"><div className="flex items-center gap-2"><RouteIcon className="size-4 text-repair" /><p className="text-xs font-semibold">{origin?.label}</p></div><ArrowRight className="size-4 text-muted-foreground" /><p className="text-right text-xs font-semibold">{destination?.label}</p></div>
              <div className="mt-4 flex items-center gap-2" aria-label={`${completed} of ${required.length} required repairs selected`}>
                {required.map((id, index) => <div key={id} className="flex flex-1 items-center gap-2"><span className={`flex size-7 shrink-0 items-center justify-center rounded-full border ${selected.has(id) ? "border-unlocked bg-unlocked text-primary-foreground" : "border-barrier text-barrier"}`}>{selected.has(id) ? <Check className="size-4" /> : <span className="tnum text-[11px] font-semibold">{index + 1}</span>}</span>{index < required.length - 1 && <span className={`h-px flex-1 ${selected.has(id) ? "bg-unlocked" : "bg-border"}`} />}</div>)}
              </div>
              <p className={`mt-3 text-sm font-semibold ${allApplied ? "text-unlocked" : "text-foreground"}`}>{allApplied ? "This walking route is connected." : `${completed} of ${required.length} repairs selected`}</p>
            </div>

            <div className="p-4">
              {needed.length ? <ul className="space-y-3">{required.map((id) => { const barrier = getBarrier(id); const done = selected.has(id); return <li key={id} className="flex items-start gap-3 text-xs"><span className={`mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border ${done ? "border-unlocked bg-unlocked text-primary-foreground" : "border-barrier text-barrier"}`}>{done ? <Check className="size-3" /> : <Circle className="size-2.5" />}</span><span className="min-w-0 flex-1"><span className={done ? "text-muted-foreground line-through" : "font-medium"}>{barrier?.label}</span><span className="tnum block text-muted-foreground">{done ? "Selected" : formatCurrency(barrier?.cost ?? 0)}</span></span></li>; })}</ul> : <p className="text-sm text-unlocked">Every required repair is already in your plan.</p>}
              <div className="mt-4 grid grid-cols-2 gap-3 border-t pt-4"><Metric label="Cost remaining" value={formatCurrency(remainingCost)} /><Metric label="Network gain" value={`+${formatNumber(addedConnections)}`} sub="after completing this trip" tone={addedConnections > 0 ? "unlocked" : "muted"} /></div>
              <Button className="mt-4 w-full gap-2" onClick={() => apply(needed)} disabled={allApplied}><Check className="size-4" />{allApplied ? "Journey connected" : `Add ${needed.length} repair${needed.length === 1 ? "" : "s"} to plan`}</Button>
            </div>
          </section>
        </aside>
        <div className="relative min-h-[520px]">
          <GeoMap phase={allApplied ? "after" : "before"} repairedBarrierIds={selected} highlightedBarrierIds={new Set(needed)} activeRouteIds={allApplied && route ? [route.id] : []} {...(!allApplied && route ? { blockedRouteId: route.id } : {})} focusNodeIds={solution?.nodeIds ?? route?.path ?? []} statusText={allApplied ? "The selected journey is reachable." : `${needed.length} additional repairs are needed at a cost of ${formatCurrency(remainingCost)}.`} />
          <MapLegend className="absolute bottom-4 left-4" />
          <div className="absolute bottom-4 right-4 max-w-[calc(100%-18rem)] rounded-lg border bg-surface/95 p-4 shadow-sm backdrop-blur"><div className="flex flex-wrap gap-x-8 gap-y-3"><Metric label="Trip status" value={allApplied ? "Connected" : "Blocked"} tone={allApplied ? "unlocked" : "default"} sub={`${completed} of ${required.length} repairs selected`} /><Metric label="Places reachable" value={`${currentDestinations} → ${completedDestinations}`} sub={`from ${origin?.label ?? "this home area"}`} /><Metric label="Cost remaining" value={formatCurrency(remainingCost)} sub="illustrative estimate" /><Metric label="Network gain" value={`+${formatNumber(addedConnections)}`} sub="weighted connections" tone={addedConnections > 0 ? "unlocked" : "muted"} /></div></div>
        </div>
      </div>
    </AppShell>
  );
}
