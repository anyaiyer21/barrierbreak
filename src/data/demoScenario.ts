/**
 * Frozen demo scenario for the BarrierBreak city-official prototype.
 *
 * EVERYTHING HERE IS SYNTHETIC. Place names around Sammamish, WA are real, but
 * barrier ids, conditions, costs, household counts and unlocked-trip counts are
 * illustrative and hand-designed to demonstrate the product concept.
 *
 * The network is laid out in a local planning plane (0..1200 x 0..820) rather
 * than lat/lng: the prototype's map is a schematic pedestrian-network canvas,
 * and the geometry is the part that gets replaced by municipal GIS later.
 */

import type { Scenario, NetworkLink, PlanNode } from "@/types/scenario";

const V = { v1: 180, v2: 400, v3: 600, v4: 820, v5: 1020 };
const H = { h1: 140, h2: 300, h3: 480, h4: 660 };

const streetsV = {
  v1: "212th Ave SE",
  v2: "218th Ave SE",
  v3: "228th Ave SE",
  v4: "240th Ave SE",
  v5: "244th Ave SE",
};
const streetsH = {
  h1: "SE 4th St",
  h2: "SE 8th St",
  h3: "SE 20th St",
  h4: "SE 24th St",
};

/**
 * Real coordinates.
 *
 * Every intersection below was geocoded from its real street address in
 * Sammamish, WA, so the network sits on the actual road grid.
 */
const gridLatLng: Record<string, { lat: number; lng: number }> = {
  v1h1: { lat: 47.60558, lng: -122.05729 },
  v1h2: { lat: 47.60194, lng: -122.05713 },
  v1h3: { lat: 47.59202, lng: -122.05693 },
  v1h4: { lat: 47.5884, lng: -122.05687 },
  v2h1: { lat: 47.6051, lng: -122.04903 },
  v2h2: { lat: 47.60189, lng: -122.049 },
  v2h3: { lat: 47.59186, lng: -122.04747 },
  v2h4: { lat: 47.5884, lng: -122.0488 },
  v3h1: { lat: 47.6055, lng: -122.03542 },
  v3h2: { lat: 47.60199, lng: -122.03546 },
  v3h3: { lat: 47.59176, lng: -122.03552 },
  v3h4: { lat: 47.58823, lng: -122.03555 },
  v4h1: { lat: 47.60538, lng: -122.01866 },
  v4h2: { lat: 47.60163, lng: -122.01946 },
  v4h3: { lat: 47.5912, lng: -122.01867 },
  v4h4: { lat: 47.5881, lng: -122.01867 },
  v5h1: { lat: 47.60489, lng: -122.01403 },
  v5h2: { lat: 47.60297, lng: -122.0138 },
  v5h3: { lat: 47.59119, lng: -122.01407 },
  v5h4: { lat: 47.58803, lng: -122.01407 },
};

const gridNodes: PlanNode[] = [];
(Object.keys(V) as (keyof typeof V)[]).forEach((v) => {
  (Object.keys(H) as (keyof typeof H)[]).forEach((h) => {
    gridNodes.push({
      id: `${v}${h}`,
      x: V[v],
      y: H[h],
      lat: gridLatLng[`${v}${h}`]!.lat,
      lng: gridLatLng[`${v}${h}`]!.lng,
      label: `${streetsV[v]} & ${streetsH[h]}`,
    });
  });
});

