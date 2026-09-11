-- Allow admins to view all profiles
CREATE POLICY "Admins can view all profiles" 
ON public.profiles 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Allow admins to view all apps  
CREATE POLICY "Admins can view all apps"
ON public.apps
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Allow admins to view all sessions
CREATE POLICY "Admins can view all sessions"
ON public.student_sessions
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));