REVOKE EXECUTE ON FUNCTION public.increment_apps_created() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.increment_monthly_plays() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_reading_time() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_updated_at() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_blog_updated_at() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_last_seen() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;