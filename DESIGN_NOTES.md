# Design notes

## Direction
Light, near-white civic interface (Linear/Stripe restraint) rather than a dark dashboard. It
projects well in bright meeting rooms, screenshots cleanly for a submission, and reads as a public
planning instrument rather than a consumer product. Dark surfaces are used only for the primary
action.

## Type
IBM Plex Sans for interface text, IBM Plex Mono for identifiers. All figures use tabular numerals
(`.tnum`) so counters do not jitter while animating.

## Colour semantics
Colour carries meaning, never decoration:

| Token | Meaning |
| --- | --- |
| `--network` | accessible pedestrian network today |
| `--barrier` | blocked link / candidate barrier |
| `--repair` | selected repair |
| `--unlocked` | newly continuous route |
| `--transit` / `--school` / `--civic` / `--park` | destination type |
| `--origin` | residential origin area |

Every colour is also paired with a shape or dash pattern (dashes = blocked, diamonds = barriers,
outlined squares = destinations) so the map does not depend on colour alone.

## The map
A hand-built SVG schematic in a local planning plane (1200 × 820) rather than a tile map. Reasons:
no API keys or network dependency in a demo, full control over the choreography, and honesty — the
geometry is illustrative, and a tile basemap would imply survey accuracy the data does not have.

## Motion
Motion is used once, for the one thing worth explaining: the transformation from "blocked city" to
"funded plan". The sequence is evaluate → select → unlock → settle, roughly 3.5 seconds. Route
lines draw along their own length; counters count up. A reduced-motion toggle sits in the header
and is also honoured from the OS setting; when on, the plan simply appears.

## Honesty in the interface
The demo-data badge is always visible in the header. Evidence badges appear on costs and barrier
attributes. The Method page states the model, the assumptions, and the limits. Comparison language
avoids claiming any real program is wrong.
