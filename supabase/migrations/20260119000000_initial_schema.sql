-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ── Users ──────────────────────────────────────────────────
-- Global platform role: Guest (unverified) | User (verified) | Admin
-- Board-level roles (Mod / Leader) live in user_boards.
CREATE TABLE IF NOT EXISTS users (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  display_name     TEXT,
  email            TEXT        UNIQUE NOT NULL,
  email_verified   BOOLEAN     DEFAULT FALSE,
  phone_number     TEXT,
  notify_via_email BOOLEAN     DEFAULT FALSE,
  notify_via_sms   BOOLEAN     DEFAULT FALSE,
  role             TEXT        CHECK (role IN ('Guest', 'User', 'Admin')) DEFAULT 'Guest',
  is_active        BOOLEAN     DEFAULT TRUE,
  last_login_at    TIMESTAMPTZ,
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);

-- ── Boards ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS boards (
  id                  UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  name                TEXT    NOT NULL UNIQUE,
  invite_code         TEXT    NOT NULL UNIQUE,
  invite_code_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  created_by          UUID    REFERENCES users(id) ON DELETE SET NULL,
  is_active           BOOLEAN NOT NULL DEFAULT TRUE,
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);

-- ── User ↔ Board membership ────────────────────────────────
CREATE TABLE IF NOT EXISTS user_boards (
  id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID        NOT NULL REFERENCES users(id)  ON DELETE CASCADE,
  board_id            UUID        NOT NULL REFERENCES boards(id) ON DELETE CASCADE,
  role                TEXT        NOT NULL CHECK (role IN ('User', 'Mod', 'Leader')),
  is_approved         BOOLEAN     NOT NULL DEFAULT FALSE,
  approved_by_user_id UUID        REFERENCES users(id) ON DELETE SET NULL,
  approved_at         TIMESTAMPTZ,
  requested_at        TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, board_id)
);

