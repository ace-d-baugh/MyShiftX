-- Create user_types lookup table
CREATE TABLE IF NOT EXISTS user_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO user_types (name) VALUES
  ('Guest'),
  ('Cast'),
  ('CoPro'),
  ('Leader'),
  ('Admin')
ON CONFLICT (name) DO NOTHING;

-- Rename users.role → users.user_type
ALTER TABLE users RENAME COLUMN role TO user_type;

-- Drop old CHECK constraint and add new one with capitalized values
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE users ADD CONSTRAINT users_user_type_check
  CHECK (user_type IN ('Guest', 'Cast', 'CoPro', 'Leader', 'Admin'));

-- Update existing values to match new casing
UPDATE users SET user_type = 'Cast'   WHERE user_type = 'cast';
UPDATE users SET user_type = 'CoPro'  WHERE user_type = 'copro';
UPDATE users SET user_type = 'Leader' WHERE user_type = 'leader';
UPDATE users SET user_type = 'Admin'  WHERE user_type = 'admin';
UPDATE users SET user_type = 'Guest'  WHERE user_type = 'guest';

-- Update default value
ALTER TABLE users ALTER COLUMN user_type SET DEFAULT 'Guest';

-- Rename index
DROP INDEX IF EXISTS idx_users_role_active;
CREATE INDEX IF NOT EXISTS idx_users_user_type_active ON users(user_type, is_active);
