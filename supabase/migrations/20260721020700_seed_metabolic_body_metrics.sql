DO $$
DECLARE
  user_id uuid;
BEGIN
  SELECT id INTO user_id FROM auth.users WHERE email = 'felipecozendey@gmail.com';
  IF user_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM body_metrics WHERE user_id = user_id AND tmb IS NOT NULL
  ) THEN
    INSERT INTO body_metrics (
      user_id, date, weight, height, body_fat_percentage, muscle_mass,
      measurements, photo_urls, gender, age, activity_level,
      tmb, get, venta_target, primary_goal, methodology_used,
      injury_factor, met_activities, heart_rate_rest, blood_pressure,
      sleep_quality, stress_level, target_weight
    ) VALUES (
      user_id,
      NOW(),
      81,
      175,
      18,
      64.5,
      '{"waist": 86, "hip": 95, "chest": 97, "skf_peitoral": 12, "skf_abdominal": 18, "skf_coxa": 15}'::jsonb,
      '{}'::text[],
      'male',
      30,
      'moderate',
      1759,
      2726,
      3226,
      'Hipertrofia',
      'mifflin',
      1.0,
      '[]'::jsonb,
      65,
      '120/80',
      4,
      2,
      75
    );
  END IF;
END $$;
