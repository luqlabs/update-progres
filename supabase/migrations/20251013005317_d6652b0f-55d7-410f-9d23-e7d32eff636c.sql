-- Drop the existing INSERT policy that doesn't properly target roles
DROP POLICY IF EXISTS "Allow anyone to insert sessions" ON public.student_sessions;

-- Create new INSERT policy explicitly for anon and authenticated roles
CREATE POLICY "Allow anonymous and authenticated users to insert sessions"
ON public.student_sessions
FOR INSERT
TO anon, authenticated
WITH CHECK (true);