-- ── Board invite-code rate limiting ───────────────────────
CREATE TABLE IF NOT EXISTS board_join_attempts (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  code_entered TEXT        NOT NULL,
  outcome      TEXT        NOT NULL CHECK (outcome IN ('invalid_code', 'user_declined', 'success')),
  attempted_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── Shifts (offers) ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS shifts (
  id                   UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by           TEXT        NOT NULL,
  user_id              UUID        REFERENCES users(id)  ON DELETE SET NULL,
  board_id             UUID        REFERENCES boards(id) ON DELETE CASCADE,
  shift_title          TEXT        NOT NULL,
  start_time           TIMESTAMPTZ NOT NULL,
  end_time             TIMESTAMPTZ NOT NULL,
  is_trade             BOOLEAN     DEFAULT FALSE,
  is_giveaway          BOOLEAN     DEFAULT FALSE,
  is_overtime_approved BOOLEAN     DEFAULT FALSE,
  details              TEXT,
  is_active            BOOLEAN     DEFAULT TRUE,
  expires_at           TIMESTAMPTZ,
  created_at           TIMESTAMPTZ DEFAULT NOW()
);

-- ── Requests ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS requests (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by      TEXT        NOT NULL,
  user_id         UUID        REFERENCES users(id)  ON DELETE SET NULL,
  board_id        UUID        REFERENCES boards(id) ON DELETE CASCADE,
  preferred_times TEXT[]      NOT NULL CHECK (preferred_times <@ ARRAY['morning', 'afternoon', 'evening', 'late']),
  requested_date  DATE        NOT NULL,
  details         TEXT,
  is_active       BOOLEAN     DEFAULT TRUE,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  expires_at      TIMESTAMPTZ
);

-- ── Flags ─────────────────────────────────────────────────
-- board_id set for post/comment flags (board the post belongs to)
-- and for board flags (board_id = target_id).
CREATE TABLE IF NOT EXISTS flags (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  flagged_by_user_id  UUID REFERENCES users(id) ON DELETE SET NULL,
  target_type         TEXT CHECK (target_type IN ('post', 'user', 'comment', 'board')) NOT NULL,
  target_id           UUID NOT NULL,
  board_id            UUID REFERENCES boards(id) ON DELETE SET NULL,
  reason              TEXT NOT NULL,
  status              TEXT CHECK (status IN ('pending', 'resolved', 'dismissed')) DEFAULT 'pending',
  resolved_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at          TIMESTAMPTZ DEFAULT NOW()
);

-- ── Comments ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS comments (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  post_type  TEXT        CHECK (post_type IN ('shift', 'request')) NOT NULL,
  post_id    UUID        NOT NULL,
  user_id    UUID        REFERENCES users(id) ON DELETE SET NULL,
  body       TEXT        NOT NULL,
  is_interested BOOLEAN  DEFAULT FALSE,
  is_active  BOOLEAN     DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── Indexes ───────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_shifts_board             ON shifts(board_id, is_active);
CREATE INDEX IF NOT EXISTS idx_shifts_active_time       ON shifts(is_active, start_time, created_at);
CREATE INDEX IF NOT EXISTS idx_requests_board           ON requests(board_id, is_active);
CREATE INDEX IF NOT EXISTS idx_requests_active_date     ON requests(is_active, requested_date);
CREATE INDEX IF NOT EXISTS idx_flags_status_time        ON flags(status, created_at);
CREATE INDEX IF NOT EXISTS idx_users_email              ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role_active        ON users(role, is_active);
CREATE INDEX IF NOT EXISTS idx_boards_invite_code       ON boards(invite_code);
CREATE INDEX IF NOT EXISTS idx_user_boards_user         ON user_boards(user_id, is_approved);
CREATE INDEX IF NOT EXISTS idx_user_boards_board        ON user_boards(board_id, is_approved);
CREATE INDEX IF NOT EXISTS idx_join_attempts_user_time  ON board_join_attempts(user_id, attempted_at);

-- ── Trigger functions ─────────────────────────────────────

CREATE OR REPLACE FUNCTION set_shift_expires_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.expires_at = NEW.start_time - INTERVAL '30 minutes';
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION set_request_expires_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.expires_at = (NEW.requested_date + INTERVAL '1 day' - INTERVAL '1 second')::TIMESTAMPTZ;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT LOWER(role) FROM public.users WHERE id = auth.uid()
$$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.users (id, email, role, is_active)
  VALUES (NEW.id, NEW.email, 'Guest', true)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.handle_email_verified()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF OLD.email_confirmed_at IS NULL AND NEW.email_confirmed_at IS NOT NULL THEN
    UPDATE public.users
    SET role = 'User', email_verified = true
    WHERE id = NEW.id AND role = 'Guest';
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.is_board_member(p_board_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_boards
    WHERE user_id = auth.uid()
      AND board_id = p_board_id
      AND is_approved = true
  )
$$;

CREATE OR REPLACE FUNCTION public.is_board_moderator(p_board_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_boards
    WHERE user_id = auth.uid()
      AND board_id = p_board_id
      AND is_approved = true
      AND role IN ('Mod', 'Leader')
  )
$$;

CREATE OR REPLACE FUNCTION public.is_board_leader(p_board_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_boards
    WHERE user_id = auth.uid()
      AND board_id = p_board_id
      AND is_approved = true
      AND role = 'Leader'
  )
$$;

CREATE OR REPLACE FUNCTION public.is_any_board_moderator()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_boards
    WHERE user_id = auth.uid()
      AND is_approved = true
      AND role IN ('Mod', 'Leader')
  )
$$;

-- ── Triggers ──────────────────────────────────────────────

CREATE TRIGGER set_shifts_expires_at
  BEFORE INSERT ON shifts
  FOR EACH ROW EXECUTE FUNCTION set_shift_expires_at();

CREATE TRIGGER set_requests_expires_at
  BEFORE INSERT ON requests
  FOR EACH ROW EXECUTE FUNCTION set_request_expires_at();

CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_boards_updated_at
  BEFORE UPDATE ON boards
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_comments_updated_at
  BEFORE UPDATE ON comments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

DROP TRIGGER IF EXISTS on_auth_user_email_verified ON auth.users;
CREATE TRIGGER on_auth_user_email_verified
  AFTER UPDATE ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_email_verified();
