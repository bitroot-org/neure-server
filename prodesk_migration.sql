-- ============================================================
-- ProDesk Migration
-- Run once against the neure database
-- ============================================================

SET FOREIGN_KEY_CHECKS = 0;

-- ------------------------------------------------------------
-- STEP 1: Add roles for client (5) and therapist_staff (6)
-- ------------------------------------------------------------
INSERT IGNORE INTO roles (id, role_name, description) VALUES
  (5, 'client',           'ProDesk client/patient — books sessions with a therapist'),
  (6, 'therapist_staff',  'ProDesk staff member managed under a therapist clinic');

-- ------------------------------------------------------------
-- STEP 2: Extend therapists table with ProDesk profile fields
-- ------------------------------------------------------------
ALTER TABLE therapists
  ADD COLUMN IF NOT EXISTS booking_slug         VARCHAR(150) UNIQUE            COMMENT 'Unique URL slug for public booking page',
  ADD COLUMN IF NOT EXISTS about_me             TEXT                           COMMENT 'Bio shown on public booking page',
  ADD COLUMN IF NOT EXISTS experience_years     INT                            COMMENT 'Years of clinical practice',
  ADD COLUMN IF NOT EXISTS registration_number  VARCHAR(100)                   COMMENT 'Professional license/registration number',
  ADD COLUMN IF NOT EXISTS rating               DECIMAL(3,2) DEFAULT 0.00;

-- ------------------------------------------------------------
-- STEP 3: therapist_availability
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS therapist_availability (
  id             INT NOT NULL AUTO_INCREMENT,
  therapist_id   INT NOT NULL,
  days           JSON NOT NULL          COMMENT '["Mon","Tue","Wed","Thu","Fri"]',
  from_time      TIME NOT NULL          COMMENT 'e.g. 09:00',
  to_time        TIME NOT NULL          COMMENT 'e.g. 17:00',
  slot_minutes   INT DEFAULT 60,
  buffer_minutes INT DEFAULT 0,
  updated_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_therapist_avail (therapist_id),
  CONSTRAINT fk_ta_therapist FOREIGN KEY (therapist_id) REFERENCES therapists(id) ON DELETE CASCADE
);

-- ------------------------------------------------------------
-- STEP 4: therapist_branding
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS therapist_branding (
  id                    INT NOT NULL AUTO_INCREMENT,
  therapist_id          INT NOT NULL,
  brand_name            VARCHAR(100) DEFAULT 'ProDesk',
  theme                 ENUM('dark','light') DEFAULT 'dark',
  accent                ENUM('sage','slate','plum','bronze','clay') DEFAULT 'sage',
  background_preset     VARCHAR(50) DEFAULT 'aurora',
  logo_url              VARCHAR(500),
  custom_background_url VARCHAR(500),
  updated_at            TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_therapist_brand (therapist_id),
  CONSTRAINT fk_tb_therapist FOREIGN KEY (therapist_id) REFERENCES therapists(id) ON DELETE CASCADE
);

-- ------------------------------------------------------------
-- STEP 5: therapist_documents
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS therapist_documents (
  id           INT NOT NULL AUTO_INCREMENT,
  therapist_id INT NOT NULL,
  type         ENUM('agreement','consent','certification') NOT NULL COMMENT 'agreement=service agreement; consent=consent form; certification=license/cert',
  file_url     VARCHAR(500) NOT NULL,
  created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  CONSTRAINT fk_td_therapist FOREIGN KEY (therapist_id) REFERENCES therapists(id) ON DELETE CASCADE
);

