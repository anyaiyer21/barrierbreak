<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Keep all pedestrian-network calculations in pure TypeScript under `src/lib/graphEngine.ts` so UI views share one explainable, testable source of truth.
- Each demo city is a frozen Scenario plus frozen walk paths registered in `src/lib/scenarioEngine.ts`; `setActiveCity` swaps them and `CityProvider` remounts the app — so every view keeps reading one `scenario` binding.
