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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useFinanceStore } from '@/stores/useFinanceStore'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

export function TransactionModal({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const addTransaction = useFinanceStore((s) => s.addTransaction)
  const financeCategories = useFinanceStore((s) => s.financeCategories)
  const [type, setType] = useState<'income' | 'expense'>('expense')
  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState('📦 Outros')
  const [subcategory, setSubcategory] = useState('')
  const [description, setDescription] = useState('')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [isPaid, setIsPaid] = useState(false)

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
    if (!open) {
      setType('expense')
      setAmount('')
      setCategory(categoryOptions[0] || '📦 Outros')
      setSubcategory('')
      setDescription('')
      setDate(new Date().toISOString().split('T')[0])
      setIsPaid(false)
    }
  }, [open, categoryOptions])

  const handleSubmit = () => {
    if (!amount || parseFloat(amount) <= 0) {
      toast.error('Digite um valor válido')
      return
    }
    onOpenChange(false)
    addTransaction({
      type,
      amount: parseFloat(amount),
      category,
      subcategory: subcategory || undefined,
      description: description.trim(),
      date,
      status: isPaid ? 'paid' : 'pending',
    })
    toast.success('Transação adicionada! 🎉')
  }

  const noSubcategories = !selectedCategoryObj || subcategoryOptions.length === 0

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md rounded-3xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-extrabold">Nova Transação</DialogTitle>
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
          <Button
            onClick={handleSubmit}
            className="w-full py-6 rounded-3xl bg-[#1CB0F6] hover:bg-[#1899D6] text-white font-extrabold border-b-4 border-[#1899D6] active:translate-y-1 active:border-b-0 transition-all duration-150"
          >
            Adicionar Transação
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
