-- =============================================================================
-- GoGun — PostgreSQL 15+ Schema
-- Pure SQL: no ORM syntax
-- =============================================================================

-- Drop everything if re-running (reverse dependency order)
DROP VIEW  IF EXISTS availability_summary CASCADE;
DROP FUNCTION IF EXISTS trip_expense_balance(UUID) CASCADE;

DROP TABLE IF EXISTS
  wheel_options, packing_checks, packing_assignees, packing_items,
  checklist_checks, checklist_items,
  poll_votes, poll_options, polls,
  availability,
  transfer_slips,
  expense_splits, expenses,
  itinerary_activities, itinerary_days,
  trip_members, trips, users
CASCADE;

DROP TYPE IF EXISTS
  date_status_enum, trip_member_role_enum, trip_member_status_enum,
  transfer_status_enum, availability_status_enum,
  poll_status_enum, packing_category_enum
CASCADE;

-- =============================================================================
-- 1. ENUM TYPES
-- =============================================================================

CREATE TYPE date_status_enum        AS ENUM ('proposed', 'confirmed');
CREATE TYPE trip_member_role_enum   AS ENUM ('organizer', 'member');
CREATE TYPE trip_member_status_enum AS ENUM ('invited', 'joined', 'declined');
CREATE TYPE transfer_status_enum    AS ENUM ('pending', 'slip_attached', 'confirmed');
CREATE TYPE availability_status_enum AS ENUM ('available', 'uncertain', 'unavailable');
CREATE TYPE poll_status_enum        AS ENUM ('open', 'closed');
CREATE TYPE packing_category_enum   AS ENUM ('shared', 'personal');

-- =============================================================================
-- 2. TABLES (dependency order — no forward FK references)
-- =============================================================================

