/**
 * One-off generator: fetches real walking geometry for each witness route and
 * freezes it into `src/data/walkPaths.ts`.
 *
 * Run with `bun scripts/generateWalkPaths.ts`. The app never calls the routing
 * service at runtime — it reads the generated file, so the demo is identical
 * every time and costs nothing to show.
 */

import { writeFileSync } from "node:fs";

const GATEWAY_URL = "https://connector-gateway.lovable.dev/google_maps";
const LOVABLE_API_KEY = process.env["LOVABLE_API_KEY"];
const GOOGLE_MAPS_API_KEY = process.env["GOOGLE_MAPS_API_KEY"];
if (!LOVABLE_API_KEY || !GOOGLE_MAPS_API_KEY) throw new Error("Missing Google Maps credentials");

import sammamishScenario from "../src/data/demoScenario";
import redmondScenario from "../src/data/redmondScenario";

// Usage: bun scripts/generateWalkPaths.ts [sammamish|redmond]
const CITY = process.argv[2] ?? "sammamish";
const demoScenario = CITY === "redmond" ? redmondScenario : sammamishScenario;
const OUT_FILE = CITY === "redmond" ? "src/data/redmondWalkPaths.ts" : "src/data/walkPaths.ts";

const nodes: Record<string, { lat: number; lng: number }> = Object.fromEntries(
  demoScenario.nodes.map((n) => [n.id, { lat: n.lat, lng: n.lng }]),
);

const routes = demoScenario.routes.map((r) => ({
  id: r.id,
  path: r.path,
  ...(r.blockedAt ? { blockedAt: r.blockedAt } : {}),
}));

function decodePolyline(encoded: string): [number, number][] {
  const points: [number, number][] = [];
  let index = 0;
  let lat = 0;
  let lng = 0;
  while (index < encoded.length) {
    let result = 0;
    let shift = 0;
    let b: number;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    lat += result & 1 ? ~(result >> 1) : result >> 1;
    result = 0;
    shift = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    lng += result & 1 ? ~(result >> 1) : result >> 1;
    points.push([Number((lat / 1e5).toFixed(5)), Number((lng / 1e5).toFixed(5))]);
  }
  return points;
}

const waypoint = (p: { lat: number; lng: number }) => ({
  location: { latLng: { latitude: p.lat, longitude: p.lng } },
});

async function computeWalk(path: string[]): Promise<[number, number][]> {
  const pts = path.map((id) => nodes[id]!).filter(Boolean);
  const origin = pts[0]!;
  const destination = pts[pts.length - 1]!;
  const intermediates = pts.slice(1, -1).map(waypoint);
  const res = await fetch(`${GATEWAY_URL}/routes/directions/v2:computeRoutes`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${LOVABLE_API_KEY}`,
      "X-Connection-Api-Key": GOOGLE_MAPS_API_KEY!,
      "Content-Type": "application/json",
      "X-Goog-FieldMask": "routes.polyline.encodedPolyline,routes.distanceMeters",
    },
    body: JSON.stringify({
      origin: waypoint(origin),
      destination: waypoint(destination),
      intermediates,
      travelMode: "WALK",
      polylineQuality: "HIGH_QUALITY",
      units: "IMPERIAL",
    }),
  });
  if (!res.ok) throw new Error(`Routes API failed [${res.status}]: ${await res.text()}`);
  const json = (await res.json()) as {
    routes?: { polyline?: { encodedPolyline?: string } }[];
  };
  const encoded = json.routes?.[0]?.polyline?.encodedPolyline;
  if (!encoded) throw new Error(`No polyline returned: ${JSON.stringify(json).slice(0, 300)}`);
  return decodePolyline(encoded);
}

const out: Record<string, { full: [number, number][]; blocked?: [number, number][] }> = {};
for (const r of routes) {
  out[r.id] = { full: await computeWalk(r.path) };
  if (r.blockedAt) {
    const cut = r.path.slice(0, r.path.indexOf(r.blockedAt) + 1);
    if (cut.length > 1) out[r.id]!.blocked = await computeWalk(cut);
  }
  console.log(r.id, out[r.id]!.full.length, "points");
}

// Real street geometry for every network link, so blocked (red dashed)
// segments trace the actual road instead of a straight line on the map.
const linkOut: Record<string, [number, number][]> = {};
for (const l of demoScenario.links) {
  const a = nodes[l.from];
  const b = nodes[l.to];
  if (!a || !b) continue;
  try {
    linkOut[l.id] = await computeWalk([l.from, l.to]);
    console.log("link", l.id, linkOut[l.id]!.length, "points");
  } catch (err) {
    // Fall back to a straight segment; the app still works.
    console.warn("link", l.id, "fell back to straight line:", String(err).slice(0, 120));
    linkOut[l.id] = [
      [a.lat, a.lng],
      [b.lat, b.lng],
    ];
  }
}

const body = `/**
 * Frozen real walking geometry for each witness route.
 *
 * Generated once by \`scripts/generateWalkPaths.ts\` from real walking
 * directions. Nothing calls the routing service at runtime, so the demo is
 * byte-identical in every meeting.
 */

export type WalkPoint = [lat: number, lng: number];

export interface WalkPath {
  /** Full origin-to-destination walking geometry. */
  full: WalkPoint[];
  /** Geometry up to the point where the trip is currently blocked. */
  blocked?: WalkPoint[];
}

export const walkPaths: Record<string, WalkPath> = ${JSON.stringify(out, null, 2)};

/** Real street geometry for every network link, keyed by link id. */
export const linkPaths: Record<string, WalkPoint[]> = ${JSON.stringify(linkOut, null, 2)};

export default walkPaths;
`;

writeFileSync(OUT_FILE, body);
console.log("wrote", OUT_FILE);