const stubNodes: PlanNode[] = [
  // Real Sammamish destinations, geocoded from their street addresses.
  { id: "s_lib", x: 560, y: 300, lat: 47.60059, lng: -122.03703, label: "Sammamish Library" },
  { id: "s_commons", x: 470, y: 250, lat: 47.60234, lng: -122.04059, label: "Sammamish Commons" },
  { id: "s_hs", x: 700, y: 250, lat: 47.60011, lng: -122.03231, label: "Skyline High School" },
  {
    id: "s_elem",
    x: 640,
    y: 620,
    lat: 47.58934,
    lng: -122.03487,
    label: "Discovery Elementary School",
  },
  {
    id: "s_pine_a",
    x: 330,
    y: 690,
    lat: 47.587,
    lng: -122.042,
    label: "Pine Lake Park north entry",
  },
  { id: "s_pine_b", x: 420, y: 720, lat: 47.58747, lng: -122.03899, label: "Pine Lake Park" },
  { id: "s_beaver", x: 1090, y: 740, lat: 47.58631, lng: -122.0139, label: "Beaver Lake Park" },
];

/** link helper: `l(from, to, street, barrierId?)` */
function l(from: string, to: string, street: string, barrierId?: string): NetworkLink {
  return { id: `${from}-${to}`, from, to, street, ...(barrierId ? { barrierId } : {}) };
}

export const links: NetworkLink[] = [
  // vertical corridors
  l("v1h1", "v1h2", streetsV.v1),
  l("v1h2", "v1h3", streetsV.v1, "BR-19"),
  l("v1h3", "v1h4", streetsV.v1, "BR-10"),

  l("v2h1", "v2h2", streetsV.v2, "BR-05"),
  l("v2h2", "v2h3", streetsV.v2, "BR-20"),
  l("v2h3", "v2h4", streetsV.v2),

  l("v3h1", "v3h2", streetsV.v3),
  l("v3h2", "v3h3", streetsV.v3, "BR-02"), // Repair B
  l("v3h3", "v3h4", streetsV.v3, "BR-01"), // Repair A

  l("v4h1", "v4h2", streetsV.v4, "BR-11"),
  l("v4h2", "v4h3", streetsV.v4, "BR-12"),
  l("v4h3", "v4h4", streetsV.v4),

  l("v5h1", "v5h2", streetsV.v5),
  l("v5h2", "v5h3", streetsV.v5, "BR-13"),
  l("v5h3", "v5h4", streetsV.v5, "BR-14"),

  // cross streets
  l("v1h1", "v2h1", streetsH.h1),
  l("v2h1", "v3h1", streetsH.h1),
  l("v3h1", "v4h1", streetsH.h1, "BR-15"),
  l("v4h1", "v5h1", streetsH.h1),

  l("v1h2", "v2h2", streetsH.h2, "BR-16"),
  l("v2h2", "v3h2", streetsH.h2),
  l("v3h2", "v4h2", streetsH.h2),
  l("v4h2", "v5h2", streetsH.h2),

  l("v1h3", "v2h3", streetsH.h3),
  l("v2h3", "v3h3", streetsH.h3, "BR-06"),
  l("v3h3", "v4h3", streetsH.h3, "BR-21"),
  l("v4h3", "v5h3", streetsH.h3, "BR-17"),

  l("v1h4", "v2h4", streetsH.h4, "BR-18"),
  l("v2h4", "v3h4", streetsH.h4),
  l("v3h4", "v4h4", streetsH.h4),
  l("v4h4", "v5h4", streetsH.h4),

  // destination approaches
  l("v3h2", "s_lib", "Library approach path", "BR-07"),
  l("v3h2", "s_commons", "Sammamish Commons walkway"),
  l("v3h2", "s_hs", "Skyline campus approach"),
  l("v3h4", "s_elem", "Discovery Elementary walkway"),
  l("v2h4", "s_pine_a", "Pine Lake connector", "BR-08"),
  l("s_pine_a", "s_pine_b", "Pine Lake Park entry", "BR-09"),
  l("v5h4", "s_beaver", "Beaver Lake Park entry"),
];

