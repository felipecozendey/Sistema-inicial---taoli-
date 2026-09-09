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
import { useFinanceStore, type Investment, type YieldFrequency } from '@/stores/useFinanceStore'
import { toast } from 'sonner'
import { TrendingUp, Percent } from 'lucide-react'

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
  const [initialAmount, setInitialAmount] = useState('0')
  const [yieldRate, setYieldRate] = useState('')
  const [yieldFrequency, setYieldFrequency] = useState<YieldFrequency>('monthly')
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
        setInitialAmount(String(editingInvestment.initialAmount ?? 0))
        setYieldRate(editingInvestment.yieldRate != null ? String(editingInvestment.yieldRate) : '')
        setYieldFrequency(editingInvestment.yieldFrequency || 'monthly')
        setDate(editingInvestment.date)
        setBankAccountId(editingInvestment.bankAccountId || 'none')
        setGoalId(editingInvestment.goalId || 'none')
        setNotes(editingInvestment.notes || '')
      } else {
        setName('')
        setType('CDB / Renda Fixa')
        setInitialAmount('0')
        setYieldRate('')
        setYieldFrequency('monthly')
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
    const initial = parseFloat(initialAmount)

    if (isNaN(initial) || initial < 0) {
      toast.error('Informe um valor inicial válido (pode ser R$ 0)')
      return
    }

    const rateParsed = yieldRate.trim() ? parseFloat(yieldRate) : null
    if (rateParsed !== null && (isNaN(rateParsed) || rateParsed < 0)) {
      toast.error('Informe uma taxa de rendimento válida')
      return
    }

    onOpenChange(false)

    if (isEditing && editingInvestment) {
      updateInvestment(editingInvestment.id, {
        name: name.trim(),
        type,
        initialAmount: initial,
        yieldRate: rateParsed,
        yieldFrequency: rateParsed !== null ? yieldFrequency : null,
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
        initialAmount: initial,
        yieldRate: rateParsed,
        yieldFrequency: rateParsed !== null ? yieldFrequency : null,
        date,
        bankAccountId: bankAccountId !== 'none' ? bankAccountId : null,
        goalId: goalId !== 'none' ? goalId : null,
        notes: notes.trim() || undefined,
      })
      toast.success('Investimento cadastrado com sucesso! 🎉')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto rounded-3xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-extrabold flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-[#58CC02]" />
            {isEditing ? 'Editar Investimento' : 'Novo Investimento'}
          </DialogTitle>
          <DialogDescription>
            Defina o ativo, taxa de rendimento e valor inicial. O saldo atual é calculado
            automaticamente com base nos aportes e retiradas.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1">
            <Label className="text-sm font-extrabold">Nome do Ativo</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: CDB 100% / Tesouro Selic 2029 / FII MXRF11"
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

          {/* Valor Inicial (pode ser 0) */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-extrabold">Valor Inicial (R$)</Label>
              <span className="text-[11px] font-bold text-muted-foreground">
                Pode começar com R$ 0
              </span>
            </div>
            <Input
              type="number"
              inputMode="decimal"
              value={initialAmount}
              onChange={(e) => setInitialAmount(e.target.value)}
              placeholder="0,00"
              className="rounded-xl font-bold text-base"
            />
            {isEditing && (
              <p className="text-[11px] text-muted-foreground font-medium">
                💡 O valor atual é derivado da soma dos seus aportes e retiradas.
              </p>
            )}
          </div>

          {/* Taxa de Rendimento e Frequência */}
          <div className="p-3.5 rounded-2xl bg-muted/40 border space-y-3">
            <div className="flex items-center gap-2 text-xs font-extrabold text-[#58CC02]">
              <Percent className="w-4 h-4" />
              <span>Configuração de Rendimento Previsto</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-extrabold">Taxa de Rendimento (%)</Label>
                <Input
                  type="number"
                  inputMode="decimal"
                  step="0.01"
                  value={yieldRate}
                  onChange={(e) => setYieldRate(e.target.value)}
                  placeholder="Ex: 10 para 10%"
                  className="rounded-xl font-bold h-10"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-extrabold">Frequência</Label>
                <Select
                  value={yieldFrequency}
                  onValueChange={(val: YieldFrequency) => setYieldFrequency(val)}
                >
                  <SelectTrigger className="rounded-xl font-bold text-xs h-10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="monthly">Mensal</SelectItem>
                    <SelectItem value="weekly">Semanal</SelectItem>
                    <SelectItem value="daily">Diária</SelectItem>
                  </SelectContent>
                </Select>
              </div>
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
