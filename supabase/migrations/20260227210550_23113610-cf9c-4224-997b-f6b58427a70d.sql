ALTER TABLE public.apps
  ADD COLUMN document_context jsonb DEFAULT NULL,
  ADD COLUMN url_context jsonb DEFAULT NULL;