export const demoScenario: Scenario = {
  id: "sammamish-fy2026-illustrative",
  city: "Sammamish, WA",
  label: "Illustrative FY2026 scenario",
  baselineCoverage: 61,
  totalModeledTrips: 3120,
  nodes: [...gridNodes, ...stubNodes],
  links,

  barriers: [
    {
      id: "BR-01",
      linkId: "v3h3-v3h4",
      label: "228th Ave SE at SE 20th St — crossing",
      kind: "unsignalized-crossing",
      condition: "poor",
      cost: 86000,
      standaloneScore: 71,
      standaloneConnections: 0,
      evidence: "illustrative",
    },
    {
      id: "BR-02",
      linkId: "v3h2-v3h3",
      label: "228th Ave SE at SE 8th St — curb ramps",
      kind: "missing-curb-ramp",
      condition: "poor",
      cost: 76000,
      standaloneScore: 63,
      standaloneConnections: 0,
      evidence: "illustrative",
    },
    {
      id: "BR-05",
      linkId: "v2h1-v2h2",
      label: "218th Ave SE — sidewalk gap north of SE 8th",
      kind: "no-sidewalk",
      condition: "fair",
      cost: 120000,
      standaloneScore: 40,
      standaloneConnections: 0,
      evidence: "illustrative",
    },
    {
      id: "BR-06",
      linkId: "v2h3-v3h3",
      label: "SE 20th St — driveway grade obstruction",
      kind: "grade-obstruction",
      condition: "fair",
      cost: 64000,
      standaloneScore: 44,
      standaloneConnections: 0,
      evidence: "illustrative",
    },
    {
      id: "BR-07",
      linkId: "v3h2-s_lib",
      label: "Sammamish Library approach — missing curb ramp pair",
      kind: "missing-curb-ramp",
      condition: "poor",
      cost: 48000,
      standaloneScore: 81,
      standaloneConnections: 214,
      evidence: "illustrative",
    },
    {
      id: "BR-08",
      linkId: "v2h4-s_pine_a",
      label: "Pine Lake connector — sidewalk gap",
      kind: "no-sidewalk",
      condition: "fair",
      cost: 44000,
      standaloneScore: 55,
      standaloneConnections: 0,
      evidence: "illustrative",
    },
    {
      id: "BR-09",
      linkId: "s_pine_a-s_pine_b",
      label: "Pine Lake Park entry — non-compliant path grade",
      kind: "grade-obstruction",
      condition: "poor",
      cost: 44000,
      standaloneScore: 52,
      standaloneConnections: 0,
      evidence: "illustrative",
    },
    {
      id: "BR-10",
      linkId: "v1h3-v1h4",
      label: "212th Ave SE — shoulder walking south of SE 20th",
      kind: "no-sidewalk",
      condition: "poor",
      cost: 154000,
      standaloneScore: 38,
      standaloneConnections: 0,
      evidence: "illustrative",
    },
    {
      id: "BR-11",
      linkId: "v4h1-v4h2",
      label: "240th Ave SE — missing ramps at school walk",
      kind: "missing-curb-ramp",
      condition: "fair",
      cost: 58000,
      standaloneScore: 46,
      standaloneConnections: 0,
      evidence: "illustrative",
    },
    {
      id: "BR-12",
      linkId: "v4h2-v4h3",
      label: "240th Ave SE — culvert crossing",
      kind: "grade-obstruction",
      condition: "unknown",
      cost: 190000,
      standaloneScore: 33,
      standaloneConnections: 0,
      evidence: "illustrative",
    },
    {
      id: "BR-13",
      linkId: "v5h2-v5h3",
      label: "244th Ave SE — north segment sidewalk gap",
      kind: "no-sidewalk",
      condition: "poor",
      cost: 132000,
      standaloneScore: 66,
      standaloneConnections: 0,
      evidence: "illustrative",
    },
    {
      id: "BR-14",
      linkId: "v5h3-v5h4",
      label: "244th Ave SE — south segment sidewalk gap",
      kind: "no-sidewalk",
      condition: "poor",
      cost: 116000,
      standaloneScore: 48,
      standaloneConnections: 0,
      evidence: "illustrative",
    },
    {
      id: "BR-15",
      linkId: "v3h1-v4h1",
      label: "SE 4th St — unsignalized crossing",
      kind: "unsignalized-crossing",
      condition: "fair",
      cost: 92000,
      standaloneScore: 51,
      standaloneConnections: 0,
      evidence: "illustrative",
    },
    {
      id: "BR-16",
      linkId: "v1h2-v2h2",
      label: "SE 8th St — sidewalk gap west of 218th Ave SE",
      kind: "no-sidewalk",
      condition: "fair",
      cost: 96000,
      standaloneScore: 74,
      standaloneConnections: 176,
      evidence: "illustrative",
    },
    {
      id: "BR-17",
      linkId: "v4h3-v5h3",
      label: "SE 20th St — trail landing crossing",
      kind: "unsignalized-crossing",
      condition: "poor",
      cost: 74000,
      standaloneScore: 92,
      standaloneConnections: 0,
      evidence: "illustrative",
    },
    {
      id: "BR-18",
      linkId: "v1h4-v2h4",
      label: "SE 24th St — shoulder walking west of 218th",
      kind: "no-sidewalk",
      condition: "fair",
      cost: 138000,
      standaloneScore: 29,
      standaloneConnections: 0,
      evidence: "illustrative",
    },
    {
      id: "BR-19",
      linkId: "v1h2-v1h3",
      label: "212th Ave SE — ditch section",
      kind: "no-sidewalk",
      condition: "poor",
      cost: 210000,
      standaloneScore: 57,
      standaloneConnections: 0,
      evidence: "illustrative",
    },
    {
      id: "BR-20",
      linkId: "v2h2-v2h3",
      label: "218th Ave SE — steep non-compliant walk",
      kind: "grade-obstruction",
      condition: "poor",
      cost: 245000,
      standaloneScore: 43,
      standaloneConnections: 0,
      evidence: "illustrative",
    },
    {
      id: "BR-21",
      linkId: "v3h3-v4h3",
      label: "SE 20th St — bridge approach without walkway",
      kind: "no-sidewalk",
      condition: "unknown",
      cost: 268000,
      standaloneScore: 35,
      standaloneConnections: 0,
      evidence: "illustrative",
    },
  ],

  origins: [
    {
      id: "O1",
      label: "SE Sammamish — 228th Ave SE at SE 24th St",
      nodeId: "v3h4",
      x: 690,
      y: 726,
      households: 286,
    },
    {
      id: "O2",
      label: "244th Ave SE at SE 8th St",
      nodeId: "v5h2",
      x: 1090,
      y: 320,
      households: 168,
    },
    { id: "O3", label: "Pine Lake ridge — 218th Ave SE", nodeId: "v2h3", x: 330, y: 556, households: 204 },
    { id: "O4", label: "Beaver Lake bench — 240th Ave SE", nodeId: "v4h3", x: 880, y: 552, households: 142 },
    { id: "O5", label: "Inglewood Hill north — 212th Ave SE", nodeId: "v1h1", x: 120, y: 68, households: 176 },
    {
      id: "O6",
      label: "SE 8th St at 218th Ave SE",
      nodeId: "v2h2",
      x: 400,
      y: 300,
      households: 214,
    },
  ],

  destinations: [
    {
      id: "D_TRANSIT",
      label: "228th Ave SE & SE 4th St transit stop",
      kind: "transit",
      nodeId: "v3h1",
      x: 600,
      y: 140,
    },
    { id: "D_LIBRARY", label: "Sammamish Library", kind: "civic", nodeId: "s_lib", x: 560, y: 300 },
    {
      id: "D_COMMONS",
      label: "Sammamish Commons",
      kind: "civic",
      nodeId: "s_commons",
      x: 470,
      y: 250,
    },
    { id: "D_HS", label: "Skyline High School", kind: "school", nodeId: "s_hs", x: 700, y: 250 },
    {
      id: "D_ELEM",
      label: "Discovery Elementary School",
      kind: "school",
      nodeId: "s_elem",
      x: 640,
      y: 620,
    },
    { id: "D_PINE", label: "Pine Lake Park", kind: "park", nodeId: "s_pine_b", x: 420, y: 720 },
    { id: "D_BEAVER", label: "Beaver Lake Park", kind: "park", nodeId: "s_beaver", x: 1090, y: 740 },
  ],

  routes: [
    {
      id: "R_TRANSIT",
      originId: "O1",
      destinationId: "D_TRANSIT",
      path: ["v3h4", "v3h3", "v3h2", "v3h1"],
      blockedAt: "v3h3",
      summary:
        "228th Ave SE at SE 24th St → 228th Ave SE → SE 8th St crossing → SE 4th St transit stop",
    },
    {
      id: "R_LIBRARY",
      originId: "O6",
      destinationId: "D_LIBRARY",
      path: ["v2h2", "v3h2", "s_lib"],
      summary: "SE 8th St at 218th Ave SE → 228th Ave SE → Sammamish Library",
    },
    {
      id: "R_PINE",
      originId: "O3",
      destinationId: "D_PINE",
      path: ["v2h3", "v2h4", "s_pine_a", "s_pine_b"],
      blockedAt: "s_pine_a",
      summary: "Pine Lake ridge → 218th Ave SE → Pine Lake Park north entry",
    },
    {
      id: "R_BEAVER",
      originId: "O2",
      destinationId: "D_BEAVER",
      path: ["v5h2", "v5h3", "v5h4", "s_beaver"],
      blockedAt: "v5h3",
      summary: "244th Ave SE at SE 8th St → 244th Ave SE → Beaver Lake Park",
    },
    {
      id: "R_HS",
      originId: "O5",
      destinationId: "D_HS",
      path: ["v1h1", "v1h2", "v2h2", "v3h2", "s_hs"],
      blockedAt: "v1h2",
      summary: "Inglewood Hill north → SE 8th St → 228th Ave SE → Skyline High School",
    },
  ],

  bundles: [
    {
      id: "UB-01",
      name: "Unlock Set 01 — 228th Ave SE corridor",
      repairIds: ["BR-01", "BR-02"],
      cost: 162000,
      connections: 418,
      breakdown: { transit: 286, civic: 92, park: 40 },
      coverageDelta: 8,
      witnessRouteId: "R_TRANSIT",
      rationale:
        "Both crossings sit on the only continuous walking corridor between the SE Sammamish residential area and the transit corridor. Neither repair completes a connection on its own.",
      complementarity: {
        standalone: [
          { repairId: "BR-01", connections: 0, stopsAt: "v3h3" },
          { repairId: "BR-02", connections: 0, stopsAt: "v3h3" },
        ],
        sentence:
          "Both barriers must be removed before this neighborhood has a complete accessible connection to the transit corridor.",
      },
      evidence: "illustrative",
    },
    {
      id: "UB-02",
      name: "Unlock Set 02 — Library approach",
      repairIds: ["BR-07"],
      cost: 48000,
      connections: 214,
      breakdown: { civic: 214 },
      coverageDelta: 3,
      witnessRouteId: "R_LIBRARY",
      rationale:
        "A single ramp pair is the last blocked element on an otherwise continuous route from Pine Lake ridge to the library. High standalone value and low cost.",
      evidence: "illustrative",
    },
    {
      id: "UB-03",
      name: "Unlock Set 03 — Pine Lake Park entry pair",
      repairIds: ["BR-08", "BR-09"],
      cost: 88000,
      connections: 168,
      breakdown: { park: 168 },
      coverageDelta: 5,
      witnessRouteId: "R_PINE",
      rationale:
        "The connector and the park entry sit in series. Each scores modestly on its own, but together they open the park to two residential areas.",
      complementarity: {
        standalone: [
          { repairId: "BR-08", connections: 0, stopsAt: "s_pine_a" },
          { repairId: "BR-09", connections: 0, stopsAt: "s_pine_a" },
        ],
        sentence:
          "The connector ends at a park entry that is still non-compliant, so the pair only pays off when both are funded.",
      },
      evidence: "illustrative",
    },
    {
      id: "UB-04",
      name: "Unlock Set 04 — 244th Ave SE spine",
      repairIds: ["BR-13", "BR-14"],
      cost: 248000,
      connections: 305,
      breakdown: { park: 305 },
      coverageDelta: 8,
      witnessRouteId: "R_BEAVER",
      rationale:
        "An expensive two-segment bottleneck on 244th Ave SE. It is the only way the eastern neighborhoods reach Beaver Lake Park in this scenario.",
      evidence: "illustrative",
    },
    {
      id: "UB-05",
      name: "Unlock Set 05 — SE 20th St crossing at 244th",
      repairIds: ["BR-17"],
      cost: 74000,
      connections: 0,
      breakdown: {},
      coverageDelta: 0,
      rationale:
        "Ranks first on a facility-by-facility priority score, but the segments on both sides of it remain blocked, so it completes no journey until the 244th Ave SE spine is also funded.",
      evidence: "illustrative",
    },
    {
      id: "UB-06",
      name: "Unlock Set 06 — SE 8th St west gap",
      repairIds: ["BR-16"],
      cost: 96000,
      connections: 176,
      breakdown: { school: 176 },
      coverageDelta: 4,
      witnessRouteId: "R_HS",
      rationale:
        "One sidewalk gap on SE 8th St separates the Inglewood Hill neighborhood from Skyline High School.",
      evidence: "illustrative",
    },
  ],

  journeys: [
    {
      id: "J1",
      originId: "O1",
      destinationId: "D_TRANSIT",
      requiredBundleId: "UB-01",
      blockedSummary:
        "No continuous accessible route in this illustrative scenario. Two crossings on 228th Ave SE interrupt the corridor.",
      unlockedSummary:
        "A continuous accessible route exists once both 228th Ave SE crossings are addressed.",
    },
    {
      id: "J2",
      originId: "O3",
      destinationId: "D_PINE",
      requiredBundleId: "UB-03",
      blockedSummary:
        "The connector to the park and the park entry itself are both non-compliant in this illustrative scenario.",
      unlockedSummary:
        "Pine Lake Park becomes reachable once the connector and entry are both addressed.",
    },
    {
      id: "J3",
      originId: "O6",
      destinationId: "D_LIBRARY",
      requiredBundleId: "UB-02",
      blockedSummary: "A single missing ramp pair interrupts an otherwise continuous route.",
      unlockedSummary: "One ramp pair completes the route to Sammamish Library.",
    },
    {
      id: "J4",
      originId: "O5",
      destinationId: "D_HS",
      requiredBundleId: "UB-06",
      blockedSummary: "A sidewalk gap on SE 8th St west of 218th Ave SE interrupts the route.",
      unlockedSummary: "Closing the SE 8th St gap completes the route to Skyline High School.",
    },
    {
      id: "J5",
      originId: "O2",
      destinationId: "D_BEAVER",
      requiredBundleId: "UB-04",
      blockedSummary: "Two consecutive sidewalk gaps on 244th Ave SE interrupt the route.",
      unlockedSummary: "Both 244th Ave SE segments must be built before the park is reachable.",
    },
  ],

  budgets: [100000, 200000, 300000, 400000, 500000, 650000],

  results: [
    // --- BarrierBreak, network-aware ---
    {
      strategy: "network-aware",
      budget: 100000,
      fundedBundleIds: ["UB-02"],
      fundedRepairIds: ["BR-07"],
      unfundedBundleIds: ["UB-03", "UB-01", "UB-06", "UB-04", "UB-05"],
      spend: 48000,
      connections: 214,
      coverage: 64,
      note: "No other unlock set fits inside the remaining $52K.",
    },
    {
      strategy: "network-aware",
      budget: 200000,
      fundedBundleIds: ["UB-01"],
      fundedRepairIds: ["BR-01", "BR-02"],
      unfundedBundleIds: ["UB-02", "UB-03", "UB-06", "UB-04", "UB-05"],
      spend: 162000,
      connections: 418,
      coverage: 69,
      note: "The corridor pair becomes affordable and outperforms three cheaper repairs combined.",
    },
    {
      strategy: "network-aware",
      budget: 300000,
      fundedBundleIds: ["UB-01", "UB-02", "UB-03"],
      fundedRepairIds: ["BR-01", "BR-02", "BR-07", "BR-08", "BR-09"],
      unfundedBundleIds: ["UB-06", "UB-04", "UB-05"],
      spend: 298000,
      connections: 800,
      coverage: 74,
    },
    {
      strategy: "network-aware",
      budget: 400000,
      fundedBundleIds: ["UB-01", "UB-02", "UB-03", "UB-06"],
      fundedRepairIds: ["BR-01", "BR-02", "BR-07", "BR-08", "BR-09", "BR-16"],
      unfundedBundleIds: ["UB-04", "UB-05"],
      spend: 394000,
      connections: 976,
      coverage: 78,
    },
    {
      strategy: "network-aware",
      budget: 500000,
      fundedBundleIds: ["UB-01", "UB-02", "UB-03", "UB-06"],
      fundedRepairIds: ["BR-01", "BR-02", "BR-07", "BR-08", "BR-09", "BR-16"],
      unfundedBundleIds: ["UB-04", "UB-05"],
      spend: 394000,
      connections: 976,
      coverage: 78,
      note: "A plateau: the next useful unlock set costs $248K, so $500K buys nothing beyond $400K.",
    },
    {
      strategy: "network-aware",
      budget: 650000,
      fundedBundleIds: ["UB-01", "UB-02", "UB-03", "UB-06", "UB-04"],
      fundedRepairIds: [
        "BR-01",
        "BR-02",
        "BR-07",
        "BR-08",
        "BR-09",
        "BR-16",
        "BR-13",
        "BR-14",
      ],
      unfundedBundleIds: ["UB-05"],
      spend: 642000,
      connections: 1281,
      coverage: 86,
      note: "The 244th Ave SE spine finally fits, adding school and park access for the south.",
    },

    // --- Individual priority score (facility-by-facility ranking) ---
    {
      strategy: "individual",
      budget: 100000,
      fundedBundleIds: [],
      fundedRepairIds: ["BR-17"],
      unfundedBundleIds: [],
      spend: 74000,
      connections: 0,
      coverage: 61,
      note: "The highest-scoring individual barrier completes no journey on its own.",
    },
    {
      strategy: "individual",
      budget: 200000,
      fundedBundleIds: ["UB-02"],
      fundedRepairIds: ["BR-17", "BR-07", "BR-02"],
      unfundedBundleIds: [],
      spend: 198000,
      connections: 214,
      coverage: 64,
    },
    {
      strategy: "individual",
      budget: 300000,
      fundedBundleIds: ["UB-02", "UB-06"],
      fundedRepairIds: ["BR-17", "BR-07", "BR-16", "BR-02"],
      unfundedBundleIds: [],
      spend: 294000,
      connections: 390,
      coverage: 68,
    },
    {
      strategy: "individual",
      budget: 400000,
      fundedBundleIds: ["UB-02", "UB-06", "UB-01"],
      fundedRepairIds: ["BR-17", "BR-07", "BR-16", "BR-01", "BR-02"],
      unfundedBundleIds: [],
      spend: 380000,
      connections: 808,
      coverage: 74,
      note: "The corridor pair is eventually funded, but only after $74K went to a repair that completes nothing.",
    },
    {
      strategy: "individual",
      budget: 500000,
      fundedBundleIds: ["UB-02", "UB-06", "UB-01", "UB-03"],
      fundedRepairIds: ["BR-17", "BR-07", "BR-16", "BR-01", "BR-02", "BR-08", "BR-09"],
      unfundedBundleIds: [],
      spend: 468000,
      connections: 976,
      coverage: 78,
      note: "Reaches at $500K what the network-aware plan reached at $400K.",
    },
    {
      strategy: "individual",
      budget: 650000,
      fundedBundleIds: ["UB-02", "UB-06", "UB-01", "UB-03"],
      fundedRepairIds: [
        "BR-17",
        "BR-07",
        "BR-16",
        "BR-01",
        "BR-02",
        "BR-08",
        "BR-09",
        "BR-13",
      ],
      unfundedBundleIds: [],
      spend: 600000,
      connections: 976,
      coverage: 78,
      note: "$132K goes to one half of the 244th Ave SE spine, which completes nothing until its partner is built.",
    },

    // --- Marginal greedy (one repair at a time, best immediate gain) ---
    {
      strategy: "marginal-greedy",
      budget: 100000,
      fundedBundleIds: ["UB-02"],
      fundedRepairIds: ["BR-07"],
      unfundedBundleIds: [],
      spend: 48000,
      connections: 214,
      coverage: 64,
    },
    {
      strategy: "marginal-greedy",
      budget: 200000,
      fundedBundleIds: ["UB-02", "UB-06"],
      fundedRepairIds: ["BR-07", "BR-16"],
      unfundedBundleIds: [],
      spend: 144000,
      connections: 390,
      coverage: 68,
    },
    {
      strategy: "marginal-greedy",
      budget: 300000,
      fundedBundleIds: ["UB-02", "UB-06"],
      fundedRepairIds: ["BR-07", "BR-16"],
      unfundedBundleIds: [],
      spend: 144000,
      connections: 390,
      coverage: 68,
      note: "Every remaining single repair shows zero immediate gain, so the search stalls.",
    },
    {
      strategy: "marginal-greedy",
      budget: 400000,
      fundedBundleIds: ["UB-02", "UB-06"],
      fundedRepairIds: ["BR-07", "BR-16"],
      unfundedBundleIds: [],
      spend: 144000,
      connections: 390,
      coverage: 68,
      note: "Stalled: no single next repair improves the network on its own.",
    },
    {
      strategy: "marginal-greedy",
      budget: 500000,
      fundedBundleIds: ["UB-02", "UB-06"],
      fundedRepairIds: ["BR-07", "BR-16"],
      unfundedBundleIds: [],
      spend: 144000,
      connections: 390,
      coverage: 68,
      note: "Stalled: no single next repair improves the network on its own.",
    },
    {
      strategy: "marginal-greedy",
      budget: 650000,
      fundedBundleIds: ["UB-02", "UB-06"],
      fundedRepairIds: ["BR-07", "BR-16"],
      unfundedBundleIds: [],
      spend: 144000,
      connections: 390,
      coverage: 68,
      note: "Stalled: no single next repair improves the network on its own.",
    },
  ],

  comparison: {
    budgetLabel: "≈ $400K illustrative program year",
    plans: [
      {
        id: "documented",
        label: "Documented project scenario",
        caveat:
          "A plausible facility-by-facility program: worst-condition assets first, spread across the city.",
        investment: 398000,
        repairs: 8,
        connections: 512,
        byKind: { transit: 96, civic: 210, parksSchools: 206 },
        fundedRepairIds: ["BR-17", "BR-07", "BR-11", "BR-15", "BR-01"],
      },
      {
        id: "network",
        label: "Network-connectivity scenario",
        caveat:
          "The same money allocated to repair combinations that complete journeys end to end.",
        investment: 394000,
        repairs: 6,
        connections: 976,
        byKind: { transit: 286, civic: 306, parksSchools: 384 },
        fundedRepairIds: ["BR-01", "BR-02", "BR-07", "BR-08", "BR-09", "BR-16"],
      },
    ],
  },
};

export default demoScenario;
