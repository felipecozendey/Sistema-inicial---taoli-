import { useState, useEffect, useMemo } from 'react'
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
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useFinanceStore, type Transaction } from '@/stores/useFinanceStore'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

interface TransactionModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  transaction?: Transaction | null
}

export function TransactionModal({ open, onOpenChange, transaction }: TransactionModalProps) {
  const addTransaction = useFinanceStore((s) => s.addTransaction)
  const updateTransaction = useFinanceStore((s) => s.updateTransaction)
  const financeCategories = useFinanceStore((s) => s.financeCategories)
  const [type, setType] = useState<'income' | 'expense'>('expense')
  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState('📦 Outros')
  const [subcategory, setSubcategory] = useState('')
  const [description, setDescription] = useState('')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [isPaid, setIsPaid] = useState(false)
  const [isRecurring, setIsRecurring] = useState(false)
  const [recurrenceMonths, setRecurrenceMonths] = useState('1')
  const [isFixed, setIsFixed] = useState(false)

  const isEditing = !!transaction

  const categoryOptions = useMemo(
    () => financeCategories.filter((c) => !c.parentId).map((c) => `${c.icon} ${c.name}`),
    [financeCategories],
  )

  const selectedCategoryObj = useMemo(
    () => financeCategories.find((c) => `${c.icon} ${c.name}` === category),
    [financeCategories, category],
  )

  const subcategoryOptions = useMemo(() => {
    if (!selectedCategoryObj) return []
    return financeCategories
      .filter((c) => c.parentId === selectedCategoryObj.id)
      .map((c) => `${c.icon} ${c.name}`)
  }, [financeCategories, selectedCategoryObj])

  useEffect(() => {
    if (open) {
      if (transaction) {
        setType(transaction.type as 'income' | 'expense')
        setAmount(String(transaction.amount))
        setCategory(transaction.category)
        setSubcategory(transaction.subcategory || '')
        setDescription(transaction.description || '')
        setDate(transaction.date)
        setIsPaid(transaction.status === 'paid')
        setIsRecurring(transaction.isRecurring)
        setRecurrenceMonths('1')
        setIsFixed(transaction.isFixed)
      } else {
        setType('expense')
        setAmount('')
        setCategory(categoryOptions[0] || '📦 Outros')
        setSubcategory('')
        setDescription('')
        setDate(new Date().toISOString().split('T')[0])
        setIsPaid(false)
        setIsRecurring(false)
        setRecurrenceMonths('1')
        setIsFixed(false)
      }
    }
  }, [open, transaction, categoryOptions])

  const handleSubmit = () => {
    if (!amount || parseFloat(amount) <= 0) {
      toast.error('Digite um valor válido')
      return
    }
    onOpenChange(false)

    if (isEditing && transaction) {
      updateTransaction(transaction.id, {
        type,
        amount: parseFloat(amount),
        category,
        subcategory: subcategory || null,
        description: description.trim(),
        date,
        status: isPaid ? 'paid' : 'pending',
        isRecurring,
        isFixed,
      })
      toast.success('Transação atualizada! 🎉')
    } else {
      addTransaction({
        type,
        amount: parseFloat(amount),
        category,
        subcategory: subcategory || undefined,
        description: description.trim(),
        date,
        status: isPaid ? 'paid' : 'pending',
        isRecurring,
        recurrencePeriod: isRecurring ? 'monthly' : undefined,
        recurrenceMonths: isRecurring ? Math.min(parseInt(recurrenceMonths) || 1, 12) : undefined,
        isFixed,
      })
      toast.success(
        isRecurring
          ? `${Math.min(parseInt(recurrenceMonths) || 1, 12)} transações criadas! 🎉`
          : 'Transação adicionada! 🎉',
      )
    }
  }

  const noSubcategories = !selectedCategoryObj || subcategoryOptions.length === 0

  const fixedLabel = type === 'expense' ? '🔴 Despesa Fixa' : '🟢 Receita Fixa'
  const variableLabel = type === 'expense' ? '🔴 Despesa Variável' : '🟢 Receita Variável'
  const fixedColor = type === 'expense' ? '#FF4B4B' : '#58CC02'
  const fixedDarkColor = type === 'expense' ? '#CC3B3B' : '#46A302'

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md rounded-3xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-extrabold">
            {isEditing ? 'Editar Transação' : 'Nova Transação'}
          </DialogTitle>
          <DialogDescription>Registre uma receita ou despesa</DialogDescription>
        </DialogHeader>
        <div className="space-y-5">
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setType('expense')}
              className={cn(
                'py-4 rounded-2xl font-extrabold text-sm border-b-4 transition-all duration-150 active:translate-y-1 active:border-b-0',
                type === 'expense'
                  ? 'bg-[#FF4B4B] text-white border-[#CC3B3B]'
                  : 'bg-muted text-muted-foreground border-transparent',
              )}
            >
              🔴 Despesa
            </button>
            <button
              onClick={() => setType('income')}
              className={cn(
                'py-4 rounded-2xl font-extrabold text-sm border-b-4 transition-all duration-150 active:translate-y-1 active:border-b-0',
                type === 'income'
                  ? 'bg-[#58CC02] text-white border-[#46A302]'
                  : 'bg-muted text-muted-foreground border-transparent',
              )}
            >
              🟢 Receita
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setIsFixed(true)}
              className={cn(
                'py-3 rounded-2xl font-extrabold text-xs border-b-4 transition-all duration-150 active:translate-y-1 active:border-b-0',
                isFixed
                  ? 'text-white border-transparent'
                  : 'bg-muted text-muted-foreground border-transparent',
              )}
              style={isFixed ? { backgroundColor: fixedColor, borderColor: fixedDarkColor } : {}}
            >
              {fixedLabel}
            </button>
            <button
              onClick={() => setIsFixed(false)}
              className={cn(
                'py-3 rounded-2xl font-extrabold text-xs border-b-4 transition-all duration-150 active:translate-y-1 active:border-b-0',
                !isFixed
                  ? 'bg-[#FF9600] text-white border-[#CC7700]'
                  : 'bg-muted text-muted-foreground border-transparent',
              )}
            >
              {variableLabel}
            </button>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-extrabold">Valor (R$)</Label>
            <Input
              type="number"
              inputMode="decimal"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0,00"
              className="rounded-xl text-center font-extrabold text-2xl h-16 border-2 border-b-4"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-extrabold">Categoria</Label>
            <Select
              value={category}
              onValueChange={(v) => {
                setCategory(v)
                setSubcategory('')
              }}
            >
              <SelectTrigger className="rounded-xl font-bold">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {categoryOptions.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-extrabold">Subcategoria</Label>
            <Select value={subcategory} onValueChange={setSubcategory} disabled={noSubcategories}>
              <SelectTrigger className="rounded-xl font-bold">
                <SelectValue
                  placeholder={
                    noSubcategories ? 'Sem subcategorias disponíveis' : 'Selecione uma subcategoria'
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {subcategoryOptions.map((sub) => (
                  <SelectItem key={sub} value={sub}>
                    {sub}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-extrabold">Descrição</Label>
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ex: Supermercado do mês"
              className="rounded-xl"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label className="text-sm font-extrabold">Data</Label>
              <Input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="rounded-xl font-bold"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-extrabold">Status</Label>
              <button
                onClick={() => setIsPaid(!isPaid)}
                className={cn(
                  'w-full h-10 rounded-xl font-extrabold text-sm border-2 border-b-4 transition-all duration-150 active:translate-y-1 active:border-b-2',
                  isPaid
                    ? 'bg-[#58CC02]/10 border-[#58CC02] text-[#58CC02]'
                    : 'bg-muted border-muted-foreground/30 text-muted-foreground',
                )}
              >
                {isPaid ? '✅ Pago' : '⏳ Pendente'}
              </button>
            </div>
          </div>
          {!isEditing && (
            <div className="flex items-center justify-between p-4 rounded-2xl bg-muted/50">
              <Label className="text-sm font-extrabold cursor-pointer">
                🔁 Transação Recorrente?
              </Label>
              <Switch checked={isRecurring} onCheckedChange={setIsRecurring} />
            </div>
          )}
          {!isEditing && isRecurring && (
            <div className="space-y-2 animate-fade-in-up">
              <Label className="text-sm font-extrabold">Repetir por quantos meses? (Máx: 12)</Label>
              <Input
                type="number"
                min={1}
                max={12}
                value={recurrenceMonths}
                onChange={(e) => {
                  const val = Math.min(Math.max(parseInt(e.target.value) || 1, 1), 12)
                  setRecurrenceMonths(String(val))
                }}
                className="rounded-xl font-bold text-center text-lg"
              />
            </div>
          )}
          <Button
            onClick={handleSubmit}
            className="w-full py-6 rounded-3xl bg-[#1CB0F6] hover:bg-[#1899D6] text-white font-extrabold border-b-4 border-[#1899D6] active:translate-y-1 active:border-b-0 transition-all duration-150"
          >
            {isEditing ? 'Salvar Alterações' : 'Adicionar Transação'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
