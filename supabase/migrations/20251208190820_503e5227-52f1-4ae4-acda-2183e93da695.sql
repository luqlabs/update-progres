-- Add column to track when user last read notifications
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS last_notification_read_at TIMESTAMPTZ;