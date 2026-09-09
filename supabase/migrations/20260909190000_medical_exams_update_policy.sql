-- Adicionar policy de UPDATE para medical_exams permitindo edição de exames pelo usuário autenticado
DROP POLICY IF EXISTS "medical_exams_update" ON public.medical_exams;
CREATE POLICY "medical_exams_update" ON public.medical_exams
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
