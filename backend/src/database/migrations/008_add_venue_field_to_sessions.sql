-- Add new columns (nullable for backward compatibility)
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS sport_type VARCHAR(50);
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS venue_id INTEGER REFERENCES venues(id) ON DELETE SET NULL;
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS field_id INTEGER REFERENCES fields(id) ON DELETE SET NULL;

-- Create indexes for efficient conflict detection
CREATE INDEX IF NOT EXISTS idx_sessions_venue_id ON sessions(venue_id);
CREATE INDEX IF NOT EXISTS idx_sessions_field_id ON sessions(field_id);
CREATE INDEX IF NOT EXISTS idx_sessions_sport_type ON sessions(sport_type);

-- Composite index for conflict detection queries (only non-cancelled sessions)
CREATE INDEX IF NOT EXISTS idx_sessions_field_date_time ON sessions(field_id, scheduled_date, scheduled_time, scheduled_end_time)
WHERE status != 'cancelled';

COMMENT ON COLUMN sessions.sport_type IS 'Type of sport: Cricket, Football, Basketball, etc.';
COMMENT ON COLUMN sessions.venue_id IS 'Reference to venues table (null for legacy sessions)';
COMMENT ON COLUMN sessions.field_id IS 'Specific field assigned to this session (null for legacy sessions)';
