# Clarify multi-barrier planning and strengthen journey progress

## Changes

- Remove Feedback and the visible Reduced motion control from the header. The app will still respect each device’s accessibility setting automatically.
- Replace every user-facing “what-if” phrase with direct language such as “selected repairs,” “repair plan,” or “current plan.”
- Rework the Planner’s repair list around complementary repair groups:
  - show a clear selected-repairs summary;
  - visually highlight repairs that work with the selected barrier;
  - label the added benefit of repairing a related pair;
  - let planners apply a suggested pair directly;
  - highlight the same related barriers on the map.
- Improve Unlock a Journey with a more visual progress panel showing the chosen trip, connected/blocked status, repairs completed versus required, added cost, and the change in network reach after applying repairs.
- Keep all calculations in the existing shared graph engine and leave the illustrative data disclaimer intact.

## Verification

- Check Planner selection, pair highlighting, pair application, and map markers in the live app.
- Check Journey before and after applying its required repairs.
- Confirm desktop and mobile layouts, automated graph tests, and the preview build.
