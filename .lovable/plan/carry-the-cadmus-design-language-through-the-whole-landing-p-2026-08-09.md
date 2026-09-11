# Carry the Cadmus design language through the whole landing page

The hero band is right. Everything below it still uses the older card-heavy layout: bordered boxes with shadows, mixed container widths, repeated section eyebrows, and too many sections saying similar things. The fix is a consistent set of rules applied down the page, plus trimming duplication.

## The design rules to apply everywhere

1. **Band rhythm.** The page alternates full-bleed colour bands instead of floating grey blocks: deep emerald (hero), white, white, emerald, white, soft off-white, emerald CTA. No `bg-secondary/50` half-tints.
2. **No card chrome by default.** Remove borders, rounded-2xl boxes and shadows from content grids. Content sits directly on the band, separated by whitespace and thin rules — the way the benefit grid already does it.
3. **One container width.** Every section uses the same `max-w-6xl` container and the same horizontal padding as the hero.
4. **One heading pattern.** Small uppercase eyebrow, then a serif display headline, then one supporting line. Same sizes in every section. Headline colour flips to the light tone inside emerald bands.
5. **Generous vertical space.** Uniform section padding, larger than today, so sections breathe like the hero does.
6. **Real imagery over icon tiles.** Where a section currently leads with a lucide icon in a green square, prefer a photo or a product frame; keep icons only for small supporting lists.

## Section-by-section

- **Trust bar** — keep, but restyle as a quiet centered strip of source types under the hero, no top border box feel.
- **Animated demo** — keep as-is; it already fits. Move it directly under the trust bar (already there).
- **How it works** — drop the three bordered cards. Render as three numbered columns with a hairline divider between them, large step numerals in serif, no boxes.
- **Product tabs** — keep. Widen the image side and give the alternating rows more vertical room.
- **Why lecturers choose** — keep the structure; set it on an emerald band with light text so it becomes the page's second colour anchor.
- **Features** — currently a separate uniform card grid that overlaps with the product tabs. Reduce it to a compact capability list (two columns, hairline separated, no cards) so it supports rather than repeats the tabs.
- **Method comparison (Old way / Quizabl way)** — keep, restyle to the shared heading pattern and remove card borders; two clean columns split by a vertical rule.
- **Target audience** — restyle to plain columns matching the benefit grid.
- **Comparison section** — remove. It repeats the method comparison and dilutes the page.
- **Stats** — fold the count-up numbers into a slim strip inside the emerald band rather than a standalone section.
- **Testimonials** — restyle as large serif pull-quotes on white, attribution in small caps, no card boxes.
- **Pricing** — keep the three tiers and current copy; align typography, radius and spacing to the rest of the page, lighten the card borders.
- **FAQ** — plain hairline-separated accordion, shared heading pattern, no surrounding card.
- **Footer CTA** — keep the band but make it full-bleed emerald edge to edge, matching the hero, instead of a floating rounded black block.

## Technical notes

- Section order after the change: hero band, trust strip, animated demo, how it works, product tabs, emerald band (why + stats), features list, method comparison, target audience, testimonials, pricing, FAQ, emerald CTA band, footer.
- Add a small shared `SectionHeading` component and a `Section` wrapper (handles band colour, padding, container) in `src/components/landing/`, then use them across the listed sections so spacing and type can't drift again.
- Reuse the existing `--hero-band`, `--hero-band-foreground`, `--hero-band-muted` tokens for every emerald band; no new hardcoded colours.
- Delete `ComparisonSection` usage from `src/pages/Index.tsx`; leave the file in place unused only if it is referenced elsewhere.
- Content and copy stay as they are — this is a presentation-layer pass.