-- ------------------------------------------------------------
-- STEP 6: prodesk_clients
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS prodesk_clients (
  id                  INT NOT NULL AUTO_INCREMENT,
  user_id             INT NOT NULL          COMMENT 'FK to users (role_id=5)',
  therapist_id        INT NOT NULL,
  age                 INT,
  gender              ENUM('F','M','NB','U'),
  city                VARCHAR(100),
  emergency_contact   VARCHAR(100),
  start_date          DATE                  COMMENT 'Date client started therapy',
  presenting_concerns TEXT,
  issues              JSON                  COMMENT '["Anxiety","Work stress"]',
  default_fee         DECIMAL(10,2) DEFAULT 0.00 COMMENT 'Per-session fee',
  status              ENUM('active','archived') DEFAULT 'active',
  avatar_color        VARCHAR(20),
  created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_client_user (user_id),
  CONSTRAINT fk_pc_user      FOREIGN KEY (user_id)      REFERENCES users(user_id)   ON DELETE CASCADE,
  CONSTRAINT fk_pc_therapist FOREIGN KEY (therapist_id) REFERENCES therapists(id)  ON DELETE CASCADE
);

-- ------------------------------------------------------------
-- STEP 7: prodesk_sessions
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS prodesk_sessions (
  id             INT NOT NULL AUTO_INCREMENT,
  therapist_id   INT NOT NULL,
  client_id      INT NOT NULL          COMMENT 'FK to prodesk_clients.id',
  session_number INT NOT NULL          COMMENT 'Sequential per client: 1, 2, 3...',
  title          VARCHAR(255),
  starts_at      TIMESTAMP NOT NULL,
  duration_min   INT DEFAULT 60,
  modality       ENUM('in_person','video','phone') NOT NULL,
  status         ENUM('scheduled','completed','cancelled','no_show') DEFAULT 'scheduled',
  fee            DECIMAL(10,2) DEFAULT 0.00 COMMENT 'Fee captured at booking time',
  location       VARCHAR(255)           COMMENT 'For in_person sessions',
  meet_url       VARCHAR(500)           COMMENT 'Video call URL from external meet service',
  note_id        INT                    COMMENT 'Linked session note — NULL until note created',
  created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  CONSTRAINT fk_ps_therapist FOREIGN KEY (therapist_id) REFERENCES therapists(id)       ON DELETE CASCADE,
  CONSTRAINT fk_ps_client    FOREIGN KEY (client_id)    REFERENCES prodesk_clients(id)  ON DELETE CASCADE
);

-- ------------------------------------------------------------
-- STEP 8: prodesk_session_notes
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS prodesk_session_notes (
  id           INT NOT NULL AUTO_INCREMENT,
  session_id   INT NOT NULL UNIQUE       COMMENT 'One note per session',
  client_id    INT NOT NULL,
  therapist_id INT NOT NULL,
  title        VARCHAR(255),
  body         LONGTEXT,
  preview      VARCHAR(200)              COMMENT 'Auto-generated: first ~120 chars of body',
  format       ENUM('markdown','plain') DEFAULT 'markdown',
  is_draft     TINYINT(1) DEFAULT 1,
  created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  CONSTRAINT fk_psn_session   FOREIGN KEY (session_id)   REFERENCES prodesk_sessions(id)  ON DELETE RESTRICT,
  CONSTRAINT fk_psn_client    FOREIGN KEY (client_id)    REFERENCES prodesk_clients(id),
  CONSTRAINT fk_psn_therapist FOREIGN KEY (therapist_id) REFERENCES therapists(id)
);

-- ------------------------------------------------------------
-- STEP 9: prodesk_note_attachments
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS prodesk_note_attachments (
  id          INT NOT NULL AUTO_INCREMENT,
  note_id     INT NOT NULL,
  file_name   VARCHAR(255) NOT NULL,
  file_url    VARCHAR(500) NOT NULL,
  size_bytes  INT,
  uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  CONSTRAINT fk_pna_note FOREIGN KEY (note_id) REFERENCES prodesk_session_notes(id) ON DELETE CASCADE
);

