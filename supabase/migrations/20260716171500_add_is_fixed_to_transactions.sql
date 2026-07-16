ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS is_fixed BOOLEAN NOT NULL DEFAULT false;

INSERT INTO transactions (user_id, type, amount, category, description, date, status, is_fixed, is_recurring, recurrence_period)
SELECT id, 'income', 5000, '💰 Salário', 'Salário mensal', NOW(), 'paid', true, false, NULL
FROM auth.users WHERE email = 'felipecozendey@gmail.com'
ON CONFLICT DO NOTHING;

INSERT INTO transactions (user_id, type, amount, category, description, date, status, is_fixed, is_recurring, recurrence_period)
SELECT id, 'expense', 1200, '🏠 Casa', 'Aluguel', NOW(), 'paid', true, false, NULL
FROM auth.users WHERE email = 'felipecozendey@gmail.com'
ON CONFLICT DO NOTHING;

INSERT INTO transactions (user_id, type, amount, category, description, date, status, is_fixed, is_recurring, recurrence_period)
SELECT id, 'expense', 450, '🍔 Alimentação', 'Supermercado', NOW(), 'pending', false, false, NULL
FROM auth.users WHERE email = 'felipecozendey@gmail.com'
ON CONFLICT DO NOTHING;

INSERT INTO transactions (user_id, type, amount, category, description, date, status, is_fixed, is_recurring, recurrence_period)
SELECT id, 'income', 800, '💼 Freelance', 'Projeto extra', NOW(), 'pending', false, false, NULL
FROM auth.users WHERE email = 'felipecozendey@gmail.com'
ON CONFLICT DO NOTHING;
