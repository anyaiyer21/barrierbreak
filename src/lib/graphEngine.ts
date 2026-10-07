import type { Barrier, Destination, NetworkLink, OriginArea, Scenario } from "@/types/scenario";

export interface ImpactResult {
  score: number;
  reachableByOrigin: Record<string, string[]>;
}

export interface RepairImpact extends Barrier {
  gain: number;
}

export interface PairImpact {
  repairIds: [string, string];
  gain: number;
  synergy: number;
}

export interface JourneySolution {
  nodeIds: string[];
  repairIds: string[];
  cost: number;
}

function adjacency(links: NetworkLink[], selected: ReadonlySet<string>) {
  const graph = new Map<string, { node: string; link: NetworkLink }[]>();
  for (const link of links) {
    if (link.barrierId && !selected.has(link.barrierId)) continue;
    graph.set(link.from, [...(graph.get(link.from) ?? []), { node: link.to, link }]);
    graph.set(link.to, [...(graph.get(link.to) ?? []), { node: link.from, link }]);
  }
  return graph;
}

export function reachableNodes(
  links: NetworkLink[],
  start: string,
  selected: ReadonlySet<string>,
) {
  const graph = adjacency(links, selected);
  const seen = new Set([start]);
  const queue = [start];
  while (queue.length) {
    const current = queue.shift();
    if (!current) continue;
    for (const next of graph.get(current) ?? []) {
      if (seen.has(next.node)) continue;
      seen.add(next.node);
      queue.push(next.node);
    }
  }
  return seen;
}

export function networkImpact(scenario: Scenario, selected: ReadonlySet<string>): ImpactResult {
  const reachableByOrigin: Record<string, string[]> = {};
  let score = 0;
  for (const origin of scenario.origins) {
    const reached = reachableNodes(scenario.links, origin.nodeId, selected);
    const destinations = scenario.destinations.filter((d) => reached.has(d.nodeId));
    reachableByOrigin[origin.id] = destinations.map((d) => d.id);
    score += origin.households * destinations.length;
  }
  return { score, reachableByOrigin };
}

export function singleRepairImpacts(scenario: Scenario): RepairImpact[] {
  const baseline = networkImpact(scenario, new Set()).score;
  return scenario.barriers
    .map((barrier) => ({
      ...barrier,
      gain: networkImpact(scenario, new Set([barrier.id])).score - baseline,
    }))
    .sort((a, b) => b.gain - a.gain || a.cost - b.cost);
}

export function pairImpacts(scenario: Scenario): PairImpact[] {
  const baseline = networkImpact(scenario, new Set()).score;
  const singles = new Map(singleRepairImpacts(scenario).map((r) => [r.id, r.gain]));
  const pairs: PairImpact[] = [];
  for (let a = 0; a < scenario.barriers.length; a += 1) {
    for (let b = a + 1; b < scenario.barriers.length; b += 1) {
      const first = scenario.barriers[a];
      const second = scenario.barriers[b];
      if (!first || !second) continue;
      const gain = networkImpact(scenario, new Set([first.id, second.id])).score - baseline;
      pairs.push({
        repairIds: [first.id, second.id],
        gain,
        synergy: gain - (singles.get(first.id) ?? 0) - (singles.get(second.id) ?? 0),
      });
    }
  }
  return pairs.sort((a, b) => b.synergy - a.synergy || b.gain - a.gain);
}

export function leastCostJourney(
  scenario: Scenario,
  origin: OriginArea,
  destination: Destination,
  alreadySelected: ReadonlySet<string> = new Set(),
): JourneySolution | undefined {
  const barrierCosts = new Map(scenario.barriers.map((b) => [b.id, b.cost]));
  const graph = new Map<string, { node: string; link: NetworkLink; cost: number }[]>();
  for (const link of scenario.links) {
    const cost = link.barrierId && !alreadySelected.has(link.barrierId)
      ? (barrierCosts.get(link.barrierId) ?? 0)
      : 0;
    graph.set(link.from, [...(graph.get(link.from) ?? []), { node: link.to, link, cost }]);
    graph.set(link.to, [...(graph.get(link.to) ?? []), { node: link.from, link, cost }]);
  }

  const distance = new Map<string, number>([[origin.nodeId, 0]]);
  const previous = new Map<string, { node: string; link: NetworkLink }>();
  const pending = new Set(scenario.nodes.map((n) => n.id));
  while (pending.size) {
    let current: string | undefined;
    let best = Number.POSITIVE_INFINITY;
    for (const node of pending) {
      const value = distance.get(node) ?? Number.POSITIVE_INFINITY;
      if (value < best) {
        best = value;
        current = node;
      }
    }
    if (!current || !Number.isFinite(best)) break;
    pending.delete(current);
    if (current === destination.nodeId) break;
    for (const edge of graph.get(current) ?? []) {
      if (!pending.has(edge.node)) continue;
      const next = best + edge.cost;
      if (next < (distance.get(edge.node) ?? Number.POSITIVE_INFINITY)) {
        distance.set(edge.node, next);
        previous.set(edge.node, { node: current, link: edge.link });
      }
    }
  }

  if (!distance.has(destination.nodeId)) return undefined;
  const nodeIds = [destination.nodeId];
  const repairIds = new Set<string>();
  let cursor = destination.nodeId;
  while (cursor !== origin.nodeId) {
    const step = previous.get(cursor);
    if (!step) return undefined;
    if (step.link.barrierId) repairIds.add(step.link.barrierId);
    cursor = step.node;
    nodeIds.unshift(cursor);
  }
  return { nodeIds, repairIds: [...repairIds].sort(), cost: distance.get(destination.nodeId) ?? 0 };
}
