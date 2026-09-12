import { useState, useCallback } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Plus, Sparkles, Stethoscope } from 'lucide-react'
import { toast } from 'sonner'
import { useProfessionalPatientWrite } from '@/hooks/use-professional-patient-write'

interface Props {
  open: boolean
  onOpenChange: (o: boolean) => void
  patientName: string
  editPlan?: any | null
  onSuccess?: () => void
}

export function ProfessionalDietPlanModal({
  open,
  onOpenChange,
  patientName,
  editPlan,
  onSuccess,
}: Props) {
  const { createDietPlanForPatient, updateDietPlanForPatient } = useProfessionalPatientWrite()
  const [name, setName] = useState('')
  const [time, setTime] = useState('')
  const [saving, setSaving] = useState(false)

  // Pre-fill when editing
  useState(() => {
    if (editPlan) {
      setName(editPlan.name || '')
      setTime(editPlan.time || '')
    }
  })

  // Also update when open / editPlan changes
  const [lastPlanId, setLastPlanId] = useState<string | null>(null)
  if (editPlan && editPlan.id !== lastPlanId) {
    setLastPlanId(editPlan.id)
    setName(editPlan.name || '')
    setTime(editPlan.time || '')
  } else if (!editPlan && lastPlanId !== null) {
    setLastPlanId(null)
    setName('')
    setTime('')
  }

  const handleSubmit = useCallback(async () => {
    if (!name.trim()) {
      toast.error('Informe o nome da refeição.')
      return
    }

    setSaving(true)
    let res = null
    if (editPlan?.id) {
      res = await updateDietPlanForPatient(editPlan.id, {
        name: name.trim(),
        time: time.trim() || '08:00',
      })
    } else {
      res = await createDietPlanForPatient(name.trim(), time.trim() || '08:00')
    }
    setSaving(false)

    if (res) {
      toast.success(
        editPlan
          ? `Refeição atualizada para ${patientName}! 🎉`
          : `Refeição prescrita para ${patientName}! 🎉`,
      )
      setName('')
      setTime('')
      onOpenChange(false)
      onSuccess?.()
    }
  }, [
    name,
    time,
    editPlan,
    createDietPlanForPatient,
    updateDietPlanForPatient,
    patientName,
    onOpenChange,
    onSuccess,
  ])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md rounded-3xl">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-black text-white bg-[#1CB0F6]">
              <Stethoscope className="w-3 h-3" />
              Prescrição
            </span>
            <span className="text-xs font-bold text-muted-foreground truncate">
              Criando para: <strong>{patientName}</strong>
            </span>
          </div>
          <DialogTitle className="text-xl font-extrabold">
            {editPlan ? 'Editar Refeição no Plano' : 'Nova Refeição no Plano'}
          </DialogTitle>
          <DialogDescription className="text-xs">
            {editPlan
              ? 'Edite o nome ou horário sugerido para esta refeição prescrita.'
              : 'Prescreva um novo horário/refeição no plano alimentar do paciente.'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label className="text-sm font-extrabold">Nome da Refeição</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Café da Manhã Anabólico, Lanche Pré-Treino"
              className="rounded-2xl font-bold"
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-extrabold">Horário Sugerido</Label>
            <Input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="rounded-2xl font-bold"
            />
          </div>

          <Button
            onClick={handleSubmit}
            disabled={saving}
            className="w-full py-6 rounded-3xl bg-[#1CB0F6] hover:bg-[#1899d6] text-white font-extrabold border-b-4 border-[#147eb0] active:translate-y-1 active:border-b-0 transition-all duration-150"
          >
            <Plus className="w-5 h-5 mr-2" strokeWidth={3} />
            {saving ? 'Salvando...' : editPlan ? 'Salvar Refeição' : 'Prescrever Refeição'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
