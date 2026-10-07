/**
 * Geographic helpers for the real-map view.
 *
 * Scenario points carry real Sammamish latitude/longitude alongside the
 * schematic x/y plane. Origins and destinations inherit the coordinates of the
 * network node they sit on, so the overlay always lines up with the network.
 */

import { getNode, scenario } from "@/lib/scenarioEngine";

export interface LatLng {
  lat: number;
  lng: number;
}

export const SAMMAMISH_CENTER: LatLng = { lat: 47.6135, lng: -122.0356 };

export function nodeLatLng(nodeId: string): LatLng | undefined {
  const n = getNode(nodeId);
  return n ? { lat: n.lat, lng: n.lng } : undefined;
}

export function originLatLng(originId: string): LatLng | undefined {
  const o = scenario.origins.find((x) => x.id === originId);
  return o ? nodeLatLng(o.nodeId) : undefined;
}

export function destinationLatLng(destinationId: string): LatLng | undefined {
  const d = scenario.destinations.find((x) => x.id === destinationId);
  return d ? nodeLatLng(d.nodeId) : undefined;
}

/** Midpoint of a link, where its barrier marker is drawn. */
export function midpoint(a: LatLng, b: LatLng): LatLng {
  return { lat: (a.lat + b.lat) / 2, lng: (a.lng + b.lng) / 2 };
}

export function boundsOf(points: LatLng[]) {
  if (!points.length) return null;
  let north = -90;
  let south = 90;
  let east = -180;
  let west = 180;
  for (const p of points) {
    north = Math.max(north, p.lat);
    south = Math.min(south, p.lat);
    east = Math.max(east, p.lng);
    west = Math.min(west, p.lng);
  }
  return { north, south, east, west };
}

/** Ordered node path as coordinates, optionally stopping at a node. */
export function pathLatLngs(nodeIds: string[], stopAt?: string): LatLng[] {
  const out: LatLng[] = [];
  for (const id of nodeIds) {
    const p = nodeLatLng(id);
    if (p) out.push(p);
    if (stopAt && id === stopAt) break;
  }
  return out;
}
