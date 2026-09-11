
-- Drop the existing restrictive SELECT policies
DROP POLICY IF EXISTS "Teachers can view sessions for their apps" ON public.student_sessions;

-- Create new SELECT policy for teachers
CREATE POLICY "Teachers can view sessions for their apps"
ON public.student_sessions
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM apps
    WHERE apps.id = student_sessions.app_id
    AND apps.teacher_id = auth.uid()
  )
);

-- Create SELECT policy for anonymous users to read their own sessions
CREATE POLICY "Allow anonymous and authenticated users to read sessions"
ON public.student_sessions
FOR SELECT
TO anon, authenticated
USING (true);
