import type { Scenario } from "@/types/scenario";

export const validationFixture: Scenario = {
  id: "abc-validation",
  city: "Hand-checkable example",
  label: "$100K validation fixture",
  baselineCoverage: 0,
  totalModeledTrips: 200,
  nodes: [
    { id: "o-local", x: 0, y: 0, lat: 0, lng: 0, label: "Local origin" },
    { id: "local", x: 1, y: 0, lat: 0, lng: 1, label: "Local destination" },
    { id: "o-transit", x: 0, y: 1, lat: 1, lng: 0, label: "Transit origin" },
    { id: "corridor", x: 1, y: 1, lat: 1, lng: 1, label: "Transit corridor" },
    { id: "transit", x: 2, y: 1, lat: 1, lng: 2, label: "Transit" },
  ],
  links: [
    { id: "repair-a", from: "o-local", to: "local", barrierId: "A" },
    { id: "repair-b", from: "o-transit", to: "corridor", barrierId: "B" },
    { id: "repair-c", from: "corridor", to: "transit", barrierId: "C" },
  ],
  barriers: [
    { id: "A", linkId: "repair-a", label: "Repair A", kind: "missing-curb-ramp", condition: "poor", cost: 60000, standaloneScore: 92, standaloneConnections: 80, evidence: "illustrative" },
    { id: "B", linkId: "repair-b", label: "Repair B", kind: "no-sidewalk", condition: "fair", cost: 40000, standaloneScore: 70, standaloneConnections: 0, evidence: "illustrative" },
    { id: "C", linkId: "repair-c", label: "Repair C", kind: "unsignalized-crossing", condition: "fair", cost: 40000, standaloneScore: 68, standaloneConnections: 0, evidence: "illustrative" },
  ],
  origins: [
    { id: "local-origin", label: "80 modeled households", nodeId: "o-local", x: 0, y: 0, households: 80 },
    { id: "transit-origin", label: "200 modeled households", nodeId: "o-transit", x: 0, y: 1, households: 200 },
  ],
  destinations: [
    { id: "local-destination", label: "Local destination", kind: "civic", nodeId: "local", x: 1, y: 0 },
    { id: "transit-destination", label: "Transit", kind: "transit", nodeId: "transit", x: 2, y: 1 },
  ],
  bundles: [], routes: [], journeys: [], budgets: [], results: [],
  comparison: { budgetLabel: "$100K", plans: [] },
};
