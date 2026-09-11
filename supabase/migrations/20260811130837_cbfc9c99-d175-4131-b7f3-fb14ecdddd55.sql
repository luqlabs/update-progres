-- 1. student_sessions: remove open anon read/insert/update
DROP POLICY IF EXISTS "Allow anonymous and authenticated users to read sessions" ON public.student_sessions;
DROP POLICY IF EXISTS "Allow anonymous and authenticated users to insert sessions" ON public.student_sessions;
DROP POLICY IF EXISTS "Allow session completion updates only" ON public.student_sessions;
REVOKE INSERT, UPDATE, SELECT, DELETE ON public.student_sessions FROM anon;
GRANT SELECT, DELETE ON public.student_sessions TO authenticated;
GRANT ALL ON public.student_sessions TO service_role;

-- 2. student_responses: remove open select + open insert
DROP POLICY IF EXISTS "Allow reading responses for accessible sessions" ON public.student_responses;
DROP POLICY IF EXISTS "Allow unauthenticated users to insert responses" ON public.student_responses;
REVOKE INSERT, UPDATE, SELECT, DELETE ON public.student_responses FROM anon;
GRANT SELECT ON public.student_responses TO authenticated;
GRANT ALL ON public.student_responses TO service_role;

-- 3. analytics_summary: remove blanket write policy
DROP POLICY IF EXISTS "System can update analytics" ON public.analytics_summary;
REVOKE INSERT, UPDATE, DELETE, SELECT ON public.analytics_summary FROM anon;
GRANT SELECT ON public.analytics_summary TO authenticated;
GRANT ALL ON public.analytics_summary TO service_role;

-- 4. usage_tracking: remove blanket manage policy
DROP POLICY IF EXISTS "System can manage usage" ON public.usage_tracking;
REVOKE INSERT, UPDATE, DELETE, SELECT ON public.usage_tracking FROM anon;
GRANT SELECT ON public.usage_tracking TO authenticated;
GRANT ALL ON public.usage_tracking TO service_role;

-- 5. user_subscriptions: remove anon read + blanket manage policy
DROP POLICY IF EXISTS "Allow anon read for play validation" ON public.user_subscriptions;
DROP POLICY IF EXISTS "System can manage subscriptions" ON public.user_subscriptions;
REVOKE INSERT, UPDATE, DELETE, SELECT ON public.user_subscriptions FROM anon;
GRANT SELECT ON public.user_subscriptions TO authenticated;
GRANT ALL ON public.user_subscriptions TO service_role;

-- 6. landing_feature_images: admin-only writes
DROP POLICY IF EXISTS "Authenticated users can insert feature images" ON public.landing_feature_images;
DROP POLICY IF EXISTS "Authenticated users can update feature images" ON public.landing_feature_images;

-- 7. admin_audit_log: no client-side inserts
DROP POLICY IF EXISTS "System can insert audit logs" ON public.admin_audit_log;
REVOKE INSERT, UPDATE, DELETE, SELECT ON public.admin_audit_log FROM anon;
REVOKE INSERT, UPDATE, DELETE ON public.admin_audit_log FROM authenticated;
GRANT SELECT ON public.admin_audit_log TO authenticated;
GRANT ALL ON public.admin_audit_log TO service_role;

-- 8. Fix mutable search_path
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

-- 9. Lock down SECURITY DEFINER function execution
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.get_user_credits(uuid) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.get_user_storage_bytes(uuid) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.can_create_app(uuid) FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.deduct_credit(uuid) FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.get_user_feature_limit(uuid, text) FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.calculate_reading_time(text) FROM anon, authenticated, public;

GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_user_credits(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_user_storage_bytes(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.can_create_app(uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.deduct_credit(uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.get_user_feature_limit(uuid, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.calculate_reading_time(text) TO service_role;