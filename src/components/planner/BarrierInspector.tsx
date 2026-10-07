import { Check, MapPin, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { barrierKindLabels, formatCurrency, formatNumber, scenario } from "@/lib/scenarioEngine";
import type { PairImpact } from "@/lib/graphEngine";
import type { Barrier } from "@/types/scenario";

function pedestrianUse(score: number) {
  if (score >= 75) return "High";
  if (score >= 50) return "Moderate";
  return "Lower";
}

export function BarrierInspector({
  barrier,
  gain,
  dependency,
  selected,
  onToggle,
  onClose,
}: {
  barrier: Barrier;
  gain: number;
  dependency?: PairImpact;
  selected: boolean;
  onToggle: () => void;
  onClose: () => void;
}) {
  const partnerId = dependency?.repairIds.find((id) => id !== barrier.id);
  const partner = scenario.barriers.find((item) => item.id === partnerId);
  const nearby = scenario.bundles.find((bundle) => bundle.repairIds.includes(barrier.id));

  return (
    <aside className="flex h-full min-h-0 w-full flex-col overflow-y-auto border-l bg-surface" aria-label="Individual barrier details" data-tour="barrier-inspector">
      <header className="sticky top-0 z-10 flex items-start gap-3 border-b bg-surface/95 px-5 py-4 backdrop-blur">
        <div className="min-w-0 flex-1">
          <p className="eyebrow">Individual barrier</p>
          <h2 className="mt-1 text-[17px] font-semibold leading-tight">{barrier.label}</h2>
          <p className="mt-1 text-xs text-muted-foreground">{barrierKindLabels[barrier.kind]}</p>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close barrier details"><X className="size-4" /></Button>
      </header>
      <div className="space-y-6 p-5">
        <dl className="grid grid-cols-2 gap-4">
          <div><dt className="eyebrow">Severity</dt><dd className="mt-1 text-sm font-semibold capitalize">{barrier.condition}</dd></div>
          <div><dt className="eyebrow">Pedestrian use</dt><dd className="mt-1 text-sm font-semibold">{barrier.pedestrianUse ?? pedestrianUse(barrier.standaloneScore)}</dd></div>
          <div><dt className="eyebrow">Estimated cost</dt><dd className="tnum mt-1 text-sm font-semibold">{formatCurrency(barrier.cost)}</dd></div>
          <div><dt className="eyebrow">Priority score</dt><dd className="tnum mt-1 text-sm font-semibold">{barrier.standaloneScore}/100</dd></div>
        </dl>

        <section className="rounded-md border bg-background p-4">
          <p className="eyebrow">Network gain alone</p>
          <p className="tnum mt-1 text-3xl font-semibold">+{formatNumber(gain)}</p>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">Weighted household-to-destination connections added when only this repair is applied.</p>
        </section>

        <section>
          <p className="eyebrow">Public facility proximity</p>
          <p className="mt-1.5 flex gap-2 text-sm text-muted-foreground"><MapPin className="mt-0.5 size-4 shrink-0" />{barrier.publicFacilityProximity ?? nearby?.name ?? "No modeled destination connection"}</p>
        </section>

        <section data-tour="pair-dependency">
          <p className="eyebrow">Repair dependency</p>
          {dependency && dependency.synergy > 0 && partner ? (
            <div className="mt-2 rounded-md border border-repair/30 bg-accent p-3 text-sm">
              <p className="font-medium">Works better with {partner.label}</p>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">Together they add {formatNumber(dependency.gain)} connections, including {formatNumber(dependency.synergy)} that neither explains alone.</p>
            </div>
          ) : <p className="mt-1.5 text-sm text-muted-foreground">No positive two-repair dependency was found for this barrier.</p>}
        </section>

        <Button className="w-full gap-2" variant={selected ? "outline" : "default"} onClick={onToggle}>
          <Check className="size-4" />{selected ? "Remove from plan" : "Add to repair plan"}
        </Button>
        <p className="text-xs leading-relaxed text-muted-foreground">Illustrative condition, use, cost, and impact data. This is context for planner judgment, not a recommendation.</p>
      </div>
    </aside>
  );
}
