# Hero copy critique + SEO pain-point strategy for lecturers

## 1. Is the current hero psychologically right?

Current:
- H1: "Know what your students don't know — before you teach it."
- Sub: "Build a 5-minute formative quiz just by chatting. Share one link with your cohort, and walk into the lecture knowing exactly where the gaps are."

What works:
- Names a real fear lecturers feel weekly (teaching over students' heads, discovering it at the exam).
- "Before you teach it" creates urgency tied to a fixed deadline (next lecture).
- Sub-line carries effort ("5 minutes", "just by chatting") and friction removal ("one link").

What is weak:
- The headline sells *insight*, not *relief*. Lecturers do not lack awareness that gaps exist; they lack time and a painless way to act. The strongest subscription trigger for this audience is time saved plus not looking unprepared, not analytics.
- "Formative quiz" is jargon-correct but emotionally flat, and it is also the exact word Kahoot/Mentimeter own.
- No identity signal. Nothing on the page says "this was built for university teaching, not K-12 gamified fun" in the first two seconds — that is the single biggest differentiator against Kahoot/ClassPoint.
- No risk reversal in the hero (free, no student logins, no LMS admin needed).

Recommended direction: keep the gap insight as the *sub*, and promote identity + effort to the headline.

Candidate H1s to test (pick one):
1. "Walk into every lecture knowing what your cohort already understands." — identity + confidence
2. "Five minutes before the lecture. Zero surprises during it." — effort + relief
3. "Built for lecturers, not classrooms of ten-year-olds." — differentiation, sharper but riskier
4. Keep current H1, change sub to lead with time + no-login friction.

Proposed hero package (default recommendation):
- Eyebrow: "For lecturers, tutors and professors"
- H1: "Walk into every lecture knowing what your cohort is still struggling with — and what to explain next."
- Sub: "Chat for five minutes, get a pre-lecture check, share one link. No student logins, no LMS setup, no marking."
- Primary CTA: "Build your first check — free"
- Micro-trust under CTA: "Free plan, no card. Works with your PDFs, slides and notes."

## 2. SEO pain-point analysis (grounded in Semrush, US database)

Demand reality:
- "ai quiz generator" 2,900/mo, KD 70 — crowded, dominated by consumer study tools. Not winnable head-on.
- "quiz maker" 12,100/mo, "study guide maker" 14,800/mo — student intent, wrong audience.
- "formative assessment" 22,200/mo, KD low on most variants; "formative vs summative" 12,100/mo; "formative assessment examples" 4,400/mo.
- "diagnostic assessment" 1,900/mo, KD 35; "how to create a diagnostic assessment" exists as a question.
- "teacher tools" / "teacher teaching tools" 3,600/mo, CPC $1.46 — commercial intent, but K-12 skewed.

Interpretation: the winnable ground is the *pedagogy vocabulary*, not the *tool vocabulary*. Educators search concepts before products, and those concept pages have low competition and high topical fit for Quizabl.

Cross-country pains that map to the same searches (UK, AU, MY/SG, IE, CA, ZA):
1. Mixed-preparedness cohorts after intake widening — "students arrive without prerequisites".
2. Large first-year classes where no lecturer can tell who is lost until the mid-semester exam.
3. Institutional pressure to evidence formative assessment and constructive alignment for accreditation/QA reviews.
4. LMS friction: Moodle/Canvas/Blackboard quiz builders are slow, and IT approval is required for new integrations.
5. Attendance and engagement decline post-2020; lecturers asked to "make lectures interactive" with no extra time.
6. Non-native-English cohorts, especially in MY/SG/Gulf, where comprehension gaps are invisible in silence.

## 3. Proposed SEO content plan

Hub: "Formative assessment for university lecturers" — a pillar page owning the concept in a higher-ed frame.

Spokes (each answers one pain, each links back to the hub and to signup):
- Formative vs summative assessment in higher education (high volume, low KD)
- 15 formative assessment examples you can run in a 5-minute lecture slot
- How to create a diagnostic assessment before the first lecture (with a template)
- Pre-lecture knowledge checks for large first-year cohorts
- Formative assessment without adding to your marking load
- Running quick checks alongside Moodle/Canvas without an IT ticket

Each page includes a live, usable element (question templates or a sample check the lecturer can copy), not just prose, so the page has utility beyond ranking.

## Technical notes

- Hero copy change is confined to `src/pages/Index.tsx` (h1, paragraph, CTA labels) plus a new eyebrow line; no logic changes.
- The blog system already exists (`src/pages/Blog.tsx`, `BlogPost.tsx`, admin editor, sitemap function), so spokes are published as blog posts, with the hub as a static route if you want stronger internal linking.
- Head metadata for any new route follows the existing `Helmet` + `src/lib/seo.ts` pattern.

## Scope for this round

Suggested first step: hero rewrite only, then the pillar page, then spokes one at a time. Confirm the H1 choice before I implement.
