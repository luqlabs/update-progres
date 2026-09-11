# Dashboard refinement: from file manager to teaching cockpit

Right now the dashboard is a good file list with a stats strip on top. The best education dashboards (Canvas, Gradescope, Cadmus, Wooclap) do one thing differently: they answer "what needs my attention today?" before they show "here is everything you own." These changes push in that direction while staying inside the Academic Editorial theme (white base, black text, emerald actions, serif headings, hairline borders).

## 1. Make the top strip actionable, not just informative

The Cohort Signal tiles report numbers but only tile 03 is clickable.

- Tile 01 "This term" — add a small sparkline of activity created per week, click filters the list to this month.
- Tile 02 "Students reached" — add "+N since you last visited" so returning users see movement.
- Tile 03 "Latest gap" — keep, but add a one-line action: "Review question breakdown" linking straight to that activity's analytics tab, not just the activity.

## 2. Add a "Needs attention" row under the signal strip

A single horizontal hairline row, max 3 items, only rendered when relevant:

- Diagnostics with new responses since last visit
- Drafts left untouched for 7+ days ("Untitled activity" is already sitting there)
- Activities shared but with zero responses after 3 days (nudge to re-share)

Each item is a one-line link. No cards, no icons — just eyebrow label, serif title, action verb on the right.

## 3. Fix the "Untitled activity" problem

Untitled drafts with no questions clutter the list. Group them into a quiet "Drafts" section above the table, collapsed by default, with a count. Keeps the main list as published, shareable work.

## 4. Improve the activity table's information scent

Current columns: Title, Type, Theme, Participants, Updated, Actions.

- Replace **Theme** (a cosmetic setting, irrelevant when scanning) with **Avg score** — the number lecturers actually care about, shown as a small horizontal bar plus percentage.
- Show **Participants** as a real number with a subtle bar rather than a pill; 0 stays muted.
- Keep Type as a small text label, not a badge.

## 5. Rethink the view switcher

Three view modes (grid, list, table) is one too many for this content. Recommend keeping **Table** (default, dense, scanning) and **Grid** (visual, for themed activities) and removing List, which duplicates table at lower density.

## 6. Empty and first-run states

For a brand-new lecturer, the whole page reads as zeros. Instead show a single centred panel: one line of purpose ("Find out what your students don't know before the lecture"), one primary emerald action, and two example diagnostics they can clone (e.g. "Intro to Statistics — week 1 diagnostic").

## 7. Sidebar hierarchy

Views and Folders currently sit at the same visual weight. Give Folders a slightly quieter treatment and move the item count to a right-aligned muted numeral so the eye scans names first.

## 8. Stats and charts — one chart, chosen carefully

Education dashboards get worse when they add a chart wall. Lecturers do not want a BI tool; they want one picture that says "is the cohort ready?". Recommend exactly one chart on the dashboard, plus small inline sparklines. Everything deeper stays in the per-activity Analytics page where it has context.

**The one chart: cohort readiness distribution.** A horizontal stacked bar (or simple histogram) across all responses this term, bucketed into score bands:

```text
Struggling <50%   ████████            34
Developing 50-74% ███████████████     61
Secure 75%+       ██████████          28
```

Black bars with the emerald band reserved for the "Secure" segment. Clicking a band filters the activity list to diagnostics where that band dominates. This answers the teaching question directly, unlike a generic line chart of plays over time.

**Sparklines, not panels.** A 40px inline sparkline of weekly responses in the "This term" tile, and a tiny score bar per row in the table (section 4). No axes, no legend, no tooltips beyond a title attribute.

**Stats worth showing (and what to drop).**

Keep — each maps to a decision:
- Response rate: responses / students the link was shared with, when known
- Median score this term, with the delta vs last term
- Completion rate: started vs finished
- Most-missed question across the term (single line, links to that question)

Drop or move to Analytics: total activities created, "most used type", "active since", engagement rate, and anything that is vanity rather than diagnostic. `DashboardStats.tsx` in its current form is exactly this category.

**Rendering.** Recharts is already in the project. Style it flat: no gridlines, no drop shadows, hairline axis only where needed, black and emerald only, serif numerals for the headline figure.

## Technical notes

- All changes are presentational plus small derived-data reads; no schema changes.
- Avg score per activity comes from existing analytics data already used to compute `lowestScoringApp` in `Dashboard.tsx` — extend that query to return per-app averages instead of just the minimum.
- Score-band distribution and median come from aggregating `student_sessions` scores for the user's apps; this can be a single grouped read rather than per-app fetches.
- "Since last visit" uses the existing `useLastSeen` hook.
- New pieces: `NeedsAttention`, `DraftsGroup`, and `ReadinessChart` components under `src/components/dashboard/`; edits to `CohortSignal.tsx`, `AppTable.tsx`, `DashboardFilters.tsx`, `DashboardSidebar.tsx`, `Dashboard.tsx`.
- `DashboardStats.tsx` and `DashboardHeroInput.tsx` appear unused by the current dashboard; leave untouched unless you want them removed.

## Scope check

If you would rather not do all eight, the highest impact for the least churn is: 2 (needs attention), 4 (avg score column), and 8 (the single readiness chart).

