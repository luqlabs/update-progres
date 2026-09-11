# Drop "diagnostic" wording and remove the header create button

The greeting-header "New diagnostic" button is redundant with the sidebar "Create New" and the wording feels too clinical. Two changes: stop using the word "diagnostic" everywhere, and remove the header button so the sidebar is the single create entry point.

## Changes

1. **Remove the create button from the greeting header.** In `src/components/dashboard/CohortSignal.tsx`, delete the `<Button>` block and the "N activities remaining" hint beneath it. Keep the greeting ("Good evening, Firstname.") and the date line. The section becomes a calm title row, not a call-to-action.

2. **Replace "diagnostic" with "activity" app-wide.** Grep and update user-facing strings across the dashboard, landing, and builder. Known spots:
   - `CohortSignal.tsx`: the removed button text ("New diagnostic" / "Create your first diagnostic") goes away with the button.
   - `NeedsAttention.tsx`, `ReadinessChart.tsx`: any "diagnostic" label becomes "activity".
   - Landing page copy (`Index.tsx`, `src/components/landing/*`): "diagnostic quiz/assessment" → "pre-lecture activity" or just "activity".
   - `index.html` meta title/description if it uses "diagnostic".

3. **Keep the sidebar "Create New" button as the single primary action** (including its remaining-activities count). No new button is added.

## Technical notes

- Presentational + copy changes only; no data, dialog, or schema changes.
- `handleCreate` / `onCreate` props on `CohortSignal` become unused and should be removed from the props interface and the call site in `Dashboard.tsx`.
- Confirm no remaining user-facing "diagnostic" strings after the sweep with a final grep.
