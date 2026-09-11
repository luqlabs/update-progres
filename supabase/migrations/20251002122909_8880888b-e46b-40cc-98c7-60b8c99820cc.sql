-- Fix RLS policies for student_sessions to allow unauthenticated inserts

-- Drop existing policies
DROP POLICY IF EXISTS "Anyone can insert sessions" ON public.student_sessions;
DROP POLICY IF EXISTS "Anyone can update their own session" ON public.student_sessions;
DROP POLICY IF EXISTS "Anyone can insert responses" ON public.student_responses;

-- Create new policy that explicitly allows unauthenticated users to insert
CREATE POLICY "Allow unauthenticated users to insert sessions"
  ON public.student_sessions
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Allow unauthenticated users to update sessions (for completing them)
CREATE POLICY "Allow unauthenticated users to update sessions"
  ON public.student_sessions
  FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- Allow unauthenticated users to insert responses
CREATE POLICY "Allow unauthenticated users to insert responses"
  ON public.student_responses
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);