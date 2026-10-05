import { useEffect, useState, useMemo } from 'react'
import { useProfessionalStore, PatientLink } from '@/stores/useProfessionalStore'
import { StethoscopeIcon } from '@/components/professional/StethoscopeIcon'
import { ClinicConfigModal } from '@/components/professional/ClinicConfigModal'
import { DeletePatientModal } from '@/components/professional/DeletePatientModal'
import {
  useSiteSettingsStore,
  useBrandName,
  DEFAULT_PRO_NAV_ITEMS,
  mergeNavCustomization,
} from '@/stores/useSiteSettingsStore'
import { PatientDetailsDrawer } from '@/components/professional/PatientDetailsDrawer'
import { AppointmentModal } from '@/components/professional/AppointmentModal'
import { InvitePatientModal } from '@/components/professional/InvitePatientModal'
import { CreateOfflinePatientModal } from '@/components/professional/CreateOfflinePatientModal'
import { ProfessionalGroupsTab } from '@/components/professional/ProfessionalGroupsTab'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
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
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Checkbox } from '@/components/ui/checkbox'
import { safeFormatDate } from '@/lib/date-utils'
import {
  Users,
  Calendar,
  FileText,
  LayoutDashboard,
  Search,
  Plus,
  Settings,
  Clock,
  CheckCircle2,
  Trash2,
  MessageCircle,
  CheckSquare,
  Share2,
  HeartPulse,
  Wallet,
  GraduationCap,
  BarChart2,
  Sparkles,
  Flame,
  Zap,
  MapPin,
  RotateCcw,
  Check,
} from 'lucide-react'

const ICON_MAP: Record<string, any> = {
  LayoutDashboard,
  Users,
  Calendar,
  FileText,
  MessageCircle,
  StethoscopeIcon,
  CheckSquare,
  Share2,
  HeartPulse,
  Wallet,
  GraduationCap,
  BarChart2,
  Sparkles,
  Flame,
  Zap,
}

