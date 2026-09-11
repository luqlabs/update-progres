-- Allow students to read their own responses for question breakdown
CREATE POLICY "Allow reading responses for accessible sessions"
ON public.student_responses
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM student_sessions 
    WHERE student_sessions.id = student_responses.session_id
  )
);