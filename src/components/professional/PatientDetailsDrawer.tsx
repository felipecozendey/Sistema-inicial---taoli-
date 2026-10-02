import React, { useState, useEffect, useMemo, useCallback } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
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
  PatientMenteData,
} from '@/stores/useProfessionalStore'
import { PatientMenteView } from './PatientMenteView'
import { PatientSocialHistoryTab } from './PatientSocialHistoryTab'
import { PatientSocialHistoryData } from '@/services/social'
import {
  Scale,
  Activity,
  FileText,
  CheckCircle2,
  ListTodo,
  UserX,
  Lock,
  Wallet,
  TrendingUp,
  Receipt,
  BookOpen,
  Layers,
  Flame,
  Brain,
  Pencil,
  Trash2,
  Plus,
  Dumbbell,
  Salad,
  ChefHat,
  ShieldCheck,
  Eye,
  Paperclip,
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
import {
  CONSENT_SCOPES,
  SCOPE_LABELS,
  SCOPE_BADGE_STYLES,
  normalizeGrantedPages,
  ScopeId,
} from './consent-scopes.tsx'
import { Send, Copy, Check, Globe } from 'lucide-react'
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

// 9 tabs strictly in user Health page order
const ORDERED_TABS: ScopeId[] = [
  'prontuario_geral',
  'tarefas',
  'mente',
  'nutricao',
  'exercicios',
  'raio_x',
  'financas',
  'estudos',
  'historico_social',
]

interface PatientDetailsDrawerProps {
  patient: PatientLink | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

interface ScopePermissionInfo {
  scope: string
  isDirectGrant: boolean
  professionalId: string
  professionalName: string
}

export function PatientDetailsDrawer({ patient, open, onOpenChange }: PatientDetailsDrawerProps) {
  const {
    fetchPatientTarefas,
    fetchPatientSaude,
    fetchPatientFinancas,
    fetchPatientEstudos,
    fetchPatientMente,
    fetchPatientMultidisciplinaryScopes,
    setActivePatient,
    endPatientLink,
    convertOfflinePatient,
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

  // Conversão de paciente offline
  const [confirmConvertOpen, setConfirmConvertOpen] = useState(false)
  const [converting, setConverting] = useState(false)
  const [conversionResult, setConversionResult] = useState<{
    open: boolean
    warning?: string
    message?: string
    actionLink?: string | null
    isFirst?: boolean
  }>({ open: false })
  const [copiedLink, setCopiedLink] = useState(false)

  // Multidisciplinary scope mapping
  const [multidisciplinaryInfo, setMultidisciplinaryInfo] = useState<{
    allowMultidisciplinary: boolean
    activeScopes: ScopePermissionInfo[]
  }>({
    allowMultidisciplinary: false,
    activeScopes: [],
  })

  // Module data states
  const [tarefasData, setTarefasData] = useState<PatientTarefasData | null>(null)
  const [saudeData, setSaudeData] = useState<PatientSaudeData | null>(null)
  const [financasData, setFinancasData] = useState<PatientFinancasData | null>(null)
  const [estudosData, setEstudosData] = useState<PatientEstudosData | null>(null)
  const [menteData, setMenteData] = useState<PatientMenteData | null>(null)
  const [socialHistoryData, setSocialHistoryData] = useState<PatientSocialHistoryData | null>(null)

  // Loading flags per tab
  const [loadingMap, setLoadingMap] = useState<Record<string, boolean>>({})

  // Write hooks
  const {
    deleteTaskForPatient,
    deleteDietPlanForPatient,
    deleteDietPlanItemForPatient,
    deleteRecipeForPatient,
    deleteBodyMetricForPatient,
    deleteMetabolicLogForPatient,
    deleteWorkoutRoutineForPatient,
  } = useProfessionalPatientWrite()

  // Sub-chips for Nutrição tab (diet, recipes, metabolic)
  const [nutricaoSubTab, setNutricaoSubTab] = useState<'diet' | 'recipes' | 'metabolic'>('diet')

  // Modals state: Tasks / Habits
  const [taskModalOpen, setTaskModalOpen] = useState(false)
  const [editingTask, setEditingTask] = useState<any | null>(null)
  const [habitModalOpen, setHabitModalOpen] = useState(false)
  const [editingHabit, setEditingHabit] = useState<any | null>(null)

  // Modals state: Saúde & Prontuário
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

  // Reload helpers
  const reloadTarefas = useCallback(async () => {
    if (!patient) return
    const res = await fetchPatientTarefas(patient.patient_id)
    setTarefasData(res)
  }, [patient, fetchPatientTarefas])

  const reloadSaude = useCallback(async () => {
    if (!patient) return
    const res = await fetchPatientSaude(patient.patient_id)
    setSaudeData(res)
  }, [patient, fetchPatientSaude])

  // Fetch multidisciplinary info when drawer opens
  useEffect(() => {
    if (open && patient) {
      fetchPatientMultidisciplinaryScopes(patient.patient_id).then((info) => {
        setMultidisciplinaryInfo(info)
      })
    }
  }, [open, patient, fetchPatientMultidisciplinaryScopes])

  // Compute direct granted pages (normalized)
  const directGrantedPages = useMemo(() => {
    if (!patient || !Array.isArray(patient.granted_pages)) return []
    return normalizeGrantedPages(patient.granted_pages)
  }, [patient])

  // Compute all visible tabs (direct + multidisciplinary read-only scopes) ordered strictly by ORDERED_TABS
  const visibleTabs = useMemo(() => {
    const directSet = new Set(directGrantedPages)
    const multiMap = new Map(multidisciplinaryInfo.activeScopes.map((s) => [s.scope, s] as const))

    return ORDERED_TABS.filter((tabKey) => {
      if (directSet.has(tabKey)) return true
      if (multidisciplinaryInfo.allowMultidisciplinary && multiMap.has(tabKey)) return true
      return false
    })
  }, [directGrantedPages, multidisciplinaryInfo])

  // Active tab permissions
  const activeTabPermission = useMemo(() => {
    if (!activeTab) return { isReadOnly: true, authorName: '' }
    const isDirect = directGrantedPages.includes(activeTab)
    if (isDirect) {
      return { isReadOnly: false, authorName: '' }
    }
    const multiScope = multidisciplinaryInfo.activeScopes.find((s) => s.scope === activeTab)
    return {
      isReadOnly: true,
      authorName: multiScope?.professionalName || 'outro profissional',
    }
  }, [activeTab, directGrantedPages, multidisciplinaryInfo.activeScopes])

  // Select initial tab when opened or when visible tabs change
  useEffect(() => {
    if (open && visibleTabs.length > 0) {
      if (!visibleTabs.includes(activeTab as ScopeId)) {
        setActiveTab(visibleTabs[0])
      }
    } else if (open && visibleTabs.length === 0) {
      setActiveTab('')
    }
  }, [open, visibleTabs, activeTab])

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
      setMenteData(null)
      setSocialHistoryData(null)
      setLoadingMap({})
    }
  }, [patient?.id])

  // Fetch data on demand when active tab opens (clinical areas share saudeData)
  useEffect(() => {
    if (!open || !patient || !activeTab) return

    const clinicalTabs = ['prontuario_geral', 'nutricao', 'exercicios', 'raio_x']

    if (activeTab === 'tarefas' && !tarefasData && !loadingMap['tarefas']) {
      setLoadingMap((m) => ({ ...m, tarefas: true }))
      fetchPatientTarefas(patient.patient_id)
        .then((res) => setTarefasData(res))
        .finally(() => setLoadingMap((m) => ({ ...m, tarefas: false })))
    } else if (clinicalTabs.includes(activeTab) && !saudeData && !loadingMap['saude']) {
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
    } else if (activeTab === 'mente' && !menteData && !loadingMap['mente']) {
      setLoadingMap((m) => ({ ...m, mente: true }))
      fetchPatientMente(patient.patient_id)
        .then((res) => setMenteData(res))
        .catch((err) => {
          console.error('Erro ao buscar dados de mente do paciente:', err)
          setMenteData(null)
        })
        .finally(() => setLoadingMap((m) => ({ ...m, mente: false })))
    } else if (
      activeTab === 'historico_social' &&
      !socialHistoryData &&
      !loadingMap['historico_social'] &&
      currentUserId
    ) {
      setLoadingMap((m) => ({ ...m, historico_social: true }))
      import('@/services/social').then(({ getPatientSocialHistory }) => {
        getPatientSocialHistory(patient.patient_id, currentUserId)
          .then((res) => setSocialHistoryData(res))
          .catch((err) => console.error('Erro ao buscar histórico social do paciente:', err))
          .finally(() => setLoadingMap((m) => ({ ...m, historico_social: false })))
      })
    }
  }, [
    open,
    patient,
    activeTab,
    tarefasData,
    saudeData,
    financasData,
    estudosData,
    menteData,
    socialHistoryData,
    currentUserId,
    loadingMap,
    fetchPatientTarefas,
    fetchPatientSaude,
    fetchPatientFinancas,
    fetchPatientEstudos,
    fetchPatientMente,
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

  const handleConvertPatient = async () => {
    if (!patient) return
    setConverting(true)
    const res = await convertOfflinePatient(patient.patient_id)
    setConverting(false)
    setConfirmConvertOpen(false)

    if (res.ok) {
      setConversionResult({
        open: true,
        warning: res.warning,
        message: res.message,
        actionLink: res.actionLink,
        isFirst: res.isFirst,
      })
    }
  }

  const handleCopyActionLink = () => {
    if (conversionResult.actionLink) {
      navigator.clipboard.writeText(conversionResult.actionLink)
      setCopiedLink(true)
      setTimeout(() => setCopiedLink(false), 2500)
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="w-full max-w-4xl h-[100dvh] sm:h-auto sm:max-h-[90vh] rounded-none sm:rounded-3xl border-0 sm:border-2 p-0 gap-0 shadow-2xl flex flex-col overflow-hidden">
          {/* Cabeçalho Pro Fixo (Sticky): Card do paciente + badges granulares + barra de abas rolável */}
          <DialogHeader className="shrink-0 sticky top-0 z-20 p-4 sm:p-6 pb-2.5 border-b bg-background/95 backdrop-blur-md space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-[#1CB0F6] text-white flex items-center justify-center font-black text-base sm:text-lg shadow-sm shrink-0 border-b-2 border-[#147eb0]">
                  {initials}
                </div>
                <div className="min-w-0 flex-1">
                  <DialogTitle className="text-base sm:text-xl font-black text-foreground flex items-center gap-2 truncate flex-wrap">
                    <span className="truncate">{patient.patient_name || 'Paciente'}</span>
                    {patient.is_offline && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500/15 text-amber-800 dark:text-amber-300 border border-amber-500/30 shrink-0">
                        Offline
                      </span>
                    )}
                    <Badge className="bg-[#1CB0F6] text-white text-[10px] font-extrabold uppercase shrink-0">
                      {patient.status === 'active' ? 'Ativo' : patient.status}
                    </Badge>
                  </DialogTitle>
                  <DialogDescription className="text-xs text-muted-foreground truncate mt-0.5">
                    {patient.patient_email} • Vínculo desde {safeFormatDate(patient.created_at)}
                  </DialogDescription>
                </div>
              </div>

              {/* Botão de conversão se paciente offline */}
              {patient.is_offline && (
                <div className="shrink-0 self-start sm:self-center">
                  <Button
                    type="button"
                    onClick={() => setConfirmConvertOpen(true)}
                    className="rounded-2xl h-10 px-3.5 sm:px-4 font-black bg-[#58CC02] hover:bg-[#46a302] text-white border-b-4 border-[#3c8c02] active:border-b-0 active:translate-y-1 transition-all text-xs flex items-center gap-1.5 shadow-sm cursor-pointer whitespace-nowrap"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Convidar para o sistema</span>
                  </Button>
                </div>
              )}

              {/* Badges granulares dos escopos disponíveis */}
              {visibleTabs.length > 0 && (
                <div className="flex flex-wrap items-center gap-1.5">
                  {visibleTabs.map((scope) => {
                    const badgeClass =
                      SCOPE_BADGE_STYLES[scope] || 'bg-muted text-foreground border-border'
                    const label = SCOPE_LABELS[scope] || scope
                    const isDirect = directGrantedPages.includes(scope)
                    return (
                      <span
                        key={scope}
                        className={cn(
                          'px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border flex items-center gap-1',
                          badgeClass,
                          !isDirect && 'opacity-85 border-dashed',
                        )}
                        title={
                          isDirect
                            ? 'Acesso direto concedido'
                            : 'Acesso multidisciplinar em modo leitura'
                        }
                      >
                        {!isDirect && <Eye className="w-2.5 h-2.5" />}
                        {label}
                      </span>
                    )
                  })}
                </div>
              )}
            </div>

            {/* 9 ABAS — ROLÁVEL HORIZONTALMENTE COM SUPORTE TOTAL A 360PX */}
            {visibleTabs.length > 0 && (
              <div className="overflow-x-auto pb-1.5 -mx-2 px-2 pt-1 scrollbar-none">
                <div className="inline-flex w-max min-w-full sm:min-w-0 p-1.5 rounded-2xl bg-card border-2 gap-1.5">
                  {visibleTabs.map((scope) => {
                    const isActive = activeTab === scope
                    const label = SCOPE_LABELS[scope] || scope
                    const def = CONSENT_SCOPES.find((s) => s.id === scope)
                    const IconComp = def?.icon
                    const isDirect = directGrantedPages.includes(scope)

                    // Duolingo 3D active colors based on scope category
                    const activeColorClass =
                      scope === 'mente'
                        ? 'bg-[#CE82FF] text-white border-[#a552dc]'
                        : scope === 'tarefas'
                          ? 'bg-[#58CC02] text-white border-[#45a300]'
                          : scope === 'financas'
                            ? 'bg-[#FFC800] text-amber-950 border-[#cca000]'
                            : 'bg-[#1CB0F6] text-white border-[#147eb0]'

                    return (
                      <button
                        key={scope}
                        type="button"
                        onClick={() => setActiveTab(scope)}
                        className={cn(
                          'rounded-xl px-3 py-1.5 text-xs font-black transition-all flex items-center gap-1.5 shrink-0 border-b-2 whitespace-nowrap cursor-pointer',
                          isActive
                            ? `${activeColorClass} shadow-xs`
                            : 'bg-transparent text-muted-foreground hover:bg-muted border-transparent',
                        )}
                      >
                        {IconComp && <IconComp className="w-3.5 h-3.5 shrink-0" />}
                        <span>{label}</span>
                        {!isDirect && (
                          <span
                            className={cn(
                              'px-1 py-0.2 text-[9px] rounded font-bold uppercase',
                              isActive
                                ? 'bg-black/20 text-white'
                                : 'bg-muted text-muted-foreground',
                            )}
                            title="Somente leitura multidisciplinar"
                          >
                            Leitura
                          </span>
                        )}
                      </button>
                    )
                  })}
                </div>
              </div>
            )}
          </DialogHeader>

          {/* Conteúdo Principal por Aba (Scrollable) */}
          <div className="flex-1 overflow-y-auto overscroll-contain p-4 sm:p-6 space-y-6">
            {visibleTabs.length === 0 ? (
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
                {/* SELO DE MODO MULTIDISCIPLINAR SOMENTE LEITURA */}
                {activeTabPermission.isReadOnly && (
                  <div className="p-3.5 rounded-2xl bg-sky-500/10 border-2 border-sky-400/40 text-sky-800 dark:text-sky-300 flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-sky-500 text-white flex items-center justify-center shrink-0 shadow-xs">
                      <ShieldCheck className="w-5 h-5" />
                    </div>
                    <div className="min-w-0 flex-1 text-xs">
                      <div className="font-black uppercase tracking-wider text-[11px]">
                        Atendimento Multidisciplinar • Somente Leitura
                      </div>
                      <div className="text-[11px] opacity-90 mt-0.5">
                        Registrado pelo profissional{' '}
                        <strong>@{activeTabPermission.authorName}</strong> — área de{' '}
                        {SCOPE_LABELS[activeTab as ScopeId] || activeTab}. Edições bloqueadas para
                        este módulo.
                      </div>
                    </div>
                  </div>
                )}

                {/* ABA 1: PRONTUÁRIO GERAL (Métricas, peso, dobras, metas clínicas, exames anexados e registros gerais) */}
                {activeTab === 'prontuario_geral' && (
                  <div className="space-y-5 animate-fade-in">
                    {/* Botão de Registro (apenas se concessão direta) */}
                    {!activeTabPermission.isReadOnly && (
                      <button
                        type="button"
                        onClick={() => {
                          setEditingMetric(null)
                          setAnthropometryModalOpen(true)
                        }}
                        className="w-full py-3 px-4 rounded-3xl bg-[#1CB0F6] hover:bg-[#1899d6] text-white font-extrabold text-xs sm:text-sm border-b-4 border-[#147eb0] active:translate-y-1 active:border-b-0 transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <Plus className="w-4 h-4 stroke-[3]" />
                        <span>Novo Registro no Prontuário Geral</span>
                      </button>
                    )}

                    {loadingMap['saude'] ? (
                      <div className="space-y-3">
                        <Skeleton className="h-20 w-full rounded-2xl" />
                        <Skeleton className="h-32 w-full rounded-2xl" />
                      </div>
                    ) : !saudeData ? (
                      <p className="text-xs text-muted-foreground italic text-center py-6">
                        Nenhum registro clínico disponível no prontuário.
                      </p>
                    ) : (
                      <>
                        {/* Resumo Clínico de Metas e Medições */}
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
                              % Gordura
                            </div>
                            <div className="text-base font-black text-foreground mt-0.5">
                              {saudeData.latest_metrics?.body_fat_percentage
                                ? `${saudeData.latest_metrics.body_fat_percentage}%`
                                : '—'}
                            </div>
                          </div>
                          <div className="p-3 rounded-2xl border-2 bg-card">
                            <div className="text-[10px] font-bold text-muted-foreground">
                              Exames Anexados
                            </div>
                            <div className="text-base font-black text-foreground mt-0.5">
                              {saudeData.medical_exams?.length || 0}
                            </div>
                          </div>
                        </div>

                        {/* Exames Clínicos Anexados */}
                        {saudeData.medical_exams && saudeData.medical_exams.length > 0 && (
                          <div className="space-y-2">
                            <h4 className="text-xs font-black uppercase text-muted-foreground tracking-wider flex items-center gap-1.5">
                              <Paperclip className="w-4 h-4 text-[#1CB0F6]" />
                              Exames Médicos Anexados ({saudeData.medical_exams.length})
                            </h4>
                            <div className="space-y-1.5 max-h-[180px] overflow-y-auto pr-1">
                              {saudeData.medical_exams.map((ex: any) => (
                                <div
                                  key={ex.id}
                                  className="p-2.5 rounded-xl border bg-card flex items-center justify-between text-xs hover:border-[#1CB0F6]/40 transition-colors"
                                >
                                  <div className="min-w-0 flex-1">
                                    <div className="font-extrabold text-foreground truncate">
                                      {ex.title || 'Exame Clínico'}
                                    </div>
                                    <div className="text-[10px] text-muted-foreground">
                                      {safeFormatDate(ex.date || ex.created_at)}
                                    </div>
                                  </div>
                                  {ex.file_url && (
                                    <a
                                      href={ex.file_url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="px-2.5 py-1 rounded-lg bg-[#1CB0F6]/10 text-[#1CB0F6] font-bold text-[10px] hover:bg-[#1CB0F6]/20 transition-colors"
                                    >
                                      Visualizar
                                    </a>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Histórico Geral de Registros Clínicos */}
                        <div className="space-y-2">
                          <h4 className="text-xs font-black uppercase text-muted-foreground tracking-wider flex items-center gap-1.5">
                            <FileText className="w-4 h-4 text-emerald-500" />
                            Registros Clínicos Recentes ({saudeData.metrics_history?.length || 0})
                          </h4>
                          {!saudeData.metrics_history || saudeData.metrics_history.length === 0 ? (
                            <div className="p-6 rounded-2xl border-2 border-dashed bg-muted/20 text-center text-xs text-muted-foreground">
                              Nenhum registro clínico no prontuário ainda.
                            </div>
                          ) : (
                            <div className="space-y-2 max-h-[260px] overflow-y-auto pr-1">
                              {saudeData.metrics_history.map((m: any) => {
                                const isAuthor =
                                  currentUserId &&
                                  m.created_by === currentUserId &&
                                  !activeTabPermission.isReadOnly
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
                                        {m.created_by ? (
                                          <ProfessionalTag createdBy={m.created_by} />
                                        ) : (
                                          <span className="text-[10px] text-muted-foreground italic">
                                            registro do paciente
                                          </span>
                                        )}
                                      </div>
                                      <div className="text-[11px] text-muted-foreground flex flex-wrap gap-2 mt-0.5">
                                        {m.weight && <span>Peso: {m.weight} kg</span>}
                                        {m.body_fat_percentage && (
                                          <span>• Gordura: {m.body_fat_percentage}%</span>
                                        )}
                                        {m.lean_mass && (
                                          <span>• Massa Magra: {m.lean_mass} kg</span>
                                        )}
                                        {m.blood_pressure && (
                                          <span>• P.A.: {m.blood_pressure}</span>
                                        )}
                                      </div>
                                      {m.observations && (
                                        <p className="text-[10px] text-muted-foreground italic line-clamp-1 mt-1">
                                          &quot;{m.observations}&quot;
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
                                                title: 'Excluir registro do prontuário?',
                                                description: `Deseja remover o registro de ${safeFormatDate(m.date || m.created_at)}?`,
                                                onConfirm: async () => {
                                                  const ok = await deleteBodyMetricForPatient(m.id)
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
                      </>
                    )}
                  </div>
                )}

                {/* ABA 2: PERFORMANCE (Tarefas, Hábitos, Checklists) */}
                {activeTab === 'tarefas' && (
                  <div className="space-y-5 animate-fade-in">
                    {/* Botões 3D Azuis de Ação no Topo (desabilitados em modo leitura) */}
                    {!activeTabPermission.isReadOnly && (
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
                    )}

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
                              <span>Hábitos e Consistência ({tarefasData.habits.length})</span>
                            </h4>
                          </div>

                          {tarefasData.habits.length === 0 ? (
                            <p className="text-xs text-muted-foreground italic pl-2">
                              Nenhum hábito cadastrado para este paciente.
                            </p>
                          ) : (
                            <div className="space-y-2">
                              {tarefasData.habits_summary.map((hs) => {
                                const fullHabit = tarefasData.habits.find((h) => h.id === hs.id)
                                const isAuthor =
                                  currentUserId &&
                                  fullHabit?.created_by === currentUserId &&
                                  !activeTabPermission.isReadOnly
                                return (
                                  <div
                                    key={hs.id}
                                    className="p-3 rounded-2xl border bg-card flex items-center justify-between text-xs gap-3"
                                  >
                                    <div className="min-w-0 flex-1">
                                      <div className="flex items-center gap-2">
                                        <span className="font-extrabold text-foreground truncate">
                                          {hs.title}
                                        </span>
                                        {fullHabit?.created_by && (
                                          <ProfessionalTag createdBy={fullHabit.created_by} />
                                        )}
                                      </div>
                                      <div className="text-[10px] text-muted-foreground mt-0.5">
                                        Frequência: {hs.frequency} • Streak: {hs.streak} dias
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-2 shrink-0">
                                      <Badge
                                        variant="outline"
                                        className="font-bold text-[10px] border-[#58CC02]/40 text-[#58CC02]"
                                      >
                                        {hs.completion_rate_pct}% 7d
                                      </Badge>
                                      {isAuthor && (
                                        <Button
                                          type="button"
                                          size="icon"
                                          variant="ghost"
                                          onClick={() => {
                                            setEditingHabit(fullHabit)
                                            setHabitModalOpen(true)
                                          }}
                                          className="h-7 w-7 rounded-lg text-muted-foreground hover:text-[#1CB0F6]"
                                          title="Editar hábito"
                                        >
                                          <Pencil className="w-3.5 h-3.5" />
                                        </Button>
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
                            Tarefas (
                            {tarefasData.tasks?.length || tarefasData.recent_tasks?.length || 0})
                          </h4>
                          <div className="space-y-1.5 max-h-[220px] overflow-y-auto pr-1">
                            {(tarefasData.tasks || tarefasData.recent_tasks || []).map(
                              (task: any) => {
                                const isAuthor =
                                  currentUserId &&
                                  task.created_by === currentUserId &&
                                  !activeTabPermission.isReadOnly
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
                                        {task.created_by ? (
                                          <ProfessionalTag createdBy={task.created_by} />
                                        ) : (
                                          <span className="text-[10px] text-muted-foreground italic">
                                            criado pelo paciente
                                          </span>
                                        )}
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
                              },
                            )}
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                )}

                {/* ABA 3: MENTE (Humor, Ansiedade, Estresse, Linha do Tempo) */}
                {activeTab === 'mente' && (
                  <PatientMenteView data={menteData} loading={!!loadingMap['mente']} />
                )}

                {/* ABA 4: NUTRIÇÃO (Plano Alimentar, Receitas, Ato Energético) */}
                {activeTab === 'nutricao' && (
                  <div className="space-y-4 animate-fade-in">
                    {/* Sub-chips de Nutrição */}
                    <div className="overflow-x-auto pb-1 -mx-2 px-2 scrollbar-none">
                      <div className="inline-flex items-center gap-1.5 p-1 rounded-2xl bg-muted/40 border">
                        {[
                          { key: 'diet', label: 'Plano Alimentar', icon: Salad },
                          { key: 'recipes', label: 'Receitas Recomendadas', icon: ChefHat },
                          { key: 'metabolic', label: 'Ato Energético & Calorias', icon: Flame },
                        ].map((sub) => {
                          const IconComp = sub.icon
                          const isActive = nutricaoSubTab === sub.key
                          return (
                            <button
                              key={sub.key}
                              type="button"
                              onClick={() => setNutricaoSubTab(sub.key as any)}
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
                        Nenhum dado nutricional disponível.
                      </p>
                    ) : (
                      <>
                        {/* 1. PLANO ALIMENTAR */}
                        {nutricaoSubTab === 'diet' && (
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

                              {!activeTabPermission.isReadOnly && (
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
                              )}
                            </div>

                            {!saudeData.diet_plans || saudeData.diet_plans.length === 0 ? (
                              <div className="p-8 rounded-2xl border-2 border-dashed bg-muted/20 text-center space-y-2">
                                <Salad className="w-8 h-8 text-muted-foreground mx-auto" />
                                <p className="text-xs font-bold text-foreground">
                                  Nenhuma refeição no plano
                                </p>
                              </div>
                            ) : (
                              <div className="space-y-3">
                                {saudeData.diet_plans.map((plan: any) => {
                                  const isAuthor =
                                    currentUserId &&
                                    plan.created_by === currentUserId &&
                                    !activeTabPermission.isReadOnly
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
                                            {plan.created_by ? (
                                              <ProfessionalTag createdBy={plan.created_by} />
                                            ) : (
                                              <span className="text-[10px] text-muted-foreground italic">
                                                criado pelo paciente
                                              </span>
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

                                      {/* Itens do plano */}
                                      {items.length === 0 ? (
                                        <p className="text-[11px] text-muted-foreground italic pl-1">
                                          Nenhum alimento cadastrado nesta refeição.
                                        </p>
                                      ) : (
                                        <div className="space-y-1.5 pl-1">
                                          {items.map((it: any) => {
                                            const isItemAuthor =
                                              currentUserId &&
                                              it.created_by === currentUserId &&
                                              !activeTabPermission.isReadOnly
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

                        {/* 2. RECEITAS RECOMENDADAS */}
                        {nutricaoSubTab === 'recipes' && (
                          <div className="space-y-4 animate-fade-in">
                            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
                              <div>
                                <h4 className="text-xs font-black uppercase text-muted-foreground flex items-center gap-1.5 tracking-wider">
                                  <ChefHat className="w-4 h-4 text-amber-500" />
                                  Receitas Recomendadas ({saudeData.recipes?.length || 0})
                                </h4>
                                <p className="text-[11px] text-muted-foreground">
                                  Preparações culinárias orientadas para a dieta do paciente.
                                </p>
                              </div>

                              {!activeTabPermission.isReadOnly && (
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
                              )}
                            </div>

                            {!saudeData.recipes || saudeData.recipes.length === 0 ? (
                              <div className="p-8 rounded-2xl border-2 border-dashed bg-muted/20 text-center space-y-2">
                                <ChefHat className="w-8 h-8 text-muted-foreground mx-auto" />
                                <p className="text-xs font-bold text-foreground">
                                  Nenhuma receita prescrita
                                </p>
                              </div>
                            ) : (
                              <div className="space-y-2.5">
                                {saudeData.recipes.map((recipe: any) => {
                                  const isAuthor =
                                    currentUserId &&
                                    recipe.created_by === currentUserId &&
                                    !activeTabPermission.isReadOnly
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
                                            {recipe.created_by ? (
                                              <ProfessionalTag createdBy={recipe.created_by} />
                                            ) : (
                                              <span className="text-[10px] text-muted-foreground italic">
                                                criado pelo paciente
                                              </span>
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

                        {/* 3. ATO ENERGÉTICO & CALORIAS */}
                        {nutricaoSubTab === 'metabolic' && (
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

                              {!activeTabPermission.isReadOnly && (
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
                              )}
                            </div>

                            {!saudeData.metabolic_logs || saudeData.metabolic_logs.length === 0 ? (
                              <div className="p-8 rounded-2xl border-2 border-dashed bg-muted/20 text-center space-y-2">
                                <Flame className="w-8 h-8 text-amber-500 mx-auto" />
                                <p className="text-xs font-bold text-foreground">
                                  Nenhum cálculo energético registrado
                                </p>
                              </div>
                            ) : (
                              <div className="space-y-2.5">
                                {saudeData.metabolic_logs.map((log: any) => {
                                  const isAuthor =
                                    currentUserId &&
                                    log.created_by === currentUserId &&
                                    !activeTabPermission.isReadOnly
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
                                            {log.created_by ? (
                                              <ProfessionalTag createdBy={log.created_by} />
                                            ) : (
                                              <span className="text-[10px] text-muted-foreground italic">
                                                criado pelo paciente
                                              </span>
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
                                                    description: `Deseja remover o cálculo de ${safeFormatDate(log.date || log.created_at)}?`,
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
                      </>
                    )}
                  </div>
                )}

                {/* ABA 5: EXERCÍCIOS (Fichas de Treino, Séries, Exercícios) */}
                {activeTab === 'exercicios' && (
                  <div className="space-y-4 animate-fade-in">
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
                      <div>
                        <h4 className="text-xs font-black uppercase text-muted-foreground flex items-center gap-1.5 tracking-wider">
                          <Dumbbell className="w-4 h-4 text-blue-500" />
                          Fichas de Treino Prescritas ({saudeData?.workout_routines?.length || 0})
                        </h4>
                        <p className="text-[11px] text-muted-foreground">
                          Rotinas de treinamento e exercícios individualizados.
                        </p>
                      </div>

                      {!activeTabPermission.isReadOnly && (
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
                      )}
                    </div>

                    {loadingMap['saude'] ? (
                      <div className="space-y-3">
                        <Skeleton className="h-16 w-full rounded-2xl" />
                        <Skeleton className="h-32 w-full rounded-2xl" />
                      </div>
                    ) : !saudeData?.workout_routines || saudeData.workout_routines.length === 0 ? (
                      <div className="p-8 rounded-2xl border-2 border-dashed bg-muted/20 text-center space-y-2">
                        <Dumbbell className="w-8 h-8 text-muted-foreground mx-auto" />
                        <p className="text-xs font-bold text-foreground">
                          Nenhuma ficha de treino prescrita
                        </p>
                        <p className="text-[11px] text-muted-foreground max-w-xs mx-auto">
                          Prescreva séries, repetições e cargas para o paciente acompanhar em seus
                          treinos.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {saudeData.workout_routines.map((routine: any) => {
                          const isAuthor =
                            currentUserId &&
                            routine.created_by === currentUserId &&
                            !activeTabPermission.isReadOnly
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
                                    {routine.created_by ? (
                                      <ProfessionalTag createdBy={routine.created_by} />
                                    ) : (
                                      <span className="text-[10px] text-muted-foreground italic">
                                        criado pelo paciente
                                      </span>
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
                                              const ok = await deleteWorkoutRoutineForPatient(
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
                                    <Badge variant="secondary" className="text-[9px] font-semibold">
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

                {/* ABA 6: RAIO-X CORPORAL (Composição em 4 compartimentos, dobras, circunferências) */}
                {activeTab === 'raio_x' && (
                  <div className="space-y-4 animate-fade-in">
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
                      <div>
                        <h4 className="text-xs font-black uppercase text-muted-foreground flex items-center gap-1.5 tracking-wider">
                          <Scale className="w-4 h-4 text-cyan-500" />
                          Raio-X Corporal e Antropometria ({saudeData?.metrics_history?.length || 0}
                          )
                        </h4>
                        <p className="text-[11px] text-muted-foreground">
                          Avaliação física completa, dobras cutâneas, perímetros e composição
                          corporal.
                        </p>
                      </div>

                      {!activeTabPermission.isReadOnly && (
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
                      )}
                    </div>

                    {loadingMap['saude'] ? (
                      <div className="space-y-3">
                        <Skeleton className="h-16 w-full rounded-2xl" />
                        <Skeleton className="h-32 w-full rounded-2xl" />
                      </div>
                    ) : !saudeData ? (
                      <p className="text-xs text-muted-foreground italic text-center py-6">
                        Nenhum dado antropométrico disponível.
                      </p>
                    ) : (
                      <>
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
                        {!saudeData.metrics_history || saudeData.metrics_history.length === 0 ? (
                          <div className="p-8 rounded-2xl border-2 border-dashed bg-muted/20 text-center space-y-2">
                            <Scale className="w-8 h-8 text-muted-foreground mx-auto" />
                            <p className="text-xs font-bold text-foreground">
                              Nenhuma avaliação física registrada
                            </p>
                          </div>
                        ) : (
                          <div className="space-y-2 max-h-[280px] overflow-y-auto pr-1">
                            {saudeData.metrics_history.map((m: any) => {
                              const isAuthor =
                                currentUserId &&
                                m.created_by === currentUserId &&
                                !activeTabPermission.isReadOnly
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
                                      {m.created_by ? (
                                        <ProfessionalTag createdBy={m.created_by} />
                                      ) : (
                                        <span className="text-[10px] text-muted-foreground italic">
                                          criado pelo paciente
                                        </span>
                                      )}
                                    </div>
                                    <div className="text-[11px] text-muted-foreground flex flex-wrap gap-2 mt-0.5">
                                      {m.weight && <span>Peso: {m.weight} kg</span>}
                                      {m.body_fat_percentage && (
                                        <span>• Gordura: {m.body_fat_percentage}%</span>
                                      )}
                                      {m.lean_mass && <span>• Massa Magra: {m.lean_mass} kg</span>}
                                      {m.muscle_mass && (
                                        <span>• Massa Muscular: {m.muscle_mass} kg</span>
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
                                                const ok = await deleteBodyMetricForPatient(m.id)
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
                      </>
                    )}
                  </div>
                )}

                {/* ABA 7: FINANÇAS */}
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

                {/* ABA 8: ESTUDOS */}
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

                {/* ABA 9: HISTÓRICO SOCIAL (Exclusivo Pro, grupos criados pelo profissional logado) */}
                {activeTab === 'historico_social' && (
                  <PatientSocialHistoryTab
                    data={socialHistoryData}
                    loading={Boolean(loadingMap['historico_social'])}
                  />
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

      {/* Confirmação de conversão de paciente offline */}
      <AlertDialog open={confirmConvertOpen} onOpenChange={setConfirmConvertOpen}>
        <AlertDialogContent className="max-w-md rounded-3xl border-2 p-6 shadow-2xl">
          <AlertDialogHeader>
            <div className="w-12 h-12 rounded-2xl bg-[#58CC02]/15 text-[#58CC02] flex items-center justify-center mb-1">
              <Globe className="w-6 h-6" />
            </div>
            <AlertDialogTitle className="text-lg font-black text-foreground">
              Convidar paciente para o sistema?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-muted-foreground leading-relaxed">
              Um convite de acesso será registrado para{' '}
              <strong>{patient.patient_name || patient.patient_email}</strong> (
              {patient.patient_email}). O paciente receberá um e-mail com link para definir sua
              senha e acessar consultas, dietas, treinos e evoluções clínicas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 pt-2">
            <AlertDialogCancel disabled={converting} className="rounded-2xl font-bold">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault()
                handleConvertPatient()
              }}
              disabled={converting}
              className="rounded-2xl font-black bg-[#58CC02] hover:bg-[#46a302] text-white border-b-4 border-[#3c8c02] active:border-b-0 active:translate-y-1 transition-all"
            >
              {converting ? 'Enviando...' : 'Sim, convidar paciente'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Modal estruturado de resultado da conversão (com link copiável e/ou aviso de 1º profissional) */}
      <Dialog
        open={conversionResult.open}
        onOpenChange={(o) => setConversionResult((prev) => ({ ...prev, open: o }))}
      >
        <DialogContent className="max-w-md rounded-3xl border-2 p-6 shadow-2xl">
          <DialogHeader>
            <div
              className={cn(
                'w-12 h-12 rounded-2xl flex items-center justify-center mb-1',
                conversionResult.warning
                  ? 'bg-amber-500/15 text-amber-600'
                  : 'bg-emerald-500/15 text-emerald-600',
              )}
            >
              <Send className="w-6 h-6" />
            </div>
            <DialogTitle className="text-lg font-black text-foreground">
              {conversionResult.warning ? 'Atenção na Conversão' : 'Convite Gerado com Sucesso!'}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground leading-relaxed">
              {conversionResult.message ||
                'A solicitação de conversão do paciente offline foi processada.'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2 text-xs">
            {/* Aviso estruturado se outro profissional já solicitou primeiro */}
            {conversionResult.warning && (
              <div className="p-3.5 rounded-2xl bg-amber-500/10 border-2 border-amber-500/40 text-amber-900 dark:text-amber-200 space-y-1">
                <p className="font-black text-[11px] uppercase tracking-wide">
                  Prioridade de Importação
                </p>
                <p className="text-[11px] leading-relaxed">{conversionResult.warning}</p>
              </div>
            )}

            {/* Link de ativação caso o Resend não esteja configurado */}
            {conversionResult.actionLink && (
              <div className="space-y-2 p-3.5 rounded-2xl bg-[#1CB0F6]/10 border-2 border-[#1CB0F6]/30">
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-[11px] text-foreground">
                    Link de Ativação Manual
                  </span>
                  <span className="text-[10px] text-muted-foreground font-semibold">
                    Envie para o paciente
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={conversionResult.actionLink}
                    className="w-full h-9 px-2.5 rounded-xl border bg-background text-[11px] font-mono text-muted-foreground truncate select-all"
                  />
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleCopyActionLink}
                    className="h-9 px-3 rounded-xl font-black bg-[#1CB0F6] hover:bg-[#1899d6] text-white shrink-0 border-b-2 border-[#147eb0]"
                  >
                    {copiedLink ? (
                      <>
                        <Check className="w-3.5 h-3.5 mr-1 text-white" />
                        Copiado!
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 mr-1" />
                        Copiar
                      </>
                    )}
                  </Button>
                </div>
                <p className="text-[10px] text-muted-foreground leading-relaxed">
                  Como o envio de e-mails em lote não possui chave de API Resend ativa, você pode
                  copiar este link diretamente e enviá-lo por WhatsApp ou mensagem ao paciente.
                </p>
              </div>
            )}
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              onClick={() => setConversionResult({ open: false })}
              className="w-full rounded-2xl h-11 font-black bg-[#1CB0F6] hover:bg-[#1899d6] text-white border-b-4 border-[#147eb0]"
            >
              Concluir
            </Button>
          </DialogFooter>
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
