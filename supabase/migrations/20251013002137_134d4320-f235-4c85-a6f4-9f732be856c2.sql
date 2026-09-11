-- Fix student_sessions INSERT policy for anonymous users
DROP POLICY IF EXISTS "Allow unauthenticated users to insert sessions" ON public.student_sessions;

CREATE POLICY "Allow anon to insert sessions"
ON public.student_sessions
FOR INSERT
TO anon
WITH CHECK (true);