-- ------------------------------------------------------------
-- STEP 10: prodesk_invoices
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS prodesk_invoices (
  id                  INT NOT NULL AUTO_INCREMENT,
  therapist_id        INT NOT NULL,
  client_id           INT NOT NULL,
  session_id          INT,
  invoice_number      VARCHAR(30)            COMMENT 'e.g. INV-2026-001, server-generated',
  issue_date          DATE NOT NULL,
  due_date            DATE,
  line_items          JSON NOT NULL          COMMENT '[{description, qty, rate, amount}]',
  subtotal            DECIMAL(10,2) NOT NULL,
  tax_percent         DECIMAL(5,2) DEFAULT 18.00,
  tax                 DECIMAL(10,2) NOT NULL,
  total               DECIMAL(10,2) NOT NULL,
  currency            CHAR(3) DEFAULT 'INR',
  notes               TEXT,
  status              ENUM('draft','sent','paid','overdue','cancelled') DEFAULT 'draft',
  razorpay_invoice_id VARCHAR(100)           COMMENT 'Razorpay invoice ID once issued',
  razorpay_short_url  VARCHAR(500)           COMMENT 'Razorpay hosted invoice URL',
  paid_at             TIMESTAMP NULL,
  created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  CONSTRAINT fk_pi_therapist FOREIGN KEY (therapist_id) REFERENCES therapists(id),
  CONSTRAINT fk_pi_client    FOREIGN KEY (client_id)    REFERENCES prodesk_clients(id)
);

-- ------------------------------------------------------------
-- STEP 11: prodesk_payment
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS prodesk_payment (
  id                INT NOT NULL AUTO_INCREMENT,
  user_id           INT NOT NULL          COMMENT 'Client user_id who paid',
  therapist_id      INT NOT NULL,
  invoice_id        INT,
  session_id        INT,
  payment_type      VARCHAR(255)          COMMENT 'session_fee | invoice | booking',
  provider          VARCHAR(255) DEFAULT 'razorpay',
  amount            DECIMAL(10,2),
  currency          CHAR(3) DEFAULT 'INR',
  reference_id      VARCHAR(255)          COMMENT 'Internal reference',
  razorpay_ref_id   VARCHAR(255)          COMMENT 'Razorpay payment ID (pay_xxx)',
  razorpay_order_id VARCHAR(255)          COMMENT 'Razorpay order ID (order_xxx)',
  status            VARCHAR(100)          COMMENT 'created | captured | failed | refunded',
  meta              JSON                  COMMENT 'Full Razorpay response payload',
  invoice_url       VARCHAR(500),
  created_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  CONSTRAINT fk_pp_user      FOREIGN KEY (user_id)      REFERENCES users(user_id),
  CONSTRAINT fk_pp_therapist FOREIGN KEY (therapist_id) REFERENCES therapists(id)
);

-- ------------------------------------------------------------
-- STEP 12: prodesk_payment_log
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS prodesk_payment_log (
  id           INT NOT NULL AUTO_INCREMENT,
  payment_id   INT NOT NULL,
  reference_id VARCHAR(255),
  status       VARCHAR(255),
  refund_id    VARCHAR(255)   COMMENT 'Razorpay refund ID if applicable',
  meta         JSON           COMMENT 'Razorpay webhook event payload',
  created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  CONSTRAINT fk_ppl_payment FOREIGN KEY (payment_id) REFERENCES prodesk_payment(id)
);

-- ------------------------------------------------------------
-- STEP 13: payment_method
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS payment_method (
  id             INT NOT NULL AUTO_INCREMENT,
  payment_method VARCHAR(100) NOT NULL,
  is_active      TINYINT(1) DEFAULT 1,
  created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
);

INSERT IGNORE INTO payment_method (id, payment_method) VALUES
  (1, 'Debit/Credit Card'),
  (2, 'Net Banking'),
  (3, 'Wallet'),
  (4, 'UPI'),
  (5, 'COD');

-- ------------------------------------------------------------
-- STEP 14: client_integration
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS client_integration (
  id         INT NOT NULL AUTO_INCREMENT,
  name       VARCHAR(255),
  key_id     VARCHAR(255)    COMMENT 'API key / client ID',
  secret     VARCHAR(500)    COMMENT 'API secret — encrypt at rest',
  domain     VARCHAR(255),
  type       VARCHAR(45) NOT NULL COMMENT 'payment | calendar | sms | email',
  is_active  INT DEFAULT 1,
  meta       JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
);

