# Align BarrierBreak to the simplified MVP

## Goal
Turn the current polished prototype into the focused two-view decision-support demo described in the proposal: planners inspect individual barriers, manually try repairs, observe network effects, uncover pair dependencies, and unlock a requested journey. Add a guided first-time walkthrough and a technical page for judges.

## Product changes

### 1. Make the planner a manual “what-if” workspace
- Replace the budget/strategy optimizer controls with a clear repair-selection panel.
- Let planners select and remove individual barriers directly from the list or map.
- Recalculate and display baseline reachability, selected-plan reachability, added connections, and estimated cost immediately.
- Keep “suggested opportunities” limited to the best single repair and best repair pair; label these as computed opportunities, not an optimal capital plan.
- Remove the Pareto/frontier and optimizer language that conflicts with the proposal’s explicit V1 non-goals.

### 2. Add a true Individual Barrier view
- Clicking a barrier opens an inspector with severity, pedestrian use, nearby public facilities, estimated cost, standalone network gain, and any positive pair dependency.
- Keep the barrier at the same map position when its selected state changes.
- Clearly separate individual-priority evidence from network impact.

### 3. Implement the four proposal algorithms
- Build undirected graph reachability using breadth-first search.
- Compute the weighted impact score from origin demand and reachable destinations.
- Compute every single-repair gain and all repair-pair synergy values.
- Use cost-weighted Dijkstra for “Unlock this journey,” returning the least-cost route and required repairs.
- Base visible metrics and explanations on these computations rather than frozen portfolio results.
- Add the proposal’s A/B/C fixture as automated tests, including the 150% comparison and journey-unlock result.

### 4. Keep and refocus the supporting pages
- **Unlock a Journey:** calculate the least-cost repair set for the chosen origin and destination, then let the planner apply it to the shared what-if state.
- **Comparison:** replace the current broad portfolio comparison with the proposal’s compact A/B/C validation example, presented as a method demonstration rather than a recommended city plan.
- Preserve the real basemap, real walking geometry, neighborhood impact cards, and the abstract A/B/A+B dependency diagram.

### 5. Add a first-time walkthrough mode
- Add a persistent “Take a tour” action in the app header and open it automatically for first-time visitors.
- Use a spotlight overlay anchored to the actual interface, with Back, Next, Skip, progress, keyboard support, and reduced-motion behavior.
- Walk through: illustrative-data warning, barrier selection, individual evidence, network result, pair dependency, neighborhood impact, and Unlock a Journey.
- Include optional judge notes explaining BFS, pair synergy, and Dijkstra without overwhelming planner-facing steps.
- Remember completion only in the browser so the tour can always be restarted.

### 6. Add a judge-friendly Technical page
- Add a dedicated **Technical** navigation page with:
  - the graph model and data schema;
  - the four algorithms, equations, and complexity in plain language;
  - the A/B/C hand-checkable fixture;
  - an architecture/data-flow diagram;
  - what is real versus illustrative;
  - accessibility, deterministic demo data, frozen Google walking geometry, and current limitations;
  - a concise “how this could become a municipal pilot” section.
- Update the existing Method page to focus on planner-facing assumptions and evidence, avoiding duplicate technical detail.

### 7. Add planner feedback capture
- Add a short feedback panel centered on the proposal’s main question: whether individual and network views add useful planning context.
- Include structured prompts for useful inputs, outputs, constraints, terminology, and workflow fit.
- Keep submission local to the demo unless persistent storage is explicitly enabled; provide a copyable summary so feedback is not lost.

## Technical details
- Extend the scenario model with `severity`, `pedestrianUse`, `publicFacilityProximity`, and graph edge length/accessibility fields while preserving the existing real coordinates.
- Put graph algorithms in a small pure TypeScript module with deterministic unit tests.
- Add a lightweight shared selection context so Planner and Journey use the same selected repairs without introducing a database.
- Build the tour as an accessible React overlay using measured target elements and stable `data-tour` anchors; no new tour library is necessary.
- Add route-specific metadata for the Technical page and retain the current visual system and responsive behavior.

## Verification
- Run algorithm tests and the project typecheck/build.
- Browser-test the complete first-visit tour, restart-tour flow, manual barrier selection, pair discovery, journey unlock, feedback summary, and all routes on desktop and mobile.
- Confirm the visible claims match computed values and that every illustrative/real-data distinction remains explicit.
