-- Function to increment apps_created counter
CREATE OR REPLACE FUNCTION increment_apps_created()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.usage_tracking (user_id, apps_created, created_at, updated_at)
  VALUES (NEW.teacher_id, 1, NOW(), NOW())
  ON CONFLICT (user_id) 
  DO UPDATE SET 
    apps_created = usage_tracking.apps_created + 1,
    updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger for apps table to track app creation
CREATE TRIGGER track_app_creation
AFTER INSERT ON public.apps
FOR EACH ROW
EXECUTE FUNCTION increment_apps_created();

-- Function to increment monthly_plays counter
CREATE OR REPLACE FUNCTION increment_monthly_plays()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.completed_at IS NULL AND NEW.completed_at IS NOT NULL THEN
    INSERT INTO public.usage_tracking (user_id, monthly_plays, created_at, updated_at)
    VALUES (
      (SELECT teacher_id FROM public.apps WHERE id = NEW.app_id),
      1,
      NOW(),
      NOW()
    )
    ON CONFLICT (user_id)
    DO UPDATE SET 
      monthly_plays = usage_tracking.monthly_plays + 1,
      updated_at = NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger for student_sessions table to track play completion
CREATE TRIGGER track_session_completion
AFTER UPDATE ON public.student_sessions
FOR EACH ROW
EXECUTE FUNCTION increment_monthly_plays();

-- Fix existing data: Update usage_tracking with actual counts for all users
WITH app_counts AS (
  SELECT teacher_id, COUNT(*) as total_apps
  FROM public.apps
  GROUP BY teacher_id
),
play_counts AS (
  SELECT a.teacher_id, COUNT(*) as total_plays
  FROM public.student_sessions ss
  JOIN public.apps a ON a.id = ss.app_id
  WHERE ss.completed_at IS NOT NULL
  GROUP BY a.teacher_id
)
INSERT INTO public.usage_tracking (user_id, apps_created, monthly_plays, created_at, updated_at)
SELECT 
  COALESCE(ac.teacher_id, pc.teacher_id) as user_id,
  COALESCE(ac.total_apps, 0) as apps_created,
  COALESCE(pc.total_plays, 0) as monthly_plays,
  NOW() as created_at,
  NOW() as updated_at
FROM app_counts ac
FULL OUTER JOIN play_counts pc ON ac.teacher_id = pc.teacher_id
ON CONFLICT (user_id)
DO UPDATE SET
  apps_created = EXCLUDED.apps_created,
  monthly_plays = EXCLUDED.monthly_plays,
  updated_at = NOW();