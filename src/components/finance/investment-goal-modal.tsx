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
import { useFinanceStore, type InvestmentGoal } from '@/stores/useFinanceStore'
import { toast } from 'sonner'

interface InvestmentGoalModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  editingGoal?: InvestmentGoal | null
}

export function InvestmentGoalModal({ open, onOpenChange, editingGoal }: InvestmentGoalModalProps) {
  const addInvestmentGoal = useFinanceStore((s) => s.addInvestmentGoal)
  const updateInvestmentGoal = useFinanceStore((s) => s.updateInvestmentGoal)

  const [name, setName] = useState('')
  const [targetAmount, setTargetAmount] = useState('')
  const [initialAmount, setInitialAmount] = useState('0')
  const [deadline, setDeadline] = useState('')

  const isEditing = !!editingGoal

  useEffect(() => {
    if (open) {
      if (editingGoal) {
        setName(editingGoal.name)
        setTargetAmount(String(editingGoal.targetAmount))
        setInitialAmount(String(editingGoal.initialAmount ?? 0))
        setDeadline(editingGoal.deadline || '')
      } else {
        setName('')
        setTargetAmount('')
        setInitialAmount('0')
        setDeadline('')
      }
    }
  }, [open, editingGoal])

  const handleSubmit = () => {
    if (!name.trim()) {
      toast.error('Informe o nome da meta')
      return
    }

    const target = parseFloat(targetAmount)
    if (isNaN(target) || target <= 0) {
      toast.error('Informe um valor-alvo válido')
      return
    }

    const initial = parseFloat(initialAmount)
    if (isNaN(initial) || initial < 0) {
      toast.error('Informe um valor inicial válido (pode ser R$ 0)')
      return
    }

    onOpenChange(false)

    if (isEditing && editingGoal) {
      updateInvestmentGoal(editingGoal.id, {
        name: name.trim(),
        targetAmount: target,
        initialAmount: initial,
        deadline: deadline || null,
      })
      toast.success('Meta atualizada! 🎯')
    } else {
      addInvestmentGoal({
        name: name.trim(),
        targetAmount: target,
        initialAmount: initial,
        deadline: deadline || null,
      })
      toast.success('Nova meta de investimento criada! 🎯')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md rounded-3xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-extrabold">
            {isEditing ? 'Editar Meta' : 'Nova Meta de Investimento'}
          </DialogTitle>
          <DialogDescription>
            Ex: Reserva de Emergência, Carro Novo, Casa Própria. O saldo atual é derivado dos
            aportes e retiradas registrados.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-sm font-extrabold">Nome da Meta</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Reserva de Emergência (R$ 30.000)"
              className="rounded-xl font-bold"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-sm font-extrabold">Valor Alvo (R$)</Label>
              <Input
                type="number"
                inputMode="decimal"
                value={targetAmount}
                onChange={(e) => setTargetAmount(e.target.value)}
                placeholder="0,00"
                className="rounded-xl font-bold"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-extrabold">Valor Inicial (R$)</Label>
              <Input
                type="number"
                inputMode="decimal"
                value={initialAmount}
                onChange={(e) => setInitialAmount(e.target.value)}
                placeholder="0,00"
                className="rounded-xl font-bold"
              />
            </div>
          </div>
          <p className="text-[11px] text-muted-foreground font-medium -mt-2">
            💡 Você pode começar com R$ 0 e registrar aportes posteriores. O saldo atual alimenta a
            barra de progresso em tempo real.
          </p>

          <div className="space-y-1.5">
            <Label className="text-sm font-extrabold">Prazo Estimado (Opcional)</Label>
            <Input
              type="date"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              className="rounded-xl font-bold"
            />
          </div>

          <Button
            type="button"
            onClick={handleSubmit}
            className="w-full py-6 rounded-3xl bg-[#1CB0F6] hover:bg-[#1899D6] text-white font-extrabold border-b-4 border-[#1899D6] active:translate-y-1 active:border-b-0 transition-all duration-150"
          >
            {isEditing ? 'Salvar Alterações' : 'Criar Meta'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
