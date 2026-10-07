import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ArrowRight, Network, Route as RouteIcon } from "lucide-react";

import AppShell from "@/components/shell/AppShell";
import GeoMap from "@/components/map/GeoMap";
import MapLegend from "@/components/map/MapLegend";
import { Metric } from "@/components/shell/Metrics";
import { BarrierInspector } from "@/components/planner/BarrierInspector";
import { RepairSelectionPanel } from "@/components/planner/RepairSelectionPanel";
import { Button } from "@/components/ui/button";
import { networkImpact, pairImpacts, singleRepairImpacts } from "@/lib/graphEngine";
import { useRepairSelection } from "@/lib/repairSelection";
import { formatCurrency, formatNumber, scenario } from "@/lib/scenarioEngine";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "BarrierBreak — Pedestrian repair planner" },
      { name: "description", content: "Inspect barriers, try repairs, and see which complete pedestrian journeys become accessible across illustrative Sammamish and Redmond networks." },
      { property: "og:title", content: "BarrierBreak — accessibility as a network problem" },
      { property: "og:description", content: "A hands-on planning demo for comparing individual barrier evidence with complete-network impact." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Planner,
});

function Planner() {
  const { selected, toggle, apply, clear } = useRepairSelection();
  const [inspectedId, setInspectedId] = useState<string | undefined>();
  const baseline = useMemo(() => networkImpact(scenario, new Set()), []);
  const current = useMemo(() => networkImpact(scenario, selected), [selected]);
  const singles = useMemo(() => singleRepairImpacts(scenario), []);
  const pairs = useMemo(() => pairImpacts(scenario), []);
  const selectedPair = pairs.find((pair) => pair.synergy > 0 && pair.repairIds.some((id) => selected.has(id)));
  const inspectedPair = pairs.find((pair) => pair.synergy > 0 && pair.repairIds.includes(inspectedId ?? ""));
  const featuredPair = inspectedPair ?? selectedPair ?? pairs.find((pair) => pair.synergy > 0);
  const inspected = scenario.barriers.find((barrier) => barrier.id === inspectedId);
  const inspectedSingle = singles.find((barrier) => barrier.id === inspectedId);
  const dependency = pairs.find((pair) => pair.synergy > 0 && pair.repairIds.includes(inspectedId ?? ""));
  const cost = [...selected].reduce((sum, id) => sum + (scenario.barriers.find((barrier) => barrier.id === id)?.cost ?? 0), 0);
  const reachable = Object.values(current.reachableByOrigin).reduce((sum, ids) => sum + ids.length, 0);

  return (
    <AppShell>
      <div className="grid min-h-0 grid-cols-1 lg:h-full lg:grid-cols-[340px_minmax(0,1fr)]">
        <RepairSelectionPanel
          selected={selected}
          singles={singles}
          {...(featuredPair ? { featuredPair } : {})}
          onToggle={toggle}
          onInspect={setInspectedId}
          onApplyPair={apply}
          onClear={clear}
        />

        <div className="relative min-h-[520px]" data-tour="network-map">
          <div className="grid h-full min-h-0 grid-cols-1 xl:grid-cols-[minmax(0,1fr)_auto]">
            <div className="relative min-h-[520px]">
              <GeoMap
                phase="before"
                repairedBarrierIds={selected}
                {...(selected.size || inspectedId ? { highlightedBarrierIds: new Set(featuredPair?.repairIds ?? []) } : {})}
                statusText={`${selected.size} repairs selected. ${formatNumber(current.score - baseline.score)} weighted connections added.`}
                onBarrierClick={setInspectedId}
              />
              <MapLegend className="absolute bottom-4 left-4" />
              <div className="absolute inset-x-4 bottom-4 ml-64 hidden rounded-lg border bg-surface/95 p-4 shadow-sm backdrop-blur lg:block" data-tour="network-metrics">
                <div className="flex flex-wrap items-start gap-x-8 gap-y-4">
                  <Metric label="Baseline impact" value={formatNumber(baseline.score)} sub="weighted reachable connections" />
                  <Metric label="Current plan" value={formatNumber(current.score)} sub={`+${formatNumber(current.score - baseline.score)} from selected repairs`} tone={current.score > baseline.score ? "unlocked" : "muted"} />
                  <Metric label="Estimated cost" value={formatCurrency(cost)} sub={`${selected.size} repair${selected.size === 1 ? "" : "s"} selected`} />
                  <Metric label="Reachable pairs" value={formatNumber(reachable)} sub="origin-to-destination pairs" />
                  <Button asChild variant="outline" size="sm" className="ml-auto gap-2"><Link to="/journey"><RouteIcon className="size-4" />Connect one trip<ArrowRight className="size-4" /></Link></Button>
                </div>
              </div>
            </div>
            {inspected && inspectedSingle && (
              <div className="min-h-0 w-full xl:w-[380px]">
                <BarrierInspector barrier={inspected} gain={inspectedSingle.gain} {...(dependency ? { dependency } : {})} selected={selected.has(inspected.id)} onToggle={() => toggle(inspected.id)} onClose={() => setInspectedId(undefined)} />
              </div>
            )}
          </div>
          {!inspected && <div className="pointer-events-none absolute right-4 top-16 hidden max-w-64 rounded-md border bg-surface/90 p-3 text-xs text-muted-foreground shadow-sm xl:block"><Network className="mb-2 size-4 text-repair" />Select a red diamond or a barrier in the left panel to inspect its individual evidence.</div>}
        </div>
      </div>
    </AppShell>
  );
}
