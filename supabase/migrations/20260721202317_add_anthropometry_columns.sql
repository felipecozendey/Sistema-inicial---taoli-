-- Basic Metrics
ALTER TABLE body_metrics ADD COLUMN IF NOT EXISTS sitting_height NUMERIC;
ALTER TABLE body_metrics ADD COLUMN IF NOT EXISTS knee_height NUMERIC;

-- Circunferências (Upper Limbs)
ALTER TABLE body_metrics ADD COLUMN IF NOT EXISTS arm_relaxed_left NUMERIC;
ALTER TABLE body_metrics ADD COLUMN IF NOT EXISTS arm_relaxed_right NUMERIC;
ALTER TABLE body_metrics ADD COLUMN IF NOT EXISTS arm_contracted_left NUMERIC;
ALTER TABLE body_metrics ADD COLUMN IF NOT EXISTS arm_contracted_right NUMERIC;
ALTER TABLE body_metrics ADD COLUMN IF NOT EXISTS forearm_left NUMERIC;
ALTER TABLE body_metrics ADD COLUMN IF NOT EXISTS forearm_right NUMERIC;
ALTER TABLE body_metrics ADD COLUMN IF NOT EXISTS wrist_circ_left NUMERIC;
ALTER TABLE body_metrics ADD COLUMN IF NOT EXISTS wrist_circ_right NUMERIC;

-- Circunferências (Trunk)
ALTER TABLE body_metrics ADD COLUMN IF NOT EXISTS neck_circ NUMERIC;
ALTER TABLE body_metrics ADD COLUMN IF NOT EXISTS shoulder_circ NUMERIC;
ALTER TABLE body_metrics ADD COLUMN IF NOT EXISTS chest_circ NUMERIC;
ALTER TABLE body_metrics ADD COLUMN IF NOT EXISTS waist_circ NUMERIC;
ALTER TABLE body_metrics ADD COLUMN IF NOT EXISTS abdomen_circ NUMERIC;
ALTER TABLE body_metrics ADD COLUMN IF NOT EXISTS hip_circ NUMERIC;

-- Circunferências (Lower Limbs)
ALTER TABLE body_metrics ADD COLUMN IF NOT EXISTS calf_left NUMERIC;
ALTER TABLE body_metrics ADD COLUMN IF NOT EXISTS calf_right NUMERIC;
ALTER TABLE body_metrics ADD COLUMN IF NOT EXISTS thigh_left NUMERIC;
ALTER TABLE body_metrics ADD COLUMN IF NOT EXISTS thigh_right NUMERIC;
ALTER TABLE body_metrics ADD COLUMN IF NOT EXISTS proximal_thigh_left NUMERIC;
ALTER TABLE body_metrics ADD COLUMN IF NOT EXISTS proximal_thigh_right NUMERIC;

-- Bone Diameters
ALTER TABLE body_metrics ADD COLUMN IF NOT EXISTS wrist_diameter NUMERIC;
ALTER TABLE body_metrics ADD COLUMN IF NOT EXISTS femur_diameter NUMERIC;
ALTER TABLE body_metrics ADD COLUMN IF NOT EXISTS humerus_diameter NUMERIC;

-- Composition Context
ALTER TABLE body_metrics ADD COLUMN IF NOT EXISTS composition_method TEXT DEFAULT 'skinfolds';
ALTER TABLE body_metrics ADD COLUMN IF NOT EXISTS calc_protocol TEXT DEFAULT 'none';

-- Skinfolds (mm)
ALTER TABLE body_metrics ADD COLUMN IF NOT EXISTS skinfold_biceps NUMERIC;
ALTER TABLE body_metrics ADD COLUMN IF NOT EXISTS skinfold_triceps NUMERIC;
ALTER TABLE body_metrics ADD COLUMN IF NOT EXISTS skinfold_subscapular NUMERIC;
ALTER TABLE body_metrics ADD COLUMN IF NOT EXISTS skinfold_chest NUMERIC;
ALTER TABLE body_metrics ADD COLUMN IF NOT EXISTS skinfold_midaxillary NUMERIC;
ALTER TABLE body_metrics ADD COLUMN IF NOT EXISTS skinfold_suprailiac NUMERIC;
ALTER TABLE body_metrics ADD COLUMN IF NOT EXISTS skinfold_supraspinal NUMERIC;
ALTER TABLE body_metrics ADD COLUMN IF NOT EXISTS skinfold_abdominal NUMERIC;
ALTER TABLE body_metrics ADD COLUMN IF NOT EXISTS skinfold_thigh NUMERIC;
ALTER TABLE body_metrics ADD COLUMN IF NOT EXISTS skinfold_calf NUMERIC;

-- Media & Notes
ALTER TABLE body_metrics ADD COLUMN IF NOT EXISTS photo_front TEXT;
ALTER TABLE body_metrics ADD COLUMN IF NOT EXISTS photo_back TEXT;
ALTER TABLE body_metrics ADD COLUMN IF NOT EXISTS photo_right TEXT;
ALTER TABLE body_metrics ADD COLUMN IF NOT EXISTS photo_left TEXT;
ALTER TABLE body_metrics ADD COLUMN IF NOT EXISTS attachments TEXT[] DEFAULT '{}'::text[];
ALTER TABLE body_metrics ADD COLUMN IF NOT EXISTS observations TEXT;
