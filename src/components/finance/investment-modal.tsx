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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useFinanceStore, type Investment, type InvestmentGoal } from '@/stores/useFinanceStore'
import { toast } from 'sonner'

export const INVESTMENT_TYPES = [
  'Ações',
  'Fundos Imobiliários (FIIs)',
  'CDB / Renda Fixa',
  'Tesouro Direto',
  'Criptoativos',
  'Imóveis',
  'Previdência Privada',
  'Outros',
]

interface InvestmentModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  editingInvestment?: Investment | null
}

export function InvestmentModal({ open, onOpenChange, editingInvestment }: InvestmentModalProps) {
  const addInvestment = useFinanceStore((s) => s.addInvestment)
  const updateInvestment = useFinanceStore((s) => s.updateInvestment)
  const bankAccounts = useFinanceStore((s) => s.bankAccounts)
  const investmentGoals = useFinanceStore((s) => s.investmentGoals)

  const [name, setName] = useState('')
  const [type, setType] = useState('CDB / Renda Fixa')
  const [investedAmount, setInvestedAmount] = useState('')
  const [currentAmount, setCurrentAmount] = useState('')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [bankAccountId, setBankAccountId] = useState('none')
  const [goalId, setGoalId] = useState('none')
  const [notes, setNotes] = useState('')

  const isEditing = !!editingInvestment

  useEffect(() => {
    if (open) {
      if (editingInvestment) {
        setName(editingInvestment.name)
        setType(editingInvestment.type)
        setInvestedAmount(String(editingInvestment.investedAmount))
        setCurrentAmount(String(editingInvestment.currentAmount))
        setDate(editingInvestment.date)
        setBankAccountId(editingInvestment.bankAccountId || 'none')
        setGoalId(editingInvestment.goalId || 'none')
        setNotes(editingInvestment.notes || '')
      } else {
        setName('')
        setType('CDB / Renda Fixa')
        setInvestedAmount('')
        setCurrentAmount('')
        setDate(new Date().toISOString().split('T')[0])
        setBankAccountId('none')
        setGoalId('none')
        setNotes('')
      }
    }
  }, [open, editingInvestment])

  const handleSubmit = () => {
    if (!name.trim()) {
      toast.error('Informe o nome do investimento')
      return
    }
    const invested = parseFloat(investedAmount)
    const current = parseFloat(currentAmount)

    if (isNaN(invested) || invested < 0) {
      toast.error('Informe um valor investido válido')
      return
    }

    const curFinal = !isNaN(current) && current >= 0 ? current : invested

    onOpenChange(false)

    if (isEditing && editingInvestment) {
      updateInvestment(editingInvestment.id, {
        name: name.trim(),
        type,
        investedAmount: invested,
        currentAmount: curFinal,
        date,
        bankAccountId: bankAccountId !== 'none' ? bankAccountId : null,
        goalId: goalId !== 'none' ? goalId : null,
        notes: notes.trim() || null,
      })
      toast.success('Investimento atualizado! 🎉')
    } else {
      addInvestment({
        name: name.trim(),
        type,
        investedAmount: invested,
        currentAmount: curFinal,
        date,
        bankAccountId: bankAccountId !== 'none' ? bankAccountId : null,
        goalId: goalId !== 'none' ? goalId : null,
        notes: notes.trim() || undefined,
      })
      toast.success('Investimento adicionado ao seu portfólio! 🎉')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto rounded-3xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-extrabold">
            {isEditing ? 'Editar Investimento' : 'Novo Investimento'}
          </DialogTitle>
          <DialogDescription>
            Registre aportes em ações, fundos, tesouro, renda fixa ou cripto
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1">
            <Label className="text-sm font-extrabold">Nome do Ativo</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Tesouro Selic 2029 / Nubank CDB 110%"
              className="rounded-xl font-bold"
            />
          </div>

          <div className="space-y-1">
            <Label className="text-sm font-extrabold">Tipo de Investimento</Label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger className="rounded-xl font-bold">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {INVESTMENT_TYPES.map((t) => (
                  <SelectItem key={t} value={t}>
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-sm font-extrabold">Valor Aportado (R$)</Label>
              <Input
                type="number"
                inputMode="decimal"
                value={investedAmount}
                onChange={(e) => {
                  setInvestedAmount(e.target.value)
                  if (!currentAmount) setCurrentAmount(e.target.value)
                }}
                placeholder="0,00"
                className="rounded-xl font-bold text-base"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-sm font-extrabold">Valor Atual (R$)</Label>
              <Input
                type="number"
                inputMode="decimal"
                value={currentAmount}
                onChange={(e) => setCurrentAmount(e.target.value)}
                placeholder="0,00"
                className="rounded-xl font-bold text-base"
              />
            </div>
          </div>

          <div className="space-y-1">
            <Label className="text-sm font-extrabold">Data da Aplicação</Label>
            <Input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="rounded-xl font-bold"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs font-extrabold">Conta / Corretora</Label>
              <Select value={bankAccountId} onValueChange={setBankAccountId}>
                <SelectTrigger className="rounded-xl font-bold text-xs h-10">
                  <SelectValue placeholder="Nenhuma" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Nenhuma</SelectItem>
                  {bankAccounts.map((b) => (
                    <SelectItem key={b.id} value={b.id}>
                      {b.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-extrabold">Vincular a Meta</Label>
              <Select value={goalId} onValueChange={setGoalId}>
                <SelectTrigger className="rounded-xl font-bold text-xs h-10">
                  <SelectValue placeholder="Nenhuma" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Nenhuma</SelectItem>
                  {investmentGoals.map((g) => (
                    <SelectItem key={g.id} value={g.id}>
                      {g.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1">
            <Label className="text-sm font-extrabold">Notas / Observações</Label>
            <Input
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ex: Liquidez diária, vencimento em 2029"
              className="rounded-xl"
            />
          </div>

          <Button
            type="button"
            onClick={handleSubmit}
            className="w-full py-6 rounded-3xl bg-[#58CC02] hover:bg-[#46B302] text-white font-extrabold border-b-4 border-[#46A302] active:translate-y-1 active:border-b-0 transition-all duration-150"
          >
            {isEditing ? 'Salvar Alterações' : 'Salvar Investimento'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
