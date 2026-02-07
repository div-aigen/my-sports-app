-- Add scheduled_end_time column to sessions table
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS scheduled_end_time TIME;

-- Create index on scheduled_end_time for performance (if not exists)
CREATE INDEX IF NOT EXISTS idx_sessions_scheduled_end_time ON sessions(scheduled_end_time);
