import { Check, Link2, RotateCcw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { formatCurrency, formatNumber, scenario } from "@/lib/scenarioEngine";
import type { PairImpact, RepairImpact } from "@/lib/graphEngine";

export function RepairSelectionPanel({
  selected,
  singles,
  featuredPair,
  onToggle,
  onInspect,
  onApplyPair,
  onClear,
}: {
  selected: Set<string>;
  singles: RepairImpact[];
  featuredPair?: PairImpact;
  onToggle: (id: string) => void;
  onInspect: (id: string) => void;
  onApplyPair: (ids: [string, string]) => void;
  onClear: () => void;
}) {
  const visible = [...singles].sort((a, b) => b.standaloneScore - a.standaloneScore);
  const repairNames = (ids: string[]) => ids.map((id) => scenario.barriers.find((barrier) => barrier.id === id)?.label).filter(Boolean).join(" + ");
  const relatedIds = new Set(featuredPair?.repairIds ?? []);
  const selectedRepairs = visible.filter((barrier) => selected.has(barrier.id));
  const relatedRepairs = visible.filter((barrier) => !selected.has(barrier.id) && relatedIds.has(barrier.id));
  const otherRepairs = visible.filter((barrier) => !selected.has(barrier.id) && !relatedIds.has(barrier.id));

  const RepairRow = ({ barrier, related = false }: { barrier: RepairImpact; related?: boolean }) => (
    <div className={cn("flex items-start gap-3 rounded-md border bg-surface p-3 transition-colors", selected.has(barrier.id) && "border-repair bg-accent", related && "border-repair/50 bg-accent/60")}>
      <Checkbox checked={selected.has(barrier.id)} onCheckedChange={() => onToggle(barrier.id)} aria-label={`Select ${barrier.label}`} className="mt-0.5" />
      <button type="button" onClick={() => onInspect(barrier.id)} className="min-w-0 flex-1 text-left">
        <span className="flex items-start justify-between gap-2 text-xs font-medium leading-snug"><span>{barrier.label}</span>{related && <Link2 className="size-3.5 shrink-0 text-repair" aria-label="Related repair" />}</span>
        <span className="tnum mt-1 block text-[11px] text-muted-foreground">{formatCurrency(barrier.cost)} · adds {formatNumber(barrier.gain)} connections alone</span>
      </button>
    </div>
  );
  return (
    <div className="flex min-h-0 max-h-[560px] flex-col border-r bg-sidebar lg:h-full lg:max-h-none" data-tour="repair-list">
      <div className="min-h-0 flex-1 overflow-y-auto p-5">
        <p className="eyebrow">Build a repair plan</p>
        <h1 className="mt-1 text-xl font-semibold">Some barriers only help when fixed together.</h1>
        <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">Select repairs to see their combined effect across the walking network.</p>

        <section className="mt-5 rounded-md border bg-surface p-3" aria-live="polite">
          <div className="flex items-center justify-between gap-3"><p className="text-xs font-semibold">Your repair plan</p><span className="tnum text-xs text-muted-foreground">{selected.size} selected</span></div>
          {selectedRepairs.length ? <div className="mt-3 space-y-2">{selectedRepairs.map((barrier) => <RepairRow key={barrier.id} barrier={barrier} />)}</div> : <p className="mt-2 text-xs leading-relaxed text-muted-foreground">Choose a barrier below. Related repairs will move beside it.</p>}
        </section>

        {featuredPair && (
          <section className="mt-4 rounded-md border border-repair/40 bg-accent p-3" data-tour="opportunity">
            <div className="flex gap-2"><Link2 className="mt-0.5 size-4 shrink-0 text-repair" /><div><p className="text-xs font-semibold">These repairs work together</p><p className="mt-1 text-[11px] leading-snug text-muted-foreground">{repairNames(featuredPair.repairIds)}</p><p className="tnum mt-1 text-[11px] font-medium text-accent-foreground">Together: +{formatNumber(featuredPair.gain)} connections</p><p className="mt-1 text-[11px] leading-snug text-muted-foreground">That is {formatNumber(featuredPair.synergy)} more than their separate results combined.</p></div></div>
            <Button variant="outline" size="sm" className="mt-3 w-full gap-2" onClick={() => onApplyPair(featuredPair.repairIds)}><Check className="size-3.5" />Select both repairs</Button>
          </section>
        )}

        {relatedRepairs.length > 0 && <section className="mt-5"><div className="mb-2 flex items-center gap-2"><Link2 className="size-3.5 text-repair" /><p className="eyebrow">{selected.size ? "Works with your selection" : "Suggested starting pair"}</p></div><div className="space-y-2">{relatedRepairs.map((barrier) => <RepairRow key={barrier.id} barrier={barrier} related />)}</div></section>}
        <section className="mt-5"><p className="eyebrow mb-2">{selected.size ? "Other barriers" : "All barriers"}</p><div className="space-y-2">{otherRepairs.map((barrier) => <RepairRow key={barrier.id} barrier={barrier} />)}</div></section>
      </div>
      <div className="border-t bg-sidebar/95 p-4"><Button variant="outline" className="w-full gap-2" onClick={onClear} disabled={!selected.size}><RotateCcw className="size-4" />Clear repair plan</Button></div>
    </div>
  );
}
