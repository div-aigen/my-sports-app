-- Add session_id column to sessions table
-- Format: xxxx-xxxx-xxxx-xxxx (19 chars including hyphens)
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS session_id VARCHAR(19) UNIQUE;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_sessions_session_id ON sessions(session_id);

-- Generate session_id for existing sessions (random 16-char alphanumeric)
-- This will be handled by the backend for new sessions
UPDATE sessions
SET session_id = UPPER(
  SUBSTRING(MD5(RANDOM()::TEXT || id::TEXT || CURRENT_TIMESTAMP::TEXT) FROM 1 FOR 16)
)
WHERE session_id IS NULL;

-- Make session_id NOT NULL after populating existing records
ALTER TABLE sessions ALTER COLUMN session_id SET NOT NULL;
