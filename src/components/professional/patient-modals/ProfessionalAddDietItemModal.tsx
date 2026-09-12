import { useState } from 'react'
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
import { Plus, Stethoscope } from 'lucide-react'
import { toast } from 'sonner'
import { useProfessionalPatientWrite } from '@/hooks/use-professional-patient-write'

interface Props {
  open: boolean
  onOpenChange: (o: boolean) => void
  patientName: string
  planId: string
  planName: string
  onSuccess?: () => void
}

export function ProfessionalAddDietItemModal({
  open,
  onOpenChange,
  patientName,
  planId,
  planName,
  onSuccess,
}: Props) {
  const { addDietPlanItemForPatient } = useProfessionalPatientWrite()
  const [description, setDescription] = useState('')
  const [quantity, setQuantity] = useState('100g')
  const [calories, setCalories] = useState('0')
  const [carbs, setCarbs] = useState('0')
  const [protein, setProtein] = useState('0')
  const [fat, setFat] = useState('0')
  const [allergens, setAllergens] = useState('')
  const [saving, setSaving] = useState(false)

  const handleSubmit = async () => {
    if (!description.trim()) {
      toast.error('Informe o nome do alimento.')
      return
    }

    setSaving(true)
    const res = await addDietPlanItemForPatient(planId, {
      description: description.trim(),
      quantity: quantity.trim() || '1 porção',
      calories: parseFloat(calories) || 0,
      carbs_g: parseFloat(carbs) || 0,
      protein_g: parseFloat(protein) || 0,
      fat_g: parseFloat(fat) || 0,
      fibers_g: 0,
      sodium_mg: 0,
      allergens: allergens.trim() || null,
    })
    setSaving(false)

    if (res) {
      toast.success(`Alimento adicionado a "${planName}"! 🥗`)
      setDescription('')
      setQuantity('100g')
      setCalories('0')
      setCarbs('0')
      setProtein('0')
      setFat('0')
      setAllergens('')
      onOpenChange(false)
      onSuccess?.()
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md rounded-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-black text-white bg-[#1CB0F6]">
              <Stethoscope className="w-3 h-3" />
              Prescrição
            </span>
            <span className="text-xs font-bold text-muted-foreground truncate">
              Paciente: <strong>{patientName}</strong>
            </span>
          </div>
          <DialogTitle className="text-xl font-extrabold">Adicionar Alimento</DialogTitle>
          <DialogDescription className="text-xs">
            Prescrever alimento na refeição <strong>{planName}</strong>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label className="text-xs font-extrabold">Nome do Alimento</Label>
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ex: Peito de Frango Grelhado, Arroz Integral"
              className="rounded-2xl font-bold"
              autoFocus
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-extrabold">Porção Recomendada</Label>
            <Input
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder="Ex: 150g, 1 unidade, 2 conchas"
              className="rounded-2xl font-bold"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-extrabold">Calorias (kcal)</Label>
              <Input
                type="number"
                value={calories}
                onChange={(e) => setCalories(e.target.value)}
                className="rounded-2xl font-bold"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-extrabold">Carboidratos (g)</Label>
              <Input
                type="number"
                value={carbs}
                onChange={(e) => setCarbs(e.target.value)}
                className="rounded-2xl font-bold"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-extrabold">Proteínas (g)</Label>
              <Input
                type="number"
                value={protein}
                onChange={(e) => setProtein(e.target.value)}
                className="rounded-2xl font-bold"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-extrabold">Gorduras (g)</Label>
              <Input
                type="number"
                value={fat}
                onChange={(e) => setFat(e.target.value)}
                className="rounded-2xl font-bold"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-extrabold">Alérgenos / Notas (opcional)</Label>
            <Input
              value={allergens}
              onChange={(e) => setAllergens(e.target.value)}
              placeholder="Ex: sem glúten"
              className="rounded-2xl font-bold"
            />
          </div>

          <Button
            onClick={handleSubmit}
            disabled={saving}
            className="w-full py-5 rounded-3xl bg-[#1CB0F6] hover:bg-[#1899d6] text-white font-extrabold border-b-4 border-[#147eb0] active:translate-y-1 active:border-b-0 transition-all duration-150"
          >
            <Plus className="w-5 h-5 mr-2" strokeWidth={3} />
            {saving ? 'Adicionando...' : 'Adicionar ao Plano'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
