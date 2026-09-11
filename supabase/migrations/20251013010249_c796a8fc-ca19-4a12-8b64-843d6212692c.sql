
-- Grant INSERT permission on student_sessions to anon and authenticated roles
GRANT INSERT ON public.student_sessions TO anon, authenticated;

-- Also grant UPDATE for session completion
GRANT UPDATE ON public.student_sessions TO anon, authenticated;

-- Grant SELECT so they can read their own session data
GRANT SELECT ON public.student_sessions TO anon, authenticated;
