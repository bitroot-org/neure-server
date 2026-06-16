-- ============================================================
-- ProDesk V2 Migration
-- Subscriptions, Offers, Referrals, Feedback
-- Run once against the neure database after prodesk_migration.sql
-- ============================================================

SET FOREIGN_KEY_CHECKS = 0;

-- ─────────────────────────────────────────────────────────────
-- STEP 1: prodesk_plans
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS prodesk_plans (
  id              INT NOT NULL AUTO_INCREMENT,
  name            VARCHAR(100) NOT NULL,
  plan_type       ENUM('starter','professional','clinic') NOT NULL,
  access_type     ENUM('early_access','full_version') NOT NULL,
  billing_cycle   ENUM('monthly','annual') NOT NULL,
  price_inr       DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  per_unit_price  DECIMAL(10,2) NULL          COMMENT 'Clinic: price per psychologist/month',
  client_limit    INT NULL                    COMMENT '2 for starter, NULL = unlimited',
  is_active       TINYINT(1) DEFAULT 1,
  created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
) COMMENT 'Seeded pricing tiers — 8 rows total';

INSERT IGNORE INTO prodesk_plans (id, name, plan_type, access_type, billing_cycle, price_inr, per_unit_price, client_limit) VALUES
  (1, 'Starter',      'starter',      'early_access', 'monthly',  0.00,     NULL,    2),
  (2, 'Professional', 'professional', 'early_access', 'monthly',  799.00,   NULL,    NULL),
  (3, 'Professional', 'professional', 'early_access', 'annual',   7670.00,  NULL,    NULL),
  (4, 'Clinic',       'clinic',       'early_access', 'monthly',  9999.00,  799.00,  NULL),
  (5, 'Starter',      'starter',      'full_version', 'monthly',  0.00,     NULL,    2),
  (6, 'Professional', 'professional', 'full_version', 'monthly',  1299.00,  NULL,    NULL),
  (7, 'Professional', 'professional', 'full_version', 'annual',   12470.00, NULL,    NULL),
  (8, 'Clinic',       'clinic',       'full_version', 'monthly',  9999.00,  1299.00, NULL);

-- ─────────────────────────────────────────────────────────────
-- STEP 2: prodesk_subscriptions
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS prodesk_subscriptions (
  id                    INT NOT NULL AUTO_INCREMENT,
  therapist_id          INT NOT NULL,
  plan_id               INT NOT NULL,
  status                ENUM('active','expired','cancelled','pending_payment') DEFAULT 'pending_payment',
  billing_cycle         ENUM('monthly','annual') NOT NULL,
  current_period_start  DATE NULL,
  current_period_end    DATE NULL,
  latest_payment_id     INT NULL              COMMENT 'FK added after subscription_payments table created',
  offer_id              INT NULL              COMMENT 'Offer applied at purchase time',
  psychologist_count    INT DEFAULT 1         COMMENT 'Clinic plan: number of psychologists',
  created_at            TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at            TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  CONSTRAINT fk_psub_therapist FOREIGN KEY (therapist_id) REFERENCES therapists(id) ON DELETE CASCADE,
  CONSTRAINT fk_psub_plan      FOREIGN KEY (plan_id)      REFERENCES prodesk_plans(id)
);

-- ─────────────────────────────────────────────────────────────
-- STEP 3: prodesk_subscription_payments
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS prodesk_subscription_payments (
  id                  INT NOT NULL AUTO_INCREMENT,
  subscription_id     INT NOT NULL,
  therapist_id        INT NOT NULL,
  amount              DECIMAL(10,2) NOT NULL,
  currency            CHAR(3) DEFAULT 'INR',
  razorpay_order_id   VARCHAR(255) NULL,
  razorpay_payment_id VARCHAR(255) NULL,
  status              ENUM('created','captured','failed','refunded') DEFAULT 'created',
  payment_for         ENUM('new','renewal') DEFAULT 'new',
  paid_at             TIMESTAMP NULL,
  meta                JSON NULL              COMMENT 'Full Razorpay response payload',
  created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  CONSTRAINT fk_psp_subscription FOREIGN KEY (subscription_id) REFERENCES prodesk_subscriptions(id) ON DELETE CASCADE,
  CONSTRAINT fk_psp_therapist    FOREIGN KEY (therapist_id)    REFERENCES therapists(id)
);

