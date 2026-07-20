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
import { useNutritionStore } from '@/stores/use-nutrition-store'
import { Plus } from 'lucide-react'
import { toast } from 'sonner'

interface Props {
  open: boolean
  onOpenChange: (o: boolean) => void
}

export function NewMealPlanModal({ open, onOpenChange }: Props) {
  const { addDietPlan } = useNutritionStore()
  const [name, setName] = useState('')
  const [time, setTime] = useState('')

  const handleSubmit = useCallback(() => {
    if (!name.trim()) {
      toast.error('Adicione um nome para a refeição')
      return
    }
    onOpenChange(false)
    addDietPlan(name.trim(), time.trim() || '00:00')
    toast.success('Refeição criada! 🎉')
    setName('')
    setTime('')
  }, [name, time, addDietPlan, onOpenChange])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md rounded-3xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-extrabold">Nova Refeição</DialogTitle>
          <DialogDescription>Crie uma nova refeição no seu plano alimentar</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label className="text-sm font-extrabold">Nome da Refeição</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Lanche da Tarde"
              className="rounded-xl font-bold"
              autoFocus
            />
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-extrabold">Horário</Label>
            <Input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="rounded-xl font-bold"
            />
          </div>
          <Button
            onClick={handleSubmit}
            className="w-full py-6 rounded-3xl bg-[#58CC02] hover:bg-[#46B302] text-white font-extrabold border-b-4 border-[#46A602] active:translate-y-1 active:border-b-0 transition-all duration-150"
          >
            <Plus className="w-5 h-5 mr-2" strokeWidth={3} />
            Criar Refeição
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
