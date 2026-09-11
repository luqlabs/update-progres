-- Add DELETE policy for teachers to remove student sessions for their apps
CREATE POLICY "Teachers can delete sessions for their apps"
ON public.student_sessions
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.apps
    WHERE apps.id = student_sessions.app_id
    AND apps.teacher_id = auth.uid()
  )
);

-- Ensure cascade delete for student_responses when session is deleted
ALTER TABLE public.student_responses
DROP CONSTRAINT IF EXISTS student_responses_session_id_fkey,
ADD CONSTRAINT student_responses_session_id_fkey
  FOREIGN KEY (session_id)
  REFERENCES public.student_sessions(id)
  ON DELETE CASCADE;