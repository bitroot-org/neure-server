-- ============================================================
-- Migration: Multi-block availability per day
-- Replaces single from_time/to_time on therapist_availability
-- with a new therapist_availability_blocks table where each
-- row = one time window for one day.
-- ============================================================

-- Step 1: Create the new blocks table
CREATE TABLE IF NOT EXISTS therapist_availability_blocks (
  id             INT AUTO_INCREMENT PRIMARY KEY,
  therapist_id   INT NOT NULL,
  day            ENUM('Mon','Tue','Wed','Thu','Fri','Sat','Sun') NOT NULL,
  from_time      TIME NOT NULL,
  to_time        TIME NOT NULL,
  KEY            idx_tab_therapist (therapist_id),
  UNIQUE KEY     uq_tab_therapist_day_from (therapist_id, day, from_time)
);

-- Step 2: Migrate existing single-block data into the new table.
-- JSON_TABLE expands the days JSON array so each day gets its own row.
INSERT IGNORE INTO therapist_availability_blocks (therapist_id, day, from_time, to_time)
SELECT
  ta.therapist_id,
  jt.day,
  ta.from_time,
  ta.to_time
FROM therapist_availability ta
JOIN JSON_TABLE(ta.days, '$[*]' COLUMNS (day VARCHAR(3) PATH '$')) AS jt
WHERE ta.from_time IS NOT NULL AND ta.to_time IS NOT NULL;

-- Step 3: Drop the columns that are now owned by the blocks table.
-- slot_minutes and buffer_minutes stay on therapist_availability as
-- therapist-level settings.
ALTER TABLE therapist_availability
  DROP COLUMN IF EXISTS days,
  DROP COLUMN IF EXISTS from_time,
  DROP COLUMN IF EXISTS to_time;

-- ============================================================
-- After running this migration the therapist_availability table
-- has: id, therapist_id (UNIQUE), slot_minutes, buffer_minutes,
-- updated_at
-- All time-window data lives in therapist_availability_blocks.
-- ============================================================
