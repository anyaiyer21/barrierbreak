/**
 * Frozen demo scenario for Redmond, WA (Education Hill, around Redmond High School).
 *
 * EVERYTHING EXCEPT PLACE NAMES AND STREETS IS SYNTHETIC. It reuses the same
 * illustrative network shape, barriers, costs and household counts as the
 * Sammamish demo so both cities tell the same planning story, but every point
 * sits on a real Redmond street near Redmond High School.
 */

import type { Scenario } from "@/types/scenario";
import sammamish from "@/data/demoScenario";

/** Grid rows/columns mapped onto the real Education Hill street grid. */
const avenueLng = { v1: -122.124, v2: -122.1185, v3: -122.1109, v4: -122.1054, v5: -122.1 };
const streetLat = { h1: 47.6857, h2: 47.6929, h3: 47.6982, h4: 47.704 };

const placeLatLng: Record<string, { lat: number; lng: number }> = {
  s_lib: { lat: 47.69246, lng: -122.10603 }, // Redmond Pool, 17535 NE 104th St
  s_commons: { lat: 47.69062, lng: -122.1074 }, // Hartman Park, 17300 NE 104th St
  s_hs: { lat: 47.69493, lng: -122.10711 }, // Redmond High School, 17272 NE 104th St
  s_elem: { lat: 47.70193, lng: -122.09852 }, // Albert Einstein Elementary, 18025 NE 116th St
  s_pine_a: { lat: 47.6975, lng: -122.125 }, // Meadow Park north entry
  s_pine_b: { lat: 47.69621, lng: -122.1257 }, // Meadow Park, 10710 160th Ave NE
  s_beaver: { lat: 47.7026, lng: -122.08931 }, // Juel Park, 18815 NE 116th St
};

/** Ordered longest-first so more specific names are replaced before shorter ones. */
const renames: [string, string][] = [
  ["Sammamish, WA", "Redmond, WA"],
  ["SE Sammamish", "South Education Hill"],
  ["Sammamish Library", "Redmond Pool"],
  ["Sammamish Commons", "Hartman Park"],
  ["Library approach", "Pool approach"],
  ["the library", "the pool"],
  ["Skyline High School", "Redmond High School"],
  ["Skyline campus", "Redmond High campus"],
  ["Discovery Elementary School", "Einstein Elementary School"],
  ["Discovery Elementary", "Einstein Elementary"],
  ["Pine Lake Park", "Meadow Park"],
  ["Pine Lake ridge", "Meadow Park neighborhood"],
  ["Pine Lake", "Meadow Park"],
  ["Beaver Lake Park", "Juel Park"],
  ["Beaver Lake bench", "Juel Park edge"],
  ["Beaver Lake", "Juel Park"],
  ["Inglewood Hill", "Education Hill"],
  ["212th Ave SE", "162nd Ave NE"],
  ["218th Ave SE", "166th Ave NE"],
  ["228th Ave SE", "172nd Ave NE"],
  ["240th Ave SE", "176th Ave NE"],
  ["244th Ave SE", "180th Ave NE"],
  ["SE 4th St", "NE 95th St"],
  ["SE 8th St", "NE 104th St"],
  ["SE 20th St", "NE 109th St"],
  ["SE 24th St", "NE 116th St"],
  ["SE 4th", "NE 95th"],
  ["SE 8th", "NE 104th"],
  ["SE 20th", "NE 109th"],
  ["SE 24th", "NE 116th"],
  ["212th", "162nd"],
  ["218th", "166th"],
  ["228th", "172nd"],
  ["240th", "176th"],
  ["244th", "180th"],
  ["Sammamish", "Redmond"],
];

function rename(text: string): string {
  return renames.reduce((out, [from, to]) => out.split(from).join(to), text);
}

const cloned = JSON.parse(rename(JSON.stringify(sammamish))) as Scenario;

export const redmondScenario: Scenario = {
  ...cloned,
  id: "redmond-fy2026-illustrative",
  city: "Redmond, WA",
  nodes: cloned.nodes.map((n) => {
    const grid = /^(v\d)(h\d)$/.exec(n.id);
    if (grid) {
      return {
        ...n,
        lat: streetLat[grid[2] as keyof typeof streetLat],
        lng: avenueLng[grid[1] as keyof typeof avenueLng],
      };
    }
    const p = placeLatLng[n.id];
    return p ? { ...n, ...p } : n;
  }),
  destinations: cloned.destinations.map((d) =>
    d.id === "D_COMMONS" ? { ...d, kind: "park" } : d,
  ),
};

export default redmondScenario;