-- Seed Razorpay — replace key/secret with actual values
INSERT IGNORE INTO client_integration (id, name, key_id, secret, type) VALUES
  (1, 'Razor-Pay', 'rzp_test_YOUR_KEY_ID', 'YOUR_KEY_SECRET', 'payment');

-- ------------------------------------------------------------
-- STEP 15: prodesk_resources
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS prodesk_resources (
  id           INT NOT NULL AUTO_INCREMENT,
  therapist_id INT             COMMENT 'NULL for Neure catalogue items',
  title        VARCHAR(255) NOT NULL,
  type         ENUM('PDF','Worksheet','Audio') NOT NULL,
  category     VARCHAR(100),
  scope        ENUM('mine','catalogue') NOT NULL DEFAULT 'mine',
  owner        ENUM('therapist','neure') NOT NULL DEFAULT 'therapist',
  file_url     VARCHAR(500) NOT NULL,
  size_bytes   INT,
  is_deleted   TINYINT(1) DEFAULT 0,
  created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  CONSTRAINT fk_pr_therapist FOREIGN KEY (therapist_id) REFERENCES therapists(id) ON DELETE CASCADE
);

-- ------------------------------------------------------------
-- STEP 16: prodesk_slot_holds
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS prodesk_slot_holds (
  id           INT NOT NULL AUTO_INCREMENT,
  therapist_id INT NOT NULL,
  date         DATE NOT NULL,
  time_slot    TIME NOT NULL,
  modality     ENUM('in_person','video','phone') NOT NULL,
  hold_token   VARCHAR(64) NOT NULL UNIQUE,
  expires_at   TIMESTAMP NOT NULL,
  claimed      TINYINT(1) DEFAULT 0,
  created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_active_slot (therapist_id, date, time_slot, claimed),
  CONSTRAINT fk_psh_therapist FOREIGN KEY (therapist_id) REFERENCES therapists(id) ON DELETE CASCADE
);

-- ------------------------------------------------------------
-- STEP 17: Alter notifications — add is_close and meta
-- ------------------------------------------------------------
ALTER TABLE notifications
  ADD COLUMN IF NOT EXISTS is_close TINYINT(1) NOT NULL DEFAULT 0  COMMENT 'Dismissed by user',
  ADD COLUMN IF NOT EXISTS meta     JSON                            COMMENT 'Extra context for deep links';

-- ------------------------------------------------------------
-- STEP 18: notification_log
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS notification_log (
  id             INT NOT NULL AUTO_INCREMENT,
  user_id        INT,
  user_type      VARCHAR(20)    COMMENT 'therapist | client | employee | admin',
  platform       VARCHAR(100)   COMMENT 'IN_APP | EMAIL | SMS | PUSH',
  status_code    INT,
  status         VARCHAR(100),
  type           VARCHAR(100),
  message        VARCHAR(255),
  error          TEXT,
  message_body   TEXT,
  template_name  VARCHAR(100),
  meta           JSON,
  created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
);

-- ------------------------------------------------------------
-- STEP 19: prodesk_device_sessions
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS prodesk_device_sessions (
  id             INT NOT NULL AUTO_INCREMENT,
  therapist_id   INT NOT NULL,
  jti            VARCHAR(64) NOT NULL UNIQUE COMMENT 'JWT ID claim',
  device_info    VARCHAR(255),
  ip_address     VARCHAR(45),
  last_active_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  revoked        TINYINT(1) DEFAULT 0,
  created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  CONSTRAINT fk_pds_therapist FOREIGN KEY (therapist_id) REFERENCES therapists(id) ON DELETE CASCADE
);

SET FOREIGN_KEY_CHECKS = 1;

-- ============================================================
-- Migration complete
-- ============================================================
