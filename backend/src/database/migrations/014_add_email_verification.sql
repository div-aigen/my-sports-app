-- Add email verification fields to users table
ALTER TABLE users
ADD COLUMN email_verified BOOLEAN DEFAULT FALSE,
ADD COLUMN verification_token VARCHAR(255),
ADD COLUMN verification_token_expiry TIMESTAMP;

-- Index for faster token lookups
CREATE INDEX IF NOT EXISTS idx_users_verification_token ON users(verification_token);

-- Mark all existing users as verified so they aren't locked out
UPDATE users SET email_verified = TRUE;

-- Add comments for documentation
COMMENT ON COLUMN users.email_verified IS 'Whether the user has verified their email address';
COMMENT ON COLUMN users.verification_token IS 'One-time use token for email verification (6-character hex)';
COMMENT ON COLUMN users.verification_token_expiry IS 'Expiration timestamp for verification token (1 hour validity)';
