/**
 * Scenario engine.
 *
 * Stands in for the future BarrierBreak backend. It resolves frozen,
 * hand-authored optimization results instead of running a real optimizer, but
 * exposes the same async-friendly shape the real API will have, so swapping in
 * `fetch('/api/optimize')` later is a one-file change.
 */

import demoScenario from "@/data/demoScenario";
import redmondScenario from "@/data/redmondScenario";
import { walkPaths as sammamishWalkPaths, linkPaths as sammamishLinkPaths } from "@/data/walkPaths";
import { walkPaths as redmondWalkPaths, linkPaths as redmondLinkPaths } from "@/data/redmondWalkPaths";
import type { WalkPath, WalkPoint } from "@/data/walkPaths";
import type {
  Barrier,
  Destination,
  DestinationKind,
  NetworkLink,
  OptimizationResult,
  OriginArea,
  PlanNode,
  PriorityId,
  RepairBundle,
  Scenario,
  StrategyId,
  WitnessRoute,
} from "@/types/scenario";

export type CityId = "sammamish" | "redmond";

const cityData: Record<
  CityId,
  { scenario: Scenario; walkPaths: Record<string, WalkPath>; linkPaths: Record<string, WalkPoint[]> }
> = {
  sammamish: { scenario: demoScenario, walkPaths: sammamishWalkPaths, linkPaths: sammamishLinkPaths },
  redmond: { scenario: redmondScenario, walkPaths: redmondWalkPaths, linkPaths: redmondLinkPaths },
};

export const cities: { id: CityId; label: string }[] = [
  { id: "sammamish", label: "Sammamish, WA" },
  { id: "redmond", label: "Redmond, WA" },
];

/**
 * The active city. These are live ES module bindings: `setActiveCity` swaps
 * them, and the city provider remounts the app so every view re-reads them.
 */
export let activeCity: CityId = "sammamish";
export let scenario: Scenario = demoScenario;
export let walkPaths: Record<string, WalkPath> = sammamishWalkPaths;
export let linkPaths: Record<string, WalkPoint[]> = sammamishLinkPaths;

let nodeIndex = new Map<string, PlanNode>();
let barrierIndex = new Map<string, Barrier>();
let bundleIndex = new Map<string, RepairBundle>();
let linkIndex = new Map<string, NetworkLink>();
let routeIndex = new Map<string, WitnessRoute>();
let originIndex = new Map<string, OriginArea>();
let destinationIndex = new Map<string, Destination>();

function buildIndexes() {
  nodeIndex = new Map(scenario.nodes.map((n) => [n.id, n]));
  barrierIndex = new Map(scenario.barriers.map((b) => [b.id, b]));
  bundleIndex = new Map(scenario.bundles.map((b) => [b.id, b]));
  linkIndex = new Map(scenario.links.map((l) => [l.id, l]));
  routeIndex = new Map(scenario.routes.map((r) => [r.id, r]));
  originIndex = new Map(scenario.origins.map((o) => [o.id, o]));
  destinationIndex = new Map(scenario.destinations.map((d) => [d.id, d]));
}
buildIndexes();

export function setActiveCity(id: CityId) {
  const data = cityData[id];
  if (!data) return;
  activeCity = id;
  scenario = data.scenario;
  walkPaths = data.walkPaths;
  linkPaths = data.linkPaths;
  buildIndexes();
}

/** Geographic center of the active city's network. */
export function scenarioCenter() {
  const n = scenario.nodes.length || 1;
  return {
    lat: scenario.nodes.reduce((s, p) => s + p.lat, 0) / n,
    lng: scenario.nodes.reduce((s, p) => s + p.lng, 0) / n,
  };
}

export const getNode = (id: string) => nodeIndex.get(id);
export const getBarrier = (id: string) => barrierIndex.get(id);
export const getBundle = (id: string) => bundleIndex.get(id);
export const getLink = (id: string) => linkIndex.get(id);
export const getRoute = (id: string) => routeIndex.get(id);
export const getOrigin = (id: string) => originIndex.get(id);
export const getDestination = (id: string) => destinationIndex.get(id);

export const priorityKinds: Record<PriorityId, DestinationKind[] | null> = {
  all: null,
  transit: ["transit"],
  schools: ["school"],
  civic: ["civic"],
  parks: ["park"],
};

export const priorityLabels: Record<PriorityId, string> = {
  all: "All public destinations",
  transit: "Transit",
  schools: "Schools",
  civic: "Libraries & civic facilities",
  parks: "Parks",
};

export const strategyLabels: Record<StrategyId, string> = {
  "network-aware": "BarrierBreak — network-aware",
  individual: "Individual priority score",
  "marginal-greedy": "Marginal greedy",
};

export const strategyBlurbs: Record<StrategyId, string> = {
  "network-aware": "Evaluates combinations of repairs and the journeys they complete together.",
  individual: "Ranks each barrier on its own condition and priority score.",
  "marginal-greedy": "Adds one repair at a time, always taking the best immediate gain.",
};

/** Nearest authored budget step for an arbitrary slider value. */
export function snapBudget(value: number): number {
  return scenario.budgets.reduce((best, b) =>
    Math.abs(b - value) < Math.abs(best - value) ? b : best,
  );
}

