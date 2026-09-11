# Replace "faculty" with "lecturers" across the landing page

## Context
"Faculty" can read as institutional (a university department) rather than personal. The target market is the **individual** educator — lecturers, professors, assistant lecturers and TAs — so the copy should speak directly to them.

## Scope
Reword every "faculty" instance on the landing page to address individuals. Keep wording consistent with the existing "Academic Editorial" tone. No layout or component-structure changes — text only.

## Changes (text only)

**`src/components/landing/TargetAudienceSection.tsx`**
- Card titles: `STEM Faculty` → `STEM Lecturers`, `Law & Business Faculty` → `Law & Business Lecturers`, `Health Sciences Faculty` → `Health Sciences Lecturers`
- Section title: `Built for faculty who take student success personally` → `Built for lecturers who take student success personally`
- Subtitle already says "professors, lecturers and assistant lecturers" — keep as is.

**`src/components/landing/TestimonialSection.tsx`**
- eyebrow `Faculty voices` → `Lecturer voices`
- title `What faculty say` → `What lecturers say`

**`src/components/landing/ComparisonSection.tsx`**
- `Where Quizabl fits next to the tools most faculty already know.` → `Where Quizabl fits next to the tools most lecturers already know.`

**`src/components/landing/FAQSection.tsx`**
- FAQ 1 answer: `built for university faculty` → `built for university lecturers`
- FAQ Pro-tier answer: `for faculty teaching several cohorts` → `for lecturers teaching several cohorts`

**`src/components/landing/Footer.tsx`**
- Already uses "lecturers" — no change needed.

**`src/pages/Index.tsx`** (SEO meta + nav)
- No "faculty" in metadata or nav — no change needed.

## Verification
- Build/typecheck after edits.
- Grep confirms zero remaining `faculty` occurrences in `src/components/landing` and `src/pages/Index.tsx`.
