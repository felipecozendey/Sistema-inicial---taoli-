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
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useProfessionalStore, PatientLink, Appointment } from '@/stores/useProfessionalStore'
import { FileEdit, Lock } from 'lucide-react'
import { toast } from 'sonner'

interface NoteModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  activePatients: PatientLink[]
  appointments: Appointment[]
}

export function NoteModal({ open, onOpenChange, activePatients, appointments }: NoteModalProps) {
  const { createClinicalNote } = useProfessionalStore()
  const [patientId, setPatientId] = useState('')
  const [appointmentId, setAppointmentId] = useState('')
  const [content, setContent] = useState('')
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!patientId) {
      toast.error('Selecione um paciente.')
      return
    }
    if (!content.trim()) {
      toast.error('Digite a anotação clínica.')
      return
    }

    setSaving(true)
    const ok = await createClinicalNote({
      patient_id: patientId,
      appointment_id: appointmentId || null,
      content: content.trim(),
    })
    setSaving(false)
    if (ok) {
      onOpenChange(false)
      setContent('')
      setAppointmentId('')
    }
  }

  // Filter appointments for selected patient
  const patientAppts = appointments.filter((a) => a.patient_id === patientId)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg rounded-3xl border-2 p-6 shadow-2xl">
        <DialogHeader>
          <div className="w-12 h-12 rounded-2xl bg-[#1CB0F6]/15 text-[#1CB0F6] flex items-center justify-center mb-1">
            <FileEdit className="w-6 h-6" />
          </div>
          <DialogTitle className="text-xl font-black text-foreground flex items-center gap-2">
            <span>Nova Anotação Clínica</span>
            <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
              <Lock className="w-3 h-3" /> Exclusiva do Profissional
            </span>
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Anotações clínicas e observações de conduta. O paciente nunca visualiza este conteúdo.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-foreground">Paciente *</Label>
            <select
              value={patientId}
              onChange={(e) => {
                setPatientId(e.target.value)
                setAppointmentId('')
              }}
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
          </div>

          {patientId && patientAppts.length > 0 && (
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-foreground">
                Vincular a Consulta (opcional)
              </Label>
              <select
                value={appointmentId}
                onChange={(e) => setAppointmentId(e.target.value)}
                className="w-full rounded-2xl border-2 bg-card text-xs font-semibold text-foreground h-11 px-3 focus:outline-none focus:ring-2 focus:ring-[#1CB0F6]"
              >
                <option value="">Nenhuma consulta vinculada</option>
                {patientAppts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.title || 'Consulta'} — {new Date(a.scheduled_at).toLocaleDateString('pt-BR')}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-foreground">Conteúdo Clínico *</Label>
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Queixas principais, conduta prescrita, hipótese diagnóstica, plano alimentar/treino acordado..."
              rows={6}
              required
              className="rounded-2xl border-2 text-xs leading-relaxed"
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
              disabled={saving || !patientId}
              className="rounded-2xl h-11 font-black bg-[#1CB0F6] hover:bg-[#1899d6] text-white border-b-4 border-[#1899d6] active:border-b-0 active:translate-y-1 transition-all"
            >
              {saving ? 'Salvando...' : 'Salvar Anotação'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
