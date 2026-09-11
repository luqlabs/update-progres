# Ad-readiness round 1: trust and pricing clarity

Scope is limited to two items from the earlier list: fix the invented social proof and add the privacy relief angle, then make credit pricing unambiguous. Tracking, Reddit pixel, and the channel landing pages are deferred until you ask.

## 1. Testimonials and the privacy angle

**Replace the invented testimonials.** `src/components/landing/TestimonialSection.tsx` currently carries three named quotes ("Dr. Sarah Mitchell", "Marcus Chen", "Jennifer Rodriguez") that are not real customers. Meta, LinkedIn, and Reddit all treat fabricated testimonials as misrepresentation, and academics spot them instantly. Swap the section for an honest proof block that says nothing untrue:

- Keep the section slot and Academic Editorial styling, drop the fake attribution.
- Content becomes concrete capability proof: what a lecturer actually gets in five minutes (a pre-lecture check built from their own PDF, three activity formats from one source, cohort gap breakdown), plus subject examples already used elsewhere on the page.
- No numbers, ratings, or quotes are claimed anywhere in the replacement.
- The component keeps a simple data array so real quotes can drop straight back in when you collect them.

**Add the privacy and adoption strip.** The strongest argument in the research is that Quizabl collects no student PII, so there is no IT ticket, no data agreement, no departmental approval. The page only mentions "no student logins" as convenience. Add a short strip beneath the existing "Works with your material" trust strip in `src/pages/Index.tsx`:

- Four plain lines: no student accounts, no student personal data collected, nothing for IT to approve, one link on any device.
- Factual wording only. No claim of FERPA, GDPR, or any certification, since that would be an unverified compliance claim.

## 2. Pricing clarity inside the cards

Credit ambiguity is a known cause of checkout abandonment, and today the definition sits far down in the FAQ. In `src/components/landing/PricingPreview.tsx`:

- Add a one-line credit explainer inside each paid card: one credit is one AI generation or one AI chat edit; manual edits, sharing, plays and analytics are free.
- Add a capacity anchor so the number means something, phrased from the plan's own limits rather than invented usage data.
- Make "cancel anytime" visible in each paid card next to the CTA, not only in the FAQ.
- Keep the existing trust strip already inside each card.

**One thing to confirm:** your research document says the free tier allows up to 50 activities, the site FAQ says 10. I will keep the site's current 10 unless you tell me otherwise.

## Technical notes

- Files touched: `src/components/landing/TestimonialSection.tsx`, `src/pages/Index.tsx`, `src/components/landing/PricingPreview.tsx`.
- Presentation and copy only. No schema, pricing logic, or checkout behaviour changes; the credit lines are static copy, not derived from plan records.
