import { describe, expect, it } from "vitest";

import { validationFixture } from "@/data/validationFixture";
import { leastCostJourney, networkImpact, pairImpacts, singleRepairImpacts } from "@/lib/graphEngine";

describe("BarrierBreak A/B/C fixture", () => {
  it("matches the hand-checkable single and pair gains", () => {
    const baseline = networkImpact(validationFixture, new Set()).score;
    const gains = new Map(singleRepairImpacts(validationFixture).map((item) => [item.id, item.gain]));
    const pair = pairImpacts(validationFixture).find((item) => item.repairIds.includes("B") && item.repairIds.includes("C"));
    expect(baseline).toBe(0);
    expect(gains.get("A")).toBe(80);
    expect(gains.get("B")).toBe(0);
    expect(gains.get("C")).toBe(0);
    expect(pair?.gain).toBe(200);
    expect(pair?.synergy).toBe(200);
  });

  it("shows B plus C beating A plus B by 150 percent", () => {
    const individual = networkImpact(validationFixture, new Set(["A", "B"])).score;
    const network = networkImpact(validationFixture, new Set(["B", "C"])).score;
    expect(individual).toBe(80);
    expect(network).toBe(200);
    expect((network - individual) / individual).toBe(1.5);
  });

  it("finds the $80K least-cost transit unlock", () => {
    const origin = validationFixture.origins.find((item) => item.id === "transit-origin");
    const destination = validationFixture.destinations.find((item) => item.id === "transit-destination");
    expect(origin).toBeDefined();
    expect(destination).toBeDefined();
    if (!origin || !destination) return;
    const result = leastCostJourney(validationFixture, origin, destination);
    expect(result?.repairIds).toEqual(["B", "C"]);
    expect(result?.cost).toBe(80000);
  });
});