export interface PlanRequest {
  budget: number;
  strategy: StrategyId;
  priority: PriorityId;
}

export interface Plan extends OptimizationResult {
  bundles: RepairBundle[];
  unfundedBundles: RepairBundle[];
  /** Barrier ids that this plan repairs (superset helper for map layers). */
  repairedBarrierIds: Set<string>;
  /** Connections attributable to the selected priority filter. */
  priorityConnections: number;
  priority: PriorityId;
}

function connectionsForPriority(bundles: RepairBundle[], priority: PriorityId): number {
  const kinds = priorityKinds[priority];
  return bundles.reduce((sum, b) => {
    if (!kinds) return sum + b.connections;
    return sum + kinds.reduce((s, k) => s + (b.breakdown[k] ?? 0), 0);
  }, 0);
}

/** Resolve a frozen plan. Async on purpose: the real API call replaces the body. */
export function resolvePlan({ budget, strategy, priority }: PlanRequest): Plan {
  const snapped = snapBudget(budget);
  const base = (scenario.results.find(
    (r) => r.strategy === strategy && r.budget === snapped,
  ) ?? scenario.results[0])!;

  // The priority filter re-ranks which unlock sets a planner would fund first.
  const kinds = priorityKinds[priority];
  let fundedBundleIds = base.fundedBundleIds;
  let unfundedBundleIds = base.unfundedBundleIds;

  if (kinds && strategy === "network-aware") {
    const matches = (b: RepairBundle) => kinds.some((k) => (b.breakdown[k] ?? 0) > 0);
    const ranked = [...scenario.bundles]
      .filter((b) => b.connections > 0)
      .sort((a, b) => {
        const aScore = matches(a) ? 1 : 0;
        const bScore = matches(b) ? 1 : 0;
        if (aScore !== bScore) return bScore - aScore;
        return b.connections / b.cost - a.connections / a.cost;
      });
    const funded: string[] = [];
    const unfunded: string[] = [];
    let spent = 0;
    for (const b of ranked) {
      if (spent + b.cost <= snapped) {
        funded.push(b.id);
        spent += b.cost;
      } else {
        unfunded.push(b.id);
      }
    }
    fundedBundleIds = funded;
    unfundedBundleIds = [...unfunded, "UB-05"].filter(
      (id, i, arr) => arr.indexOf(id) === i && !funded.includes(id),
    );
  }

  const bundles = fundedBundleIds.map((id) => bundleIndex.get(id)!).filter(Boolean);
  const unfundedBundles = unfundedBundleIds.map((id) => bundleIndex.get(id)!).filter(Boolean);

  const derivedFromPriority = kinds && strategy === "network-aware";
  const spend = derivedFromPriority ? bundles.reduce((s, b) => s + b.cost, 0) : base.spend;
  const connections = derivedFromPriority
    ? bundles.reduce((s, b) => s + b.connections, 0)
    : base.connections;
  const coverage = derivedFromPriority
    ? scenario.baselineCoverage + bundles.reduce((s, b) => s + b.coverageDelta, 0)
    : base.coverage;

  const repairedBarrierIds = new Set<string>(
    derivedFromPriority ? bundles.flatMap((b) => b.repairIds) : base.fundedRepairIds,
  );

  return {
    ...base,
    budget: snapped,
    fundedBundleIds,
    unfundedBundleIds,
    fundedRepairIds: [...repairedBarrierIds],
    spend,
    connections,
    coverage,
    bundles,
    unfundedBundles,
    repairedBarrierIds,
    priority,
    priorityConnections: connectionsForPriority(bundles, priority),
  };
}

/** Budget → connections curve for the impact frontier sparkline. */
export function impactFrontier(strategy: StrategyId, priority: PriorityId) {
  return scenario.budgets.map((budget) => {
    const plan = resolvePlan({ budget, strategy, priority });
    return {
      budget,
      connections: plan.connections,
      coverage: plan.coverage,
      /** Bundle that caused the jump versus the previous budget step, if any. */
      bundleIds: plan.fundedBundleIds,
    };
  });
}

/** Which unlock set explains the jump at this budget step. */
export function jumpBundleId(strategy: StrategyId, priority: PriorityId, index: number) {
  const points = impactFrontier(strategy, priority);
  if (index === 0) return points[0]?.bundleIds[0];
  const prev = new Set(points[index - 1]?.bundleIds ?? []);
  const added = (points[index]?.bundleIds ?? []).filter((id) => !prev.has(id));
  return added.sort(
    (a, b) => (bundleIndex.get(b)?.connections ?? 0) - (bundleIndex.get(a)?.connections ?? 0),
  )[0];
}

export function formatCurrency(value: number): string {
  if (value >= 1000) return `$${Math.round(value / 1000)}K`;
  return `$${value}`;
}

export function formatNumber(value: number): string {
  return value.toLocaleString("en-US");
}

export const barrierKindLabels: Record<Barrier["kind"], string> = {
  "missing-curb-ramp": "Missing curb ramp",
  "no-sidewalk": "Sidewalk gap",
  "unsignalized-crossing": "Unsignalized crossing",
  "grade-obstruction": "Grade obstruction",
};

export const destinationKindLabels: Record<DestinationKind, string> = {
  transit: "Transit",
  school: "School",
  civic: "Civic / library",
  park: "Park",
};
