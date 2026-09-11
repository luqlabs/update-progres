-- Grant INSERT permission on student_sessions table with explicit syntax
-- The table uses UUID primary key with gen_random_uuid(), so no sequence is needed
GRANT INSERT ON TABLE public.student_sessions TO anon;
GRANT INSERT ON TABLE public.student_sessions TO authenticated;
GRANT INSERT ON TABLE public.student_sessions TO authenticator;
GRANT INSERT ON TABLE public.student_sessions TO service_role;