-- Add FK from subscriptions → latest payment (circular ref — added after both tables exist)
ALTER TABLE prodesk_subscriptions
  ADD CONSTRAINT fk_psub_latest_payment
    FOREIGN KEY (latest_payment_id) REFERENCES prodesk_subscription_payments(id) ON DELETE SET NULL;

-- Add FK from subscriptions → offers (added after offers table created below)
-- (done at end of file)

-- ─────────────────────────────────────────────────────────────
-- STEP 4: prodesk_offer_tags
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS prodesk_offer_tags (
  id          INT NOT NULL AUTO_INCREMENT,
  name        VARCHAR(100) NOT NULL,
  description VARCHAR(255) NULL,
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_tag_name (name)
);

INSERT IGNORE INTO prodesk_offer_tags (id, name, description) VALUES
  (1, 'early_access', 'Email-whitelisted early access pricing unlock — only listed emails can claim'),
  (2, 'promotional',  'Open promotional discount — percent off plan price, no whitelist required'),
  (3, 'event',        'Time-limited event-based promo (e.g. World Psychologists Day)');

-- ─────────────────────────────────────────────────────────────
-- STEP 5: prodesk_offers
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS prodesk_offers (
  id                  INT NOT NULL AUTO_INCREMENT,
  code                VARCHAR(50) NOT NULL        COMMENT 'Stored uppercase, compared uppercase',
  name                VARCHAR(100) NOT NULL,
  description         TEXT NULL,
  tag_id              INT NOT NULL,
  is_percent          TINYINT(1) DEFAULT 0        COMMENT '1=percent discount off price, 0=early_access pricing unlock',
  percent_discount    DECIMAL(5,2) NULL           COMMENT 'e.g. 10.00 for 10% off',
  is_email_restricted TINYINT(1) DEFAULT 0        COMMENT '1=only whitelisted emails can use',
  valid_from          DATETIME NOT NULL,
  valid_till          DATETIME NOT NULL,
  max_uses_per_email  INT DEFAULT 1,
  total_max_uses      INT NULL                    COMMENT 'NULL = unlimited (among whitelisted)',
  total_used          INT DEFAULT 0,
  is_active           TINYINT(1) DEFAULT 1,
  created_by_admin_id INT NULL,
  created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_offer_code (code),
  CONSTRAINT fk_po_tag FOREIGN KEY (tag_id) REFERENCES prodesk_offer_tags(id)
);

-- ─────────────────────────────────────────────────────────────
-- STEP 6: prodesk_offer_emails (whitelist — only when is_email_restricted=1)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS prodesk_offer_emails (
  id                    INT NOT NULL AUTO_INCREMENT,
  offer_id              INT NOT NULL,
  email                 VARCHAR(255) NOT NULL,
  is_used               TINYINT(1) DEFAULT 0,
  used_at               TIMESTAMP NULL,
  used_by_therapist_id  INT NULL,
  created_at            TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_offer_email (offer_id, email),
  CONSTRAINT fk_poe_offer FOREIGN KEY (offer_id) REFERENCES prodesk_offers(id) ON DELETE CASCADE
);

-- ─────────────────────────────────────────────────────────────
-- STEP 7: prodesk_user_offers (claim log — rapsap pattern)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS prodesk_user_offers (
  id              INT NOT NULL AUTO_INCREMENT,
  offer_id        INT NOT NULL,
  therapist_id    INT NOT NULL,
  subscription_id INT NULL,
  activated_at    DATETIME NOT NULL               COMMENT 'When therapist entered the code',
  redeemed_at     DATETIME NULL                   COMMENT 'When payment was confirmed',
  is_redeemed     TINYINT(1) DEFAULT 0,
  created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  CONSTRAINT fk_puo_offer    FOREIGN KEY (offer_id)    REFERENCES prodesk_offers(id),
  CONSTRAINT fk_puo_therapist FOREIGN KEY (therapist_id) REFERENCES therapists(id)
);

-- Now add FK from subscriptions → offers
ALTER TABLE prodesk_subscriptions
  ADD CONSTRAINT fk_psub_offer FOREIGN KEY (offer_id) REFERENCES prodesk_offers(id) ON DELETE SET NULL;

-- ─────────────────────────────────────────────────────────────
-- STEP 8: Referral code on therapists table
-- ─────────────────────────────────────────────────────────────
ALTER TABLE therapists
  ADD COLUMN IF NOT EXISTS referral_code VARCHAR(20) UNIQUE COMMENT 'Auto-generated unique referral code at signup';

