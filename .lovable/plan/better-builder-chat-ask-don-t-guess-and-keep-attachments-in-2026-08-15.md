# Better builder chat: ask, don't guess — and keep attachments in history

Two problems today: the assistant sometimes replies with a generic "I'm here to help! What would you like to create?" instead of using the conversation (e.g. answering "10 questions"), and the document/link chip on a past message disappears after a page refresh because attachments are never saved.

## 1. Never guess — ask like a real assistant

- Rewrite the assistant's instructions so it must resolve ambiguity before creating anything: if activity type, topic, question count, difficulty, or which source to use is unclear, it asks instead of inventing.
- Answers are always read in context. A bare reply like "10 questions" is treated as the answer to the question just asked, never as a new, meaningless prompt.
- It may only ask about things it genuinely cannot infer; if the user's message plus the attached document already say enough, it proceeds and states the assumptions it used in one line.
- One question at a time, short and plain — no interrogation lists.

## 2. Clarifying questions with clickable options

When the assistant asks something with a small set of sensible answers, it returns those answers with the question and the chat renders them as clickable chips (e.g. `Quiz` / `Flashcards` / `Matching game`, or `10` / `15` / `20`). Clicking one sends it immediately; the user can still type a free-form answer instead. Chips only appear on the newest question and are disabled once answered, so scrolled-back history is not clickable.

## 3. Attachments persist in chat history

Each saved message stores what it was attached to (kind, label, and URL for links). On reload, past user bubbles again show the same chip — a file icon with the PDF/DOCX name, or a link icon with the site name that opens in a new tab. Chip style stays exactly as it is now; no image thumbnails, no extra uploads.

## 4. Smaller chat UX fixes

- Remove the generic filler reply: if the model returns nothing usable, show a clear retry message instead of a canned greeting.
- Failed sends keep the typed text so nothing is lost.
- Keep the input focused after sending and after a reply arrives.

## Technical notes

- `chat_messages` gains `attachment_kind`, `attachment_label`, `attachment_sublabel`, `attachment_href` (all nullable text), with GRANTs matching the table's existing policies. `saveMessage` and the bulk insert in `Builder.tsx` write them; the history loader maps them back into `Message.attachment` so `AttachmentChip` renders unchanged.
- `supabase/functions/chat-assistant/index.ts`: strengthen the system prompt with an explicit clarify-before-generate rule and context-carry rule; extend the `chat` action payload with an optional `options: string[]`; drop the hardcoded fallback string in favour of an explicit error path.
- `ChatInterface.tsx`: render `options` as quick-reply chips under the latest assistant message, wired to the existing send path; preserve input on error.
