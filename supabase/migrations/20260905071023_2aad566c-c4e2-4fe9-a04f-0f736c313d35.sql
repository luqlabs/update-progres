ALTER TABLE public.chat_messages
  ADD COLUMN IF NOT EXISTS options jsonb,
  ADD COLUMN IF NOT EXISTS option_mode text,
  ADD COLUMN IF NOT EXISTS answered_with text;