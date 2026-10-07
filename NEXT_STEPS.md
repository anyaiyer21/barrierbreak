# Next steps

## Data
- Ingest the city's sidewalk, curb-ramp and crossing inventory plus ADA transition-plan records.
- Replace the schematic plane with real geometry (parcels, centrelines, transit stops, school walk
  zones) and swap the SVG canvas for a vector basemap once accuracy is warranted.
- Replace illustrative costs with engineering estimates from the capital program.

## Model
- Run the combination search over the full network instead of hand-authored candidate sets;
  budgeted maximum-coverage with pairwise dependencies is the natural formulation.
- Add trip weighting: population and household composition, equity indices, transit frequency,
  school walk boundaries.
- Model route quality beyond continuity — grade, surface, crossing wait, lighting, winter
  maintenance.

## Product
- Multi-year programming: schedule unlock sets across budget years and show cumulative coverage.
- Scenario saving and side-by-side comparison of council-proposed lists.
- Export: a one-page memo per unlock set for council packets, and CSV of the recommended program.
- Public-facing report mode with a resident-submitted barrier queue.

## Engineering
- `src/lib/scenarioEngine.ts` is the seam: `resolvePlan()` returns the same shape a real optimizer
  API would. Point it at a server function and the UI needs no changes.
- Add regression tests over the frozen scenario so demo numbers can never drift silently.
- Accessibility audit with screen-reader users, including the map's text equivalents.
