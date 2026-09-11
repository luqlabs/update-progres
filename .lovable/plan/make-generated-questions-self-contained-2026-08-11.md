# Make generated questions self-contained

## Problem

When a lecturer uploads a document or link, the AI sometimes writes questions that reference the source material itself, for example "According to the provided text, what characteristic makes a person most beloved to Allah...". Students never see the source document — they only see the question — so these questions are unanswerable and look unprofessional.

## Goal

Every generated question must stand on its own: it carries all the context a student needs inside the question text, and never refers to "the text", "the passage", "the document", "the article", "the author", or "the provided material".

## What changes

### 1. Prompt rules (both generation paths)

Add an explicit self-contained-question rule to the AI instructions in both places that produce content:

- `supabase/functions/generate-app/index.ts` — all three system prompts (create, replace, modify).
- `supabase/functions/chat-assistant/index.ts` — `buildSystemPrompt`, especially the reference-material block that currently only says "use this content".

The rule states:
- Never reference the source. Banned openings/phrases: "According to the provided text/passage/document/article/author/reading", "Based on the text", "In the passage", "as mentioned above", "the excerpt states".
- Use the document only as knowledge, not as an object the student can see.
- If a question needs context (a quote, a scenario, a formula, a case), embed that context directly in the question text so it reads standalone.
- Rewrite instead of dropping: turn "According to the text, what makes a person most beloved to Allah?" into "What characteristic is described as making a person most beloved to Allah and closest to His seat on the Day of Judgment?".
- Same rule applies to flashcard fronts/backs and matching prompts.

### 2. Server-side safety net

In `generate-app`'s `validateConfig`, add a check that scans question text (and flashcard fronts / matching prompts) for source-reference phrases and records them as warnings, so bad output is visible in logs rather than silently shipped. Detection is phrase-based and case-insensitive, covering the banned list above.

This stays a warning (not a hard error) so a generation is never rejected outright — the prompt rules are the primary fix.

## Technical notes

- Files touched: `supabase/functions/generate-app/index.ts`, `supabase/functions/chat-assistant/index.ts`. No database or frontend changes.
- The phrase list will be a single shared constant inside `generate-app` used by the validator.
- Both edge functions get redeployed as part of the change.

## Out of scope

- Automatically rewriting an offending question after the fact (a second AI pass) — the prompt rules plus warnings should be enough; we can add auto-repair later if you still see leaks.
- Existing already-generated quizzes are not retro-fixed; they can be edited manually or regenerated.
