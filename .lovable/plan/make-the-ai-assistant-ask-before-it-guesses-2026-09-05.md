# Make the AI Assistant ask before it guesses

The assistant already has a way to ask a question with clickable answers, but three things stop it from working the way you saw in Lovable's chat.

## What's actually wrong today

1. **The very first message skips the assistant entirely.** When you type a prompt on the dashboard or landing page and land in the builder, that first prompt goes straight to the generator. It never passes through the conversation step, so it can never ask you anything — it just guesses a quiz. This is almost certainly what you noticed.
2. **The clickable answers disappear on refresh.** Suggested answers are shown once but never stored with the message, so reloading the page leaves a question with no answers to click.
3. **The answers are plain text chips, not a question card.** There's no multi-select, no "you decide" escape, and no visual grouping — so it doesn't read as "the assistant is asking me something".

## What we'll build

**1. First prompt goes through the assistant**
The initial prompt from the dashboard/landing page will be handled like any other chat message. If the assistant has everything it needs (topic + what to build), it generates immediately as before. If something essential is missing, it asks first.

**2. A proper question card in the chat**
When the assistant needs context, it renders a distinct card inside the chat bubble:
- the question, one at a time
- 2–5 tappable answers
- optional multi-select (e.g. "which question types?") with a Confirm button
- always a "Let the assistant decide" and a free-text option so you're never stuck
Once answered, the card locks and shows your choice, like a completed step.

**3. Questions and answers survive refresh**
Store the suggested answers, the answer mode (pick one / pick many), and the chosen answer alongside the message, so the history shows exactly what was asked and what you picked.

**4. Clear rules on when to ask**
The assistant asks only when an essential detail is missing, and never more than two rounds before acting:
- what to build (quiz / flashcards / matching game) when not stated
- topic or which attached file/link to use, when unclear
- how many items, when not stated
- question types, when a mixed set is implied
It never invents facts, and once you answer, it acts immediately instead of asking again.

## Technical notes

- `ChatInterface.tsx`: route `initialPrompt` through `streamConversation` instead of `processGeneration`; add a `ClarifyCard` renderer for `message.options`; support `single`/`multi` modes, a locked answered state, and "Let the assistant decide".
- `chat_messages`: add `options` (jsonb), `option_mode` (text), `answered_with` (text) columns with a migration; persist them in `saveMessage` and hydrate them on load.
- `supabase/functions/chat-assistant/index.ts`: extend the `chat_response` tool with `optionMode` and `allowFreeText`; tighten the system prompt with an explicit "required info checklist" and a two-round cap so it stops asking once satisfied.
- Clarifying turns should not silently burn extra credits beyond the existing per-message cost; keep current credit behaviour unchanged.
