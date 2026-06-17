-- ============================================================
-- ProDesk Branding Migration
-- Extends therapist_branding with new background/wallpaper fields
-- Run after prodesk_migration.sql
-- ============================================================

ALTER TABLE therapist_branding
  MODIFY COLUMN accent ENUM('sage','slate','plum','bronze','clay') DEFAULT 'sage',
  MODIFY COLUMN background_preset VARCHAR(20) DEFAULT 'mist'
    COMMENT 'gradient preset key: mist, linen, tide, dusk, mono',
  ADD COLUMN IF NOT EXISTS background_type
    ENUM('gradient','preset_wallpaper','custom_wallpaper') DEFAULT 'gradient',
  ADD COLUMN IF NOT EXISTS wallpaper_id VARCHAR(50) NULL
    COMMENT 'preset wallpaper key: misty_peaks, warm_dusk, ocean_calm, forest_fog',
  ADD COLUMN IF NOT EXISTS wallpaper_url VARCHAR(500) NULL
    COMMENT 'S3 URL for custom uploaded wallpaper',
  ADD COLUMN IF NOT EXISTS invoice_prefix VARCHAR(20) NULL
    COMMENT 'e.g. DR-THAKUR — used in invoice numbering';

-- Drop old custom_background_url if it exists (replaced by wallpaper_url)
ALTER TABLE therapist_branding
  RENAME COLUMN custom_background_url TO wallpaper_url;

-- ============================================================
-- Migration complete
-- ============================================================
