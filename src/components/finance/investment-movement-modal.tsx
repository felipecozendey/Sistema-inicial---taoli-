import { useState, useMemo } from 'react'
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
  useFinanceStore,
  type Investment,
  type InvestmentGoal,
  type InvestmentTransaction,
  type InvestmentTransactionKind,
} from '@/stores/useFinanceStore'
import { formatCurrency } from '@/lib/finance-utils'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { toast } from 'sonner'
import {
  History,
  PlusCircle,
  MinusCircle,
  Trash2,
  Calendar,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface InvestmentMovementModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  investment?: Investment | null
  goal?: InvestmentGoal | null
  initialMode?: 'history' | 'contribution' | 'withdrawal'
}

export function InvestmentMovementModal({
  open,
  onOpenChange,
  investment,
  goal,
  initialMode = 'history',
}: InvestmentMovementModalProps) {
  const investmentTransactions = useFinanceStore((s) => s.investmentTransactions)
  const addInvestmentTransaction = useFinanceStore((s) => s.addInvestmentTransaction)
  const deleteInvestmentTransaction = useFinanceStore((s) => s.deleteInvestmentTransaction)

  const [activeTab, setActiveTab] = useState<'history' | 'movement'>('history')
  const [kind, setKind] = useState<InvestmentTransactionKind>('contribution')
  const [amount, setAmount] = useState('')
  const [date, setDate] = useState(() => {
    const now = new Date()
    return now.toISOString().slice(0, 16) // YYYY-MM-DDTHH:mm
  })
  const [notes, setNotes] = useState('')

  // Sincroniza modo inicial ao abrir
  const handleOpenChange = (nextOpen: boolean) => {
    if (nextOpen) {
      if (initialMode === 'contribution') {
        setActiveTab('movement')
        setKind('contribution')
      } else if (initialMode === 'withdrawal') {
        setActiveTab('movement')
        setKind('withdrawal')
      } else {
        setActiveTab('history')
      }
      setAmount('')
      setNotes('')
      const now = new Date()
      setDate(now.toISOString().slice(0, 16))
    }
    onOpenChange(nextOpen)
  }

  const currentAvailableBalance = investment
    ? investment.currentAmount
    : goal
      ? goal.currentAmount
      : 0
  const titleName = investment ? investment.name : goal ? goal.name : ''
  const isGoal = !!goal

  // Movimentações deste item, ordenadas das mais recentes para as mais antigas
  const filteredTxs = useMemo(() => {
    return investmentTransactions
      .filter((t) => {
        if (investment) return t.investmentId === investment.id
        if (goal) return t.goalId === goal.id
        return false
      })
      .sort((a, b) => {
        const da = new Date(a.date).getTime()
        const db = new Date(b.date).getTime()
        const validA = isNaN(da) ? 0 : da
        const validB = isNaN(db) ? 0 : db
        return validB - validA
      })
  }, [investmentTransactions, investment, goal])

  const formatMovementDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr)
      if (isNaN(d.getTime())) return 'Data não informada'
      return format(d, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })
    } catch {
      return 'Data não informada'
    }
  }

  const handleCreateMovement = async () => {
    const parsedAmount = parseFloat(amount)
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      toast.error('Informe um valor maior que zero!')
      return
    }

    // Regra Duolingo: bloquear retirada maior que saldo disponível
    if (kind === 'withdrawal' && parsedAmount > currentAvailableBalance) {
      toast.error(
        `Ops! Você só tem ${formatCurrency(
          currentAvailableBalance,
        )} disponível para retirada. Escolha um valor menor! 🦉`,
      )
      return
    }

    const targetDate = date ? new Date(date).toISOString() : new Date().toISOString()

    await addInvestmentTransaction({
      investmentId: investment ? investment.id : null,
      goalId: goal ? goal.id : null,
      kind,
      amount: parsedAmount,
      date: targetDate,
      notes: notes.trim() || undefined,
    })

    if (kind === 'contribution') {
      toast.success('Aporte registrado com sucesso! O seu saldo já aumentou! 🚀')
    } else {
      toast.success('Retirada registrada! Seu saldo foi recalculado. 💸')
    }

    setAmount('')
    setNotes('')
    setActiveTab('history')
  }

  const handleDeleteItem = (tx: InvestmentTransaction) => {
    deleteInvestmentTransaction(tx.id)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-hidden flex flex-col rounded-3xl p-0">
        {/* HEADER */}
        <div className="p-6 pb-4 border-b bg-card">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <span className="px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider bg-primary/10 text-primary">
                {isGoal ? 'Meta Financeira' : 'Investimento'}
              </span>
              <span className="text-xs font-extrabold text-muted-foreground">
                Saldo:{' '}
                <strong className="text-foreground">
                  {formatCurrency(currentAvailableBalance)}
                </strong>
              </span>
            </div>
            <DialogTitle className="text-xl font-extrabold truncate mt-1">
              {titleName || 'Movimentações'}
            </DialogTitle>
            <DialogDescription className="text-xs">
              Gerencie aportes, retiradas e consulte todo o histórico em tempo real.
            </DialogDescription>
          </DialogHeader>

          {/* Abas Duolingo 3D */}
          <div className="grid grid-cols-2 gap-2 mt-4">
            <button
              type="button"
              onClick={() => setActiveTab('history')}
              className={cn(
                'py-2 px-3 rounded-2xl font-extrabold text-xs flex items-center justify-center gap-1.5 border-b-4 transition-all duration-150',
                activeTab === 'history'
                  ? 'bg-[#1CB0F6] text-white border-[#1899D6] shadow-sm'
                  : 'bg-muted/70 text-muted-foreground border-transparent hover:bg-muted',
              )}
            >
              <History className="w-4 h-4" />
              Histórico ({filteredTxs.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('movement')}
              className={cn(
                'py-2 px-3 rounded-2xl font-extrabold text-xs flex items-center justify-center gap-1.5 border-b-4 transition-all duration-150',
                activeTab === 'movement'
                  ? 'bg-[#58CC02] text-white border-[#46A302] shadow-sm'
                  : 'bg-muted/70 text-muted-foreground border-transparent hover:bg-muted',
              )}
            >
              <PlusCircle className="w-4 h-4" />
              Novo Aporte / Retirada
            </button>
          </div>
        </div>

        {/* CORPO MODAL */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {activeTab === 'history' ? (
            <div className="space-y-3">
              {filteredTxs.length === 0 ? (
                <div className="text-center py-12 px-4 space-y-3 rounded-3xl bg-muted/20 border border-dashed">
                  <div className="w-12 h-12 mx-auto rounded-2xl bg-muted flex items-center justify-center text-2xl">
                    🌱
                  </div>
                  <div>
                    <p className="font-extrabold text-sm text-foreground">
                      Nenhum aporte ou retirada ainda
                    </p>
                    <p className="text-xs text-muted-foreground mt-1 max-w-xs mx-auto">
                      Registre sua primeira aplicação para começar a acompanhar o histórico e ver
                      seu saldo crescer!
                    </p>
                  </div>
                  <Button
                    type="button"
                    onClick={() => {
                      setActiveTab('movement')
                      setKind('contribution')
                    }}
                    className="rounded-2xl bg-[#58CC02] hover:bg-[#46A302] text-white font-extrabold text-xs border-b-4 border-[#46A302] active:translate-y-0.5 active:border-b-0"
                  >
                    <PlusCircle className="w-4 h-4 mr-1" /> Fazer Primeiro Aporte
                  </Button>
                </div>
              ) : (
                filteredTxs.map((tx) => {
                  const isContribution = tx.kind === 'contribution'
                  return (
                    <div
                      key={tx.id}
                      className="p-4 rounded-2xl bg-card border border-b-4 transition-all flex items-center justify-between gap-3"
                    >
                      <div className="flex items-start gap-3 min-w-0">
                        <div
                          className={cn(
                            'w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 text-white border-b-2',
                            isContribution
                              ? 'bg-[#58CC02] border-[#46A302]'
                              : 'bg-[#FF4B4B] border-[#CC3B3B]',
                          )}
                        >
                          {isContribution ? (
                            <ArrowUpRight className="w-5 h-5 stroke-[2.5]" />
                          ) : (
                            <ArrowDownRight className="w-5 h-5 stroke-[2.5]" />
                          )}
                        </div>

                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span
                              className={cn(
                                'px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border',
                                isContribution
                                  ? 'bg-[#58CC02]/10 text-[#46A302] border-[#58CC02]/30'
                                  : 'bg-[#FF4B4B]/10 text-[#FF4B4B] border-[#FF4B4B]/30',
                              )}
                            >
                              {isContribution ? 'Aporte' : 'Retirada'}
                            </span>
                            <span className="text-[11px] text-muted-foreground font-semibold flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {formatMovementDate(tx.date)}
                            </span>
                          </div>

                          <p
                            className={cn(
                              'text-base font-extrabold mt-1',
                              isContribution ? 'text-[#46A302]' : 'text-[#FF4B4B]',
                            )}
                          >
                            {isContribution ? '+' : '-'} {formatCurrency(tx.amount)}
                          </p>

                          {tx.notes && (
                            <p className="text-xs text-muted-foreground italic mt-0.5 truncate max-w-xs">
                              "{tx.notes}"
                            </p>
                          )}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleDeleteItem(tx)}
                        className="p-2 rounded-xl text-muted-foreground hover:text-[#FF4B4B] hover:bg-red-50 flex-shrink-0 transition-colors"
                        title="Excluir movimentação"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )
                })
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {/* Seletor Aporte vs Retirada */}
              <div className="space-y-1.5">
                <Label className="text-xs font-extrabold uppercase tracking-wider text-muted-foreground">
                  Tipo de Movimentação
                </Label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setKind('contribution')}
                    className={cn(
                      'py-3 px-4 rounded-2xl font-extrabold text-sm flex items-center justify-center gap-2 border-b-4 transition-all',
                      kind === 'contribution'
                        ? 'bg-[#58CC02] text-white border-[#46A302]'
                        : 'bg-muted/60 text-muted-foreground border-transparent hover:bg-muted',
                    )}
                  >
                    <PlusCircle className="w-4 h-4" /> Aporte (Entrada)
                  </button>

                  <button
                    type="button"
                    onClick={() => setKind('withdrawal')}
                    className={cn(
                      'py-3 px-4 rounded-2xl font-extrabold text-sm flex items-center justify-center gap-2 border-b-4 transition-all',
                      kind === 'withdrawal'
                        ? 'bg-[#FF4B4B] text-white border-[#CC3B3B]'
                        : 'bg-muted/60 text-muted-foreground border-transparent hover:bg-muted',
                    )}
                  >
                    <MinusCircle className="w-4 h-4" /> Retirada (Saída)
                  </button>
                </div>
              </div>

              {/* Aviso amigável de saldo na retirada */}
              {kind === 'withdrawal' && (
                <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-400 text-xs font-semibold flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                  <span>
                    Saldo disponível para resgate:{' '}
                    <strong>{formatCurrency(currentAvailableBalance)}</strong>. Não é permitido
                    sacar mais que esse valor.
                  </span>
                </div>
              )}

              {/* Valor */}
              <div className="space-y-1">
                <Label className="text-xs font-extrabold">Valor da Movimentação (R$)</Label>
                <Input
                  type="number"
                  inputMode="decimal"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0,00"
                  className="rounded-2xl font-extrabold text-lg h-12"
                  autoFocus
                />
              </div>

              {/* Data e Hora */}
              <div className="space-y-1">
                <Label className="text-xs font-extrabold">Data e Hora</Label>
                <Input
                  type="datetime-local"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="rounded-xl font-bold"
                />
              </div>

              {/* Observação */}
              <div className="space-y-1">
                <Label className="text-xs font-extrabold">Observação (Opcional)</Label>
                <Input
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Ex: Aporte mensal de salário / Resgate de emergência"
                  className="rounded-xl"
                />
              </div>

              <Button
                type="button"
                onClick={handleCreateMovement}
                className={cn(
                  'w-full py-6 rounded-3xl text-white font-extrabold border-b-4 active:translate-y-1 active:border-b-0 transition-all duration-150',
                  kind === 'contribution'
                    ? 'bg-[#58CC02] hover:bg-[#46A302] border-[#46A302]'
                    : 'bg-[#FF4B4B] hover:bg-[#CC3B3B] border-[#CC3B3B]',
                )}
              >
                {kind === 'contribution' ? (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" /> Confirmar Aporte
                  </>
                ) : (
                  <>
                    <MinusCircle className="w-4 h-4 mr-2" /> Confirmar Retirada
                  </>
                )}
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
