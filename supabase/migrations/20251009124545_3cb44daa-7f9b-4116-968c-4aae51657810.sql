-- Enable realtime for user_subscriptions table
-- This allows users to receive automatic updates when their subscription changes
ALTER PUBLICATION supabase_realtime ADD TABLE user_subscriptions;