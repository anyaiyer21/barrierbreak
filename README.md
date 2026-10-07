# BarrierBreak — city-official prototype

Which pedestrian-accessibility repairs, funded **together**, unlock the most household trips?

Accessibility is a property of routes, not of individual assets. A curb ramp only helps if the
crossing it leads to is also usable. BarrierBreak evaluates *combinations* of repairs against the
journeys they complete, and shows a planner the result on a map.

> **All data in this prototype is synthetic and illustrative.** Street names around Sammamish, WA
> are real so the scenario reads naturally; barriers, conditions, costs, household counts and
> connection counts are hand-designed to demonstrate the concept. Nothing here reflects an actual
> inventory, budget, or city plan.

## The map

The planner sits on a real, deliberately muted Google basemap of Sammamish. Every intersection in
the network is a real one on the numbered-avenue grid (212th–244th Ave SE crossed with SE 4th–24th
St), and unlocked household trips are drawn along **real walking directions**, corner by corner.

Those walking paths are fetched once at build time by `scripts/generateWalkPaths.ts` and frozen into
`src/data/walkPaths.ts`. Nothing calls a mapping service while the app is running, so the demo is
identical in every meeting, costs nothing to show, and cannot fail on stage. If the basemap cannot
load, the original schematic map renders instead.

## The three screens

| Route | What it does |
| --- | --- |
| `/` | Map-first planner: repair selection, individual barrier evidence, and network results. Add `?demo=true` for the guided opener. |
| `/journey` | Start from a blocked household trip and unlock it. |
| `/technical` | Terminology, one score worked out by hand, the model, the algorithms, and what is invented. |

## The flagship moment

Unlock Set 01 pairs two repairs on 228th Ave SE. Either one alone completes **0** trips; funded
together they complete **418**. The inspector's A / B / A+B switcher is the argument the whole
prototype exists to make.

## Architecture

```
src/types/scenario.ts     typed scenario models (API-shaped)
src/data/demoScenario.ts  the frozen synthetic scenario
src/lib/scenarioEngine.ts resolvePlan() — the seam a real optimizer API replaces
src/data/walkPaths.ts     frozen real walking geometry (generated once, never fetched live)
src/lib/geo.ts            lat/lng helpers for the geographic map
src/components/map        Google Maps basemap + SVG network overlay (schematic map as fallback)
scripts/generateWalkPaths.ts  one-off generator for the walking geometry
src/components/planner    budget / priority / strategy rail, impact frontier
src/components/inspector  "why these repairs" + complementarity diagram
src/routes                the four screens
```

Results are deterministic: identical inputs always produce the identical plan, so the demo behaves
the same in every meeting.

## Accessibility

Keyboard-operable barriers and controls, visible focus rings, live status text describing every map
state change, colour paired with shape and dash pattern, and a reduced-motion toggle in the header
that also honours the OS setting.

## Also in this repo

`DEMO_SCRIPT.md` (3-minute walkthrough), `DESIGN_NOTES.md` (visual system rationale),
`NEXT_STEPS.md` (what real deployment requires).
