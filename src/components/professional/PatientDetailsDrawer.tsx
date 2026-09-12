import React, { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  useProfessionalStore,
  PatientLink,
  PatientTarefasData,
  PatientSaudeData,
  PatientFinancasData,
  PatientEstudosData,
} from '@/stores/useProfessionalStore'
import {
  Scale,
  Activity,
  FileText,
  CheckCircle2,
  ListTodo,
  UserX,
  Loader2,
  Lock,
  Wallet,
  GraduationCap,
  TrendingUp,
  Receipt,
  BookOpen,
  Calendar,
  Layers,
  Utensils,
  Flame,
} from 'lucide-react'
import { safeFormatDate } from '@/lib/date-utils'
import { formatCurrency } from '@/lib/finance-utils'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { CONSENT_SCOPES, SCOPE_LABELS } from './consent-scopes.tsx'
import { cn } from '@/lib/utils'

interface PatientDetailsDrawerProps {
  patient: PatientLink | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function PatientDetailsDrawer({ patient, open, onOpenChange }: PatientDetailsDrawerProps) {
  const {
    fetchPatientTarefas,
    fetchPatientSaude,
    fetchPatientFinancas,
    fetchPatientEstudos,
    endPatientLink,
  } = useProfessionalStore()

  const [activeTab, setActiveTab] = useState<string>('')
  const [confirmEndOpen, setConfirmEndOpen] = useState(false)
  const [ending, setEnding] = useState(false)

  // Module data states
  const [tarefasData, setTarefasData] = useState<PatientTarefasData | null>(null)
  const [saudeData, setSaudeData] = useState<PatientSaudeData | null>(null)
  const [financasData, setFinancasData] = useState<PatientFinancasData | null>(null)
  const [estudosData, setEstudosData] = useState<PatientEstudosData | null>(null)

  // Loading flags per tab
  const [loadingMap, setLoadingMap] = useState<Record<string, boolean>>({})

  // Compute available granted pages
  const grantedPages = React.useMemo(() => {
    if (!patient || !Array.isArray(patient.granted_pages)) return []
    return patient.granted_pages.filter((p) =>
      ['tarefas', 'saude', 'financas', 'estudos'].includes(p),
    )
  }, [patient])

  // Select initial tab when opened or when granted pages change
  useEffect(() => {
    if (open && grantedPages.length > 0) {
      if (!grantedPages.includes(activeTab)) {
        setActiveTab(grantedPages[0])
      }
    } else if (open && grantedPages.length === 0) {
      setActiveTab('')
    }
  }, [open, grantedPages, activeTab])

  // Reset cached data on patient change
  useEffect(() => {
    if (patient) {
      setTarefasData(null)
      setSaudeData(null)
      setFinancasData(null)
      setEstudosData(null)
      setLoadingMap({})
    }
  }, [patient?.id])

  // Fetch data on demand when active tab opens
  useEffect(() => {
    if (!open || !patient || !activeTab) return

    if (activeTab === 'tarefas' && !tarefasData && !loadingMap['tarefas']) {
      setLoadingMap((m) => ({ ...m, tarefas: true }))
      fetchPatientTarefas(patient.patient_id)
        .then((res) => setTarefasData(res))
        .finally(() => setLoadingMap((m) => ({ ...m, tarefas: false })))
    } else if (activeTab === 'saude' && !saudeData && !loadingMap['saude']) {
      setLoadingMap((m) => ({ ...m, saude: true }))
      fetchPatientSaude(patient.patient_id)
        .then((res) => setSaudeData(res))
        .finally(() => setLoadingMap((m) => ({ ...m, saude: false })))
    } else if (activeTab === 'financas' && !financasData && !loadingMap['financas']) {
      setLoadingMap((m) => ({ ...m, financas: true }))
      fetchPatientFinancas(patient.patient_id)
        .then((res) => setFinancasData(res))
        .finally(() => setLoadingMap((m) => ({ ...m, financas: false })))
    } else if (activeTab === 'estudos' && !estudosData && !loadingMap['estudos']) {
      setLoadingMap((m) => ({ ...m, estudos: true }))
      fetchPatientEstudos(patient.patient_id)
        .then((res) => setEstudosData(res))
        .finally(() => setLoadingMap((m) => ({ ...m, estudos: false })))
    }
  }, [
    open,
    patient,
    activeTab,
    tarefasData,
    saudeData,
    financasData,
    estudosData,
    loadingMap,
    fetchPatientTarefas,
    fetchPatientSaude,
    fetchPatientFinancas,
    fetchPatientEstudos,
  ])

  if (!patient) return null

  const handleEndLink = async () => {
    setEnding(true)
    const ok = await endPatientLink(patient.id)
    setEnding(false)
    if (ok) {
      setConfirmEndOpen(false)
      onOpenChange(false)
    }
  }

  const initials = (patient.patient_name || patient.patient_email || 'P').slice(0, 2).toUpperCase()

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl border-2 p-0 gap-0 shadow-2xl">
          {/* Cabeçalho Pro Azul */}
          <DialogHeader className="p-5 sm:p-6 pb-4 border-b bg-[#1CB0F6]/10">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-[#1CB0F6] text-white flex items-center justify-center font-black text-lg shadow-sm shrink-0">
                  {initials}
                </div>
                <div>
                  <DialogTitle className="text-xl font-black text-foreground flex items-center gap-2">
                    <span>{patient.patient_name || 'Paciente'}</span>
                    <Badge className="bg-[#1CB0F6] text-white text-[10px] font-extrabold uppercase">
                      {patient.status === 'active' ? 'Ativo' : patient.status}
                    </Badge>
                  </DialogTitle>
                  <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                    {patient.patient_email} • Conectado desde {safeFormatDate(patient.created_at)}
                  </DialogDescription>
                </div>
              </div>
            </div>

            {/* Abas dinâmicas pelos escopos concedidos */}
            {grantedPages.length > 0 && (
              <div className="overflow-x-auto pb-1 -mx-2 px-2 mt-4">
                <div className="inline-flex w-auto min-w-full sm:min-w-0 p-1.5 rounded-2xl bg-card border-2 gap-1.5">
                  {grantedPages.map((scope) => {
                    const isActive = activeTab === scope
                    const label = SCOPE_LABELS[scope] || scope
                    const def = CONSENT_SCOPES.find((s) => s.key === scope)
                    const IconComp = def?.icon

                    return (
                      <button
                        key={scope}
                        type="button"
                        onClick={() => setActiveTab(scope)}
                        className={cn(
                          'rounded-xl px-3.5 py-2 text-xs font-black transition-all flex items-center gap-2 cursor-pointer shrink-0 border-b-2',
                          isActive
                            ? 'bg-[#1CB0F6] text-white border-[#147eb0] shadow-xs'
                            : 'bg-transparent text-muted-foreground hover:bg-muted border-transparent',
                        )}
                      >
                        {IconComp && <IconComp className="w-3.5 h-3.5" />}
                        <span>{label}</span>
                      </button>
                    )
                  })}
                </div>
              </div>
            )}
          </DialogHeader>

          {/* Conteúdo Principal por Aba */}
          <div className="p-5 sm:p-6 space-y-6">
            {grantedPages.length === 0 ? (
              <div className="py-12 px-4 text-center rounded-2xl border-2 border-dashed bg-muted/20 space-y-2">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center mx-auto">
                  <Lock className="w-6 h-6" />
                </div>
                <h4 className="text-sm font-extrabold text-foreground">
                  Nenhuma permissão concedida
                </h4>
                <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                  O paciente ainda não liberou o acesso a nenhuma área clínica ou de rotina. Peça ao
                  paciente para acessar Ajustes → Profissionais e liberar os módulos desejados.
                </p>
              </div>
            ) : (
              <>
                {/* ABA 1: HÁBITOS E TAREFAS */}
                {activeTab === 'tarefas' && (
                  <div className="space-y-5 animate-fade-in">
                    {loadingMap['tarefas'] ? (
                      <div className="space-y-3">
                        <Skeleton className="h-20 w-full rounded-2xl" />
                        <Skeleton className="h-32 w-full rounded-2xl" />
                      </div>
                    ) : !tarefasData ? (
                      <p className="text-xs text-muted-foreground italic text-center py-6">
                        Nenhum dado de tarefas disponível.
                      </p>
                    ) : (
                      <>
                        {/* Resumo de Aderência */}
                        <div className="grid grid-cols-2 gap-3">
                          <div className="p-3.5 rounded-2xl border-2 bg-card flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-[#58CC02]/15 text-[#58CC02] flex items-center justify-center shrink-0">
                              <CheckCircle2 className="w-5 h-5" />
                            </div>
                            <div>
                              <div className="text-[11px] font-bold text-muted-foreground">
                                Concluídas (7d)
                              </div>
                              <div className="text-lg font-black text-foreground">
                                {tarefasData.completed_tasks}
                              </div>
                            </div>
                          </div>

                          <div className="p-3.5 rounded-2xl border-2 bg-card flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-[#1CB0F6]/15 text-[#1CB0F6] flex items-center justify-center shrink-0">
                              <ListTodo className="w-5 h-5" />
                            </div>
                            <div>
                              <div className="text-[11px] font-bold text-muted-foreground">
                                Tarefas Pendentes
                              </div>
                              <div className="text-lg font-black text-foreground">
                                {tarefasData.pending_tasks}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Hábitos e Streaks */}
                        <div className="space-y-3">
                          <h4 className="text-xs font-black uppercase text-muted-foreground flex items-center gap-2 tracking-wider">
                            <Activity className="w-4 h-4 text-[#58CC02]" />
                            Hábitos Ativos e Consistência ({tarefasData.habits_summary.length})
                          </h4>

                          {tarefasData.habits_summary.length === 0 ? (
                            <div className="p-4 rounded-2xl border bg-muted/20 text-center text-xs text-muted-foreground">
                              O paciente ainda não cadastrou hábitos.
                            </div>
                          ) : (
                            <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                              {tarefasData.habits_summary.map((h) => (
                                <div
                                  key={h.id}
                                  className="p-3 rounded-2xl border bg-card flex items-center justify-between text-xs gap-3"
                                >
                                  <div className="min-w-0 flex-1">
                                    <div className="font-extrabold text-foreground truncate">
                                      {h.title}
                                    </div>
                                    <div className="text-[11px] text-muted-foreground flex items-center gap-2">
                                      <span>Aderência: {h.weekly_progress_pct}%</span>
                                      {h.streak > 0 && (
                                        <span className="text-amber-600 dark:text-amber-400 font-bold flex items-center gap-1">
                                          <Flame className="w-3 h-3 fill-amber-500 text-amber-500" />
                                          {h.streak} dias seguidos
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                  <Badge
                                    variant="outline"
                                    className="text-[10px] font-bold text-[#58CC02] border-[#58CC02]/40 bg-[#58CC02]/5 shrink-0"
                                  >
                                    {h.frequency}
                                  </Badge>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Tarefas Recentes */}
                        <div className="space-y-2">
                          <h4 className="text-xs font-black uppercase text-muted-foreground tracking-wider">
                            Tarefas Recentes ({tarefasData.recent_tasks.length})
                          </h4>
                          <div className="space-y-1.5 max-h-[160px] overflow-y-auto pr-1">
                            {tarefasData.recent_tasks.map((task) => (
                              <div
                                key={task.id}
                                className="p-2.5 rounded-xl border bg-card flex items-center justify-between text-xs"
                              >
                                <span
                                  className={cn(
                                    'truncate pr-2',
                                    task.completed
                                      ? 'line-through text-muted-foreground'
                                      : 'font-semibold text-foreground',
                                  )}
                                >
                                  {task.title}
                                </span>
                                <span
                                  className={cn(
                                    'text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0',
                                    task.completed
                                      ? 'bg-emerald-500/10 text-emerald-600'
                                      : 'bg-muted text-muted-foreground',
                                  )}
                                >
                                  {task.completed ? 'Concluída' : 'Pendente'}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                )}

                {/* ABA 2: SAÚDE */}
                {activeTab === 'saude' && (
                  <div className="space-y-5 animate-fade-in">
                    {loadingMap['saude'] ? (
                      <div className="space-y-3">
                        <Skeleton className="h-24 w-full rounded-2xl" />
                        <Skeleton className="h-32 w-full rounded-2xl" />
                      </div>
                    ) : !saudeData ? (
                      <p className="text-xs text-muted-foreground italic text-center py-6">
                        Nenhum dado de saúde disponível.
                      </p>
                    ) : (
                      <>
                        {/* Métricas e Metas */}
                        <div className="space-y-3">
                          <h4 className="text-xs font-black uppercase text-muted-foreground flex items-center gap-2 tracking-wider">
                            <Scale className="w-4 h-4 text-[#1CB0F6]" />
                            Métricas Corporais e Metas
                          </h4>

                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                            <div className="p-3 rounded-2xl border-2 bg-card">
                              <div className="text-[10px] font-bold text-muted-foreground">
                                Peso Atual
                              </div>
                              <div className="text-base font-black text-foreground mt-0.5">
                                {saudeData.latest_metrics?.weight
                                  ? `${saudeData.latest_metrics.weight} kg`
                                  : '—'}
                              </div>
                            </div>

                            <div className="p-3 rounded-2xl border-2 bg-card">
                              <div className="text-[10px] font-bold text-muted-foreground">
                                Meta de Peso
                              </div>
                              <div className="text-base font-black text-[#1CB0F6] mt-0.5">
                                {saudeData.goals?.target_weight
                                  ? `${saudeData.goals.target_weight} kg`
                                  : '—'}
                              </div>
                            </div>

                            <div className="p-3 rounded-2xl border-2 bg-card">
                              <div className="text-[10px] font-bold text-muted-foreground">
                                % Gordura Atual
                              </div>
                              <div className="text-base font-black text-foreground mt-0.5">
                                {saudeData.latest_metrics?.body_fat_percentage
                                  ? `${saudeData.latest_metrics.body_fat_percentage}%`
                                  : '—'}
                              </div>
                            </div>

                            <div className="p-3 rounded-2xl border-2 bg-card">
                              <div className="text-[10px] font-bold text-muted-foreground">
                                Meta % Gordura
                              </div>
                              <div className="text-base font-black text-[#1CB0F6] mt-0.5">
                                {saudeData.goals?.target_body_fat
                                  ? `${saudeData.goals.target_body_fat}%`
                                  : '—'}
                              </div>
                            </div>
                          </div>

                          {saudeData.latest_metrics && (
                            <div className="p-3.5 rounded-2xl border bg-muted/20 text-xs space-y-2">
                              <div className="font-bold text-foreground flex items-center justify-between">
                                <span>Última avaliação:</span>
                                <span className="text-muted-foreground font-medium">
                                  {safeFormatDate(
                                    saudeData.latest_metrics.date ||
                                      saudeData.latest_metrics.created_at,
                                  )}
                                </span>
                              </div>
                              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px] text-muted-foreground">
                                <div>
                                  Massa Magra:{' '}
                                  <strong className="text-foreground">
                                    {saudeData.latest_metrics.muscle_mass
                                      ? `${saudeData.latest_metrics.muscle_mass} kg`
                                      : saudeData.latest_metrics.lean_mass
                                        ? `${saudeData.latest_metrics.lean_mass} kg`
                                        : '—'}
                                  </strong>
                                </div>
                                <div>
                                  Pressão:{' '}
                                  <strong className="text-foreground">
                                    {saudeData.latest_metrics.blood_pressure || '—'}
                                  </strong>
                                </div>
                                <div>
                                  Glicose:{' '}
                                  <strong className="text-foreground">
                                    {saudeData.latest_metrics.glucose
                                      ? `${saudeData.latest_metrics.glucose} mg/dL`
                                      : '—'}
                                  </strong>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Exames Médicos Anexados */}
                        <div className="space-y-2">
                          <h4 className="text-xs font-black uppercase text-muted-foreground flex items-center gap-2 tracking-wider">
                            <FileText className="w-4 h-4 text-[#FFC800]" />
                            Exames Clínicos ({saudeData.medical_exams.length})
                          </h4>

                          {saudeData.medical_exams.length === 0 ? (
                            <div className="p-3 rounded-2xl border bg-muted/20 text-center text-xs text-muted-foreground">
                              Nenhum exame anexado pelo paciente.
                            </div>
                          ) : (
                            <div className="space-y-2 max-h-[140px] overflow-y-auto pr-1">
                              {saudeData.medical_exams.map((exam: any) => (
                                <div
                                  key={exam.id}
                                  className="p-3 rounded-2xl border bg-card flex items-center justify-between text-xs"
                                >
                                  <div className="min-w-0 pr-2">
                                    <div className="font-bold text-foreground truncate">
                                      {exam.title}
                                    </div>
                                    <div className="text-[10px] text-muted-foreground">
                                      {safeFormatDate(exam.date || exam.created_at)}
                                    </div>
                                  </div>
                                  {exam.file_url && (
                                    <a
                                      href={exam.file_url}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="px-3 py-1.5 rounded-xl bg-[#1CB0F6] text-white font-black text-[11px] hover:bg-[#1899d6]"
                                    >
                                      Ver Exame
                                    </a>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Registros Nutricionais Recentes */}
                        {saudeData.meal_logs.length > 0 && (
                          <div className="space-y-2">
                            <h4 className="text-xs font-black uppercase text-muted-foreground flex items-center gap-2 tracking-wider">
                              <Utensils className="w-4 h-4 text-[#58CC02]" />
                              Registros de Refeição Recentes ({saudeData.meal_logs.length})
                            </h4>
                            <div className="space-y-1.5 max-h-[140px] overflow-y-auto pr-1">
                              {saudeData.meal_logs.map((m: any) => (
                                <div
                                  key={m.id}
                                  className="p-2.5 rounded-xl border bg-card flex items-center justify-between text-xs"
                                >
                                  <div>
                                    <div className="font-bold text-foreground capitalize">
                                      {m.meal_type || 'Refeição'}
                                    </div>
                                    <div className="text-[10px] text-muted-foreground">
                                      {safeFormatDate(m.created_at)} • {m.calories || 0} kcal • P:{' '}
                                      {m.protein || 0}g
                                    </div>
                                  </div>
                                  <Badge variant="outline" className="text-[10px] font-bold">
                                    {m.adherence || 'OK'}
                                  </Badge>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )}

                {/* ABA 3: FINANÇAS */}
                {activeTab === 'financas' && (
                  <div className="space-y-5 animate-fade-in">
                    {loadingMap['financas'] ? (
                      <div className="space-y-3">
                        <Skeleton className="h-24 w-full rounded-2xl" />
                        <Skeleton className="h-32 w-full rounded-2xl" />
                      </div>
                    ) : !financasData ? (
                      <p className="text-xs text-muted-foreground italic text-center py-6">
                        Nenhum dado financeiro disponível.
                      </p>
                    ) : (
                      <>
                        {/* Resumo Agregado */}
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                          <div className="p-3.5 rounded-2xl border-2 bg-card">
                            <div className="text-[10px] font-bold text-muted-foreground">
                              Receitas do Mês
                            </div>
                            <div className="text-base font-black text-emerald-600 dark:text-emerald-400 mt-0.5">
                              {formatCurrency(financasData.monthly_income)}
                            </div>
                          </div>

                          <div className="p-3.5 rounded-2xl border-2 bg-card">
                            <div className="text-[10px] font-bold text-muted-foreground">
                              Despesas do Mês
                            </div>
                            <div className="text-base font-black text-rose-600 dark:text-rose-400 mt-0.5">
                              {formatCurrency(financasData.monthly_expense)}
                            </div>
                          </div>

                          <div className="p-3.5 rounded-2xl border-2 bg-card col-span-2 sm:col-span-1">
                            <div className="text-[10px] font-bold text-muted-foreground">
                              Saldo do Mês
                            </div>
                            <div
                              className={cn(
                                'text-base font-black mt-0.5',
                                financasData.balance >= 0
                                  ? 'text-foreground'
                                  : 'text-rose-600 dark:text-rose-400',
                              )}
                            >
                              {formatCurrency(financasData.balance)}
                            </div>
                          </div>
                        </div>

                        {/* Investimentos */}
                        <div className="p-4 rounded-2xl border-2 bg-card space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-black uppercase text-muted-foreground tracking-wider flex items-center gap-1.5">
                              <TrendingUp className="w-4 h-4 text-[#1CB0F6]" />
                              Investimentos Agregados
                            </span>
                            <span className="text-xs font-bold text-muted-foreground">
                              {financasData.investments.length} ativo(s)
                            </span>
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div className="p-2.5 rounded-xl bg-muted/30">
                              <div className="text-[10px] text-muted-foreground">
                                Total Investido
                              </div>
                              <div className="text-sm font-black text-foreground">
                                {formatCurrency(financasData.total_invested)}
                              </div>
                            </div>
                            <div className="p-2.5 rounded-xl bg-muted/30">
                              <div className="text-[10px] text-muted-foreground">Valor Atual</div>
                              <div className="text-sm font-black text-[#1CB0F6]">
                                {formatCurrency(financasData.total_current_invested)}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Contas Bancárias Cadastradas */}
                        {financasData.bank_accounts.length > 0 && (
                          <div className="space-y-2">
                            <h4 className="text-xs font-black uppercase text-muted-foreground flex items-center gap-1.5 tracking-wider">
                              <Wallet className="w-4 h-4 text-emerald-500" />
                              Contas Cadastradas ({financasData.bank_accounts.length})
                            </h4>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                              {financasData.bank_accounts.map((acc: any) => (
                                <div
                                  key={acc.id}
                                  className="p-3 rounded-2xl border bg-card text-xs"
                                >
                                  <div className="font-extrabold text-foreground truncate">
                                    {acc.name}
                                  </div>
                                  <div className="text-[10px] text-muted-foreground capitalize">
                                    {acc.account_type || 'Conta'}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Faturas Pendentes */}
                        {financasData.pending_billings.length > 0 && (
                          <div className="space-y-2">
                            <div className="flex items-center justify-between text-xs">
                              <h4 className="font-black uppercase text-muted-foreground flex items-center gap-1.5 tracking-wider">
                                <Receipt className="w-4 h-4 text-amber-500" />
                                Faturas Pendentes ({financasData.pending_billings.length})
                              </h4>
                              <span className="text-xs font-black text-amber-600">
                                {formatCurrency(financasData.pending_billings_total)}
                              </span>
                            </div>
                            <div className="space-y-1 max-h-[140px] overflow-y-auto pr-1">
                              {financasData.pending_billings.map((b: any) => (
                                <div
                                  key={b.id}
                                  className="p-2 rounded-xl border bg-card flex items-center justify-between text-xs"
                                >
                                  <span className="font-bold text-foreground truncate">
                                    {b.description}
                                  </span>
                                  <span className="font-black text-foreground shrink-0">
                                    {formatCurrency(b.amount)}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        <div className="p-3 rounded-2xl bg-muted/20 border text-[11px] text-muted-foreground flex items-center gap-2">
                          <Lock className="w-4 h-4 text-muted-foreground shrink-0" />
                          <span>
                            Senhas e credenciais do paciente <strong>nunca</strong> são
                            compartilhadas, preservando o sigilo absoluto.
                          </span>
                        </div>
                      </>
                    )}
                  </div>
                )}

                {/* ABA 4: ESTUDOS */}
                {activeTab === 'estudos' && (
                  <div className="space-y-5 animate-fade-in">
                    {loadingMap['estudos'] ? (
                      <div className="space-y-3">
                        <Skeleton className="h-24 w-full rounded-2xl" />
                        <Skeleton className="h-32 w-full rounded-2xl" />
                      </div>
                    ) : !estudosData ? (
                      <p className="text-xs text-muted-foreground italic text-center py-6">
                        Nenhum dado de estudos disponível.
                      </p>
                    ) : (
                      <>
                        {/* Resumo de Estudos */}
                        <div className="grid grid-cols-3 gap-2.5">
                          <div className="p-3.5 rounded-2xl border-2 bg-card text-center">
                            <div className="text-[10px] font-bold text-muted-foreground">
                              Cadernos
                            </div>
                            <div className="text-lg font-black text-foreground mt-0.5">
                              {estudosData.notebooks.length}
                            </div>
                          </div>

                          <div className="p-3.5 rounded-2xl border-2 bg-card text-center">
                            <div className="text-[10px] font-bold text-muted-foreground">Notas</div>
                            <div className="text-lg font-black text-[#1CB0F6] mt-0.5">
                              {estudosData.notes.length}
                            </div>
                          </div>

                          <div className="p-3.5 rounded-2xl border-2 bg-card text-center">
                            <div className="text-[10px] font-bold text-muted-foreground">
                              Flashcards
                            </div>
                            <div className="text-lg font-black text-indigo-600 dark:text-indigo-400 mt-0.5">
                              {estudosData.flashcards_count}
                            </div>
                          </div>
                        </div>

                        {/* Baralhos Cadastrados */}
                        <div className="space-y-2">
                          <h4 className="text-xs font-black uppercase text-muted-foreground flex items-center gap-1.5 tracking-wider">
                            <Layers className="w-4 h-4 text-indigo-500" />
                            Baralhos de Estudo ({estudosData.decks.length})
                          </h4>
                          {estudosData.decks.length === 0 ? (
                            <div className="p-3 rounded-2xl border bg-muted/20 text-center text-xs text-muted-foreground">
                              Nenhum baralho criado pelo paciente.
                            </div>
                          ) : (
                            <div className="grid grid-cols-2 gap-2">
                              {estudosData.decks.map((deck: any) => (
                                <div
                                  key={deck.id}
                                  className="p-3 rounded-2xl border bg-card flex items-center gap-2.5 text-xs"
                                >
                                  <span className="text-lg">{deck.emoji || '📚'}</span>
                                  <div className="min-w-0 flex-1">
                                    <div className="font-extrabold text-foreground truncate">
                                      {deck.title}
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Notas Recentes */}
                        {estudosData.notes.length > 0 && (
                          <div className="space-y-2">
                            <h4 className="text-xs font-black uppercase text-muted-foreground flex items-center gap-1.5 tracking-wider">
                              <BookOpen className="w-4 h-4 text-[#1CB0F6]" />
                              Anotações Recentes ({estudosData.notes.length})
                            </h4>
                            <div className="space-y-1 max-h-[160px] overflow-y-auto pr-1">
                              {estudosData.notes.map((note: any) => (
                                <div
                                  key={note.id}
                                  className="p-2.5 rounded-xl border bg-card flex items-center justify-between text-xs"
                                >
                                  <span className="font-bold text-foreground truncate pr-2 flex items-center gap-1.5">
                                    <span>{note.emoji || '📝'}</span>
                                    <span>{note.title || 'Sem título'}</span>
                                  </span>
                                  <span className="text-[10px] text-muted-foreground shrink-0">
                                    {safeFormatDate(note.updated_at || note.created_at)}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )}
              </>
            )}

            {/* Ação de Encerrar Vínculo */}
            <div className="pt-4 border-t flex items-center justify-between">
              <div className="text-[11px] text-muted-foreground">
                O paciente pode revogar permissões a qualquer momento.
              </div>
              {patient.status === 'active' && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setConfirmEndOpen(true)}
                  className="rounded-2xl border-2 border-rose-300 dark:border-rose-800 text-rose-600 dark:text-rose-400 font-bold text-xs h-10 px-4 flex items-center gap-1.5 hover:bg-rose-50 dark:hover:bg-rose-950"
                >
                  <UserX className="w-4 h-4" />
                  <span>Encerrar vínculo</span>
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Confirmação de encerramento */}
      <AlertDialog open={confirmEndOpen} onOpenChange={setConfirmEndOpen}>
        <AlertDialogContent className="rounded-3xl border-2 p-6 shadow-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-lg font-black text-foreground">
              Encerrar vínculo com este paciente?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-muted-foreground">
              Você deixará de ter acesso às informações clínicas e aos dados compartilhados de{' '}
              <strong>{patient.patient_name || patient.patient_email}</strong>.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-2xl font-bold">Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleEndLink}
              disabled={ending}
              className="rounded-2xl font-black bg-rose-600 hover:bg-rose-700 text-white border-b-4 border-rose-800"
            >
              {ending ? 'Encerrando...' : 'Sim, encerrar vínculo'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
