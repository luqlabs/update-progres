CREATE TABLE public.credit_charges (
  message_id uuid PRIMARY KEY,
  user_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.credit_charges TO service_role;
ALTER TABLE public.credit_charges ENABLE ROW LEVEL SECURITY;