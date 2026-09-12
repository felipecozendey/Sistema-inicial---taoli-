import { useState, useEffect } from 'react'
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
import { Check, Stethoscope } from 'lucide-react'
import { toast } from 'sonner'
import { useProfessionalPatientWrite } from '@/hooks/use-professional-patient-write'

interface Props {
  open: boolean
  onOpenChange: (o: boolean) => void
  patientName: string
  item: any | null
  onSuccess?: () => void
}

export function ProfessionalDietItemModal({
  open,
  onOpenChange,
  patientName,
  item,
  onSuccess,
}: Props) {
  const { updateDietPlanItemForPatient } = useProfessionalPatientWrite()
  const [description, setDescription] = useState('')
  const [quantity, setQuantity] = useState('')
  const [calories, setCalories] = useState('')
  const [carbs, setCarbs] = useState('')
  const [protein, setProtein] = useState('')
  const [fat, setFat] = useState('')
  const [fibers, setFibers] = useState('')
  const [sodium, setSodium] = useState('')
  const [allergens, setAllergens] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (item) {
      setDescription(item.description || '')
      setQuantity(item.quantity || '')
      setCalories(String(item.calories || 0))
      setCarbs(String(item.carbs_g || item.carbsG || 0))
      setProtein(String(item.protein_g || item.proteinG || 0))
      setFat(String(item.fat_g || item.fatG || 0))
      setFibers(String(item.fibers_g || item.fibersG || 0))
      setSodium(String(item.sodium_mg || item.sodiumMg || 0))
      setAllergens(item.allergens || '')
    }
  }, [item])

  const handleSubmit = async () => {
    if (!item) return
    if (!description.trim()) {
      toast.error('Informe o nome do item.')
      return
    }

    setSaving(true)
    const res = await updateDietPlanItemForPatient(item.id, {
      description: description.trim(),
      quantity: quantity.trim(),
      calories: parseFloat(calories) || 0,
      carbs_g: parseFloat(carbs) || 0,
      protein_g: parseFloat(protein) || 0,
      fat_g: parseFloat(fat) || 0,
      fibers_g: parseFloat(fibers) || 0,
      sodium_mg: parseFloat(sodium) || 0,
      allergens: allergens.trim() || null,
    })
    setSaving(false)

    if (res) {
      toast.success(`Alimento atualizado para ${patientName}! ✏️`)
      onOpenChange(false)
      onSuccess?.()
    }
  }

  if (!item) return null

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
          <DialogTitle className="text-xl font-extrabold">Editar Alimento da Refeição</DialogTitle>
          <DialogDescription className="text-xs">
            Ajuste a porção ou informações nutricionais do item prescrito.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label className="text-xs font-extrabold">Nome do Alimento</Label>
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="rounded-2xl font-bold"
              autoFocus
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-extrabold">Porção Recomendada</Label>
            <Input
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder="Ex: 150g, 2 colheres de sopa"
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
            <Label className="text-xs font-extrabold">Alérgenos / Restrições</Label>
            <Input
              value={allergens}
              onChange={(e) => setAllergens(e.target.value)}
              placeholder="Ex: contém glúten, lactose"
              className="rounded-2xl font-bold"
            />
          </div>

          <Button
            onClick={handleSubmit}
            disabled={saving}
            className="w-full py-5 rounded-3xl bg-[#1CB0F6] hover:bg-[#1899d6] text-white font-extrabold border-b-4 border-[#147eb0] active:translate-y-1 active:border-b-0 transition-all duration-150"
          >
            <Check className="w-5 h-5 mr-2" strokeWidth={3} />
            {saving ? 'Salvando...' : 'Salvar Alimento'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
