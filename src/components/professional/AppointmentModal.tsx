import { useState, useMemo, useEffect, useRef } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { useProfessionalStore, PatientLink, Appointment } from '@/stores/useProfessionalStore'
import { Calendar, Search, MapPin, Bell, User, Check, X } from 'lucide-react'
import { toast } from 'sonner'

interface AppointmentModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  activePatients: PatientLink[]
  editAppointment?: Appointment | null
}

export function AppointmentModal({
  open,
  onOpenChange,
  activePatients,
  editAppointment,
}: AppointmentModalProps) {
  const { createAppointment, updateAppointment, professionalLocations } = useProfessionalStore()

  const [selectedPatient, setSelectedPatient] = useState<PatientLink | null>(null)
  const [patientSearchQuery, setPatientSearchQuery] = useState('')
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const autocompleteRef = useRef<HTMLDivElement>(null)

  const [title, setTitle] = useState('Consulta')
  const [scheduledDate, setScheduledDate] = useState(() => {
    const d = new Date()
    d.setHours(d.getHours() + 1, 0, 0, 0)
    return d.toISOString().slice(0, 16)
  })
  const [durationMinutes, setDurationMinutes] = useState(50)
  const [locationName, setLocationName] = useState<string>('none')
  const [createReminder, setCreateReminder] = useState<boolean>(true)
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)

  // Sincronizar dados quando o modal abre ou muda de consulta para edição
  useEffect(() => {
    if (!open) {
      setDropdownOpen(false)
      return
    }

    if (editAppointment) {
      const matched = activePatients.find((p) => p.patient_id === editAppointment.patient_id)
      setSelectedPatient(matched || null)
      setPatientSearchQuery(matched?.patient_name || editAppointment.patient_name || '')
      setTitle(editAppointment.title || 'Consulta')
      try {
        const d = new Date(editAppointment.scheduled_at)
        setScheduledDate(d.toISOString().slice(0, 16))
      } catch {
        const d = new Date()
        d.setHours(d.getHours() + 1, 0, 0, 0)
        setScheduledDate(d.toISOString().slice(0, 16))
      }
      setDurationMinutes(editAppointment.duration_minutes || 50)
      setLocationName(editAppointment.location_name || 'none')
      setCreateReminder(Boolean(editAppointment.reminder_task_id))
      setNotes(editAppointment.notes || '')
    } else {
      setSelectedPatient(null)
      setPatientSearchQuery('')
      setTitle('Consulta de Retorno')
      const d = new Date()
      d.setHours(d.getHours() + 1, 0, 0, 0)
      setScheduledDate(d.toISOString().slice(0, 16))
      setDurationMinutes(50)
      setLocationName('none')
      setCreateReminder(true)
      setNotes('')
    }
  }, [open, editAppointment, activePatients])

  // Fecha o dropdown ao clicar fora
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (autocompleteRef.current && !autocompleteRef.current.contains(e.target as Node)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Filtragem incremental de pacientes ativos (por nome, e-mail e telefone)
  const filteredPatients = useMemo(() => {
    const q = patientSearchQuery.trim().toLowerCase()
    if (!q) return activePatients

    return activePatients.filter((p) => {
      const name = (p.patient_name || '').toLowerCase()
      const email = (p.patient_email || '').toLowerCase()
      const phone = (p.offline_details?.phone || '').toLowerCase()
      return name.includes(q) || email.includes(q) || phone.includes(q)
    })
  }, [activePatients, patientSearchQuery])

  const handleSelectPatient = (p: PatientLink) => {
    setSelectedPatient(p)
    setPatientSearchQuery(p.patient_name || p.patient_email || 'Paciente')
    setDropdownOpen(false)

    // Se o paciente tiver locais associados e o modal estiver "sem local", sugerir o primeiro
    const patientCareLocs = Array.isArray(p.offline_details?.care_locations)
      ? p.offline_details!.care_locations!
      : []
    if (locationName === 'none' && patientCareLocs.length > 0) {
      setLocationName(patientCareLocs[0])
    }
  }

  const handleClearPatient = () => {
    setSelectedPatient(null)
    setPatientSearchQuery('')
    setDropdownOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedPatient) {
      toast.error('Selecione um paciente ativo da lista para agendar a consulta.')
      return
    }

    setSaving(true)
    const locValue = locationName === 'none' ? null : locationName

    let ok = false
    if (editAppointment) {
      ok = await updateAppointment(editAppointment.id, {
        patient_id: selectedPatient.patient_id,
        title: title.trim() || 'Consulta',
        scheduled_at: new Date(scheduledDate).toISOString(),
        duration_minutes: durationMinutes,
        notes: notes.trim() || undefined,
        location_name: locValue,
        createReminder,
      })
    } else {
      ok = await createAppointment({
        patient_id: selectedPatient.patient_id,
        title: title.trim() || 'Consulta',
        scheduled_at: new Date(scheduledDate).toISOString(),
        duration_minutes: durationMinutes,
        notes: notes.trim() || undefined,
        location_name: locValue,
        createReminder,
      })
    }
    setSaving(false)

    if (ok) {
      onOpenChange(false)
      setSelectedPatient(null)
      setPatientSearchQuery('')
      setTitle('Consulta de Retorno')
      setNotes('')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full sm:max-w-md rounded-3xl border-2 p-5 sm:p-6 shadow-2xl max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <div className="w-12 h-12 rounded-2xl bg-[#1CB0F6]/15 text-[#1CB0F6] flex items-center justify-center mb-1">
            <Calendar className="w-6 h-6" />
          </div>
          <DialogTitle className="text-xl font-black text-foreground">
            {editAppointment ? 'Editar Consulta' : 'Agendar Consulta'}
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Defina paciente (online ou offline), data, local e lembrete na agenda.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          {/* Autocomplete de Paciente */}
          <div className="space-y-1.5" ref={autocompleteRef}>
            <div className="flex items-center justify-between">
              <Label className="text-xs font-bold text-foreground">Paciente *</Label>
              {selectedPatient && (
                <button
                  type="button"
                  onClick={handleClearPatient}
                  className="text-[10px] text-muted-foreground hover:text-rose-500 font-bold flex items-center gap-0.5 transition-colors"
                >
                  <X className="w-3 h-3" />
                  <span>Trocar</span>
                </button>
              )}
            </div>

            <div className="relative">
              <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <Input
                type="text"
                value={patientSearchQuery}
                onChange={(e) => {
                  setPatientSearchQuery(e.target.value)
                  if (selectedPatient) setSelectedPatient(null)
                  setDropdownOpen(true)
                }}
                onFocus={() => setDropdownOpen(true)}
                placeholder="Buscar por nome, e-mail ou telefone..."
                className="pl-9 pr-9 rounded-2xl border-2 h-11 text-xs font-bold"
              />
              {selectedPatient && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-[#58CC02] text-white flex items-center justify-center">
                  <Check className="w-3 h-3 stroke-[3]" />
                </div>
              )}
            </div>

            {/* Dropdown de sugestões */}
            {dropdownOpen && !selectedPatient && (
              <div className="mt-1 max-h-56 overflow-y-auto rounded-2xl border-2 bg-popover p-1 shadow-lg divide-y divide-border/60">
                {filteredPatients.length === 0 ? (
                  <div className="p-3 text-center text-xs text-muted-foreground">
                    Nenhum paciente ativo encontrado com este termo.
                  </div>
                ) : (
                  filteredPatients.map((p) => {
                    const isSynthetic =
                      !p.patient_email || p.patient_email.endsWith('@pacientes.offline')
                    const contact = !isSynthetic
                      ? p.patient_email
                      : p.offline_details?.phone || 'Offline'
                    const initial = (p.patient_name || contact || 'P')[0].toUpperCase()

                    return (
                      <button
                        key={p.patient_id}
                        type="button"
                        onClick={() => handleSelectPatient(p)}
                        className="w-full text-left p-2.5 rounded-xl hover:bg-muted/80 transition-colors flex items-center gap-2.5 cursor-pointer"
                      >
                        <div className="w-8 h-8 rounded-xl bg-[#1CB0F6]/15 text-[#1CB0F6] font-black text-xs flex items-center justify-center shrink-0">
                          {initial}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="font-bold text-xs text-foreground truncate flex items-center gap-1.5 flex-wrap">
                            <span className="truncate">{p.patient_name || 'Paciente'}</span>
                            {p.is_offline ? (
                              <span className="px-1.5 py-0.2 rounded-full text-[8px] font-black uppercase bg-amber-500/15 text-amber-800 dark:text-amber-300 border border-amber-500/30">
                                Offline
                              </span>
                            ) : (
                              <span className="px-1.5 py-0.2 rounded-full text-[8px] font-black uppercase bg-[#58CC02]/15 text-[#58CC02] border border-[#58CC02]/30">
                                Online
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-muted-foreground truncate">
                            {contact}
                          </div>
                        </div>
                      </button>
                    )
                  })
                )}
              </div>
            )}

            {/* Paciente selecionado destacado */}
            {selectedPatient && (
              <div className="p-2.5 rounded-2xl bg-muted/30 border flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-6 h-6 rounded-lg bg-[#1CB0F6] text-white flex items-center justify-center text-[10px] font-black">
                    {(selectedPatient.patient_name || 'P')[0].toUpperCase()}
                  </div>
                  <span className="font-black text-foreground truncate">
                    {selectedPatient.patient_name}
                  </span>
                  {selectedPatient.is_offline ? (
                    <Badge
                      variant="outline"
                      className="text-[9px] border-amber-500/40 text-amber-700 dark:text-amber-300"
                    >
                      Offline
                    </Badge>
                  ) : (
                    <Badge
                      variant="outline"
                      className="text-[9px] border-[#58CC02]/40 text-[#58CC02]"
                    >
                      Online
                    </Badge>
                  )}
                </div>
                <span className="text-[10px] text-muted-foreground truncate max-w-[140px]">
                  {selectedPatient.patient_email &&
                  !selectedPatient.patient_email.endsWith('@pacientes.offline')
                    ? selectedPatient.patient_email
                    : selectedPatient.offline_details?.phone || 'Paciente ativo'}
                </span>
              </div>
            )}
          </div>

          {/* Título / Motivo */}
          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-foreground">Título / Motivo</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Primeira Consulta / Retorno 30 dias"
              className="rounded-2xl border-2 h-11 text-xs font-bold"
            />
          </div>

          {/* Data, Horário e Duração */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-foreground">Data e Horário *</Label>
              <Input
                type="datetime-local"
                required
                value={scheduledDate}
                onChange={(e) => setScheduledDate(e.target.value)}
                className="rounded-2xl border-2 h-11 text-xs font-bold"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-foreground">Duração (min)</Label>
              <Input
                type="number"
                min={15}
                max={180}
                step={5}
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(Number(e.target.value))}
                className="rounded-2xl border-2 h-11 text-xs font-bold"
              />
            </div>
          </div>

          {/* Local de Atendimento */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-bold text-foreground flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-[#1CB0F6]" />
                Local de Atendimento
              </Label>
              {professionalLocations.length === 0 && (
                <span className="text-[10px] text-muted-foreground italic">
                  Nenhum local cadastrado
                </span>
              )}
            </div>
            <select
              value={locationName}
              onChange={(e) => setLocationName(e.target.value)}
              className="w-full rounded-2xl border-2 bg-card text-xs font-bold text-foreground h-11 px-3 focus:outline-none focus:ring-2 focus:ring-[#1CB0F6]"
            >
              <option value="none">Sem local definido (Online / Geral)</option>
              {professionalLocations.map((loc) => (
                <option key={loc.id} value={loc.name}>
                  📍 {loc.name}
                </option>
              ))}
            </select>
          </div>

          {/* Switch de Lembrete como Tarefa */}
          <div className="p-3 rounded-2xl border-2 bg-muted/20 flex items-center justify-between gap-3">
            <div className="space-y-0.5 min-w-0">
              <div className="text-xs font-black text-foreground flex items-center gap-1.5">
                <Bell className="w-3.5 h-3.5 text-[#1CB0F6]" />
                <span>Lembrete na sua Agenda</span>
              </div>
              <p className="text-[11px] text-muted-foreground leading-tight">
                Cria uma tarefa de alta prioridade com o horário e duração da consulta.
              </p>
            </div>
            <Switch
              checked={createReminder}
              onCheckedChange={setCreateReminder}
              className="shrink-0"
            />
          </div>

          {/* Observações Prévias */}
          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-foreground">Observações Prévias</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Instruções de jejum, pauta ou detalhes da consulta..."
              rows={3}
              className="rounded-2xl border-2 text-xs"
            />
          </div>

          <DialogFooter className="pt-2 gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="rounded-2xl h-11 font-bold"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={saving || !selectedPatient}
              className="rounded-2xl h-11 font-black bg-[#1CB0F6] hover:bg-[#1899d6] text-white border-b-4 border-[#1899d6] active:border-b-0 active:translate-y-1 transition-all disabled:opacity-50"
            >
              {saving
                ? 'Salvando...'
                : editAppointment
                  ? 'Salvar Alterações'
                  : 'Confirmar Agendamento'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
