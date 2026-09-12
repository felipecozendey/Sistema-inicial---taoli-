import { useEffect, useState, useMemo } from 'react'
import {
  useProfessionalStore,
  PatientLink,
  Appointment,
  ClinicalNote,
} from '@/stores/useProfessionalStore'
import { StethoscopeIcon } from '@/components/professional/StethoscopeIcon'
import { ClinicConfigModal } from '@/components/professional/ClinicConfigModal'
import { PatientDetailsDrawer } from '@/components/professional/PatientDetailsDrawer'
import { AppointmentModal } from '@/components/professional/AppointmentModal'
import { NoteModal } from '@/components/professional/NoteModal'
import { InvitePatientModal } from '@/components/professional/InvitePatientModal'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
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
  XCircle,
  HelpCircle,
  AlertCircle,
  Trash2,
  Lock,
} from 'lucide-react'

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

  const [activeTab, setActiveTab] = useState<'overview' | 'patients' | 'appointments' | 'notes'>(
    'overview',
  )
  const [clinicModalOpen, setClinicModalOpen] = useState(false)
  const [inviteModalOpen, setInviteModalOpen] = useState(false)
  const [appointmentModalOpen, setAppointmentModalOpen] = useState(false)
  const [noteModalOpen, setNoteModalOpen] = useState(false)
  const [selectedPatientForDrawer, setSelectedPatientForDrawer] = useState<PatientLink | null>(null)

  // Search & filters
  const [patientSearch, setPatientSearch] = useState('')
  const [patientStatusFilter, setPatientStatusFilter] = useState<
    'all' | 'active' | 'pending' | 'ended'
  >('all')

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
      return matchSearch && matchStatus
    })
  }, [patients, patientSearch, patientStatusFilter])

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
                <h1 className="text-2xl font-black tracking-tight">Painel Profissional</h1>
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

      {/* CTA de configuração caso consultório ainda não tenha sido preenchido */}
      {!profile && !loading && (
        <div className="p-4 rounded-3xl border-2 border-[#1CB0F6]/30 bg-[#1CB0F6]/10 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#1CB0F6] text-white flex items-center justify-center shrink-0">
              <StethoscopeIcon size={20} />
            </div>
            <div>
              <h3 className="font-black text-sm text-foreground">Configure seu consultório</h3>
              <p className="text-xs text-muted-foreground">
                Adicione seu registro (CRN/CRM etc.), especialidade e contato para personalizar seus
                atendimentos.
              </p>
            </div>
          </div>
          <Button
            onClick={() => setClinicModalOpen(true)}
            className="rounded-2xl h-10 px-4 font-black bg-[#1CB0F6] hover:bg-[#1899d6] text-white border-b-4 border-[#1899d6] active:border-b-0 active:translate-y-1 transition-all text-xs shrink-0"
          >
            Configurar agora
          </Button>
        </div>
      )}

      {/* Mobile-first chips roláveis para abas */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide border-b">
        <button
          type="button"
          onClick={() => setActiveTab('overview')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-black transition-all shrink-0 border-2 ${
            activeTab === 'overview'
              ? 'bg-[#1CB0F6] text-white border-[#1CB0F6] border-b-4'
              : 'bg-card text-muted-foreground border-transparent hover:bg-muted'
          }`}
        >
          <LayoutDashboard className="w-4 h-4" />
          <span>Visão Geral</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('patients')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-black transition-all shrink-0 border-2 ${
            activeTab === 'patients'
              ? 'bg-[#1CB0F6] text-white border-[#1CB0F6] border-b-4'
              : 'bg-card text-muted-foreground border-transparent hover:bg-muted'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Pacientes</span>
          {pendingPatients.length > 0 && (
            <span className="w-5 h-5 rounded-full bg-amber-400 text-amber-900 text-[10px] font-black flex items-center justify-center ml-0.5">
              {pendingPatients.length}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('appointments')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-black transition-all shrink-0 border-2 ${
            activeTab === 'appointments'
              ? 'bg-[#1CB0F6] text-white border-[#1CB0F6] border-b-4'
              : 'bg-card text-muted-foreground border-transparent hover:bg-muted'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>Consultas</span>
          {appointmentsToday.length > 0 && (
            <span className="w-5 h-5 rounded-full bg-emerald-500 text-white text-[10px] font-black flex items-center justify-center ml-0.5">
              {appointmentsToday.length}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('notes')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-black transition-all shrink-0 border-2 ${
            activeTab === 'notes'
              ? 'bg-[#1CB0F6] text-white border-[#1CB0F6] border-b-4'
              : 'bg-card text-muted-foreground border-transparent hover:bg-muted'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Anotações Clínicas</span>
        </button>
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

            <div className="p-4 rounded-3xl border-2 bg-card shadow-sm space-y-1">
              <div className="flex items-center justify-between text-muted-foreground">
                <span className="text-[11px] font-bold uppercase tracking-wider">
                  Anotações Clínicas
                </span>
                <FileText className="w-4 h-4 text-[#FFC800]" />
              </div>
              <div className="text-2xl font-black text-foreground">{notes.length}</div>
              <div className="text-[10px] text-muted-foreground font-semibold">
                Evoluções salvas
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
                      <div className="text-[11px] font-bold text-[#1CB0F6] flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {new Date(appt.scheduled_at).toLocaleString('pt-BR', {
                          dateStyle: 'short',
                          timeStyle: 'short',
                        })}{' '}
                        ({appt.duration_minutes} min)
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
            </div>

            <Button
              onClick={() => setInviteModalOpen(true)}
              className="rounded-2xl h-11 px-5 font-black bg-[#1CB0F6] hover:bg-[#1899d6] text-white border-b-4 border-[#1899d6] active:border-b-0 active:translate-y-1 transition-all text-xs flex items-center gap-2 shadow-sm shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Convidar Paciente</span>
            </Button>
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
                        <div className="font-bold text-sm text-foreground flex items-center gap-2 truncate">
                          <span>{p.patient_name}</span>
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
                        </div>
                        <div className="text-xs text-muted-foreground truncate">
                          {p.patient_email}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center">
                      <span className="text-[11px] text-muted-foreground">
                        {safeFormatDate(p.created_at)}
                      </span>
                      {p.status === 'active' ? (
                        <Button
                          size="sm"
                          variant="outline"
                          className="rounded-xl h-8 text-xs font-bold border-2"
                        >
                          Ver Prontuário
                        </Button>
                      ) : (
                        <span className="text-xs text-muted-foreground italic">
                          {p.status === 'pending' ? 'Pendente' : 'Desconectado'}
                        </span>
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
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-black text-base text-foreground">Agenda de Consultas</h3>
              <p className="text-xs text-muted-foreground">
                Gerencie agendamentos, presenças e status das sessões
              </p>
            </div>
            <Button
              onClick={() => setAppointmentModalOpen(true)}
              className="rounded-2xl h-11 px-5 font-black bg-[#1CB0F6] hover:bg-[#1899d6] text-white border-b-4 border-[#1899d6] active:border-b-0 active:translate-y-1 transition-all text-xs flex items-center gap-2 shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Agendar Consulta</span>
            </Button>
          </div>

          <div className="bg-card border-2 rounded-3xl overflow-hidden shadow-sm">
            {appointments.length === 0 ? (
              <div className="py-14 text-center space-y-2">
                <Calendar className="w-10 h-10 text-muted-foreground mx-auto opacity-40" />
                <p className="font-extrabold text-foreground">Nenhuma consulta agendada</p>
                <p className="text-xs text-muted-foreground">
                  Marque sessões e acompanhe o histórico de atendimentos clínicos.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {appointments.map((appt) => (
                  <div
                    key={appt.id}
                    className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
                  >
                    <div className="space-y-1 min-w-0">
                      <div className="font-black text-sm text-foreground flex items-center gap-2">
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
                      </div>
                      <div className="text-xs text-muted-foreground font-semibold">
                        {appt.title || 'Consulta'}
                      </div>
                      <div className="text-xs text-foreground font-bold flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-[#1CB0F6]" />
                        {new Date(appt.scheduled_at).toLocaleString('pt-BR', {
                          dateStyle: 'long',
                          timeStyle: 'short',
                        })}{' '}
                        • Duração: {appt.duration_minutes} min
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

      {/* ABA 4: ANOTAÇÕES CLÍNICAS */}
      {activeTab === 'notes' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-black text-base text-foreground">
                  Anotações Clínicas & Condutas
                </h3>
                <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                  <Lock className="w-3 h-3" /> Privado
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                Notas confidenciais visíveis somente para você (autor do prontuário)
              </p>
            </div>

            <Button
              onClick={() => setNoteModalOpen(true)}
              className="rounded-2xl h-11 px-5 font-black bg-[#1CB0F6] hover:bg-[#1899d6] text-white border-b-4 border-[#1899d6] active:border-b-0 active:translate-y-1 transition-all text-xs flex items-center gap-2 shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Nova Anotação</span>
            </Button>
          </div>

          <div className="bg-card border-2 rounded-3xl overflow-hidden shadow-sm">
            {notes.length === 0 ? (
              <div className="py-14 text-center space-y-2">
                <FileText className="w-10 h-10 text-muted-foreground mx-auto opacity-40" />
                <p className="font-extrabold text-foreground">Nenhuma anotação registrada</p>
                <p className="text-xs text-muted-foreground">
                  Registre impressões diagnósticas, anamneses e condutas dos atendimentos.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {notes.map((note) => (
                  <div key={note.id} className="p-4 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-black text-sm text-foreground">
                          {note.patient_name}
                        </span>
                        <span className="text-[10px] text-muted-foreground font-semibold">
                          {safeFormatDate(note.created_at)}
                        </span>
                      </div>

                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => deleteClinicalNote(note.id)}
                        className="h-8 w-8 rounded-xl text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>

                    <p className="text-xs text-foreground font-medium leading-relaxed whitespace-pre-wrap bg-muted/20 p-3 rounded-2xl border">
                      {note.content}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modais do Painel */}
      <ClinicConfigModal
        open={clinicModalOpen}
        onOpenChange={setClinicModalOpen}
        profile={profile}
      />

      <InvitePatientModal open={inviteModalOpen} onOpenChange={setInviteModalOpen} />

      <AppointmentModal
        open={appointmentModalOpen}
        onOpenChange={setAppointmentModalOpen}
        activePatients={activePatients}
      />

      <NoteModal
        open={noteModalOpen}
        onOpenChange={setNoteModalOpen}
        activePatients={activePatients}
        appointments={appointments}
      />

      <PatientDetailsDrawer
        patient={selectedPatientForDrawer}
        open={Boolean(selectedPatientForDrawer)}
        onOpenChange={(isOpen) => {
          if (!isOpen) setSelectedPatientForDrawer(null)
        }}
      />
    </div>
  )
}
