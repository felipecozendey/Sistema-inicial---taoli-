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
import { TaskForm } from '@/components/tasks/task-form'
import { HabitForm } from '@/components/habits/habit-form'
import { useProfessionalPatientWrite } from '@/hooks/use-professional-patient-write'
import { ProfessionalDietPlanModal } from './patient-modals/ProfessionalDietPlanModal'
import { ProfessionalAddDietItemModal } from './patient-modals/ProfessionalAddDietItemModal'
import { ProfessionalDietItemModal } from './patient-modals/ProfessionalDietItemModal'
import { ProfessionalRecipeModal } from './patient-modals/ProfessionalRecipeModal'
import { ProfessionalAnthropometryModal } from './patient-modals/ProfessionalAnthropometryModal'
import { ProfessionalMetabolicModal } from './patient-modals/ProfessionalMetabolicModal'
import { ProfessionalWorkoutModal } from './patient-modals/ProfessionalWorkoutModal'
import { ProfessionalTag } from './ProfessionalTag'
import { supabase } from '@/lib/supabase/client'
import {
  Pencil,
  Trash2,
  Plus,
  Dumbbell,
  Salad,
  ChefHat,
  ChevronRight,
  ShieldCheck,
  Zap,
} from 'lucide-react'

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
    setActivePatient,
    endPatientLink,
  } = useProfessionalStore()

  const [currentUserId, setCurrentUserId] = useState<string | null>(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data?.user) setCurrentUserId(data.user.id)
    })
  }, [])

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

  // Write hooks
  const {
    deleteTaskForPatient,
    deleteHabitForPatient,
    deleteDietPlanForPatient,
    deleteDietPlanItemForPatient,
    deleteRecipeForPatient,
    deleteBodyMetricForPatient,
    deleteMetabolicLogForPatient,
    deleteWorkoutRoutineForPatient,
  } = useProfessionalPatientWrite()

  // Sub-chips for Saúde tab
  const [saudeSubTab, setSaudeSubTab] = useState<
    'diet' | 'recipes' | 'xray' | 'metabolic' | 'workout'
  >('diet')

  // Modals state: Tasks / Habits
  const [taskModalOpen, setTaskModalOpen] = useState(false)
  const [editingTask, setEditingTask] = useState<any | null>(null)
  const [habitModalOpen, setHabitModalOpen] = useState(false)
  const [editingHabit, setEditingHabit] = useState<any | null>(null)

  // Modals state: Saúde
  const [dietPlanModalOpen, setDietPlanModalOpen] = useState(false)
  const [editingDietPlan, setEditingDietPlan] = useState<any | null>(null)
  const [addDietItemModalOpen, setAddDietItemModalOpen] = useState(false)
  const [activePlanForAddItem, setActivePlanForAddItem] = useState<{
    id: string
    name: string
  } | null>(null)
  const [editDietItemModalOpen, setEditDietItemModalOpen] = useState(false)
  const [editingDietItem, setEditingDietItem] = useState<any | null>(null)

  const [recipeModalOpen, setRecipeModalOpen] = useState(false)
  const [editingRecipe, setEditingRecipe] = useState<any | null>(null)

  const [anthropometryModalOpen, setAnthropometryModalOpen] = useState(false)
  const [editingMetric, setEditingMetric] = useState<any | null>(null)

  const [metabolicModalOpen, setMetabolicModalOpen] = useState(false)
  const [editingMetabolicLog, setEditingMetabolicLog] = useState<any | null>(null)

  const [workoutModalOpen, setWorkoutModalOpen] = useState(false)
  const [editingWorkoutRoutine, setEditingWorkoutRoutine] = useState<any | null>(null)

  // Generic delete alert dialog state
  const [deleteConfirm, setDeleteConfirm] = useState<{
    open: boolean
    title: string
    description: string
    onConfirm: () => Promise<void>
  }>({
    open: false,
    title: '',
    description: '',
    onConfirm: async () => {},
  })
  const [isDeleting, setIsDeleting] = useState(false)

  const reloadTarefas = React.useCallback(async () => {
    if (!patient) return
    const res = await fetchPatientTarefas(patient.patient_id)
    setTarefasData(res)
  }, [patient, fetchPatientTarefas])

  const reloadSaude = React.useCallback(async () => {
    if (!patient) return
    const res = await fetchPatientSaude(patient.patient_id)
    setSaudeData(res)
  }, [patient, fetchPatientSaude])

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

  // Set and clear active patient in store
  useEffect(() => {
    if (open && patient) {
      setActivePatient({
        id: patient.patient_id,
        displayName: patient.patient_name || patient.patient_email,
        grantedPages: Array.isArray(patient.granted_pages) ? patient.granted_pages : [],
      })
    } else if (!open) {
      setActivePatient(null)
    }
  }, [open, patient, setActivePatient])

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
                    {/* Botões 3D Azuis de Ação no Topo */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingTask(null)
                          setTaskModalOpen(true)
                        }}
                        className="w-full py-3 px-4 rounded-3xl bg-[#1CB0F6] hover:bg-[#1899d6] text-white font-extrabold text-xs sm:text-sm border-b-4 border-[#147eb0] active:translate-y-1 active:border-b-0 transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <Plus className="w-4 h-4 stroke-[3]" />
                        <span>Nova Tarefa para o Paciente</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setEditingHabit(null)
                          setHabitModalOpen(true)
                        }}
                        className="w-full py-3 px-4 rounded-3xl bg-[#1CB0F6] hover:bg-[#1899d6] text-white font-extrabold text-xs sm:text-sm border-b-4 border-[#147eb0] active:translate-y-1 active:border-b-0 transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <Plus className="w-4 h-4 stroke-[3]" />
                        <span>Novo Hábito</span>
                      </button>
                    </div>

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
                          <div className="flex items-center justify-between">
                            <h4 className="text-xs font-black uppercase text-muted-foreground flex items-center gap-2 tracking-wider">
                              <Activity className="w-4 h-4 text-[#58CC02]" />
                              Hábitos do Paciente (
                              {tarefasData.habits?.length || tarefasData.habits_summary.length})
                            </h4>
                          </div>

                          {(tarefasData.habits || []).length === 0 ? (
                            <div className="p-4 rounded-2xl border bg-muted/20 text-center text-xs text-muted-foreground">
                              Nenhum hábito cadastrado. Clique em &quot;Novo Hábito&quot; acima para
                              prescrever.
                            </div>
                          ) : (
                            <div className="space-y-2 max-h-[260px] overflow-y-auto pr-1">
                              {tarefasData.habits.map((h: any) => {
                                const isAuthor = currentUserId && h.created_by === currentUserId
                                const summary = tarefasData.habits_summary.find(
                                  (s) => s.id === h.id,
                                )
                                return (
                                  <div
                                    key={h.id}
                                    className="p-3 rounded-2xl border bg-card flex items-center justify-between text-xs gap-3 hover:border-[#1CB0F6]/50 transition-colors"
                                  >
                                    <div className="min-w-0 flex-1">
                                      <div className="flex items-center gap-2">
                                        <span className="font-extrabold text-foreground truncate">
                                          {h.title}
                                        </span>
                                        {isAuthor && <ProfessionalTag createdBy={h.created_by} />}
                                      </div>
                                      <div className="text-[11px] text-muted-foreground flex items-center gap-2 mt-0.5">
                                        {summary && (
                                          <span>Aderência: {summary.weekly_progress_pct}%</span>
                                        )}
                                        {summary && summary.streak > 0 && (
                                          <span className="text-amber-600 dark:text-amber-400 font-bold flex items-center gap-1">
                                            <Flame className="w-3 h-3 fill-amber-500 text-amber-500" />
                                            {summary.streak} dias seguidos
                                          </span>
                                        )}
                                      </div>
                                    </div>

                                    <div className="flex items-center gap-1.5 shrink-0">
                                      <Badge
                                        variant="outline"
                                        className="text-[10px] font-bold text-[#58CC02] border-[#58CC02]/40 bg-[#58CC02]/5"
                                      >
                                        {h.frequency === 'daily' ? 'Diário' : 'Semanal'}
                                      </Badge>

                                      {isAuthor ? (
                                        <div className="flex items-center gap-1">
                                          <Button
                                            type="button"
                                            size="icon"
                                            variant="ghost"
                                            onClick={() => {
                                              setEditingHabit(h)
                                              setHabitModalOpen(true)
                                            }}
                                            className="h-7 w-7 rounded-lg text-muted-foreground hover:text-[#1CB0F6]"
                                            title="Editar hábito"
                                          >
                                            <Pencil className="w-3.5 h-3.5" />
                                          </Button>
                                          <Button
                                            type="button"
                                            size="icon"
                                            variant="ghost"
                                            onClick={() => {
                                              setDeleteConfirm({
                                                open: true,
                                                title: 'Excluir hábito prescrito?',
                                                description: `Deseja remover o hábito "${h.title}"? O paciente não terá mais esse hábito na sua rotina.`,
                                                onConfirm: async () => {
                                                  const ok = await deleteHabitForPatient(h.id)
                                                  if (ok) reloadTarefas()
                                                },
                                              })
                                            }}
                                            className="h-7 w-7 rounded-lg text-muted-foreground hover:text-rose-600"
                                            title="Excluir hábito"
                                          >
                                            <Trash2 className="w-3.5 h-3.5" />
                                          </Button>
                                        </div>
                                      ) : (
                                        <Badge
                                          variant="secondary"
                                          className="text-[9px] font-semibold"
                                        >
                                          Somente leitura
                                        </Badge>
                                      )}
                                    </div>
                                  </div>
                                )
                              })}
                            </div>
                          )}
                        </div>

                        {/* Lista de Tarefas do Paciente */}
                        <div className="space-y-2">
                          <h4 className="text-xs font-black uppercase text-muted-foreground tracking-wider">
                            Tarefas ({tarefasData.tasks?.length || tarefasData.recent_tasks.length})
                          </h4>
                          <div className="space-y-1.5 max-h-[220px] overflow-y-auto pr-1">
                            {(tarefasData.tasks || tarefasData.recent_tasks).map((task: any) => {
                              const isAuthor = currentUserId && task.created_by === currentUserId
                              return (
                                <div
                                  key={task.id}
                                  className="p-2.5 rounded-xl border bg-card flex items-center justify-between text-xs hover:border-[#1CB0F6]/50 transition-colors gap-2"
                                >
                                  <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-1.5">
                                      <span
                                        className={cn(
                                          'truncate',
                                          task.completed
                                            ? 'line-through text-muted-foreground'
                                            : 'font-semibold text-foreground',
                                        )}
                                      >
                                        {task.title}
                                      </span>
                                      {isAuthor && <ProfessionalTag createdBy={task.created_by} />}
                                    </div>
                                    <div className="text-[10px] text-muted-foreground">
                                      {task.due_date
                                        ? `Prazo: ${safeFormatDate(task.due_date)}`
                                        : 'Sem prazo'}
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-1.5 shrink-0">
                                    <span
                                      className={cn(
                                        'text-[10px] font-bold px-2 py-0.5 rounded-full',
                                        task.completed
                                          ? 'bg-emerald-500/10 text-emerald-600'
                                          : 'bg-muted text-muted-foreground',
                                      )}
                                    >
                                      {task.completed ? 'Concluída' : 'Pendente'}
                                    </span>

                                    {isAuthor ? (
                                      <div className="flex items-center gap-1">
                                        <Button
                                          type="button"
                                          size="icon"
                                          variant="ghost"
                                          onClick={() => {
                                            setEditingTask({
                                              ...task,
                                              dueDate: task.due_date,
                                              scheduledDate: task.scheduled_date,
                                              energyLevel: task.energy_level,
                                              estimatedTime: task.estimated_time,
                                              tagId: task.tag_id,
                                              tagIds: task.tag_ids,
                                              subtasks: task.subtasks || [],
                                            })
                                            setTaskModalOpen(true)
                                          }}
                                          className="h-7 w-7 rounded-lg text-muted-foreground hover:text-[#1CB0F6]"
                                          title="Editar tarefa"
                                        >
                                          <Pencil className="w-3.5 h-3.5" />
                                        </Button>
                                        <Button
                                          type="button"
                                          size="icon"
                                          variant="ghost"
                                          onClick={() => {
                                            setDeleteConfirm({
                                              open: true,
                                              title: 'Excluir tarefa prescrita?',
                                              description: `Deseja remover a tarefa "${task.title}"?`,
                                              onConfirm: async () => {
                                                const ok = await deleteTaskForPatient(task.id)
                                                if (ok) reloadTarefas()
                                              },
                                            })
                                          }}
                                          className="h-7 w-7 rounded-lg text-muted-foreground hover:text-rose-600"
                                          title="Excluir tarefa"
                                        >
                                          <Trash2 className="w-3.5 h-3.5" />
                                        </Button>
                                      </div>
                                    ) : (
                                      <Badge
                                        variant="secondary"
                                        className="text-[9px] font-semibold"
                                      >
                                        Somente leitura
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                )}

                {/* ABA 2: SAÚDE COM 5 SUB-CHIPS ROLÁVEIS */}
                {activeTab === 'saude' && (
                  <div className="space-y-4 animate-fade-in">
                    {/* Sub-chips de Saúde roláveis (não corta em 360px) */}
                    <div className="overflow-x-auto pb-1 -mx-2 px-2 scrollbar-none">
                      <div className="inline-flex items-center gap-1.5 p-1 rounded-2xl bg-muted/40 border">
                        {[
                          { key: 'diet', label: 'Plano Alimentar', icon: Salad },
                          { key: 'recipes', label: 'Receitas', icon: ChefHat },
                          { key: 'xray', label: 'Raio-X Corporal', icon: Scale },
                          { key: 'metabolic', label: 'Ato Energético', icon: Flame },
                          { key: 'workout', label: 'Fichas de Treino', icon: Dumbbell },
                        ].map((sub) => {
                          const IconComp = sub.icon
                          const isActive = saudeSubTab === sub.key
                          return (
                            <button
                              key={sub.key}
                              type="button"
                              onClick={() => setSaudeSubTab(sub.key as any)}
                              className={cn(
                                'px-3 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 shrink-0 whitespace-nowrap cursor-pointer border-b-2',
                                isActive
                                  ? 'bg-[#1CB0F6] text-white border-[#147eb0] shadow-xs'
                                  : 'text-muted-foreground hover:bg-muted/80 border-transparent',
                              )}
                            >
                              <IconComp className="w-3.5 h-3.5" />
                              <span>{sub.label}</span>
                            </button>
                          )
                        })}
                      </div>
                    </div>

                    {loadingMap['saude'] ? (
                      <div className="space-y-3">
                        <Skeleton className="h-16 w-full rounded-2xl" />
                        <Skeleton className="h-32 w-full rounded-2xl" />
                      </div>
                    ) : !saudeData ? (
                      <p className="text-xs text-muted-foreground italic text-center py-6">
                        Nenhum dado de saúde disponível.
                      </p>
                    ) : (
                      <>
                        {/* 1. PLANO ALIMENTAR */}
                        {saudeSubTab === 'diet' && (
                          <div className="space-y-4 animate-fade-in">
                            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
                              <div>
                                <h4 className="text-xs font-black uppercase text-muted-foreground flex items-center gap-1.5 tracking-wider">
                                  <Salad className="w-4 h-4 text-[#58CC02]" />
                                  Plano Alimentar ({saudeData.diet_plans?.length || 0} refeições)
                                </h4>
                                <p className="text-[11px] text-muted-foreground">
                                  Horários e refeições prescritas para o paciente.
                                </p>
                              </div>

                              <button
                                type="button"
                                onClick={() => {
                                  setEditingDietPlan(null)
                                  setDietPlanModalOpen(true)
                                }}
                                className="py-2.5 px-4 rounded-2xl bg-[#1CB0F6] hover:bg-[#1899d6] text-white font-extrabold text-xs border-b-4 border-[#147eb0] active:translate-y-0.5 active:border-b-0 transition-all flex items-center justify-center gap-1.5 shrink-0"
                              >
                                <Plus className="w-4 h-4 stroke-[3]" />
                                <span>Nova Refeição</span>
                              </button>
                            </div>

                            {!saudeData.diet_plans || saudeData.diet_plans.length === 0 ? (
                              <div className="p-8 rounded-2xl border-2 border-dashed bg-muted/20 text-center space-y-2">
                                <Salad className="w-8 h-8 text-muted-foreground mx-auto" />
                                <p className="text-xs font-bold text-foreground">
                                  Nenhuma refeição no plano — crie a primeira
                                </p>
                                <p className="text-[11px] text-muted-foreground max-w-xs mx-auto">
                                  Prescreva o café da manhã, almoço, lanches ou jantar para o
                                  paciente acompanhar.
                                </p>
                              </div>
                            ) : (
                              <div className="space-y-3">
                                {saudeData.diet_plans.map((plan: any) => {
                                  const isAuthor =
                                    currentUserId && plan.created_by === currentUserId
                                  const items = plan.diet_plan_items || []
                                  return (
                                    <div
                                      key={plan.id}
                                      className="p-4 rounded-2xl border-2 bg-card space-y-3 hover:border-[#1CB0F6]/40 transition-colors"
                                    >
                                      <div className="flex items-center justify-between gap-2">
                                        <div className="min-w-0">
                                          <div className="flex items-center gap-2">
                                            <span className="font-black text-sm text-foreground">
                                              {plan.name}
                                            </span>
                                            {plan.time && (
                                              <Badge
                                                variant="outline"
                                                className="text-[10px] font-bold"
                                              >
                                                {plan.time}
                                              </Badge>
                                            )}
                                            {isAuthor && (
                                              <ProfessionalTag createdBy={plan.created_by} />
                                            )}
                                          </div>
                                          <span className="text-[10px] text-muted-foreground">
                                            {items.length} alimento(s) nesta refeição
                                          </span>
                                        </div>

                                        <div className="flex items-center gap-1 shrink-0">
                                          {isAuthor ? (
                                            <>
                                              <Button
                                                type="button"
                                                size="sm"
                                                variant="outline"
                                                onClick={() => {
                                                  setActivePlanForAddItem({
                                                    id: plan.id,
                                                    name: plan.name,
                                                  })
                                                  setAddDietItemModalOpen(true)
                                                }}
                                                className="h-8 rounded-xl text-xs font-bold text-[#1CB0F6] border-[#1CB0F6]/40 hover:bg-[#1CB0F6]/10"
                                              >
                                                <Plus className="w-3.5 h-3.5 mr-1" />
                                                Alimento
                                              </Button>
                                              <Button
                                                type="button"
                                                size="icon"
                                                variant="ghost"
                                                onClick={() => {
                                                  setEditingDietPlan(plan)
                                                  setDietPlanModalOpen(true)
                                                }}
                                                className="h-8 w-8 rounded-xl text-muted-foreground hover:text-[#1CB0F6]"
                                                title="Editar refeição"
                                              >
                                                <Pencil className="w-3.5 h-3.5" />
                                              </Button>
                                              <Button
                                                type="button"
                                                size="icon"
                                                variant="ghost"
                                                onClick={() => {
                                                  setDeleteConfirm({
                                                    open: true,
                                                    title: 'Excluir refeição do plano?',
                                                    description: `Deseja remover "${plan.name}" e todos os alimentos incluídos nela?`,
                                                    onConfirm: async () => {
                                                      const ok = await deleteDietPlanForPatient(
                                                        plan.id,
                                                      )
                                                      if (ok) reloadSaude()
                                                    },
                                                  })
                                                }}
                                                className="h-8 w-8 rounded-xl text-muted-foreground hover:text-rose-600"
                                                title="Excluir refeição"
                                              >
                                                <Trash2 className="w-3.5 h-3.5" />
                                              </Button>
                                            </>
                                          ) : (
                                            <Badge
                                              variant="secondary"
                                              className="text-[9px] font-semibold"
                                            >
                                              Somente leitura
                                            </Badge>
                                          )}
                                        </div>
                                      </div>

                                      {/* Itens do plano alimentar */}
                                      {items.length === 0 ? (
                                        <p className="text-[11px] text-muted-foreground italic pl-1">
                                          Nenhum alimento cadastrado nesta refeição.
                                        </p>
                                      ) : (
                                        <div className="space-y-1.5 pl-1">
                                          {items.map((it: any) => {
                                            const isItemAuthor =
                                              currentUserId && it.created_by === currentUserId
                                            return (
                                              <div
                                                key={it.id}
                                                className="p-2 rounded-xl bg-muted/30 border flex items-center justify-between text-xs gap-2"
                                              >
                                                <div className="min-w-0 flex-1">
                                                  <div className="font-bold text-foreground truncate">
                                                    {it.description}
                                                  </div>
                                                  <div className="text-[10px] text-muted-foreground flex flex-wrap gap-2">
                                                    <span>Porção: {it.quantity}</span>
                                                    {it.calories > 0 && (
                                                      <span>• {it.calories} kcal</span>
                                                    )}
                                                    {it.protein_g > 0 && (
                                                      <span>• P: {it.protein_g}g</span>
                                                    )}
                                                    {it.carbs_g > 0 && (
                                                      <span>• C: {it.carbs_g}g</span>
                                                    )}
                                                    {it.fat_g > 0 && <span>• G: {it.fat_g}g</span>}
                                                    {it.allergens && (
                                                      <span className="text-amber-600 font-semibold">
                                                        ({it.allergens})
                                                      </span>
                                                    )}
                                                  </div>
                                                </div>

                                                {isItemAuthor && (
                                                  <div className="flex items-center gap-0.5 shrink-0">
                                                    <Button
                                                      type="button"
                                                      size="icon"
                                                      variant="ghost"
                                                      onClick={() => {
                                                        setEditingDietItem(it)
                                                        setEditDietItemModalOpen(true)
                                                      }}
                                                      className="h-6 w-6 rounded-md text-muted-foreground hover:text-[#1CB0F6]"
                                                      title="Editar alimento"
                                                    >
                                                      <Pencil className="w-3 h-3" />
                                                    </Button>
                                                    <Button
                                                      type="button"
                                                      size="icon"
                                                      variant="ghost"
                                                      onClick={() => {
                                                        setDeleteConfirm({
                                                          open: true,
                                                          title: 'Remover alimento?',
                                                          description: `Deseja remover "${it.description}" desta refeição?`,
                                                          onConfirm: async () => {
                                                            const ok =
                                                              await deleteDietPlanItemForPatient(
                                                                it.id,
                                                              )
                                                            if (ok) reloadSaude()
                                                          },
                                                        })
                                                      }}
                                                      className="h-6 w-6 rounded-md text-muted-foreground hover:text-rose-600"
                                                      title="Excluir alimento"
                                                    >
                                                      <Trash2 className="w-3 h-3" />
                                                    </Button>
                                                  </div>
                                                )}
                                              </div>
                                            )
                                          })}
                                        </div>
                                      )}
                                    </div>
                                  )
                                })}
                              </div>
                            )}
                          </div>
                        )}

                        {/* 2. RECEITAS */}
                        {saudeSubTab === 'recipes' && (
                          <div className="space-y-4 animate-fade-in">
                            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
                              <div>
                                <h4 className="text-xs font-black uppercase text-muted-foreground flex items-center gap-1.5 tracking-wider">
                                  <ChefHat className="w-4 h-4 text-amber-500" />
                                  Receitas Recomendadas ({saudeData.recipes?.length || 0})
                                </h4>
                                <p className="text-[11px] text-muted-foreground">
                                  Receitas e preparos culinários prescritos para o paciente.
                                </p>
                              </div>

                              <button
                                type="button"
                                onClick={() => {
                                  setEditingRecipe(null)
                                  setRecipeModalOpen(true)
                                }}
                                className="py-2.5 px-4 rounded-2xl bg-[#1CB0F6] hover:bg-[#1899d6] text-white font-extrabold text-xs border-b-4 border-[#147eb0] active:translate-y-0.5 active:border-b-0 transition-all flex items-center justify-center gap-1.5 shrink-0"
                              >
                                <Plus className="w-4 h-4 stroke-[3]" />
                                <span>Nova Receita</span>
                              </button>
                            </div>

                            {!saudeData.recipes || saudeData.recipes.length === 0 ? (
                              <div className="p-8 rounded-2xl border-2 border-dashed bg-muted/20 text-center space-y-2">
                                <ChefHat className="w-8 h-8 text-muted-foreground mx-auto" />
                                <p className="text-xs font-bold text-foreground">
                                  Nenhuma receita prescrita — crie a primeira
                                </p>
                                <p className="text-[11px] text-muted-foreground max-w-xs mx-auto">
                                  Indique preparações nutricionais ricas e práticas com controle de
                                  ingredientes.
                                </p>
                              </div>
                            ) : (
                              <div className="space-y-2.5">
                                {saudeData.recipes.map((recipe: any) => {
                                  const isAuthor =
                                    currentUserId && recipe.created_by === currentUserId
                                  const ings = recipe.recipe_ingredients || []
                                  return (
                                    <div
                                      key={recipe.id}
                                      className="p-3.5 rounded-2xl border-2 bg-card space-y-2 hover:border-[#1CB0F6]/40 transition-colors"
                                    >
                                      <div className="flex items-center justify-between gap-2">
                                        <div className="min-w-0">
                                          <div className="flex items-center gap-2">
                                            <span className="font-extrabold text-foreground text-sm truncate">
                                              {recipe.name}
                                            </span>
                                            {isAuthor && (
                                              <ProfessionalTag createdBy={recipe.created_by} />
                                            )}
                                          </div>
                                          {recipe.description && (
                                            <p className="text-[11px] text-muted-foreground line-clamp-1 mt-0.5">
                                              {recipe.description}
                                            </p>
                                          )}
                                        </div>

                                        <div className="flex items-center gap-1 shrink-0">
                                          {isAuthor ? (
                                            <>
                                              <Button
                                                type="button"
                                                size="icon"
                                                variant="ghost"
                                                onClick={() => {
                                                  setEditingRecipe(recipe)
                                                  setRecipeModalOpen(true)
                                                }}
                                                className="h-7 w-7 rounded-lg text-muted-foreground hover:text-[#1CB0F6]"
                                                title="Editar receita"
                                              >
                                                <Pencil className="w-3.5 h-3.5" />
                                              </Button>
                                              <Button
                                                type="button"
                                                size="icon"
                                                variant="ghost"
                                                onClick={() => {
                                                  setDeleteConfirm({
                                                    open: true,
                                                    title: 'Excluir receita?',
                                                    description: `Deseja remover a receita "${recipe.name}"?`,
                                                    onConfirm: async () => {
                                                      const ok = await deleteRecipeForPatient(
                                                        recipe.id,
                                                      )
                                                      if (ok) reloadSaude()
                                                    },
                                                  })
                                                }}
                                                className="h-7 w-7 rounded-lg text-muted-foreground hover:text-rose-600"
                                                title="Excluir receita"
                                              >
                                                <Trash2 className="w-3.5 h-3.5" />
                                              </Button>
                                            </>
                                          ) : (
                                            <Badge
                                              variant="secondary"
                                              className="text-[9px] font-semibold"
                                            >
                                              Somente leitura
                                            </Badge>
                                          )}
                                        </div>
                                      </div>

                                      {ings.length > 0 && (
                                        <div className="flex flex-wrap gap-1 text-[10px]">
                                          {ings.map((ing: any, i: number) => (
                                            <span
                                              key={i}
                                              className="px-2 py-0.5 rounded-md bg-muted font-medium text-muted-foreground"
                                            >
                                              {ing.custom_foods?.name || 'Ingrediente'} (
                                              {ing.amount})
                                            </span>
                                          ))}
                                        </div>
                                      )}
                                    </div>
                                  )
                                })}
                              </div>
                            )}
                          </div>
                        )}

                        {/* 3. RAIO-X CORPORAL / MEDIDAS */}
                        {saudeSubTab === 'xray' && (
                          <div className="space-y-4 animate-fade-in">
                            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
                              <div>
                                <h4 className="text-xs font-black uppercase text-muted-foreground flex items-center gap-1.5 tracking-wider">
                                  <Scale className="w-4 h-4 text-[#1CB0F6]" />
                                  Raio-X Corporal e Medidas (
                                  {saudeData.metrics_history?.length || 0})
                                </h4>
                                <p className="text-[11px] text-muted-foreground">
                                  Histórico de peso, circunferências, dobras e composição corporal.
                                </p>
                              </div>

                              <button
                                type="button"
                                onClick={() => {
                                  setEditingMetric(null)
                                  setAnthropometryModalOpen(true)
                                }}
                                className="py-2.5 px-4 rounded-2xl bg-[#1CB0F6] hover:bg-[#1899d6] text-white font-extrabold text-xs border-b-4 border-[#147eb0] active:translate-y-0.5 active:border-b-0 transition-all flex items-center justify-center gap-1.5 shrink-0"
                              >
                                <Plus className="w-4 h-4 stroke-[3]" />
                                <span>Registrar Avaliação</span>
                              </button>
                            </div>

                            {/* Resumo atual */}
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

                            {/* Lista de Avaliações */}
                            {!saudeData.metrics_history ||
                            saudeData.metrics_history.length === 0 ? (
                              <div className="p-8 rounded-2xl border-2 border-dashed bg-muted/20 text-center space-y-2">
                                <Scale className="w-8 h-8 text-muted-foreground mx-auto" />
                                <p className="text-xs font-bold text-foreground">
                                  Nenhuma avaliação física registrada
                                </p>
                                <p className="text-[11px] text-muted-foreground max-w-xs mx-auto">
                                  Clique em &quot;Registrar Avaliação&quot; para inserir medidas
                                  antropométricas completas.
                                </p>
                              </div>
                            ) : (
                              <div className="space-y-2 max-h-[260px] overflow-y-auto pr-1">
                                {saudeData.metrics_history.map((m: any) => {
                                  const isAuthor = currentUserId && m.created_by === currentUserId
                                  return (
                                    <div
                                      key={m.id}
                                      className="p-3 rounded-2xl border bg-card flex items-center justify-between text-xs gap-3 hover:border-[#1CB0F6]/40 transition-colors"
                                    >
                                      <div className="min-w-0 flex-1">
                                        <div className="flex items-center gap-2">
                                          <span className="font-extrabold text-foreground">
                                            {safeFormatDate(m.date || m.created_at)}
                                          </span>
                                          {isAuthor && <ProfessionalTag createdBy={m.created_by} />}
                                        </div>
                                        <div className="text-[11px] text-muted-foreground flex flex-wrap gap-2 mt-0.5">
                                          {m.weight && <span>Peso: {m.weight} kg</span>}
                                          {m.body_fat_percentage && (
                                            <span>• Gordura: {m.body_fat_percentage}%</span>
                                          )}
                                          {m.lean_mass && (
                                            <span>• Massa Magra: {m.lean_mass} kg</span>
                                          )}
                                        </div>
                                      </div>

                                      <div className="flex items-center gap-1 shrink-0">
                                        {isAuthor ? (
                                          <>
                                            <Button
                                              type="button"
                                              size="icon"
                                              variant="ghost"
                                              onClick={() => {
                                                setEditingMetric(m)
                                                setAnthropometryModalOpen(true)
                                              }}
                                              className="h-7 w-7 rounded-lg text-muted-foreground hover:text-[#1CB0F6]"
                                              title="Editar avaliação"
                                            >
                                              <Pencil className="w-3.5 h-3.5" />
                                            </Button>
                                            <Button
                                              type="button"
                                              size="icon"
                                              variant="ghost"
                                              onClick={() => {
                                                setDeleteConfirm({
                                                  open: true,
                                                  title: 'Excluir avaliação física?',
                                                  description: `Deseja remover a avaliação do dia ${safeFormatDate(m.date || m.created_at)}?`,
                                                  onConfirm: async () => {
                                                    const ok = await deleteBodyMetricForPatient(
                                                      m.id,
                                                    )
                                                    if (ok) reloadSaude()
                                                  },
                                                })
                                              }}
                                              className="h-7 w-7 rounded-lg text-muted-foreground hover:text-rose-600"
                                              title="Excluir avaliação"
                                            >
                                              <Trash2 className="w-3.5 h-3.5" />
                                            </Button>
                                          </>
                                        ) : (
                                          <Badge
                                            variant="secondary"
                                            className="text-[9px] font-semibold"
                                          >
                                            Somente leitura
                                          </Badge>
                                        )}
                                      </div>
                                    </div>
                                  )
                                })}
                              </div>
                            )}
                          </div>
                        )}

                        {/* 4. ATO ENERGÉTICO */}
                        {saudeSubTab === 'metabolic' && (
                          <div className="space-y-4 animate-fade-in">
                            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
                              <div>
                                <h4 className="text-xs font-black uppercase text-muted-foreground flex items-center gap-1.5 tracking-wider">
                                  <Flame className="w-4 h-4 text-amber-500" />
                                  Ato Energético e Calorias ({saudeData.metabolic_logs?.length || 0}
                                  )
                                </h4>
                                <p className="text-[11px] text-muted-foreground">
                                  TMB, NAF, Fator Injúria e meta calórica (VENTA) calculados
                                  clinicamente.
                                </p>
                              </div>

                              <button
                                type="button"
                                onClick={() => {
                                  setEditingMetabolicLog(null)
                                  setMetabolicModalOpen(true)
                                }}
                                className="py-2.5 px-4 rounded-2xl bg-[#1CB0F6] hover:bg-[#1899d6] text-white font-extrabold text-xs border-b-4 border-[#147eb0] active:translate-y-0.5 active:border-b-0 transition-all flex items-center justify-center gap-1.5 shrink-0"
                              >
                                <Plus className="w-4 h-4 stroke-[3]" />
                                <span>Registrar Cálculo Energético</span>
                              </button>
                            </div>

                            {!saudeData.metabolic_logs || saudeData.metabolic_logs.length === 0 ? (
                              <div className="p-8 rounded-2xl border-2 border-dashed bg-muted/20 text-center space-y-2">
                                <Flame className="w-8 h-8 text-amber-500 mx-auto" />
                                <p className="text-xs font-bold text-foreground">
                                  Nenhum cálculo energético registrado
                                </p>
                                <p className="text-[11px] text-muted-foreground max-w-xs mx-auto">
                                  Prescreva o planejamento metabólico calculando a TMB e o GET do
                                  paciente.
                                </p>
                              </div>
                            ) : (
                              <div className="space-y-2.5">
                                {saudeData.metabolic_logs.map((log: any) => {
                                  const isAuthor = currentUserId && log.created_by === currentUserId
                                  return (
                                    <div
                                      key={log.id}
                                      className="p-3.5 rounded-2xl border-2 bg-card space-y-2 hover:border-[#1CB0F6]/40 transition-colors"
                                    >
                                      <div className="flex items-center justify-between gap-2">
                                        <div className="min-w-0">
                                          <div className="flex items-center gap-2">
                                            <span className="font-extrabold text-foreground text-sm">
                                              {safeFormatDate(log.date || log.created_at)}
                                            </span>
                                            <Badge
                                              variant="outline"
                                              className="text-[10px] font-bold uppercase"
                                            >
                                              {log.formula || 'Mifflin'}
                                            </Badge>
                                            {isAuthor && (
                                              <ProfessionalTag createdBy={log.created_by} />
                                            )}
                                          </div>
                                          <div className="text-[11px] text-muted-foreground flex flex-wrap gap-2 mt-0.5">
                                            <span>
                                              TMB: <strong>{Math.round(log.tmb || 0)} kcal</strong>
                                            </span>
                                            <span>
                                              • VENTA:{' '}
                                              <strong className="text-amber-600">
                                                {Math.round(log.venta_target || 0)} kcal
                                              </strong>
                                            </span>
                                            {log.injury_factor && (
                                              <span>• Injúria: {log.injury_factor}</span>
                                            )}
                                          </div>
                                        </div>

                                        <div className="flex items-center gap-1 shrink-0">
                                          {isAuthor ? (
                                            <>
                                              <Button
                                                type="button"
                                                size="icon"
                                                variant="ghost"
                                                onClick={() => {
                                                  setEditingMetabolicLog(log)
                                                  setMetabolicModalOpen(true)
                                                }}
                                                className="h-7 w-7 rounded-lg text-muted-foreground hover:text-[#1CB0F6]"
                                                title="Editar cálculo energético"
                                              >
                                                <Pencil className="w-3.5 h-3.5" />
                                              </Button>
                                              <Button
                                                type="button"
                                                size="icon"
                                                variant="ghost"
                                                onClick={() => {
                                                  setDeleteConfirm({
                                                    open: true,
                                                    title: 'Excluir cálculo energético?',
                                                    description: `Deseja remover o cálculo energético de ${safeFormatDate(log.date || log.created_at)}?`,
                                                    onConfirm: async () => {
                                                      const ok = await deleteMetabolicLogForPatient(
                                                        log.id,
                                                      )
                                                      if (ok) reloadSaude()
                                                    },
                                                  })
                                                }}
                                                className="h-7 w-7 rounded-lg text-muted-foreground hover:text-rose-600"
                                                title="Excluir cálculo"
                                              >
                                                <Trash2 className="w-3.5 h-3.5" />
                                              </Button>
                                            </>
                                          ) : (
                                            <Badge
                                              variant="secondary"
                                              className="text-[9px] font-semibold"
                                            >
                                              Somente leitura
                                            </Badge>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  )
                                })}
                              </div>
                            )}
                          </div>
                        )}

                        {/* 5. FICHAS DE TREINO */}
                        {saudeSubTab === 'workout' && (
                          <div className="space-y-4 animate-fade-in">
                            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
                              <div>
                                <h4 className="text-xs font-black uppercase text-muted-foreground flex items-center gap-1.5 tracking-wider">
                                  <Dumbbell className="w-4 h-4 text-indigo-500" />
                                  Fichas de Treino ({saudeData.workout_routines?.length || 0})
                                </h4>
                                <p className="text-[11px] text-muted-foreground">
                                  Rotinas de treinamento e exercícios prescritos.
                                </p>
                              </div>

                              <button
                                type="button"
                                onClick={() => {
                                  setEditingWorkoutRoutine(null)
                                  setWorkoutModalOpen(true)
                                }}
                                className="py-2.5 px-4 rounded-2xl bg-[#1CB0F6] hover:bg-[#1899d6] text-white font-extrabold text-xs border-b-4 border-[#147eb0] active:translate-y-0.5 active:border-b-0 transition-all flex items-center justify-center gap-1.5 shrink-0"
                              >
                                <Plus className="w-4 h-4 stroke-[3]" />
                                <span>Prescrever Ficha</span>
                              </button>
                            </div>

                            {!saudeData.workout_routines ||
                            saudeData.workout_routines.length === 0 ? (
                              <div className="p-8 rounded-2xl border-2 border-dashed bg-muted/20 text-center space-y-2">
                                <Dumbbell className="w-8 h-8 text-muted-foreground mx-auto" />
                                <p className="text-xs font-bold text-foreground">
                                  Nenhuma ficha de treino prescrita
                                </p>
                                <p className="text-[11px] text-muted-foreground max-w-xs mx-auto">
                                  Clique em &quot;Prescrever Ficha&quot; para montar séries e
                                  exercícios individualizados.
                                </p>
                              </div>
                            ) : (
                              <div className="space-y-3">
                                {saudeData.workout_routines.map((routine: any) => {
                                  const isAuthor =
                                    currentUserId && routine.created_by === currentUserId
                                  const exercises = Array.isArray(routine.exercises)
                                    ? routine.exercises
                                    : []
                                  return (
                                    <div
                                      key={routine.id}
                                      className="p-4 rounded-2xl border-2 bg-card space-y-2.5 hover:border-[#1CB0F6]/40 transition-colors"
                                    >
                                      <div className="flex items-center justify-between gap-2">
                                        <div className="min-w-0">
                                          <div className="flex items-center gap-2">
                                            <span className="font-extrabold text-foreground text-sm">
                                              {routine.title}
                                            </span>
                                            {isAuthor && (
                                              <ProfessionalTag createdBy={routine.created_by} />
                                            )}
                                          </div>
                                          {routine.description && (
                                            <p className="text-[11px] text-muted-foreground mt-0.5">
                                              {routine.description}
                                            </p>
                                          )}
                                        </div>

                                        <div className="flex items-center gap-1 shrink-0">
                                          {isAuthor ? (
                                            <>
                                              <Button
                                                type="button"
                                                size="icon"
                                                variant="ghost"
                                                onClick={() => {
                                                  setEditingWorkoutRoutine(routine)
                                                  setWorkoutModalOpen(true)
                                                }}
                                                className="h-7 w-7 rounded-lg text-muted-foreground hover:text-[#1CB0F6]"
                                                title="Editar ficha"
                                              >
                                                <Pencil className="w-3.5 h-3.5" />
                                              </Button>
                                              <Button
                                                type="button"
                                                size="icon"
                                                variant="ghost"
                                                onClick={() => {
                                                  setDeleteConfirm({
                                                    open: true,
                                                    title: 'Excluir ficha de treino?',
                                                    description: `Deseja remover a ficha "${routine.title}"?`,
                                                    onConfirm: async () => {
                                                      const ok =
                                                        await deleteWorkoutRoutineForPatient(
                                                          routine.id,
                                                        )
                                                      if (ok) reloadSaude()
                                                    },
                                                  })
                                                }}
                                                className="h-7 w-7 rounded-lg text-muted-foreground hover:text-rose-600"
                                                title="Excluir ficha"
                                              >
                                                <Trash2 className="w-3.5 h-3.5" />
                                              </Button>
                                            </>
                                          ) : (
                                            <Badge
                                              variant="secondary"
                                              className="text-[9px] font-semibold"
                                            >
                                              Somente leitura
                                            </Badge>
                                          )}
                                        </div>
                                      </div>

                                      {exercises.length > 0 && (
                                        <div className="space-y-1">
                                          {exercises.map((ex: any, idx: number) => (
                                            <div
                                              key={idx}
                                              className="p-2 rounded-xl bg-muted/30 flex items-center justify-between text-xs"
                                            >
                                              <span className="font-semibold text-foreground">
                                                {ex.name}
                                              </span>
                                              <span className="text-[11px] text-muted-foreground font-bold">
                                                {ex.sets}x {ex.reps}{' '}
                                                {ex.weightKg ? `(${ex.weightKg}kg)` : ''}
                                              </span>
                                            </div>
                                          ))}
                                        </div>
                                      )}
                                    </div>
                                  )
                                })}
                              </div>
                            )}
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
            <div className="pt-4 border-t flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="text-[11px] text-muted-foreground leading-relaxed">
                Conteúdos que você criar aparecerão para o paciente com seu nome. O paciente pode
                revogar permissões a qualquer momento.
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

      {/* MODAIS CLÍNICOS E FORMULÁRIOS DE ESCRITA */}

      {/* Modal Tarefa parametrizado com patientContext */}
      <TaskForm
        open={taskModalOpen}
        onOpenChange={(v) => {
          setTaskModalOpen(v)
          if (!v) setEditingTask(null)
        }}
        editTask={editingTask}
        patientContext={
          patient
            ? {
                userId: patient.patient_id,
                displayName: patient.patient_name || 'Paciente',
                mode: 'professional',
              }
            : undefined
        }
        onSavedSuccess={() => {
          reloadTarefas()
        }}
      />

      {/* Modal Hábito parametrizado com patientContext */}
      <HabitForm
        open={habitModalOpen}
        onOpenChange={(v) => {
          setHabitModalOpen(v)
          if (!v) setEditingHabit(null)
        }}
        editHabit={editingHabit}
        patientContext={
          patient
            ? {
                userId: patient.patient_id,
                displayName: patient.patient_name || 'Paciente',
                mode: 'professional',
              }
            : undefined
        }
        onSavedSuccess={() => {
          reloadTarefas()
        }}
      />

      {/* Modal Prescrever / Editar Refeição no Plano Alimentar */}
      {patient && (
        <ProfessionalDietPlanModal
          open={dietPlanModalOpen}
          onOpenChange={(v) => {
            setDietPlanModalOpen(v)
            if (!v) setEditingDietPlan(null)
          }}
          patientName={patient.patient_name || 'Paciente'}
          editPlan={editingDietPlan}
          onSuccess={() => reloadSaude()}
        />
      )}

      {/* Modal Adicionar Alimento a Refeição do Plano */}
      {patient && activePlanForAddItem && (
        <ProfessionalAddDietItemModal
          open={addDietItemModalOpen}
          onOpenChange={(v) => {
            setAddDietItemModalOpen(v)
            if (!v) setActivePlanForAddItem(null)
          }}
          planId={activePlanForAddItem.id}
          planName={activePlanForAddItem.name}
          patientName={patient.patient_name || 'Paciente'}
          onSuccess={() => reloadSaude()}
        />
      )}

      {/* Modal Editar Alimento da Refeição */}
      {patient && (
        <ProfessionalDietItemModal
          open={editDietItemModalOpen}
          onOpenChange={(v) => {
            setEditDietItemModalOpen(v)
            if (!v) setEditingDietItem(null)
          }}
          item={editingDietItem}
          patientName={patient.patient_name || 'Paciente'}
          onSuccess={() => reloadSaude()}
        />
      )}

      {/* Modal Prescrever / Editar Receita */}
      {patient && (
        <ProfessionalRecipeModal
          open={recipeModalOpen}
          onOpenChange={(v) => {
            setRecipeModalOpen(v)
            if (!v) setEditingRecipe(null)
          }}
          patientName={patient.patient_name || 'Paciente'}
          editRecipe={editingRecipe}
          onSuccess={() => reloadSaude()}
        />
      )}

      {/* Modal Registrar / Editar Avaliação Antropométrica */}
      {patient && (
        <ProfessionalAnthropometryModal
          open={anthropometryModalOpen}
          onOpenChange={(v) => {
            setAnthropometryModalOpen(v)
            if (!v) setEditingMetric(null)
          }}
          patientName={patient.patient_name || 'Paciente'}
          editMetric={editingMetric}
          onSuccess={() => reloadSaude()}
        />
      )}

      {/* Modal Registrar / Editar Cálculo Energético */}
      {patient && (
        <ProfessionalMetabolicModal
          open={metabolicModalOpen}
          onOpenChange={(v) => {
            setMetabolicModalOpen(v)
            if (!v) setEditingMetabolicLog(null)
          }}
          patientName={patient.patient_name || 'Paciente'}
          editLog={editingMetabolicLog}
          onSuccess={() => reloadSaude()}
        />
      )}

      {/* Modal Prescrever / Editar Ficha de Treino */}
      {patient && (
        <ProfessionalWorkoutModal
          open={workoutModalOpen}
          onOpenChange={(v) => {
            setWorkoutModalOpen(v)
            if (!v) setEditingWorkoutRoutine(null)
          }}
          patientName={patient.patient_name || 'Paciente'}
          editRoutine={editingWorkoutRoutine}
          onSuccess={() => reloadSaude()}
        />
      )}

      {/* Confirmação genérica de exclusão via AlertDialog */}
      <AlertDialog
        open={deleteConfirm.open}
        onOpenChange={(o) => {
          if (!isDeleting) setDeleteConfirm((prev) => ({ ...prev, open: o }))
        }}
      >
        <AlertDialogContent className="max-w-md rounded-3xl border-2 p-6 shadow-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-lg font-black text-foreground">
              {deleteConfirm.title}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-muted-foreground">
              {deleteConfirm.description}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel disabled={isDeleting} className="rounded-2xl">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={isDeleting}
              onClick={async (e) => {
                e.preventDefault()
                setIsDeleting(true)
                try {
                  await deleteConfirm.onConfirm()
                  setDeleteConfirm((prev) => ({ ...prev, open: false }))
                } finally {
                  setIsDeleting(false)
                }
              }}
              className="bg-rose-600 hover:bg-rose-700 text-white rounded-2xl font-bold"
            >
              {isDeleting ? 'Excluindo...' : 'Confirmar Exclusão'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

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
