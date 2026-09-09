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
import { formatCurrency, addMonthsClamped } from '@/lib/finance-utils'
import { toast } from 'sonner'
import { CreditCard, Landmark } from 'lucide-react'

interface TransactionModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  transaction?: Transaction | null
}

export function TransactionModal({ open, onOpenChange, transaction }: TransactionModalProps) {
  const addTransaction = useFinanceStore((s) => s.addTransaction)
  const updateTransaction = useFinanceStore((s) => s.updateTransaction)
  const financeCategories = useFinanceStore((s) => s.financeCategories)
  const paymentMethods = useFinanceStore((s) => s.paymentMethods)
  const bankAccounts = useFinanceStore((s) => s.bankAccounts)

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

  // Modo Parcelado
  const [isInstallment, setIsInstallment] = useState(false)
  const [totalInstallments, setTotalInstallments] = useState('12')
  const [installmentCalcMode, setInstallmentCalcMode] = useState<'total' | 'per_installment'>(
    'total',
  )

  // Método de pagamento e Conta bancária
  const [paymentMethodId, setPaymentMethodId] = useState<string>('none')
  const [bankAccountId, setBankAccountId] = useState<string>('none')

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
        setIsInstallment(!!transaction.isInstallment)
        setTotalInstallments(String(transaction.totalInstallments || 12))
        setInstallmentCalcMode('total')
        setPaymentMethodId(transaction.paymentMethodId || 'none')
        setBankAccountId(transaction.bankAccountId || 'none')
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
        setIsInstallment(false)
        setTotalInstallments('12')
        setInstallmentCalcMode('total')
        setPaymentMethodId('none')
        setBankAccountId('none')
      }
    }
  }, [open, transaction, categoryOptions])

  // Cálculos automáticos do parcelamento
  const numInstallments = Math.min(Math.max(parseInt(totalInstallments) || 2, 2), 48)
  const parsedAmount = parseFloat(amount) || 0

  const { calculatedTotal, calculatedPerInstallment } = useMemo(() => {
    if (installmentCalcMode === 'total') {
      const per = parsedAmount > 0 ? parsedAmount / numInstallments : 0
      return { calculatedTotal: parsedAmount, calculatedPerInstallment: per }
    } else {
      const tot = parsedAmount > 0 ? parsedAmount * numInstallments : 0
      return { calculatedTotal: tot, calculatedPerInstallment: parsedAmount }
    }
  }, [installmentCalcMode, parsedAmount, numInstallments])

  const handleSubmit = () => {
    if (!amount || parseFloat(amount) <= 0) {
      toast.error('Digite um valor válido')
      return
    }
    onOpenChange(false)

    const cleanPaymentMethod = paymentMethodId !== 'none' ? paymentMethodId : null
    const cleanBankAccount = bankAccountId !== 'none' ? bankAccountId : null

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
        paymentMethodId: cleanPaymentMethod,
        bankAccountId: cleanBankAccount,
      })
      toast.success('Transação atualizada! 🎉')
    } else if (isInstallment) {
      addTransaction({
        type,
        amount: calculatedTotal,
        installmentAmount: calculatedPerInstallment,
        category,
        subcategory: subcategory || undefined,
        description: description.trim(),
        date, // data da primeira parcela
        status: isPaid ? 'paid' : 'pending',
        isInstallment: true,
        totalInstallments: numInstallments,
        isFixed: false,
        paymentMethodId: cleanPaymentMethod,
        bankAccountId: cleanBankAccount,
      })
      toast.success(
        `Compra parcelada em ${numInstallments}x de ${formatCurrency(calculatedPerInstallment)} criada! 🎉`,
      )
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
        paymentMethodId: cleanPaymentMethod,
        bankAccountId: cleanBankAccount,
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
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto rounded-3xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-extrabold">
            {isEditing ? 'Editar Transação' : 'Nova Transação'}
          </DialogTitle>
          <DialogDescription>
            Registre receitas, despesas normais, fixas ou parceladas
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setType('expense')}
              className={cn(
                'py-3.5 rounded-2xl font-extrabold text-sm border-b-4 transition-all duration-150 active:translate-y-1 active:border-b-0',
                type === 'expense'
                  ? 'bg-[#FF4B4B] text-white border-[#CC3B3B]'
                  : 'bg-muted text-muted-foreground border-transparent',
              )}
            >
              🔴 Despesa
            </button>
            <button
              type="button"
              onClick={() => setType('income')}
              className={cn(
                'py-3.5 rounded-2xl font-extrabold text-sm border-b-4 transition-all duration-150 active:translate-y-1 active:border-b-0',
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
              type="button"
              onClick={() => setIsFixed(true)}
              className={cn(
                'py-2.5 rounded-2xl font-extrabold text-xs border-b-4 transition-all duration-150 active:translate-y-1 active:border-b-0',
                isFixed
                  ? 'text-white border-transparent'
                  : 'bg-muted text-muted-foreground border-transparent',
              )}
              style={isFixed ? { backgroundColor: fixedColor, borderColor: fixedDarkColor } : {}}
            >
              {fixedLabel}
            </button>
            <button
              type="button"
              onClick={() => setIsFixed(false)}
              className={cn(
                'py-2.5 rounded-2xl font-extrabold text-xs border-b-4 transition-all duration-150 active:translate-y-1 active:border-b-0',
                !isFixed
                  ? 'bg-[#FF9600] text-white border-[#CC7700]'
                  : 'bg-muted text-muted-foreground border-transparent',
              )}
            >
              {variableLabel}
            </button>
          </div>

          {/* Seletor de modo do valor quando parcelado */}
          {isInstallment && !isEditing && (
            <div className="p-3 rounded-2xl bg-[#1CB0F6]/10 border border-[#1CB0F6]/30 space-y-2">
              <Label className="text-xs font-extrabold text-[#1CB0F6]">
                Forma de informar o valor:
              </Label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setInstallmentCalcMode('total')}
                  className={cn(
                    'py-2 rounded-xl text-xs font-extrabold transition-all border-b-2',
                    installmentCalcMode === 'total'
                      ? 'bg-[#1CB0F6] text-white border-[#1899D6]'
                      : 'bg-card text-muted-foreground border-border',
                  )}
                >
                  Valor Total da Compra
                </button>
                <button
                  type="button"
                  onClick={() => setInstallmentCalcMode('per_installment')}
                  className={cn(
                    'py-2 rounded-xl text-xs font-extrabold transition-all border-b-2',
                    installmentCalcMode === 'per_installment'
                      ? 'bg-[#1CB0F6] text-white border-[#1899D6]'
                      : 'bg-card text-muted-foreground border-border',
                  )}
                >
                  Valor de Cada Parcela
                </button>
              </div>
            </div>
          )}

          <div className="space-y-1">
            <Label className="text-sm font-extrabold">
              {isInstallment && !isEditing
                ? installmentCalcMode === 'total'
                  ? 'Valor Total da Compra (R$)'
                  : 'Valor da Parcela (R$)'
                : 'Valor (R$)'}
            </Label>
            <Input
              type="number"
              inputMode="decimal"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0,00"
              className="rounded-xl text-center font-extrabold text-2xl h-14 border-2 border-b-4"
            />
            {isInstallment && !isEditing && parsedAmount > 0 && (
              <p className="text-xs text-center font-bold text-muted-foreground mt-1">
                {installmentCalcMode === 'total' ? (
                  <>
                    {numInstallments}x de{' '}
                    <strong className="text-[#1CB0F6]">
                      {formatCurrency(calculatedPerInstallment)}
                    </strong>
                  </>
                ) : (
                  <>
                    Total da compra:{' '}
                    <strong className="text-[#1CB0F6]">{formatCurrency(calculatedTotal)}</strong>
                  </>
                )}
              </p>
            )}
          </div>

          <div className="space-y-1">
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

          <div className="space-y-1">
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

          <div className="space-y-1">
            <Label className="text-sm font-extrabold">Descrição</Label>
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ex: Supermercado do mês"
              className="rounded-xl"
            />
          </div>

          {/* Método de Pagamento e Conta Bancária */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs font-extrabold flex items-center gap-1">
                <CreditCard className="w-3.5 h-3.5 text-[#1CB0F6]" /> Método
              </Label>
              <Select value={paymentMethodId} onValueChange={setPaymentMethodId}>
                <SelectTrigger className="rounded-xl font-bold text-xs h-10">
                  <SelectValue placeholder="Nenhum" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Nenhum</SelectItem>
                  {paymentMethods.map((pm) => (
                    <SelectItem key={pm.id} value={pm.id}>
                      <span className="flex items-center gap-1.5">
                        <span
                          className="w-2 h-2 rounded-full inline-block"
                          style={{ backgroundColor: pm.color }}
                        />
                        {pm.name}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-extrabold flex items-center gap-1">
                <Landmark className="w-3.5 h-3.5 text-[#58CC02]" /> Conta
              </Label>
              <Select value={bankAccountId} onValueChange={setBankAccountId}>
                <SelectTrigger className="rounded-xl font-bold text-xs h-10">
                  <SelectValue placeholder="Nenhuma" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Nenhuma</SelectItem>
                  {bankAccounts.map((ba) => (
                    <SelectItem key={ba.id} value={ba.id}>
                      <span className="flex items-center gap-1.5">
                        <span
                          className="w-2 h-2 rounded-full inline-block"
                          style={{ backgroundColor: ba.color }}
                        />
                        {ba.name}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-sm font-extrabold">
                {isInstallment ? '1ª Parcela em' : 'Data'}
              </Label>
              <Input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="rounded-xl font-bold"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-sm font-extrabold">
                {isInstallment ? 'Status da 1ª' : 'Status'}
              </Label>
              <button
                type="button"
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

          {/* Opções de Parcelamento ou Recorrência (apenas criação) */}
          {!isEditing && (
            <div className="space-y-3 pt-2 border-t">
              {/* Modo Parcelado */}
              <div className="flex items-center justify-between p-3 rounded-2xl bg-[#1CB0F6]/10 border border-[#1CB0F6]/20">
                <div>
                  <Label className="text-sm font-extrabold cursor-pointer text-[#1CB0F6]">
                    💳 Compra Parcelada?
                  </Label>
                  <p className="text-[11px] text-muted-foreground font-semibold">
                    Gera N parcelas mensais encadeadas (2x a 48x)
                  </p>
                </div>
                <Switch
                  checked={isInstallment}
                  onCheckedChange={(checked) => {
                    setIsInstallment(checked)
                    if (checked) setIsRecurring(false)
                  }}
                />
              </div>

              {isInstallment && (
                <div className="p-3 rounded-2xl bg-muted/50 border space-y-2 animate-fade-in-up">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-extrabold">Número de Parcelas (2 a 48):</Label>
                    <span className="text-sm font-extrabold text-[#1CB0F6]">
                      {numInstallments}x
                    </span>
                  </div>
                  <Input
                    type="number"
                    min={2}
                    max={48}
                    value={totalInstallments}
                    onChange={(e) => {
                      const val = Math.min(Math.max(parseInt(e.target.value) || 2, 2), 48)
                      setTotalInstallments(String(val))
                    }}
                    className="rounded-xl font-bold text-center text-lg h-10"
                  />
                  <p className="text-[11px] text-muted-foreground font-bold">
                    📅 Última parcela:{' '}
                    {new Date(
                      addMonthsClamped(date, numInstallments - 1) + 'T00:00:00',
                    ).toLocaleDateString('pt-BR')}
                  </p>
                </div>
              )}

              {/* Modo Recorrente (preservado) */}
              {!isInstallment && (
                <div className="flex items-center justify-between p-3 rounded-2xl bg-muted/50">
                  <div>
                    <Label className="text-sm font-extrabold cursor-pointer">
                      🔁 Transação Recorrente?
                    </Label>
                    <p className="text-[11px] text-muted-foreground font-semibold">
                      Ex: Aluguel, assinatura mensal (até 12 meses)
                    </p>
                  </div>
                  <Switch
                    checked={isRecurring}
                    onCheckedChange={(checked) => {
                      setIsRecurring(checked)
                      if (checked) setIsInstallment(false)
                    }}
                  />
                </div>
              )}

              {!isInstallment && isRecurring && (
                <div className="space-y-1.5 p-3 rounded-2xl bg-muted/50 border animate-fade-in-up">
                  <Label className="text-xs font-extrabold">
                    Repetir por quantos meses? (Máx: 12)
                  </Label>
                  <Input
                    type="number"
                    min={1}
                    max={12}
                    value={recurrenceMonths}
                    onChange={(e) => {
                      const val = Math.min(Math.max(parseInt(e.target.value) || 1, 1), 12)
                      setRecurrenceMonths(String(val))
                    }}
                    className="rounded-xl font-bold text-center text-lg h-10"
                  />
                </div>
              )}
            </div>
          )}

          <Button
            type="button"
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
