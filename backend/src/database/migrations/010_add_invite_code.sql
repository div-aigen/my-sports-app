-- Add invite_code column to sessions table
-- Format: 6 uppercase letters (e.g., ABCDEF) - short and easy to share verbally
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS invite_code VARCHAR(6) UNIQUE;

-- Create index for fast lookup
CREATE INDEX IF NOT EXISTS idx_sessions_invite_code ON sessions(invite_code);

-- Generate invite codes for existing sessions
UPDATE sessions
SET invite_code = UPPER(SUBSTRING(MD5(RANDOM()::TEXT || id::TEXT) FROM 1 FOR 6))
WHERE invite_code IS NULL;

-- Replace any digits/special chars with letters to keep it all alphabetic
UPDATE sessions
SET invite_code = TRANSLATE(invite_code, '0123456789', 'ABCDEFGHIJ')
WHERE invite_code ~ '[0-9]';

-- Make NOT NULL after populating
ALTER TABLE sessions ALTER COLUMN invite_code SET NOT NULL;
