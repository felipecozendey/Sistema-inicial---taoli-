ALTER TABLE body_metrics ADD COLUMN IF NOT EXISTS patient_profile TEXT;
ALTER TABLE body_metrics ADD COLUMN IF NOT EXISTS calc_formula TEXT;
