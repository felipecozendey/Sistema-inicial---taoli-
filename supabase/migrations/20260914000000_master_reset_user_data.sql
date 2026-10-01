-- Migration: 20260914000000_master_reset_user_data.sql
-- Description: Adiciona account_reset_at em profiles e a função master_reset_user_data

-- 1. Coluna account_reset_at em profiles
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS account_reset_at TIMESTAMPTZ DEFAULT NULL;

-- 2. Função RPC master_reset_user_data com validação is_master e SECURITY DEFINER
CREATE OR REPLACE FUNCTION public.master_reset_user_data(
  target_user_id UUID,
  reset_scope TEXT -- 'usage', 'clinical', 'all'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  caller_id UUID;
  caller_email TEXT;
  target_rec RECORD;
  reset_timestamp TIMESTAMPTZ := clock_timestamp();
  result_counts JSONB := '{}'::jsonb;
BEGIN
  -- Validar autenticação e se o chamador é master
  caller_id := auth.uid();
  IF caller_id IS NULL THEN
    RAISE EXCEPTION 'Acesso negado: usuário não autenticado';
  END IF;

  IF NOT public.is_master() THEN
    RAISE EXCEPTION 'Acesso negado: apenas master pode resetar contas de usuários';
  END IF;

  -- Obter dados do alvo
  SELECT id, email INTO target_rec
  FROM public.profiles
  WHERE id = target_user_id;

  IF target_rec.id IS NULL THEN
    RAISE EXCEPTION 'Usuário alvo não encontrado';
  END IF;

  -- Obter email do chamador para auditoria
  SELECT email INTO caller_email
  FROM public.profiles
  WHERE id = caller_id;

  -- Escopo 1: DADOS DE USO (usage ou all)
  IF reset_scope IN ('usage', 'all') THEN
    DELETE FROM public.tasks WHERE user_id = target_user_id;
    DELETE FROM public.habits WHERE user_id = target_user_id;
    DELETE FROM public.meal_logs WHERE user_id = target_user_id;
    DELETE FROM public.fasting_logs WHERE user_id = target_user_id;
    DELETE FROM public.workout_history WHERE user_id = target_user_id;
    DELETE FROM public.workout_routines WHERE user_id = target_user_id;
    DELETE FROM public.personal_records WHERE user_id = target_user_id;
    DELETE FROM public.daily_checklist WHERE user_id = target_user_id;
    DELETE FROM public.mind_journals WHERE user_id = target_user_id;
    DELETE FROM public.mind_events WHERE user_id = target_user_id;
    DELETE FROM public.transactions WHERE user_id = target_user_id;
    DELETE FROM public.bank_accounts WHERE user_id = target_user_id;
    DELETE FROM public.passwords WHERE user_id = target_user_id;
    DELETE FROM public.investments WHERE user_id = target_user_id;
    DELETE FROM public.investment_goals WHERE user_id = target_user_id;
    DELETE FROM public.investment_transactions WHERE user_id = target_user_id;
    DELETE FROM public.finance_categories WHERE user_id = target_user_id;
    DELETE FROM public.payment_methods WHERE user_id = target_user_id;
    DELETE FROM public.posts WHERE author_id = target_user_id;
    DELETE FROM public.group_posts WHERE author_id = target_user_id;
    DELETE FROM public.group_poll_votes WHERE user_id = target_user_id;
    DELETE FROM public.follows WHERE follower_id = target_user_id OR following_id = target_user_id;
    DELETE FROM public.garden_decorations WHERE user_id = target_user_id;
    DELETE FROM public.garden_state WHERE user_id = target_user_id;
    DELETE FROM public.notebooks WHERE user_id = target_user_id;
    DELETE FROM public.notes WHERE user_id = target_user_id;
    DELETE FROM public.decks WHERE user_id = target_user_id;
    DELETE FROM public.flashcards WHERE user_id = target_user_id;
    DELETE FROM public.jiu_logs WHERE user_id = target_user_id;
    DELETE FROM public.jiu_profiles WHERE user_id = target_user_id;
  END IF;

  -- Escopo 2: DADOS DE CONSULTÓRIO (clinical ou all)
  IF reset_scope IN ('clinical', 'all') THEN
    DELETE FROM public.professional_appointments WHERE patient_id = target_user_id;
    DELETE FROM public.professional_notes WHERE patient_id = target_user_id;
    DELETE FROM public.professional_patients WHERE patient_id = target_user_id;
    DELETE FROM public.patient_goals WHERE user_id = target_user_id;
    DELETE FROM public.medical_exams WHERE user_id = target_user_id;
    DELETE FROM public.body_metrics WHERE user_id = target_user_id;
    DELETE FROM public.metabolic_logs WHERE user_id = target_user_id;
    DELETE FROM public.nutrition_macro_goals WHERE user_id = target_user_id;
    DELETE FROM public.nutrition_micro_goals WHERE user_id = target_user_id;
    DELETE FROM public.diet_plans WHERE user_id = target_user_id;
    DELETE FROM public.nutrition_recipes WHERE user_id = target_user_id;
    DELETE FROM public.custom_foods WHERE user_id = target_user_id;
  END IF;

  -- Atualizar carimbo de reset em profiles
  UPDATE public.profiles
  SET account_reset_at = reset_timestamp,
      updated_at = reset_timestamp
  WHERE id = target_user_id;

  -- Registrar na tabela de auditoria admin_audit_logs
  INSERT INTO public.admin_audit_logs (
    actor_id,
    actor_email,
    action,
    target_user_id,
    target_email,
    details,
    created_at
  ) VALUES (
    caller_id,
    caller_email,
    CASE 
      WHEN reset_scope = 'usage' THEN 'reset_user_usage_data'
      WHEN reset_scope = 'clinical' THEN 'reset_user_clinical_data'
      ELSE 'reset_user_all_data'
    END,
    target_user_id,
    target_rec.email,
    jsonb_build_object(
      'scope', reset_scope,
      'timestamp', reset_timestamp,
      'target_id', target_user_id,
      'target_email', target_rec.email
    ),
    reset_timestamp
  );

  RETURN jsonb_build_object(
    'success', true,
    'scope', reset_scope,
    'target_user_id', target_user_id,
    'reset_at', reset_timestamp
  );
END;
$$;
