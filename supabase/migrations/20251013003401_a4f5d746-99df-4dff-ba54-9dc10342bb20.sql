-- Grant INSERT permission on student_sessions to allow session creation
GRANT INSERT ON public.student_sessions TO anon;
GRANT INSERT ON public.student_sessions TO authenticated;

-- Grant sequence permissions for auto-incrementing id
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;