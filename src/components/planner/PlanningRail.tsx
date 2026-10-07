import { Building2, Loader2, Sparkles } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { scenario, formatCurrency, priorityLabels, strategyLabels, strategyBlurbs } from "@/lib/scenarioEngine";
import type { PriorityId, StrategyId } from "@/types/scenario";
import ImpactFrontier from "@/components/planner/ImpactFrontier";

const priorities: PriorityId[] = ["all", "transit", "schools", "civic", "parks"];
const strategies: StrategyId[] = ["network-aware", "individual", "marginal-greedy"];

export function PlanningRail({
  budget,
  setBudget,
  priority,
  setPriority,
  strategy,
  setStrategy,
  onOptimize,
  running,
  hasPlan,
  onHighlightBundle,
}: {
  budget: number;
  setBudget: (v: number) => void;
  priority: PriorityId;
  setPriority: (v: PriorityId) => void;
  strategy: StrategyId;
  setStrategy: (v: StrategyId) => void;
  onOptimize: () => void;
  running: boolean;
  hasPlan: boolean;
  onHighlightBundle: (id?: string) => void;
}) {
  const budgetIndex = Math.max(0, scenario.budgets.indexOf(budget));

  return (
    <div className="flex h-full min-h-0 w-full flex-col overflow-y-auto border-r bg-sidebar">
      <div className="space-y-7 p-5">
        <section>
          <p className="eyebrow">Study area</p>
          <div className="mt-2 flex items-center gap-2.5 rounded-md border bg-surface px-3 py-2.5">
            <Building2 className="size-4 text-muted-foreground" aria-hidden />
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{scenario.city}</p>
              <p className="text-[11px] text-muted-foreground">Issaquah — coming later</p>
            </div>
          </div>
        </section>

        <section>
          <div className="flex items-baseline justify-between">
            <label htmlFor="budget" className="eyebrow">
              Budget
            </label>
            <span className="text-[11px] text-muted-foreground">illustrative program year</span>
          </div>
          <p className="tnum mt-1 text-[34px] font-semibold leading-none tracking-tight">
            {formatCurrency(budget)}
          </p>
          <Slider
            id="budget"
            className="mt-4"
            min={0}
            max={scenario.budgets.length - 1}
            step={1}
            value={[budgetIndex]}
            onValueChange={([i]) => setBudget(scenario.budgets[i ?? 0] ?? budget)}
            aria-label="Budget"
            aria-valuetext={formatCurrency(budget)}
          />
          <div className="mt-2 flex justify-between">
            {scenario.budgets.map((b) => (
              <button
                key={b}
                type="button"
                onClick={() => setBudget(b)}
                className={cn(
                  "tnum rounded px-1 py-0.5 text-[11px] transition-colors",
                  b === budget
                    ? "font-semibold text-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {formatCurrency(b)}
              </button>
            ))}
          </div>

          <div className="mt-5">
            <ImpactFrontier
              strategy={strategy}
              priority={priority}
              budget={budget}
              onSelectBudget={setBudget}
              onHighlightBundle={onHighlightBundle}
            />
          </div>
        </section>

        <section>
          <p className="eyebrow" id="priority-label">
            Prioritize access to
          </p>
          <div className="mt-2 flex flex-wrap gap-1.5" role="group" aria-labelledby="priority-label">
            {priorities.map((p) => (
              <button
                key={p}
                type="button"
                aria-pressed={priority === p}
                onClick={() => setPriority(p)}
                className={cn(
                  "rounded-md border px-2.5 py-1.5 text-[12px] transition-colors",
                  priority === p
                    ? "border-foreground/20 bg-primary text-primary-foreground"
                    : "bg-surface text-muted-foreground hover:text-foreground",
                )}
              >
                {priorityLabels[p]}
              </button>
            ))}
          </div>
        </section>

        <section>
          <p className="eyebrow" id="strategy-label">
            Planning strategy
          </p>
          <div className="mt-2 space-y-1.5" role="radiogroup" aria-labelledby="strategy-label">
            {strategies.map((s) => (
              <button
                key={s}
                type="button"
                role="radio"
                aria-checked={strategy === s}
                onClick={() => setStrategy(s)}
                className={cn(
                  "w-full rounded-md border px-3 py-2.5 text-left transition-colors",
                  strategy === s
                    ? "border-repair/50 bg-accent"
                    : "bg-surface hover:border-foreground/15",
                )}
              >
                <span className="flex items-center gap-2 text-[13px] font-medium">
                  <span
                    className={cn(
                      "grid size-3.5 shrink-0 place-items-center rounded-full border",
                      strategy === s ? "border-repair" : "border-muted-foreground/50",
                    )}
                  >
                    {strategy === s && <span className="size-1.5 rounded-full bg-repair" />}
                  </span>
                  {strategyLabels[s]}
                </span>
                <span className="mt-1 block pl-5.5 text-[11px] leading-snug text-muted-foreground">
                  {strategyBlurbs[s]}
                </span>
              </button>
            ))}
          </div>
        </section>
      </div>

      <div className="sticky bottom-0 mt-auto border-t bg-sidebar/95 p-4 backdrop-blur">
        <Button className="w-full gap-2" size="lg" onClick={onOptimize} disabled={running}>
          {running ? (
            <Loader2 className="size-4 animate-spin" aria-hidden />
          ) : (
            <Sparkles className="size-4" aria-hidden />
          )}
          {running ? "Evaluating…" : hasPlan ? "Re-run repair plan" : "Find highest-impact repair plan"}
        </Button>
        <p className="mt-2 text-center text-[11px] text-muted-foreground">
          Frozen demo results — no live optimization
        </p>
      </div>
    </div>
  );
}

export default PlanningRail;
