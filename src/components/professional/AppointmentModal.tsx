import { useState } from 'react'
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
import { useProfessionalStore, PatientLink } from '@/stores/useProfessionalStore'
import { Calendar } from 'lucide-react'
import { toast } from 'sonner'

interface AppointmentModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  activePatients: PatientLink[]
}

export function AppointmentModal({ open, onOpenChange, activePatients }: AppointmentModalProps) {
  const { createAppointment } = useProfessionalStore()
  const [patientId, setPatientId] = useState('')
  const [title, setTitle] = useState('Consulta de Retorno')
  const [scheduledDate, setScheduledDate] = useState(() => {
    const d = new Date()
    d.setHours(d.getHours() + 1, 0, 0, 0)
    return d.toISOString().slice(0, 16)
  })
  const [durationMinutes, setDurationMinutes] = useState(50)
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!patientId) {
      toast.error('Selecione um paciente ativo.')
      return
    }

    setSaving(true)
    const ok = await createAppointment({
      patient_id: patientId,
      title: title.trim() || 'Consulta',
      scheduled_at: new Date(scheduledDate).toISOString(),
      duration_minutes: durationMinutes,
      notes: notes.trim() || undefined,
    })
    setSaving(false)
    if (ok) {
      onOpenChange(false)
      setTitle('Consulta de Retorno')
      setNotes('')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md rounded-3xl border-2 p-6 shadow-2xl">
        <DialogHeader>
          <div className="w-12 h-12 rounded-2xl bg-[#1CB0F6]/15 text-[#1CB0F6] flex items-center justify-center mb-1">
            <Calendar className="w-6 h-6" />
          </div>
          <DialogTitle className="text-xl font-black text-foreground">Agendar Consulta</DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Defina data, horário e duração para atendimento de paciente ativo.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-foreground">Paciente *</Label>
            <select
              value={patientId}
              onChange={(e) => setPatientId(e.target.value)}
              required
              className="w-full rounded-2xl border-2 bg-card text-xs font-bold text-foreground h-11 px-3 focus:outline-none focus:ring-2 focus:ring-[#1CB0F6]"
            >
              <option value="">Selecione um paciente...</option>
              {activePatients.map((p) => (
                <option key={p.patient_id} value={p.patient_id}>
                  {p.patient_name || p.patient_email}
                </option>
              ))}
            </select>
            {activePatients.length === 0 && (
              <p className="text-[11px] text-amber-500 font-semibold">
                Nenhum paciente ativo no momento. Convide um paciente primeiro.
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-foreground">Título / Motivo</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Primeira Consulta / Retorno 30 dias"
              className="rounded-2xl border-2 h-11 text-xs"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-foreground">Data e Horário *</Label>
              <Input
                type="datetime-local"
                required
                value={scheduledDate}
                onChange={(e) => setScheduledDate(e.target.value)}
                className="rounded-2xl border-2 h-11 text-xs"
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
                className="rounded-2xl border-2 h-11 text-xs"
              />
            </div>
          </div>

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

          <DialogFooter className="pt-2">
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
              disabled={saving || activePatients.length === 0}
              className="rounded-2xl h-11 font-black bg-[#1CB0F6] hover:bg-[#1899d6] text-white border-b-4 border-[#1899d6] active:border-b-0 active:translate-y-1 transition-all"
            >
              {saving ? 'Agendando...' : 'Confirmar Agendamento'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
