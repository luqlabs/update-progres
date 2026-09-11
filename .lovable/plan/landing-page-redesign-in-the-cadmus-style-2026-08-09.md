# Landing page redesign in the Cadmus style

I studied cadmus.io (markdown + full screenshot). Here's what defines its look, and how I'd apply the whole structure to the Quizabl landing page.

## What makes Cadmus look the way it does

- **Deep saturated brand hero.** A full-bleed burgundy band holds the nav and the headline; the rest of the page sits on warm off-white with generous breathing room.
- **Floating pill nav.** White rounded bar centred at the top, logo left, four link groups centre, one solid CTA right.
- **Serif display headline** in a soft light tint on the dark band, with a single short sans subline underneath. Two lines maximum, no badges, no stats.
- **Staggered photo collage.** Four vertically offset image cards, each with a small pill label and icon (Create / Mark / Manage / Analyse) — this is the hero's "visual", not a product screenshot.
- **Alternating product rows.** Tab-style chips select a product; each row = large photo on one side, heading + paragraph + "Learn more" link on the other.
- **Benefit grid.** Four icon + one-sentence outcome statements, no card chrome.
- **Animated counter stats** (students / teachers / assessments) that count up on scroll.
- **Softly rounded corners** (~12–16px) on nav, cards and images.

## How this maps to Quizabl

| Cadmus section | Quizabl version |
|---|---|
| Burgundy hero band | Deep emerald band (the green already used for the hero badge), light mint headline |
| Serif headline | "Know what your students don't know — before you teach it." |
| Staggered photo collage | Four offset cards labelled Ask / Generate / Share / Diagnose, using product UI frames rather than stock photos |
| Product tab rows | Quizzes, Flashcards, Matching games, Manual editing, Cohort analytics — chip selector + alternating image/copy rows |
| Benefit icon grid | Four faculty outcomes (spot gaps pre-lecture, no student logins, minutes not hours, works with any material) |
| Counter stats | Existing StatsSection, converted to count-up |
| Body sections | Method comparison, features, pricing, FAQ, footer — kept, restyled to the new spacing and type scale |

## One decision to flag

Your current theme is deliberately **pure black-and-white with minimal 6px radius**. Cadmus is the opposite: one strong brand colour and soft corners. I'll build it with the **emerald band + white body**, keeping black text everywhere else, and soften radius only on the nav pill, hero collage cards and product images — the rest of the app stays as-is. Say the word if you'd rather stay strictly monochrome and take only the layout.

## Technical notes

- Rework `src/pages/Index.tsx`: emerald hero band wrapping the existing floating nav, centred serif headline, new staggered collage component, then the reordered sections.
- New components: `HeroCollage.tsx` (four offset labelled cards) and `ProductTabs.tsx` (chip selector + alternating rows) under `src/components/landing/`.
- Add tokens to `src/index.css` for the hero band background/foreground and a `--radius-lg` used only by the new landing components; no global radius change.
- Add count-up animation to `StatsSection.tsx` via an IntersectionObserver hook.
- Reuse existing `FeaturesSection`, `MethodComparisonSection`, `PricingPreview`, `FAQSection`, `Footer`; only spacing and heading styles adjusted for consistency.
- Photography: Cadmus leans on stock photos of students. I'll generate a small set of matching lecture/study images for the collage and product rows unless you'd prefer product screenshots.
- Mobile: collage stacks to a 2-column offset grid, product tabs become a vertical stack.
