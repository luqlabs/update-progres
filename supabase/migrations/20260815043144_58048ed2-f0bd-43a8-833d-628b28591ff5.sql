ALTER TABLE public.chat_messages
  ADD COLUMN IF NOT EXISTS attachment_kind text,
  ADD COLUMN IF NOT EXISTS attachment_label text,
  ADD COLUMN IF NOT EXISTS attachment_sublabel text,
  ADD COLUMN IF NOT EXISTS attachment_href text;