export default function ProfessionalPage() {
  const {
    profile,
    patients,
    appointments,
    notes,
    loading,
    loadProfessionalData,
    updateAppointmentStatus,
    deleteAppointment,
    deleteClinicalNote,
  } = useProfessionalStore()

  const { proBrandName } = useBrandName()
  const settings = useSiteSettingsStore((s) => s.settings)

  // Mescla personalização do menu Pro
  const proNavItems = useMemo(() => {
    return mergeNavCustomization(DEFAULT_PRO_NAV_ITEMS, settings.pro_nav_customization)
  }, [settings.pro_nav_customization])

  const visibleProNavItems = useMemo(() => {
    const list = proNavItems.filter((i) => i.visible)
    return list.length > 0 ? list : DEFAULT_PRO_NAV_ITEMS
  }, [proNavItems])

  const [activeTab, setActiveTab] = useState<
    'overview' | 'patients' | 'appointments' | 'groups_pro'
  >('overview')

  // Se a aba ativa atual não estiver na lista de visíveis, chavear para a primeira visível
  useEffect(() => {
    const isCurrentVisible = visibleProNavItems.some((i) => i.key === activeTab)
    if (!isCurrentVisible && visibleProNavItems.length > 0) {
      setActiveTab(visibleProNavItems[0].key as any)
    }
  }, [visibleProNavItems, activeTab])
  const [clinicModalOpen, setClinicModalOpen] = useState(false)
  const [inviteModalOpen, setInviteModalOpen] = useState(false)
  const [offlinePatientModalOpen, setOfflinePatientModalOpen] = useState(false)
  const [appointmentModalOpen, setAppointmentModalOpen] = useState(false)
  const [selectedPatientForDrawer, setSelectedPatientForDrawer] = useState<PatientLink | null>(null)

  const {
    professionalLocations,
    deletePatientFromPro,
    restorePatientLink,
    updatePatientCareLocations,
  } = useProfessionalStore()

  // Search & filters de pacientes
  const [patientSearch, setPatientSearch] = useState('')
  const [patientStatusFilter, setPatientStatusFilter] = useState<
    'all' | 'active' | 'pending' | 'ended'
  >('all')
  const [patientLocationFilter, setPatientLocationFilter] = useState<string>('all')

  // Filtros combináveis da aba Consultas (dia + atalhos + local)
  const [appointmentDateFilter, setAppointmentDateFilter] = useState<string>('')
  const [appointmentDatePreset, setAppointmentDatePreset] = useState<
    'all' | 'today' | 'this_week' | 'custom'
  >('all')
  const [appointmentLocationFilter, setAppointmentLocationFilter] = useState<string>('all')

  // Modal de confirmação Duolingo para Restaurar vínculo
  const [patientToRestore, setPatientToRestore] = useState<PatientLink | null>(null)
  const [restoring, setRestoring] = useState(false)

  // Patient to delete via confirmation modal
  const [patientToDelete, setPatientToDelete] = useState<PatientLink | null>(null)

  useEffect(() => {
    loadProfessionalData()
  }, [loadProfessionalData])

  const activePatients = useMemo(() => {
    return patients.filter((p) => p.status === 'active')
  }, [patients])

  const pendingPatients = useMemo(() => {
    return patients.filter((p) => p.status === 'pending')
  }, [patients])

  const filteredPatients = useMemo(() => {
    return patients.filter((p) => {
      const matchSearch =
        (p.patient_name && p.patient_name.toLowerCase().includes(patientSearch.toLowerCase())) ||
        (p.patient_email && p.patient_email.toLowerCase().includes(patientSearch.toLowerCase()))
      const matchStatus = patientStatusFilter === 'all' || p.status === patientStatusFilter

      // Care locations filter
      const patientLocs: string[] = Array.isArray(p.offline_details?.care_locations)
        ? p.offline_details!.care_locations!
        : []

      let matchLocation = true
      if (patientLocationFilter === 'none') {
        matchLocation = patientLocs.length === 0
      } else if (patientLocationFilter !== 'all') {
        matchLocation = patientLocs.includes(patientLocationFilter)
      }

      return matchSearch && matchStatus && matchLocation
    })
  }, [patients, patientSearch, patientStatusFilter, patientLocationFilter])

  // Appointments today / upcoming
  const now = new Date()
  const todayStr = now.toISOString().slice(0, 10)

  const appointmentsToday = useMemo(() => {
    return appointments.filter((a) => a.scheduled_at.startsWith(todayStr))
  }, [appointments, todayStr])

  const appointmentsDoneThisMonth = useMemo(() => {
    const curMonth = todayStr.slice(0, 7)
    return appointments.filter((a) => a.scheduled_at.startsWith(curMonth) && a.status === 'done')
  }, [appointments, todayStr])

  const upcomingAppointments = useMemo(() => {
    return appointments
      .filter((a) => new Date(a.scheduled_at) >= now && a.status === 'scheduled')
      .slice(0, 6)
  }, [appointments, now])

  // Filtros da aba Consultas
  const filteredAppointments = useMemo(() => {
    const today = new Date()
    const todayMidnight = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime()
    const todayEnd = todayMidnight + 24 * 60 * 60 * 1000 - 1

    // Semana atual (segunda a domingo)
    const currentDayOfWeek = today.getDay()
    const diffToMonday = (currentDayOfWeek + 6) % 7
    const weekStart = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate() - diffToMonday,
    ).getTime()
    const weekEnd = weekStart + 7 * 24 * 60 * 60 * 1000 - 1

    return appointments.filter((appt) => {
      // Filtro de local
      if (appointmentLocationFilter !== 'all') {
        if (appointmentLocationFilter === 'none') {
          if (appt.location_name) return false
        } else if (appt.location_name !== appointmentLocationFilter) {
          return false
        }
      }

      // Filtro de data / atalhos
      const apptTime = new Date(appt.scheduled_at).getTime()
      if (appointmentDatePreset === 'today') {
        if (apptTime < todayMidnight || apptTime > todayEnd) return false
      } else if (appointmentDatePreset === 'this_week') {
        if (apptTime < weekStart || apptTime > weekEnd) return false
      } else if (appointmentDatePreset === 'custom' && appointmentDateFilter) {
        if (!appt.scheduled_at.startsWith(appointmentDateFilter)) return false
      }

      return true
    })
  }, [appointments, appointmentLocationFilter, appointmentDatePreset, appointmentDateFilter])

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-16 animate-fade-in px-2 sm:px-4">
      {/* Header com identidade azul #1CB0F6 */}
      <div className="bg-gradient-to-r from-[#1CB0F6] to-[#0284c7] rounded-3xl p-6 text-white shadow-md relative overflow-hidden">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative z-10">
          <div className="flex items-center gap-3.5">
            <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm border-2 border-white/30 flex items-center justify-center shrink-0">
              <StethoscopeIcon size={32} className="text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-black tracking-tight">{proBrandName}</h1>
                <Badge className="bg-white text-[#1CB0F6] hover:bg-white text-[10px] font-black uppercase px-2 py-0.5 rounded-full">
                  Consultório Pro
                </Badge>
              </div>
              <p className="text-xs text-white/90 font-semibold mt-0.5">
                {profile?.profession || 'Profissional de Saúde'}
                {profile?.register_code ? ` • ${profile.register_code}` : ''}
                {profile?.clinic_name ? ` • ${profile.clinic_name}` : ''}
              </p>
            </div>
          </div>

          <Button
            type="button"
            onClick={() => setClinicModalOpen(true)}
            className="rounded-2xl h-10 px-4 font-black bg-white text-[#1CB0F6] hover:bg-white/90 border-b-4 border-slate-300 active:border-b-0 active:translate-y-1 transition-all text-xs flex items-center gap-2 shadow-sm"
          >
            <Settings className="w-4 h-4" />
            <span>Configurar Consultório</span>
          </Button>
        </div>
      </div>

      {/* Mobile-first chips roláveis para abas customizadas */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide border-b">
        {visibleProNavItems.map((item) => {
          const IconComp = ICON_MAP[item.icon] || LayoutDashboard
          const isSelected = activeTab === item.key
          const isGroupsPro = item.key === 'groups_pro'

          return (
            <button
              key={item.key}
              type="button"
              onClick={() => setActiveTab(item.key as any)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-black transition-all shrink-0 border-2 ${
                isSelected
                  ? isGroupsPro
                    ? 'bg-[#58CC02] text-white border-[#58CC02] border-b-4 shadow-sm'
                    : 'bg-[#1CB0F6] text-white border-[#1CB0F6] border-b-4'
                  : 'bg-card text-muted-foreground border-transparent hover:bg-muted'
              }`}
            >
              <IconComp className="w-4 h-4" />
              <span>{item.label}</span>
              {item.key === 'patients' && pendingPatients.length > 0 && (
                <span className="w-5 h-5 rounded-full bg-amber-400 text-amber-900 text-[10px] font-black flex items-center justify-center ml-0.5">
                  {pendingPatients.length}
                </span>
              )}
              {item.key === 'appointments' && appointmentsToday.length > 0 && (
                <span className="w-5 h-5 rounded-full bg-emerald-500 text-white text-[10px] font-black flex items-center justify-center ml-0.5">
                  {appointmentsToday.length}
                </span>
              )}
              {isGroupsPro && (
                <Badge className="bg-[#CE82FF] text-white text-[9px] font-black uppercase px-1.5 py-0.2 rounded-md ml-0.5">
                  Pro
                </Badge>
              )}
            </button>
          )
        })}
      </div>

      {/* ABA 1: VISÃO GERAL */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Métricas do consultório */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="p-4 rounded-3xl border-2 bg-card shadow-sm space-y-1">
              <div className="flex items-center justify-between text-muted-foreground">
                <span className="text-[11px] font-bold uppercase tracking-wider">
                  Pacientes Ativos
                </span>
                <Users className="w-4 h-4 text-[#1CB0F6]" />
              </div>
              <div className="text-2xl font-black text-foreground">{activePatients.length}</div>
              <div className="text-[10px] text-muted-foreground font-semibold">
                {pendingPatients.length} convite(s) pendente(s)
              </div>
            </div>

            <div className="p-4 rounded-3xl border-2 bg-card shadow-sm space-y-1">
              <div className="flex items-center justify-between text-muted-foreground">
                <span className="text-[11px] font-bold uppercase tracking-wider">
                  Consultas Hoje
                </span>
                <Calendar className="w-4 h-4 text-[#58CC02]" />
              </div>
              <div className="text-2xl font-black text-foreground">{appointmentsToday.length}</div>
              <div className="text-[10px] text-muted-foreground font-semibold">
                Agendadas para hoje
              </div>
            </div>

            <div className="p-4 rounded-3xl border-2 bg-card shadow-sm space-y-1">
              <div className="flex items-center justify-between text-muted-foreground">
                <span className="text-[11px] font-bold uppercase tracking-wider">
                  Atendimentos no Mês
                </span>
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              </div>
              <div className="text-2xl font-black text-foreground">
                {appointmentsDoneThisMonth.length}
              </div>
              <div className="text-[10px] text-muted-foreground font-semibold">
                Consultas realizadas
              </div>
            </div>

            <div
              onClick={() => setActiveTab('patients')}
              className="p-4 rounded-3xl border-2 bg-card shadow-sm space-y-1 cursor-pointer hover:border-[#1CB0F6]/50 transition-all"
              title="Ir para a lista de pacientes"
            >
              <div className="flex items-center justify-between text-muted-foreground">
                <span className="text-[11px] font-bold uppercase tracking-wider">
                  Anotações Clínicas
                </span>
                <FileText className="w-4 h-4 text-[#FFC800]" />
              </div>
              <div className="text-2xl font-black text-foreground">{notes.length}</div>
              <div className="text-[10px] text-muted-foreground font-semibold flex items-center justify-between">
                <span>Evoluções salvas</span>
                <span className="text-[9px] text-[#1CB0F6] font-bold">Ver pacientes →</span>
              </div>
            </div>
          </div>

          {/* Seção Próximas Consultas */}
          <div className="p-5 rounded-3xl border-2 bg-card shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-black text-base text-foreground flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-[#1CB0F6]" />
                  Próximas Consultas
                </h3>
                <p className="text-xs text-muted-foreground">
                  Atendimentos agendados na sua agenda
                </p>
              </div>

              <Button
                onClick={() => setAppointmentModalOpen(true)}
                className="rounded-2xl h-9 px-3.5 font-black bg-[#1CB0F6] hover:bg-[#1899d6] text-white border-b-4 border-[#1899d6] active:border-b-0 active:translate-y-1 transition-all text-xs flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Nova Consulta</span>
              </Button>
            </div>

            {upcomingAppointments.length === 0 ? (
              <div className="py-10 text-center space-y-2">
                <Clock className="w-8 h-8 text-muted-foreground mx-auto opacity-40" />
                <p className="text-sm font-bold text-foreground">Nenhuma consulta agendada</p>
                <p className="text-xs text-muted-foreground">
                  Clique em &quot;Nova Consulta&quot; para marcar horário com um de seus pacientes
                  ativos.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {upcomingAppointments.map((appt) => (
                  <div
                    key={appt.id}
                    className="p-4 rounded-2xl border-2 bg-muted/20 flex items-start justify-between gap-3"
                  >
                    <div className="space-y-1 min-w-0">
                      <div className="font-black text-sm text-foreground truncate">
                        {appt.patient_name}
                      </div>
                      <div className="text-xs text-muted-foreground font-semibold">
                        {appt.title || 'Consulta'}
                      </div>
                      <div className="text-[11px] font-bold text-[#1CB0F6] flex items-center gap-1 flex-wrap">
                        <Clock className="w-3.5 h-3.5" />
                        <span>
                          {new Date(appt.scheduled_at).toLocaleString('pt-BR', {
                            dateStyle: 'short',
                            timeStyle: 'short',
                          })}{' '}
                          ({appt.duration_minutes} min)
                        </span>
                        {appt.location_name && (
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-bold border flex items-center gap-1 bg-muted/60 text-foreground ml-1">
                            <MapPin className="w-2.5 h-2.5 text-[#1CB0F6]" />
                            <span className="truncate max-w-[110px]">{appt.location_name}</span>
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => updateAppointmentStatus(appt.id, 'done')}
                        className="px-2.5 py-1 rounded-xl bg-emerald-500/15 text-emerald-600 hover:bg-emerald-500/25 text-[10px] font-black transition-colors"
                      >
                        Realizada
                      </button>
                      <button
                        type="button"
                        onClick={() => updateAppointmentStatus(appt.id, 'canceled')}
                        className="px-2.5 py-1 rounded-xl bg-rose-500/15 text-rose-600 hover:bg-rose-500/25 text-[10px] font-black transition-colors"
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ABA 2: PACIENTES */}
      {activeTab === 'patients' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
            <div className="flex-1 flex flex-wrap gap-2 items-center">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                <Input
                  value={patientSearch}
                  onChange={(e) => setPatientSearch(e.target.value)}
                  placeholder="Buscar paciente por nome ou e-mail..."
                  className="pl-9 rounded-2xl border-2 h-11 text-xs"
                />
              </div>

              <select
                value={patientStatusFilter}
                onChange={(e) => setPatientStatusFilter(e.target.value as any)}
                className="h-11 px-3 rounded-2xl border-2 bg-card text-xs font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-[#1CB0F6]"
              >
                <option value="all">Todos os Status</option>
                <option value="active">🟢 Ativos</option>
                <option value="pending">🟡 Pendentes</option>
                <option value="ended">⚪ Encerrados</option>
              </select>

              <select
                value={patientLocationFilter}
                onChange={(e) => setPatientLocationFilter(e.target.value)}
                className="h-11 px-3 rounded-2xl border-2 bg-card text-xs font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-[#1CB0F6]"
              >
                <option value="all">Todos os locais</option>
                <option value="none">Sem local</option>
                {professionalLocations.map((loc) => (
                  <option key={loc.id} value={loc.name}>
                    📍 {loc.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <Button
                onClick={() => setOfflinePatientModalOpen(true)}
                variant="outline"
                className="rounded-2xl h-11 px-4 font-extrabold border-2 border-border text-xs flex items-center gap-1.5 hover:bg-muted"
              >
                <Plus className="w-4 h-4" />
                <span>+ Paciente offline</span>
              </Button>
              <Button
                onClick={() => setInviteModalOpen(true)}
                variant="outline"
                className="rounded-2xl h-11 px-4 font-extrabold border-2 border-border text-xs flex items-center gap-1.5 hover:bg-muted"
              >
                <Plus className="w-4 h-4" />
                <span>Convidar paciente</span>
              </Button>
            </div>
          </div>

          <div className="bg-card border-2 rounded-3xl overflow-hidden shadow-sm">
            {filteredPatients.length === 0 ? (
              <div className="py-14 text-center space-y-2">
                <Users className="w-10 h-10 text-muted-foreground mx-auto opacity-40" />
                <p className="font-extrabold text-foreground">Nenhum paciente encontrado</p>
                <p className="text-xs text-muted-foreground">
                  Convide seus pacientes por e-mail para acompanhar a evolução clínica.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {filteredPatients.map((p) => (
                  <div
                    key={p.id}
                    onClick={() => {
                      if (p.status === 'active') {
                        setSelectedPatientForDrawer(p)
                      }
                    }}
                    className={`p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 transition-colors ${
                      p.status === 'active' ? 'hover:bg-muted/40 cursor-pointer' : ''
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-2xl bg-[#1CB0F6]/15 text-[#1CB0F6] flex items-center justify-center font-black text-sm shrink-0">
                        {(p.patient_name || p.patient_email || 'P')[0].toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <div className="font-bold text-sm text-foreground flex items-center gap-1.5 flex-wrap">
                          <span>{p.patient_name}</span>
                          {/* Badge Offline / Online discreto */}
                          {p.is_offline ? (
                            <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-amber-500/15 text-amber-800 dark:text-amber-300 border border-amber-500/30 shrink-0">
                              Offline
                            </span>
                          ) : p.status === 'active' ? (
                            <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-[#58CC02]/15 text-[#58CC02] border border-[#58CC02]/30 shrink-0">
                              Online
                            </span>
                          ) : null}

                          {p.status === 'active' && (
                            <Badge className="bg-emerald-500 text-white text-[9px] font-black uppercase px-2 py-0.2">
                              Ativo
                            </Badge>
                          )}
                          {p.status === 'pending' && (
                            <Badge className="bg-amber-400 text-amber-950 text-[9px] font-black uppercase px-2 py-0.2">
                              Aguardando Aceite
                            </Badge>
                          )}
                          {p.status === 'ended' && (
                            <Badge
                              variant="outline"
                              className="text-[9px] font-black uppercase px-2 py-0.2"
                            >
                              Encerrado
                            </Badge>
                          )}

                          {/* Mini-chips de locais de atendimento (até 2, +N se houver mais) */}
                          {Array.isArray(p.offline_details?.care_locations) &&
                            p.offline_details!.care_locations!.length > 0 && (
                              <div className="flex items-center gap-1 shrink-0">
                                {p.offline_details!.care_locations!.slice(0, 2).map((locName) => {
                                  const matched = professionalLocations.find(
                                    (l) => l.name.toLowerCase() === locName.toLowerCase(),
                                  )
                                  return (
                                    <span
                                      key={locName}
                                      className="px-2 py-0.5 rounded-full text-[9px] font-bold border flex items-center gap-1 bg-muted/60 text-foreground"
                                    >
                                      <span
                                        className="w-1.5 h-1.5 rounded-full shrink-0"
                                        style={{ backgroundColor: matched?.color || '#1CB0F6' }}
                                      />
                                      <span className="truncate max-w-[90px]">{locName}</span>
                                    </span>
                                  )
                                })}
                                {p.offline_details!.care_locations!.length > 2 && (
                                  <span className="px-1.5 py-0.5 rounded-full text-[9px] font-extrabold bg-muted text-muted-foreground border">
                                    +{p.offline_details!.care_locations!.length - 2}
                                  </span>
                                )}
                              </div>
                            )}

                          {/* Seletor rápido de locais de atendimento por linha (offline ou online) */}
                          {professionalLocations.length > 0 && (
                            <div onClick={(e) => e.stopPropagation()} className="shrink-0">
                              <Popover>
                                <PopoverTrigger asChild>
                                  <button
                                    type="button"
                                    className="p-1 rounded-lg border hover:bg-muted text-muted-foreground hover:text-[#1CB0F6] transition-colors"
                                    title="Editar locais de atendimento"
                                  >
                                    <MapPin className="w-3 h-3" />
                                  </button>
                                </PopoverTrigger>
                                <PopoverContent
                                  className="w-64 p-3 rounded-2xl border-2 shadow-xl"
                                  align="start"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <div className="space-y-2">
                                    <div className="flex items-center justify-between pb-1 border-b">
                                      <span className="text-[11px] font-black text-foreground flex items-center gap-1">
                                        <MapPin className="w-3.5 h-3.5 text-[#1CB0F6]" />
                                        Locais de Atendimento
                                      </span>
                                      <span className="text-[9px] text-muted-foreground font-semibold">
                                        {p.patient_name?.split(' ')[0]}
                                      </span>
                                    </div>
                                    <div className="space-y-1.5 max-h-48 overflow-y-auto">
                                      {professionalLocations.map((loc) => {
                                        const currentLocs: string[] = Array.isArray(
                                          p.offline_details?.care_locations,
                                        )
                                          ? p.offline_details!.care_locations!
                                          : []
                                        const isChecked = currentLocs.some(
                                          (l) => l.toLowerCase() === loc.name.toLowerCase(),
                                        )

                                        return (
                                          <label
                                            key={loc.id}
                                            className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-muted/60 cursor-pointer text-xs transition-colors"
                                          >
                                            <Checkbox
                                              checked={isChecked}
                                              onCheckedChange={async (chk) => {
                                                const nextLocs = chk
                                                  ? [...currentLocs, loc.name]
                                                  : currentLocs.filter(
                                                      (l) =>
                                                        l.toLowerCase() !== loc.name.toLowerCase(),
                                                    )
                                                await updatePatientCareLocations(p.id, nextLocs)
                                              }}
                                            />
                                            <span
                                              className="w-2 h-2 rounded-full shrink-0"
                                              style={{ backgroundColor: loc.color || '#1CB0F6' }}
                                            />
                                            <span className="truncate font-bold text-foreground">
                                              {loc.name}
                                            </span>
                                          </label>
                                        )
                                      })}
                                    </div>
                                  </div>
                                </PopoverContent>
                              </Popover>
                            </div>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground truncate">
                          {p.patient_email && !p.patient_email.endsWith('@pacientes.offline')
                            ? p.patient_email
                            : p.offline_details?.phone || 'E-mail pendente'}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center">
                      <span className="text-[11px] text-muted-foreground">
                        {safeFormatDate(p.created_at)}
                      </span>
                      {p.status === 'active' && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="rounded-xl h-8 text-xs font-bold border-2"
                        >
                          Ver Prontuário
                        </Button>
                      )}
                      {p.status === 'pending' && (
                        <span className="text-xs text-muted-foreground italic">Pendente</span>
                      )}
                      {p.status === 'ended' && (
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs text-muted-foreground italic">Encerrado</span>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation()
                              setPatientToRestore(p)
                            }}
                            title="Restaurar vínculo"
                            className="h-8 px-2.5 rounded-xl border-2 border-[#58CC02]/40 text-[#58CC02] hover:bg-[#58CC02]/10 hover:border-[#58CC02] font-black text-xs flex items-center gap-1 transition-all"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                            <span>Restaurar</span>
                          </Button>
                          <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            onClick={(e) => {
                              e.stopPropagation()
                              setPatientToDelete(p)
                            }}
                            title="Apagar paciente da base"
                            className="h-8 w-8 rounded-xl text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ABA 3: CONSULTAS */}
      {activeTab === 'appointments' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
            <div>
              <h3 className="font-black text-base text-foreground">Agenda de Consultas</h3>
              <p className="text-xs text-muted-foreground">
                Gerencie agendamentos, presenças e status das sessões
              </p>
            </div>
            <Button
              onClick={() => setAppointmentModalOpen(true)}
              className="rounded-2xl h-11 px-5 font-black bg-[#1CB0F6] hover:bg-[#1899d6] text-white border-b-4 border-[#1899d6] active:border-b-0 active:translate-y-1 transition-all text-xs flex items-center gap-2 shadow-sm shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Agendar Consulta</span>
            </Button>
          </div>

          {/* Barra de Filtros Combináveis: Atalhos de dia, input de data e seletor de local */}
          <div className="p-3 rounded-3xl border-2 bg-card flex flex-wrap items-center justify-between gap-2.5">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[11px] font-black text-foreground mr-1 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-[#1CB0F6]" />
                Período:
              </span>
              <button
                type="button"
                onClick={() => {
                  setAppointmentDatePreset('all')
                  setAppointmentDateFilter('')
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all border-2 ${
                  appointmentDatePreset === 'all'
                    ? 'bg-[#1CB0F6] text-white border-[#1CB0F6] border-b-3'
                    : 'bg-muted/40 border-transparent text-muted-foreground hover:bg-muted'
                }`}
              >
                Todas
              </button>
              <button
                type="button"
                onClick={() => {
                  setAppointmentDatePreset('today')
                  setAppointmentDateFilter('')
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all border-2 ${
                  appointmentDatePreset === 'today'
                    ? 'bg-[#1CB0F6] text-white border-[#1CB0F6] border-b-3'
                    : 'bg-muted/40 border-transparent text-muted-foreground hover:bg-muted'
                }`}
              >
                Hoje
              </button>
              <button
                type="button"
                onClick={() => {
                  setAppointmentDatePreset('this_week')
                  setAppointmentDateFilter('')
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all border-2 ${
                  appointmentDatePreset === 'this_week'
                    ? 'bg-[#1CB0F6] text-white border-[#1CB0F6] border-b-3'
                    : 'bg-muted/40 border-transparent text-muted-foreground hover:bg-muted'
                }`}
              >
                Esta semana
              </button>

              <div className="relative">
                <Input
                  type="date"
                  value={appointmentDateFilter}
                  onChange={(e) => {
                    setAppointmentDateFilter(e.target.value)
                    setAppointmentDatePreset(e.target.value ? 'custom' : 'all')
                  }}
                  className="h-8 rounded-xl border-2 text-xs font-bold w-36"
                  title="Filtrar por data específica"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[11px] font-black text-foreground flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-[#1CB0F6]" />
                Local:
              </span>
              <select
                value={appointmentLocationFilter}
                onChange={(e) => setAppointmentLocationFilter(e.target.value)}
                className="h-8 px-2.5 rounded-xl border-2 bg-card text-xs font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-[#1CB0F6]"
              >
                <option value="all">Todos os locais</option>
                <option value="none">Sem local</option>
                {professionalLocations.map((loc) => (
                  <option key={loc.id} value={loc.name}>
                    📍 {loc.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="bg-card border-2 rounded-3xl overflow-hidden shadow-sm">
            {filteredAppointments.length === 0 ? (
              <div className="py-14 text-center space-y-2">
                <Calendar className="w-10 h-10 text-muted-foreground mx-auto opacity-40" />
                <p className="font-extrabold text-foreground">Nenhuma consulta encontrada</p>
                <p className="text-xs text-muted-foreground">
                  {appointments.length === 0
                    ? 'Marque sessões e acompanhe o histórico de atendimentos clínicos.'
                    : 'Nenhuma consulta corresponde aos filtros de data ou local selecionados.'}
                </p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {filteredAppointments.map((appt) => (
                  <div
                    key={appt.id}
                    className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
                  >
                    <div className="space-y-1 min-w-0">
                      <div className="font-black text-sm text-foreground flex items-center gap-2 flex-wrap">
                        <span>{appt.patient_name}</span>
                        {appt.status === 'scheduled' && (
                          <Badge className="bg-[#1CB0F6] text-white text-[9px] font-black uppercase">
                            Agendada
                          </Badge>
                        )}
                        {appt.status === 'done' && (
                          <Badge className="bg-emerald-500 text-white text-[9px] font-black uppercase">
                            Realizada
                          </Badge>
                        )}
                        {appt.status === 'canceled' && (
                          <Badge className="bg-rose-500 text-white text-[9px] font-black uppercase">
                            Cancelada
                          </Badge>
                        )}
                        {appt.status === 'no_show' && (
                          <Badge
                            variant="outline"
                            className="text-rose-500 text-[9px] font-black uppercase"
                          >
                            Faltou
                          </Badge>
                        )}

                        {/* Mini-chip de local da consulta */}
                        {appt.location_name && (
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-bold border flex items-center gap-1 bg-muted/60 text-foreground">
                            <MapPin className="w-2.5 h-2.5 text-[#1CB0F6]" />
                            <span className="truncate max-w-[120px]">{appt.location_name}</span>
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground font-semibold">
                        {appt.title || 'Consulta'}
                      </div>
                      <div className="text-xs text-foreground font-bold flex items-center gap-1.5 flex-wrap">
                        <Clock className="w-3.5 h-3.5 text-[#1CB0F6]" />
                        <span>
                          {new Date(appt.scheduled_at).toLocaleString('pt-BR', {
                            dateStyle: 'long',
                            timeStyle: 'short',
                          })}{' '}
                          • Duração: {appt.duration_minutes} min
                        </span>
                      </div>
                      {appt.notes && (
                        <p className="text-xs text-muted-foreground bg-muted/40 p-2 rounded-xl mt-1">
                          {appt.notes}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 self-end sm:self-center shrink-0">
                      <select
                        value={appt.status}
                        onChange={(e) => updateAppointmentStatus(appt.id, e.target.value as any)}
                        className="h-8 px-2 rounded-xl border bg-card text-xs font-bold text-foreground"
                      >
                        <option value="scheduled">Agendada</option>
                        <option value="done">Realizada</option>
                        <option value="canceled">Cancelada</option>
                        <option value="no_show">Faltou</option>
                      </select>

                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => deleteAppointment(appt.id)}
                        className="h-8 w-8 rounded-xl text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ABA 4: GRUPOS PRO */}
      {activeTab === 'groups_pro' && <ProfessionalGroupsTab />}

      {/* Modais do Painel */}
      <ClinicConfigModal
        open={clinicModalOpen}
        onOpenChange={setClinicModalOpen}
        profile={profile}
      />

      <InvitePatientModal open={inviteModalOpen} onOpenChange={setInviteModalOpen} />

      <CreateOfflinePatientModal
        open={offlinePatientModalOpen}
        onOpenChange={setOfflinePatientModalOpen}
      />

      <AppointmentModal
        open={appointmentModalOpen}
        onOpenChange={setAppointmentModalOpen}
        activePatients={activePatients}
      />

      <PatientDetailsDrawer
        patient={selectedPatientForDrawer}
        open={Boolean(selectedPatientForDrawer)}
        onOpenChange={(isOpen, deletedLinkId) => {
          if (!isOpen) setSelectedPatientForDrawer(null)
          if (deletedLinkId) {
            setSelectedPatientForDrawer(null)
          }
        }}
      />

      {/* AlertDialog Duolingo para Restaurar vínculo com paciente */}
      <AlertDialog
        open={Boolean(patientToRestore)}
        onOpenChange={(open) => {
          if (!open) setPatientToRestore(null)
        }}
      >
        <AlertDialogContent className="max-w-md rounded-3xl border-2 p-6 shadow-2xl">
          <AlertDialogHeader>
            <div className="w-12 h-12 rounded-2xl bg-[#58CC02]/15 text-[#58CC02] flex items-center justify-center mb-1">
              <RotateCcw className="w-6 h-6" />
            </div>
            <AlertDialogTitle className="text-lg font-black text-foreground">
              Restaurar vínculo com {patientToRestore?.patient_name || 'Paciente'}?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-muted-foreground leading-relaxed">
              O paciente voltará a aparecer como ativo na sua lista, com acesso às permissões e
              histórico de dados anterior ao encerramento.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 pt-2">
            <AlertDialogCancel disabled={restoring} className="rounded-2xl font-bold">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={restoring}
              onClick={async (e) => {
                e.preventDefault()
                if (!patientToRestore) return
                setRestoring(true)
                try {
                  const ok = await restorePatientLink(patientToRestore.id)
                  if (ok) setPatientToRestore(null)
                } finally {
                  setRestoring(false)
                }
              }}
              className="rounded-2xl font-black bg-[#58CC02] hover:bg-[#46a302] text-white border-b-4 border-[#3c8c02] active:border-b-0 active:translate-y-1 transition-all"
            >
              {restoring ? 'Restaurando...' : 'Restaurar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {patientToDelete && (
        <DeletePatientModal
          open={Boolean(patientToDelete)}
          onOpenChange={(open) => {
            if (!open) setPatientToDelete(null)
          }}
          patientName={patientToDelete.patient_name || patientToDelete.patient_email || 'Paciente'}
          isOffline={patientToDelete.is_offline}
          onConfirm={async () => {
            await deletePatientFromPro(patientToDelete.id)
            setPatientToDelete(null)
          }}
        />
      )}
    </div>
  )
}
