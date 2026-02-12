-- Add password reset token fields to users table
ALTER TABLE users
ADD COLUMN reset_token VARCHAR(255),
ADD COLUMN reset_token_expiry TIMESTAMP;

-- Index for faster token lookups
CREATE INDEX IF NOT EXISTS idx_users_reset_token ON users(reset_token);

-- Add comments for documentation
COMMENT ON COLUMN users.reset_token IS 'One-time use token for password reset (6-character hex)';
COMMENT ON COLUMN users.reset_token_expiry IS 'Expiration timestamp for reset token (1 hour validity)';
