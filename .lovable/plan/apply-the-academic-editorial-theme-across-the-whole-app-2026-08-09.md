# Apply the Academic Editorial theme across the whole app

Save the landing page's design language as persistent project memory, then roll it out to every remaining page so the product feels like one coherent, faculty-grade tool.

## The theme (locked)

- Base: pure white background, pure black text, 100% contrast.
- Accent: deep emerald band (`--hero-band`) used for hero/CTA bands and small accents only.
- Type: Instrument Serif (italic display headings), Work Sans body, Inter for nav/UI labels, 15px root.
- Shape: minimal radius (`0.375rem`), hairline borders, no drop shadows, no card chrome where a rule will do.
- Rhythm: shared `Section` wrapper — `max-w-6xl`, `py-20 md:py-28`, centered `SectionHeading` with eyebrow + serif title.

## Rollout

1. **Memory** — save the theme as a design memory and add a one-line Core rule so every future change follows it automatically.
2. **App shell pages** — Dashboard, Builder, Analytics: remove `shadow-soft`/`shadow-large`, switch headers to hairline borders, serif page titles, emerald only for primary actions and status accents.
3. **Auth + Reset Password** — drop the heavy shadowed card for a bordered hairline panel, serif heading, centered layout.
4. **Upgrade / Settings (Profile, Billing, Account)** — flatten cards, unify heading typography, emerald highlight for the active plan instead of `shadow-lg`.
5. **Play** — keep the learner theme system intact; only align chrome (header, results, buttons) to the minimal-radius, hairline look.
6. **Blog, BlogPost, Help, Privacy, Terms, NotFound** — wrap in the shared `Section` component, serif titles, remove `rounded-2xl` and shadows.
7. **Admin pages** — lighten the sidebar and table chrome to hairlines; keep density.

## Technical notes

- No new tokens: reuse `--hero-band`, `--primary`, `--muted-foreground`, `--border`, `--radius` from `src/index.css`.
- Reuse `src/components/landing/Section.tsx` for content pages; app pages keep their own layouts but adopt the same typography and border rules.
- Purely presentational — no changes to data fetching, auth, or business logic.
- Player themes in `PreviewThemePicker` stay as-is; they're end-user choices, not app chrome.
