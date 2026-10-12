-- Clinic address shown on invoices (editable under Profile → Brand identity)
ALTER TABLE therapist_branding ADD COLUMN clinic_address VARCHAR(500) NULL AFTER brand_name;