-- users -----------------------------------------------------------------------
CREATE TABLE users (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  display_name TEXT        NOT NULL,
  avatar_color TEXT        NOT NULL DEFAULT '#c0613e',
  phone        TEXT        UNIQUE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- trips -----------------------------------------------------------------------
CREATE TABLE trips (
  id                   UUID              PRIMARY KEY DEFAULT gen_random_uuid(),
  name                 TEXT              NOT NULL,
  destination          TEXT              NOT NULL,
  duration_days        INT               NOT NULL,
  proposed_start_date  DATE,
  confirmed_start_date DATE,
  date_status          date_status_enum  NOT NULL DEFAULT 'proposed',
  currency             TEXT              NOT NULL,
  invite_code          TEXT              UNIQUE NOT NULL,
  organizer_id         UUID              NOT NULL REFERENCES users(id),
  created_at           TIMESTAMPTZ       NOT NULL DEFAULT NOW()
);

-- trip_members ----------------------------------------------------------------
CREATE TABLE trip_members (
  id        UUID                     PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id   UUID                     NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  user_id   UUID                     NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role      trip_member_role_enum    NOT NULL DEFAULT 'member',
  status    trip_member_status_enum  NOT NULL DEFAULT 'joined',
  joined_at TIMESTAMPTZ,
  UNIQUE (trip_id, user_id)
);

-- itinerary_days --------------------------------------------------------------
CREATE TABLE itinerary_days (
  id         UUID  PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id    UUID  NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  day_number INT   NOT NULL,
  date       DATE  NOT NULL,
  label      TEXT  NOT NULL,
  UNIQUE (trip_id, day_number)
);

-- itinerary_activities --------------------------------------------------------
CREATE TABLE itinerary_activities (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  day_id     UUID NOT NULL REFERENCES itinerary_days(id) ON DELETE CASCADE,
  time       TEXT NOT NULL,
  title      TEXT NOT NULL,
  sort_order INT  NOT NULL DEFAULT 0
);

-- expenses --------------------------------------------------------------------
CREATE TABLE expenses (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id         UUID        NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  name            TEXT        NOT NULL,
  category        TEXT        NOT NULL,
  total_amount    NUMERIC(12,2) NOT NULL,
  currency        TEXT        NOT NULL,
  paid_by_user_id UUID        NOT NULL REFERENCES users(id),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- expense_splits --------------------------------------------------------------
CREATE TABLE expense_splits (
  id         UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  expense_id UUID          NOT NULL REFERENCES expenses(id) ON DELETE CASCADE,
  user_id    UUID          NOT NULL REFERENCES users(id),
  amount     NUMERIC(12,2) NOT NULL,
  UNIQUE (expense_id, user_id)
);

-- transfer_slips --------------------------------------------------------------
CREATE TABLE transfer_slips (
  id           UUID                 PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id      UUID                 NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  from_user_id UUID                 NOT NULL REFERENCES users(id),
  to_user_id   UUID                 NOT NULL REFERENCES users(id),
  amount       NUMERIC(12,2)        NOT NULL,
  currency     TEXT                 NOT NULL,
  status       transfer_status_enum NOT NULL DEFAULT 'pending',
  slip_url     TEXT,
  confirmed_at TIMESTAMPTZ,
  created_at   TIMESTAMPTZ          NOT NULL DEFAULT NOW()
);

-- availability ----------------------------------------------------------------
CREATE TABLE availability (
  id      UUID                      PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID                      NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  user_id UUID                      NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date    DATE                      NOT NULL,
  status  availability_status_enum  NOT NULL,
  UNIQUE (trip_id, user_id, date)
);

-- polls -----------------------------------------------------------------------
CREATE TABLE polls (
  id                  UUID             PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id             UUID             NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  title               TEXT             NOT NULL,
  subtitle            TEXT,
  close_date          TIMESTAMPTZ,
  status              poll_status_enum NOT NULL DEFAULT 'open',
  created_by_user_id  UUID             REFERENCES users(id),
  created_at          TIMESTAMPTZ      NOT NULL DEFAULT NOW()
);

-- poll_options ----------------------------------------------------------------
CREATE TABLE poll_options (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  poll_id    UUID NOT NULL REFERENCES polls(id) ON DELETE CASCADE,
  text       TEXT NOT NULL,
  sort_order INT  NOT NULL DEFAULT 0
);

-- poll_votes ------------------------------------------------------------------
CREATE TABLE poll_votes (
  id        UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  poll_id   UUID        NOT NULL REFERENCES polls(id) ON DELETE CASCADE,
  option_id UUID        NOT NULL REFERENCES poll_options(id) ON DELETE CASCADE,
  user_id   UUID        NOT NULL REFERENCES users(id),
  voted_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (poll_id, user_id)
);

-- checklist_items -------------------------------------------------------------
CREATE TABLE checklist_items (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id    UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  text       TEXT NOT NULL,
  sort_order INT  NOT NULL DEFAULT 0
);

-- checklist_checks ------------------------------------------------------------
CREATE TABLE checklist_checks (
  item_id    UUID        NOT NULL REFERENCES checklist_items(id) ON DELETE CASCADE,
  user_id    UUID        NOT NULL REFERENCES users(id),
  checked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (item_id, user_id)
);

-- packing_items ---------------------------------------------------------------
CREATE TABLE packing_items (
  id         UUID                  PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id    UUID                  NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  text       TEXT                  NOT NULL,
  category   packing_category_enum NOT NULL DEFAULT 'shared',
  sort_order INT                   NOT NULL DEFAULT 0
);

-- packing_assignees -----------------------------------------------------------
CREATE TABLE packing_assignees (
  item_id UUID NOT NULL REFERENCES packing_items(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id),
  PRIMARY KEY (item_id, user_id)
);

-- packing_checks --------------------------------------------------------------
CREATE TABLE packing_checks (
  item_id    UUID        NOT NULL REFERENCES packing_items(id) ON DELETE CASCADE,
  user_id    UUID        NOT NULL REFERENCES users(id),
  checked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (item_id, user_id)
);

-- wheel_options ---------------------------------------------------------------
CREATE TABLE wheel_options (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id    UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  text       TEXT NOT NULL,
  color      TEXT NOT NULL,
  sort_order INT  NOT NULL DEFAULT 0
);

-- =============================================================================
-- 3. INDEXES
-- =============================================================================

-- FK columns
CREATE INDEX ON trips(organizer_id);
CREATE INDEX ON trip_members(trip_id);
CREATE INDEX ON trip_members(user_id);
CREATE INDEX ON itinerary_days(trip_id);
CREATE INDEX ON itinerary_activities(day_id);
CREATE INDEX ON expenses(trip_id);
CREATE INDEX ON expenses(paid_by_user_id);
CREATE INDEX ON expense_splits(expense_id);
CREATE INDEX ON expense_splits(user_id);
CREATE INDEX ON transfer_slips(trip_id);
CREATE INDEX ON transfer_slips(from_user_id);
CREATE INDEX ON transfer_slips(to_user_id);
CREATE INDEX ON availability(trip_id);
CREATE INDEX ON availability(user_id);
CREATE INDEX ON polls(trip_id);
CREATE INDEX ON polls(created_by_user_id);
CREATE INDEX ON poll_options(poll_id);
CREATE INDEX ON poll_votes(option_id);
CREATE INDEX ON poll_votes(user_id);
CREATE INDEX ON checklist_items(trip_id);
CREATE INDEX ON checklist_checks(user_id);
CREATE INDEX ON packing_items(trip_id);
CREATE INDEX ON packing_assignees(user_id);
CREATE INDEX ON packing_checks(user_id);
CREATE INDEX ON wheel_options(trip_id);

-- trips.invite_code already has a UNIQUE index (implicit); confirm:
-- (the UNIQUE constraint on invite_code creates idx automatically)

-- users.phone already has a UNIQUE index (implicit)

-- Composite: "which dates are most free?" query
CREATE INDEX ON availability(trip_id, date);

-- Vote count aggregation
CREATE INDEX ON poll_votes(poll_id);

-- =============================================================================
-- 4. FUNCTION: trip_expense_balance(trip_id)
--    Returns per-member: paid, share, net (net = paid - share)
--    positive net  → owed money back
--    negative net  → owes money
-- =============================================================================

CREATE OR REPLACE FUNCTION trip_expense_balance(p_trip_id UUID)
RETURNS TABLE (
  user_id      UUID,
  display_name TEXT,
  paid         NUMERIC(12,2),
  share        NUMERIC(12,2),
  net          NUMERIC(12,2)
)
LANGUAGE sql
STABLE
AS $$
  WITH members AS (
    SELECT tm.user_id, u.display_name
    FROM   trip_members tm
    JOIN   users u ON u.id = tm.user_id
    WHERE  tm.trip_id = p_trip_id
      AND  tm.status  <> 'declined'::trip_member_status_enum
  ),
  paid_sums AS (
    SELECT paid_by_user_id AS user_id,
           SUM(total_amount) AS paid
    FROM   expenses
    WHERE  trip_id = p_trip_id
    GROUP  BY paid_by_user_id
  ),
  share_sums AS (
    SELECT es.user_id,
           SUM(es.amount) AS share
    FROM   expense_splits es
    JOIN   expenses e ON e.id = es.expense_id
    WHERE  e.trip_id = p_trip_id
    GROUP  BY es.user_id
  )
  SELECT
    m.user_id,
    m.display_name,
    COALESCE(p.paid,  0)::NUMERIC(12,2)                       AS paid,
    COALESCE(s.share, 0)::NUMERIC(12,2)                       AS share,
    (COALESCE(p.paid, 0) - COALESCE(s.share, 0))::NUMERIC(12,2) AS net
  FROM   members m
  LEFT   JOIN paid_sums  p ON p.user_id = m.user_id
  LEFT   JOIN share_sums s ON s.user_id = m.user_id
  ORDER  BY m.display_name;
$$;

-- Usage: SELECT * FROM trip_expense_balance('your-trip-uuid');

-- =============================================================================
-- 5. VIEW: availability_summary
--    Aggregates availability records per (trip_id, date).
--    variant: 'all' | 'some' | 'uncertain' | 'default'
-- =============================================================================

CREATE OR REPLACE VIEW availability_summary AS
WITH member_counts AS (
  SELECT trip_id,
         COUNT(DISTINCT user_id)::INT AS member_count
  FROM   trip_members
  WHERE  status <> 'declined'::trip_member_status_enum
  GROUP  BY trip_id
),
avail_agg AS (
  SELECT trip_id,
         date,
         COUNT(*) FILTER (WHERE status = 'available'::availability_status_enum)::INT   AS available,
         COUNT(*) FILTER (WHERE status = 'uncertain'::availability_status_enum)::INT   AS uncertain,
         COUNT(*) FILTER (WHERE status = 'unavailable'::availability_status_enum)::INT AS unavailable
  FROM   availability
  GROUP  BY trip_id, date
)
SELECT
  a.trip_id,
  a.date,
  a.available,
  a.uncertain,
  a.unavailable,
  COALESCE(mc.member_count, 0) AS member_count,
  CASE
    WHEN COALESCE(mc.member_count, 0) > 0
         AND a.available = mc.member_count THEN 'all'
    WHEN a.available > 0                   THEN 'some'
    WHEN a.uncertain > 0                   THEN 'uncertain'
    ELSE                                        'default'
  END AS variant
FROM   avail_agg a
LEFT   JOIN member_counts mc ON mc.trip_id = a.trip_id;

-- Usage: SELECT * FROM availability_summary WHERE trip_id = 'your-trip-uuid';

-- =============================================================================
-- 6. SEED DATA (minimal — 2 users, 1 trip, all features covered)
-- =============================================================================

DO $$
DECLARE
  u1   UUID := '11111111-1111-1111-1111-111111111111';
  u2   UUID := '22222222-2222-2222-2222-222222222222';
  t1   UUID := 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
  d1   UUID := 'dddddddd-1111-1111-1111-111111111111';
  e1   UUID := 'eeeeeeee-1111-1111-1111-111111111111';
  e2   UUID := 'eeeeeeee-2222-2222-2222-222222222222';
  p1   UUID := 'b1111111-1111-1111-1111-111111111111';
  o1   UUID := 'b2111111-1111-1111-1111-111111111111';
  o2   UUID := 'b2222222-2222-2222-2222-222222222222';
  o3   UUID := 'b2333333-3333-3333-3333-333333333333';
  cl1  UUID := 'cccccccc-1111-1111-1111-111111111111';
  cl2  UUID := 'cccccccc-2222-2222-2222-222222222222';
  pi1  UUID := 'ffffffff-1111-1111-1111-111111111111';
  pi2  UUID := 'ffffffff-2222-2222-2222-222222222222';
  pi3  UUID := 'ffffffff-3333-3333-3333-333333333333';
BEGIN

-- Clean previous seed
DELETE FROM trips WHERE id = t1;
DELETE FROM users WHERE id IN (u1, u2);

-- Users
INSERT INTO users (id, display_name, avatar_color, phone) VALUES
  (u1, 'ต้นน้ำ', '#c0613e', '0911111111'),
  (u2, 'เจมส์',  '#4f6e7a', '0922222222');

-- Trip
INSERT INTO trips (id, name, destination, duration_days,
                   proposed_start_date, confirmed_start_date,
                   date_status, currency, invite_code, organizer_id) VALUES
  (t1, 'ทริปทดสอบ GoGun', 'TH', 7,
   '2026-11-01', '2026-11-01',
   'confirmed', 'THB', 'test-gogun-x2', u1);

-- Members (organizer + member)
INSERT INTO trip_members (trip_id, user_id, role, status, joined_at) VALUES
  (t1, u1, 'organizer', 'joined', NOW()),
  (t1, u2, 'member',    'joined', NOW());

-- Itinerary: 1 day, 2 activities
INSERT INTO itinerary_days (id, trip_id, day_number, date, label) VALUES
  (d1, t1, 1, '2026-11-01', 'Day 1 – Bangkok');

INSERT INTO itinerary_activities (day_id, time, title, sort_order) VALUES
  (d1, '09:00', 'เช็คอินโรงแรม', 0),
  (d1, '13:00', 'เที่ยว Chatuchak',  1);

-- Expenses: 2 expenses with even splits
INSERT INTO expenses (id, trip_id, name, category, total_amount, currency, paid_by_user_id) VALUES
  (e1, t1, 'ค่าโรงแรม',  'accommodation', 2000.00, 'THB', u1),
  (e2, t1, 'ข้าวกลางวัน', 'food',           600.00, 'THB', u2);

INSERT INTO expense_splits (expense_id, user_id, amount) VALUES
  (e1, u1, 1000.00),
  (e1, u2, 1000.00),
  (e2, u1,  300.00),
  (e2, u2,  300.00);

-- Availability: both users, 7 days
INSERT INTO availability (trip_id, user_id, date, status) VALUES
  (t1, u1, '2026-11-01', 'available'),
  (t1, u1, '2026-11-02', 'available'),
  (t1, u1, '2026-11-03', 'uncertain'),
  (t1, u1, '2026-11-04', 'available'),
  (t1, u1, '2026-11-05', 'available'),
  (t1, u1, '2026-11-06', 'available'),
  (t1, u1, '2026-11-07', 'unavailable'),
  (t1, u2, '2026-11-01', 'available'),
  (t1, u2, '2026-11-02', 'available'),
  (t1, u2, '2026-11-03', 'available'),
  (t1, u2, '2026-11-04', 'uncertain'),
  (t1, u2, '2026-11-05', 'available'),
  (t1, u2, '2026-11-06', 'unavailable'),
  (t1, u2, '2026-11-07', 'unavailable');

-- Poll: 1 poll, 3 options, u1 votes option 1
INSERT INTO polls (id, trip_id, title, subtitle, close_date, status, created_by_user_id) VALUES
  (p1, t1, 'เลือกที่กินคืนแรก', 'โหวตก่อน 31 Oct', '2026-10-31 23:59:59+07', 'open', u1);

INSERT INTO poll_options (id, poll_id, text, sort_order) VALUES
  (o1, p1, 'ส้มตำนัว',     0),
  (o2, p1, 'ข้าวมันไก่',    1),
  (o3, p1, 'ชาบู MK',       2);

INSERT INTO poll_votes (poll_id, option_id, user_id) VALUES
  (p1, o1, u1);

-- Checklist: 2 items, u1 checks item 1
INSERT INTO checklist_items (id, trip_id, text, sort_order) VALUES
  (cl1, t1, 'จองโรงแรม',          0),
  (cl2, t1, 'เตรียมเงินสดบาท',    1);

INSERT INTO checklist_checks (item_id, user_id) VALUES
  (cl1, u1);

-- Packing: 3 items (2 shared, 1 personal), u1 assigned to shared items
INSERT INTO packing_items (id, trip_id, text, category, sort_order) VALUES
  (pi1, t1, 'ยากันยุง',         'shared',   0),
  (pi2, t1, 'ครีมกันแดด',       'shared',   1),
  (pi3, t1, 'พาสปอร์ต/บัตรปชช', 'personal', 0);

INSERT INTO packing_assignees (item_id, user_id) VALUES
  (pi1, u1),
  (pi2, u1),
  (pi2, u2);

INSERT INTO packing_checks (item_id, user_id) VALUES
  (pi1, u1);

-- Wheel: 3 options
INSERT INTO wheel_options (trip_id, text, color, sort_order) VALUES
  (t1, 'ส้มตำ',      '#c0613e', 0),
  (t1, 'ข้าวมันไก่',  '#4f6e7a', 1),
  (t1, 'ก๋วยเตี๋ยว', '#7b8b57', 2);

END $$;