-- ─────────────────────────────────────────────────────────────
-- STEP 9: prodesk_referrals
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS prodesk_referrals (
  id                    INT NOT NULL AUTO_INCREMENT,
  referrer_therapist_id INT NOT NULL,
  referred_therapist_id INT NOT NULL,
  referral_code_used    VARCHAR(20) NOT NULL,
  status                ENUM('pending','converted','rewarded') DEFAULT 'pending',
  first_subscription_id INT NULL,
  reward_amount         DECIMAL(10,2) NULL        COMMENT '10% of first subscription payment',
  created_at            TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  converted_at          TIMESTAMP NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_referred (referred_therapist_id)  COMMENT 'One referral record per referred therapist',
  CONSTRAINT fk_pr_referrer FOREIGN KEY (referrer_therapist_id) REFERENCES therapists(id),
  CONSTRAINT fk_pr_referred FOREIGN KEY (referred_therapist_id) REFERENCES therapists(id)
);

-- ─────────────────────────────────────────────────────────────
-- STEP 10: prodesk_referral_wallet
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS prodesk_referral_wallet (
  id              INT NOT NULL AUTO_INCREMENT,
  therapist_id    INT NOT NULL,
  balance         DECIMAL(10,2) DEFAULT 0.00     COMMENT 'Available to redeem (pending_balance moves here after payout processed)',
  pending_balance DECIMAL(10,2) DEFAULT 0.00     COMMENT 'Earned, awaiting 5th of month payout',
  total_earned    DECIMAL(10,2) DEFAULT 0.00,
  total_paid      DECIMAL(10,2) DEFAULT 0.00,
  last_updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_wallet_therapist (therapist_id),
  CONSTRAINT fk_prw_therapist FOREIGN KEY (therapist_id) REFERENCES therapists(id) ON DELETE CASCADE
);

-- ─────────────────────────────────────────────────────────────
-- STEP 11: prodesk_referral_wallet_ledger
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS prodesk_referral_wallet_ledger (
  id              INT NOT NULL AUTO_INCREMENT,
  therapist_id    INT NOT NULL,
  type            ENUM('credit','debit') NOT NULL,
  amount          DECIMAL(10,2) NOT NULL,
  description     VARCHAR(255) NOT NULL,
  reference_id    INT NOT NULL,
  reference_type  ENUM('referral','payout') NOT NULL,
  balance_after   DECIMAL(10,2) NOT NULL          COMMENT 'Running balance snapshot after this entry',
  created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  CONSTRAINT fk_prwl_therapist FOREIGN KEY (therapist_id) REFERENCES therapists(id)
);

-- ─────────────────────────────────────────────────────────────
-- STEP 12: prodesk_referral_payouts
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS prodesk_referral_payouts (
  id                INT NOT NULL AUTO_INCREMENT,
  therapist_id      INT NOT NULL,
  amount            DECIMAL(10,2) NOT NULL,
  status            ENUM('pending','paid','failed') DEFAULT 'pending',
  payout_month      DATE NOT NULL                 COMMENT 'e.g. 2026-06-01 for June payout',
  bank_transfer_ref VARCHAR(255) NULL,
  paid_on           DATE NULL,
  created_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  CONSTRAINT fk_prp_therapist FOREIGN KEY (therapist_id) REFERENCES therapists(id)
);

-- ─────────────────────────────────────────────────────────────
-- STEP 13: prodesk_feedback
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS prodesk_feedback (
  id           INT NOT NULL AUTO_INCREMENT,
  therapist_id INT NOT NULL,
  subject      VARCHAR(255) NOT NULL,
  message      TEXT NOT NULL,
  rating       INT NULL                           COMMENT '1-5 stars, optional',
  status       ENUM('new','reviewed','resolved') DEFAULT 'new',
  admin_notes  TEXT NULL,
  created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  CONSTRAINT fk_pf_therapist FOREIGN KEY (therapist_id) REFERENCES therapists(id)
);

SET FOREIGN_KEY_CHECKS = 1;

-- ============================================================
-- Migration complete
-- Tables created: prodesk_plans, prodesk_subscriptions,
--   prodesk_subscription_payments, prodesk_offer_tags,
--   prodesk_offers, prodesk_offer_emails, prodesk_user_offers,
--   prodesk_referrals, prodesk_referral_wallet,
--   prodesk_referral_wallet_ledger, prodesk_referral_payouts,
--   prodesk_feedback
-- Altered: therapists (added referral_code)
-- ============================================================
