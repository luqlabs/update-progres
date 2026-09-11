# Emerald as the action color (keep black as the text color)

## My recommendation

Don't swap black for green everywhere — do a hybrid.

Pure black-and-white reads serious and academic, but it gives the eye nothing to follow: every button, link and heading has the same weight, so nothing looks clickable. Making green the *text* color instead of black would be worse — long body copy in emerald is tiring to read and looks less credible to faculty.

The strongest version keeps black as the reading color and promotes emerald to the single action/brand color. Text stays black, backgrounds stay white, and green means "this is Quizabl, or this is the thing to click."

## What changes

- Primary buttons, links, focus rings, active nav/sidebar states, selected plan, progress and success states: deep emerald instead of black.
- Body copy, headings, labels, table text: unchanged black.
- Emerald bands, badge and icon accents on the landing page: unchanged.
- Secondary/outline buttons stay black-on-white so there is only one loud color per screen.

## Technical notes

- In `src/index.css`, point `--primary` / `--accent` / `--ring` at the existing emerald (`158 64% 12%` deep, with a slightly lighter `158 55% 22%` hover for contrast on hover states), keep `--foreground` at `0 0% 0%`.
- Dark mode gets the lighter emerald as primary so contrast stays above 4.5:1.
- Landing sections read `--primary` for serif headings today (`Section.tsx`, `StatsSection.tsx`) — those switch to an explicit `--foreground` so headings stay black rather than turning green.
- No component rewrites: everything else already uses the semantic tokens.

If you'd rather see it before committing, I can apply it and you can revert in one step — the change is confined to the token block plus two heading colors.
