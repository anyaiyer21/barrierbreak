/**
 * Typed scenario models for the BarrierBreak prototype.
 *
 * These shapes intentionally mirror what a real BarrierBreak API would return
 * so the frozen demo data in `src/data/demoScenario.ts` can later be replaced
 * by live optimizer output without touching the UI layer.
 */

export type DestinationKind = "transit" | "school" | "civic" | "park";

export type EvidenceStatus = "illustrative" | "modeled" | "documented";

export type StrategyId = "network-aware" | "individual" | "marginal-greedy";

export type PriorityId = "all" | "transit" | "schools" | "civic" | "parks";

/**
 * A point in the scenario. `x`/`y` are the schematic planning plane retained for
 * the abstract diagrams; `lat`/`lng` are real Sammamish coordinates used by the
 * geographic map.
 */
export interface PlanNode {
  id: string;
  x: number;
  y: number;
  lat: number;
  lng: number;
  /** Human label used for screen-reader text and route descriptions. */
  label?: string;
}

/** A pedestrian network link between two nodes. */
export interface NetworkLink {
  id: string;
  from: string;
  to: string;
  /** When set, this link is currently not accessible because of this barrier. */
  barrierId?: string;
  /** Explicit accessibility flag for imported municipal network data. */
  accessible?: boolean;
  /** Segment length in meters when supplied by the source network. */
  length?: number;
  /** Street or path name shown in inspectors. */
  street?: string;
}

export interface Barrier {
  id: string;
  linkId: string;
  label: string;
  kind: "missing-curb-ramp" | "no-sidewalk" | "unsignalized-crossing" | "grade-obstruction";
  condition: "poor" | "fair" | "unknown";
  /** Illustrative planning cost in USD. */
  cost: number;
  /** Classic facility-by-facility priority score, 0-100. Illustrative. */
  standaloneScore: number;
  /** Modeled accessible connections unlocked by this repair on its own. */
  standaloneConnections: number;
  /** Optional source-defined pedestrian-use category or count. */
  pedestrianUse?: string | number;
  /** Optional distance or plain-language relationship to a public facility. */
  publicFacilityProximity?: string | number;
  evidence: EvidenceStatus;
}

export interface OriginArea {
  id: string;
  label: string;
  nodeId: string;
  x: number;
  y: number;
  /** Illustrative household count used only for modeled connection counts. */
  households: number;
}

export interface Destination {
  id: string;
  label: string;
  kind: DestinationKind;
  nodeId: string;
  x: number;
  y: number;
}

export interface WitnessRoute {
  id: string;
  originId: string;
  destinationId: string;
  /** Ordered node ids describing the unlocked walking route. */
  path: string[];
  /** Node id where the route stops when only part of the bundle is repaired. */
  blockedAt?: string;
  summary: string;
}

export interface RepairBundle {
  id: string;
  name: string;
  repairIds: string[];
  cost: number;
  /** Modeled accessible connections unlocked when the whole bundle is funded. */
  connections: number;
  /** Breakdown of `connections` by destination kind. */
  breakdown: Partial<Record<DestinationKind, number>>;
  /** Coverage points added to modeled accessible coverage. */
  coverageDelta: number;
  witnessRouteId?: string;
  /** One deterministic sentence explaining the selection. Never AI-generated at runtime. */
  rationale: string;
  /** Set when the bundle only pays off if every repair in it is funded. */
  complementarity?: {
    /** Per-repair standalone result, in bundle order. */
    standalone: { repairId: string; connections: number; stopsAt: string }[];
    sentence: string;
  };
  evidence: EvidenceStatus;
}

export interface OptimizationResult {
  strategy: StrategyId;
  budget: number;
  /** Bundles fully funded by this plan. */
  fundedBundleIds: string[];
  /** Individual repairs funded (used by non-network strategies). */
  fundedRepairIds: string[];
  /** Bundles evaluated but not affordable. */
  unfundedBundleIds: string[];
  spend: number;
  connections: number;
  coverage: number;
  note?: string;
}

export interface CityPlan {
  id: string;
  label: string;
  caveat: string;
  investment: number;
  repairs: number;
  connections: number;
  byKind: Record<"transit" | "civic" | "parksSchools", number>;
  fundedRepairIds: string[];
}

export interface Journey {
  id: string;
  originId: string;
  destinationId: string;
  /** Bundle that must be funded before the journey becomes possible. */
  requiredBundleId: string;
  blockedSummary: string;
  unlockedSummary: string;
}

export interface Scenario {
  id: string;
  city: string;
  label: string;
  baselineCoverage: number;
  totalModeledTrips: number;
  nodes: PlanNode[];
  links: NetworkLink[];
  barriers: Barrier[];
  origins: OriginArea[];
  destinations: Destination[];
  bundles: RepairBundle[];
  routes: WitnessRoute[];
  journeys: Journey[];
  budgets: number[];
  results: OptimizationResult[];
  comparison: { budgetLabel: string; plans: CityPlan[] };
}
