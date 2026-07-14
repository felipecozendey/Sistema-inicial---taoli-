DO $$
DECLARE
  seed_user_id uuid;
BEGIN
  SELECT id INTO seed_user_id FROM auth.users WHERE email = 'felipecozendey@gmail.com';

  IF seed_user_id IS NOT NULL THEN
    INSERT INTO fasting_logs (user_id, start_time, end_time, target_hours, actual_hours, feeling, completed)
    VALUES
      (seed_user_id, NOW() - INTERVAL '3 days' - INTERVAL '16 hours', NOW() - INTERVAL '3 days', 16, 16.0, 'good', true),
      (seed_user_id, NOW() - INTERVAL '2 days' - INTERVAL '14 hours', NOW() - INTERVAL '2 days', 16, 14.5, 'normal', true),
      (seed_user_id, NOW() - INTERVAL '1 day' - INTERVAL '18 hours', NOW() - INTERVAL '1 day', 18, 18.0, 'good', true)
    ON CONFLICT DO NOTHING;
  END IF;
END $$;
