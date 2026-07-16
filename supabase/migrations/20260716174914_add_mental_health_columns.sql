ALTER TABLE body_metrics ADD COLUMN IF NOT EXISTS focus_level integer;
ALTER TABLE body_metrics ADD COLUMN IF NOT EXISTS anxiety_level integer;
ALTER TABLE body_metrics ADD COLUMN IF NOT EXISTS mental_triggers text;
