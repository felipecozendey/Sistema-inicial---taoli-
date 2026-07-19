ALTER TABLE workout_routines ADD COLUMN IF NOT EXISTS description TEXT NOT NULL DEFAULT '';
ALTER TABLE workout_history ADD COLUMN IF NOT EXISTS duration_minutes INTEGER NOT NULL DEFAULT 0;
ALTER TABLE workout_history ADD COLUMN IF NOT EXISTS total_volume_kg NUMERIC NOT NULL DEFAULT 0;

DO $$
DECLARE
  v_user_id uuid;
BEGIN
  SELECT id INTO v_user_id FROM auth.users WHERE email = 'felipecozendey@gmail.com';
  IF v_user_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM workout_routines WHERE user_id = v_user_id) THEN
    INSERT INTO workout_routines (user_id, title, description, exercises) VALUES
      (v_user_id, 'Ficha A - Push', 'Peito, Ombro, Tríceps', '[{"id":"ex1","name":"Supino Reto","sets":4,"reps":"8-10","weightKg":75},{"id":"ex2","name":"Supino Inclinado","sets":3,"reps":"10-12","weightKg":60},{"id":"ex3","name":"Desenvolvimento Militar","sets":4,"reps":"8-10","weightKg":50},{"id":"ex4","name":"Tríceps Pulley","sets":3,"reps":"12-15","weightKg":40}]'::jsonb),
      (v_user_id, 'Ficha B - Pull', 'Costas, Bíceps', '[{"id":"ex5","name":"Barra Fixa","sets":4,"reps":"6-8","weightKg":0},{"id":"ex6","name":"Remada Curvada","sets":4,"reps":"8-10","weightKg":65},{"id":"ex7","name":"Puxada Frontal","sets":3,"reps":"10-12","weightKg":55},{"id":"ex8","name":"Rosca Direta","sets":3,"reps":"10-12","weightKg":25}]'::jsonb),
      (v_user_id, 'Ficha C - Legs', 'Pernas Completo', '[{"id":"ex9","name":"Agachamento Livre","sets":4,"reps":"6-8","weightKg":95},{"id":"ex10","name":"Leg Press 45","sets":4,"reps":"10-12","weightKg":150},{"id":"ex11","name":"Cadeira Extensora","sets":3,"reps":"12-15","weightKg":40},{"id":"ex12","name":"Mesa Flexora","sets":3,"reps":"12-15","weightKg":35}]'::jsonb);

    INSERT INTO workout_history (routine_id, user_id, data, duration_minutes, total_volume_kg, completed_at) VALUES
      ((SELECT id FROM workout_routines WHERE user_id = v_user_id AND title = 'Ficha A - Push' LIMIT 1), v_user_id, '{"completedSets":["ex1-0","ex1-1","ex1-2","ex1-3","ex2-0","ex2-1","ex2-2","ex3-0","ex3-1","ex3-2","ex3-3","ex4-0","ex4-1","ex4-2"],"exercises":[{"id":"ex1","name":"Supino Reto","sets":4,"reps":"8-10","weightKg":70}]}'::jsonb, 52, 3900, NOW() - INTERVAL '14 days'),
      ((SELECT id FROM workout_routines WHERE user_id = v_user_id AND title = 'Ficha B - Pull' LIMIT 1), v_user_id, '{"completedSets":["ex5-0","ex5-1","ex5-2","ex5-3","ex6-0","ex6-1","ex6-2","ex6-3","ex7-0","ex7-1","ex7-2","ex8-0","ex8-1","ex8-2"],"exercises":[{"id":"ex6","name":"Remada Curvada","sets":4,"reps":"8-10","weightKg":60}]}'::jsonb, 48, 3600, NOW() - INTERVAL '10 days'),
      ((SELECT id FROM workout_routines WHERE user_id = v_user_id AND title = 'Ficha A - Push' LIMIT 1), v_user_id, '{"completedSets":["ex1-0","ex1-1","ex1-2","ex1-3","ex2-0","ex2-1","ex2-2","ex3-0","ex3-1","ex3-2","ex3-3","ex4-0","ex4-1","ex4-2"],"exercises":[{"id":"ex1","name":"Supino Reto","sets":4,"reps":"8-10","weightKg":75}]}'::jsonb, 55, 4200, NOW() - INTERVAL '7 days'),
      ((SELECT id FROM workout_routines WHERE user_id = v_user_id AND title = 'Ficha C - Legs' LIMIT 1), v_user_id, '{"completedSets":["ex9-0","ex9-1","ex9-2","ex9-3","ex10-0","ex10-1","ex10-2","ex10-3","ex11-0","ex11-1","ex11-2","ex12-0","ex12-1","ex12-2"],"exercises":[{"id":"ex9","name":"Agachamento Livre","sets":4,"reps":"6-8","weightKg":90}]}'::jsonb, 62, 6200, NOW() - INTERVAL '4 days'),
      ((SELECT id FROM workout_routines WHERE user_id = v_user_id AND title = 'Ficha A - Push' LIMIT 1), v_user_id, '{"completedSets":["ex1-0","ex1-1","ex1-2","ex1-3","ex2-0","ex2-1","ex2-2","ex3-0","ex3-1","ex3-2","ex3-3","ex4-0","ex4-1","ex4-2"],"exercises":[{"id":"ex1","name":"Supino Reto","sets":4,"reps":"8-10","weightKg":77.5}]}'::jsonb, 58, 4400, NOW() - INTERVAL '1 days');
  END IF;
END $$;
