-- Fix student_sessions INSERT policy to allow both anon and authenticated users
DROP POLICY IF EXISTS "Allow anon to insert sessions" ON public.student_sessions;

CREATE POLICY "Allow anyone to insert sessions"
ON public.student_sessions
FOR INSERT
TO public
WITH CHECK (true);