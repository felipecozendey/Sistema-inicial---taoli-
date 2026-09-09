import { useState, useMemo } from 'react'
import { useFinanceStore, type Investment, type InvestmentGoal } from '@/stores/useFinanceStore'
import { InvestmentModal } from '@/components/finance/investment-modal'
import { InvestmentGoalModal } from '@/components/finance/investment-goal-modal'
import { InvestmentMovementModal } from '@/components/finance/investment-movement-modal'
import { formatCurrency, formatSafeDateBR } from '@/lib/finance-utils'
import { toast } from 'sonner'
import {
  Plus,
  Pencil,
  Trash2,
  TrendingUp,
  Target,
  PiggyBank,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  Sparkles,
  History,
  Minus,
  Percent,
} from 'lucide-react'
import { cn } from '@/lib/utils'

export function InvestmentsTab() {
  const investments = useFinanceStore((s) => s.investments)
  const deleteInvestment = useFinanceStore((s) => s.deleteInvestment)
  const investmentGoals = useFinanceStore((s) => s.investmentGoals)
  const deleteInvestmentGoal = useFinanceStore((s) => s.deleteInvestmentGoal)
  const bankAccounts = useFinanceStore((s) => s.bankAccounts)

  // Modais de Criação/Edição
  const [invModalOpen, setInvModalOpen] = useState(false)
  const [editingInv, setEditingInv] = useState<Investment | null>(null)

  const [goalModalOpen, setGoalModalOpen] = useState(false)
  const [editingGoal, setEditingGoal] = useState<InvestmentGoal | null>(null)

  // Modal de Histórico e Aporte/Retirada
  const [movementModalOpen, setMovementModalOpen] = useState(false)
  const [movementTargetInv, setMovementTargetInv] = useState<Investment | null>(null)
  const [movementTargetGoal, setMovementTargetGoal] = useState<InvestmentGoal | null>(null)
  const [movementInitialMode, setMovementInitialMode] = useState<
    'history' | 'contribution' | 'withdrawal'
  >('history')

  // Resumo de investimentos em tempo real via useMemo
  const summary = useMemo(() => {
    let totalInvested = 0
    let totalCurrent = 0

    investments.forEach((inv) => {
      totalInvested += inv.investedAmount
      totalCurrent += inv.currentAmount
    })

    const netProfit = totalCurrent - totalInvested
    const profitPct = totalInvested > 0 ? (netProfit / totalInvested) * 100 : 0

    return {
      totalInvested,
      totalCurrent,
      netProfit,
      profitPct,
    }
  }, [investments])

  // Metas com projeção calculada em tempo real via useMemo
  const goalsWithCalculations = useMemo(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    return investmentGoals.map((goal) => {
      // Se houver investimentos vinculados a esta meta, somar o patrimônio atual deles ao acumulado
      const linkedAmount = investments
        .filter((inv) => inv.goalId === goal.id)
        .reduce((sum, inv) => sum + inv.currentAmount, 0)

      const accumulated = Math.max(goal.currentAmount, linkedAmount)
      const remaining = Math.max(goal.targetAmount - accumulated, 0)
      const progressPct =
        goal.targetAmount > 0 ? Math.min((accumulated / goal.targetAmount) * 100, 100) : 0

      // Projeção mensal se houver deadline
      let monthsRemaining = 0
      let requiredPerMonth = 0

      if (goal.deadline) {
        const d = new Date(goal.deadline + 'T00:00:00')
        if (!isNaN(d.getTime())) {
          const diffTime = d.getTime() - today.getTime()
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
          monthsRemaining = Math.max(Math.ceil(diffDays / 30), 1)
          if (remaining > 0 && diffDays > 0) {
            requiredPerMonth = remaining / monthsRemaining
          }
        }
      }

      return {
        ...goal,
        accumulated,
        remaining,
        progressPct,
        monthsRemaining,
        requiredPerMonth,
      }
    })
  }, [investmentGoals, investments])

  const handleDeleteInv = (id: string) => {
    deleteInvestment(id)
    toast.success('Investimento removido do portfólio! 🗑️')
  }

  const handleDeleteGoal = (id: string) => {
    deleteInvestmentGoal(id)
    toast.success('Meta de investimento removida! 🗑️')
  }

  // Helpers para abrir modal de movimentação
  const openInvHistory = (inv: Investment) => {
    setMovementTargetInv(inv)
    setMovementTargetGoal(null)
    setMovementInitialMode('history')
    setMovementModalOpen(true)
  }

  const openInvContribution = (inv: Investment) => {
    setMovementTargetInv(inv)
    setMovementTargetGoal(null)
    setMovementInitialMode('contribution')
    setMovementModalOpen(true)
  }

  const openInvWithdrawal = (inv: Investment) => {
    setMovementTargetInv(inv)
    setMovementTargetGoal(null)
    setMovementInitialMode('withdrawal')
    setMovementModalOpen(true)
  }

  const openGoalHistory = (goal: InvestmentGoal) => {
    setMovementTargetGoal(goal)
    setMovementTargetInv(null)
    setMovementInitialMode('history')
    setMovementModalOpen(true)
  }

  const openGoalContribution = (goal: InvestmentGoal) => {
    setMovementTargetGoal(goal)
    setMovementTargetInv(null)
    setMovementInitialMode('contribution')
    setMovementModalOpen(true)
  }

  const openGoalWithdrawal = (goal: InvestmentGoal) => {
    setMovementTargetGoal(goal)
    setMovementTargetInv(null)
    setMovementInitialMode('withdrawal')
    setMovementModalOpen(true)
  }

  const fmt = formatCurrency

  return (
    <div className="space-y-8 pb-24">
      {/* HEADER DE PATRIMÔNIO CONSOLIDADO */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-3xl p-5 bg-[#58CC02] text-white border-b-4 border-[#46A302]">
          <div className="flex items-center gap-2 mb-1">
            <PiggyBank className="w-5 h-5" />
            <span className="font-bold text-xs uppercase tracking-wider opacity-90">
              Total Investido (Aportes)
            </span>
          </div>
          <p className="text-2xl font-extrabold">{fmt(summary.totalInvested)}</p>
        </div>

        <div className="rounded-3xl p-5 bg-[#1CB0F6] text-white border-b-4 border-[#1899D6]">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="w-5 h-5" />
            <span className="font-bold text-xs uppercase tracking-wider opacity-90">
              Patrimônio Atual
            </span>
          </div>
          <p className="text-2xl font-extrabold">{fmt(summary.totalCurrent)}</p>
        </div>

        <div
          className={cn(
            'rounded-3xl p-5 text-white border-b-4',
            summary.netProfit >= 0
              ? 'bg-[#82D936] border-[#65B726]'
              : 'bg-[#FF4B4B] border-[#CC3B3B]',
          )}
        >
          <div className="flex items-center gap-2 mb-1">
            {summary.netProfit >= 0 ? (
              <ArrowUpRight className="w-5 h-5" />
            ) : (
              <ArrowDownRight className="w-5 h-5" />
            )}
            <span className="font-bold text-xs uppercase tracking-wider opacity-90">
              Lucro / Prejuízo Total
            </span>
          </div>
          <p className="text-2xl font-extrabold flex items-center gap-2">
            <span>{fmt(summary.netProfit)}</span>
            <span className="text-xs bg-black/20 px-2 py-0.5 rounded-full font-bold">
              {summary.profitPct >= 0 ? '+' : ''}
              {summary.profitPct.toFixed(2)}%
            </span>
          </p>
        </div>
      </div>

      {/* BLOCO 1: MEUS INVESTIMENTOS */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-extrabold text-xl flex items-center gap-2">
              <TrendingUp className="w-6 h-6 text-[#1CB0F6]" /> Meus Investimentos
            </h3>
            <p className="text-xs text-muted-foreground font-semibold">
              Portfólio com cálculo automático de rendimento e rentabilidade em tempo real.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setEditingInv(null)
              setInvModalOpen(true)
            }}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-[#58CC02] hover:bg-[#46B302] text-white font-extrabold text-sm border-b-4 border-[#46A302] active:translate-y-1 active:border-b-0 transition-all duration-150"
          >
            <Plus className="w-4 h-4" strokeWidth={3} />
            Novo Investimento
          </button>
        </div>

        {investments.length === 0 ? (
          <div className="rounded-3xl p-10 bg-card border text-center space-y-3">
            <div className="w-14 h-14 mx-auto rounded-3xl bg-[#1CB0F6]/10 flex items-center justify-center text-3xl">
              📈
            </div>
            <p className="font-extrabold text-base">Nenhum investimento registrado ainda</p>
            <p className="text-muted-foreground font-semibold text-xs max-w-sm mx-auto">
              Adicione suas ações, fundos imobiliários, renda fixa ou cripto para acompanhar o
              crescimento do seu patrimônio!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {investments.map((inv) => {
              const diff = inv.currentAmount - inv.investedAmount
              const pct = inv.investedAmount > 0 ? (diff / inv.investedAmount) * 100 : 0
              const isProfit = diff >= 0
              const linkedAccount = bankAccounts.find((b) => b.id === inv.bankAccountId)
              const linkedGoal = investmentGoals.find((g) => g.id === inv.goalId)

              // Rendimento do período corrente calculado via useMemo
              const periodYieldAmount =
                inv.yieldRate != null && inv.yieldRate > 0
                  ? (inv.currentAmount * inv.yieldRate) / 100
                  : 0
              const projectedEndPeriod = inv.currentAmount + periodYieldAmount

              // Projeção de multiplicação compacta (6 e 12 períodos a juros compostos)
              const rateDecimal = (inv.yieldRate || 0) / 100
              const projected6 =
                rateDecimal > 0
                  ? inv.currentAmount * Math.pow(1 + rateDecimal, 6)
                  : inv.currentAmount
              const projected12 =
                rateDecimal > 0
                  ? inv.currentAmount * Math.pow(1 + rateDecimal, 12)
                  : inv.currentAmount

              const freqLabel =
                inv.yieldFrequency === 'daily'
                  ? 'diário'
                  : inv.yieldFrequency === 'weekly'
                    ? 'semanal'
                    : 'mensal'

              const periodLabel =
                inv.yieldFrequency === 'daily'
                  ? 'dias'
                  : inv.yieldFrequency === 'weekly'
                    ? 'sem.'
                    : 'meses'

              return (
                <div
                  key={inv.id}
                  className="rounded-3xl p-5 bg-card border border-b-4 space-y-4 transition-all hover:border-[#1CB0F6]/50 shadow-sm"
                >
                  {/* Cabeçalho do Card */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-[#1CB0F6]/10 text-[#1CB0F6]">
                          {inv.type}
                        </span>
                        {inv.yieldRate != null && inv.yieldRate > 0 && (
                          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-[#58CC02]/15 text-[#46A302] border border-[#58CC02]/30 flex items-center gap-1">
                            <Percent className="w-3 h-3" />
                            {inv.yieldRate}% {freqLabel}
                          </span>
                        )}
                        {linkedAccount && (
                          <span
                            className="px-2 py-0.5 rounded-full text-[10px] font-extrabold border"
                            style={{ borderColor: linkedAccount.color, color: linkedAccount.color }}
                          >
                            🏦 {linkedAccount.name}
                          </span>
                        )}
                      </div>
                      <h4 className="font-extrabold text-base truncate mt-1.5">{inv.name}</h4>
                      <p className="text-xs text-muted-foreground font-semibold flex items-center gap-1 mt-0.5">
                        <Calendar className="w-3 h-3" /> Início: {formatSafeDateBR(inv.date)}
                      </p>
                    </div>

                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingInv(inv)
                          setInvModalOpen(true)
                        }}
                        className="p-1.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                        title="Editar ativo"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteInv(inv.id)}
                        className="p-1.5 rounded-xl text-muted-foreground hover:text-[#FF4B4B] hover:bg-red-50 transition-colors"
                        title="Excluir"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Valores: Saldo Atual (derivado) & Aportado */}
                  <div className="grid grid-cols-2 gap-2 pt-1 border-t">
                    <div className="p-3 rounded-2xl bg-[#1CB0F6]/10 border border-[#1CB0F6]/20">
                      <p className="text-[11px] text-[#1CB0F6] font-bold">Saldo Atual</p>
                      <p className="font-extrabold text-lg text-[#1CB0F6]">
                        {fmt(inv.currentAmount)}
                      </p>
                    </div>
                    <div className="p-3 rounded-2xl bg-muted/40">
                      <p className="text-[11px] text-muted-foreground font-bold">
                        Total Aportado Líquido
                      </p>
                      <p className="font-extrabold text-base">{fmt(inv.investedAmount)}</p>
                    </div>
                  </div>

                  {/* BLOCO DE RENDIMENTO DO PERÍODO EM DESTAQUE (ITEM 1) */}
                  {inv.yieldRate != null && inv.yieldRate > 0 && (
                    <div className="p-3.5 rounded-2xl bg-[#58CC02]/10 border border-[#58CC02]/30 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-extrabold text-[#46A302] flex items-center gap-1">
                          <Sparkles className="w-3.5 h-3.5" /> Rendimento {freqLabel}:
                        </span>
                        <strong className="text-[#46A302] text-sm font-extrabold">
                          {fmt(periodYieldAmount)}
                        </strong>
                      </div>
                      <div className="text-[11px] text-muted-foreground font-semibold flex items-center justify-between border-t border-[#58CC02]/20 pt-1.5">
                        <span>Se mantido até o fim do período:</span>
                        <span className="font-extrabold text-foreground">
                          {fmt(projectedEndPeriod)}
                        </span>
                      </div>

                      {/* Projeção de multiplicação compacta (6 e 12 períodos) */}
                      <div className="pt-2 border-t border-[#58CC02]/20">
                        <p className="text-[10px] uppercase tracking-wider font-extrabold text-muted-foreground mb-1.5">
                          Projeção composta (estimativa):
                        </p>
                        <div className="grid grid-cols-2 gap-2 text-center">
                          <div className="p-2 rounded-xl bg-white dark:bg-black/20 border border-[#58CC02]/20">
                            <span className="text-[10px] font-bold text-muted-foreground block">
                              Em 6 {periodLabel}
                            </span>
                            <span className="text-xs font-extrabold text-[#46A302]">
                              {fmt(projected6)}
                            </span>
                          </div>
                          <div className="p-2 rounded-xl bg-white dark:bg-black/20 border border-[#58CC02]/20">
                            <span className="text-[10px] font-bold text-muted-foreground block">
                              Em 12 {periodLabel}
                            </span>
                            <span className="text-xs font-extrabold text-[#46A302]">
                              {fmt(projected12)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Badge Lucro/Prejuízo & Meta Vinculada */}
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div
                      className={cn(
                        'px-3 py-1.5 rounded-2xl text-xs font-extrabold border-b-2 flex items-center gap-1.5',
                        isProfit
                          ? 'bg-[#58CC02]/15 text-[#46A302] border-[#46A302]/30'
                          : 'bg-[#FF4B4B]/15 text-[#FF4B4B] border-[#FF4B4B]/30',
                      )}
                    >
                      {isProfit ? (
                        <ArrowUpRight className="w-4 h-4 stroke-[3]" />
                      ) : (
                        <ArrowDownRight className="w-4 h-4 stroke-[3]" />
                      )}
                      <span>
                        {isProfit ? '+' : ''}
                        {fmt(diff)} ({pct >= 0 ? '+' : ''}
                        {pct.toFixed(2)}%)
                      </span>
                    </div>

                    {linkedGoal && (
                      <span className="text-[11px] font-bold text-muted-foreground truncate max-w-[150px]">
                        🎯 {linkedGoal.name}
                      </span>
                    )}
                  </div>

                  {inv.notes && (
                    <p className="text-xs text-muted-foreground font-medium italic pt-1 border-t">
                      "{inv.notes}"
                    </p>
                  )}

                  {/* BARRA DE AÇÕES: APORTE, RETIRADA E HISTÓRICO (DUOLINGO 3D) */}
                  <div className="grid grid-cols-3 gap-2 pt-2 border-t">
                    <button
                      type="button"
                      onClick={() => openInvContribution(inv)}
                      className="py-2 px-2.5 rounded-2xl bg-[#58CC02] hover:bg-[#46B302] text-white font-extrabold text-xs border-b-4 border-[#46A302] active:translate-y-0.5 active:border-b-0 flex items-center justify-center gap-1 transition-all"
                    >
                      <Plus className="w-3.5 h-3.5 stroke-[3]" /> Aportar
                    </button>
                    <button
                      type="button"
                      onClick={() => openInvWithdrawal(inv)}
                      className="py-2 px-2.5 rounded-2xl bg-[#FF4B4B] hover:bg-[#CC3B3B] text-white font-extrabold text-xs border-b-4 border-[#CC3B3B] active:translate-y-0.5 active:border-b-0 flex items-center justify-center gap-1 transition-all"
                    >
                      <Minus className="w-3.5 h-3.5 stroke-[3]" /> Retirar
                    </button>
                    <button
                      type="button"
                      onClick={() => openInvHistory(inv)}
                      className="py-2 px-2.5 rounded-2xl bg-muted/80 hover:bg-muted text-foreground font-extrabold text-xs border-b-4 border-border active:translate-y-0.5 active:border-b-0 flex items-center justify-center gap-1 transition-all"
                    >
                      <History className="w-3.5 h-3.5" /> Histórico
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </section>

      {/* BLOCO 2: METAS DE INVESTIMENTO */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-extrabold text-xl flex items-center gap-2">
              <Target className="w-6 h-6 text-[#FF9600]" /> Metas de Investimento
            </h3>
            <p className="text-xs text-muted-foreground font-semibold">
              Acompanhe o progresso das suas conquistas financeiras com barras 3D e projeção mensal.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setEditingGoal(null)
              setGoalModalOpen(true)
            }}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-[#FF9600] hover:bg-[#E08500] text-white font-extrabold text-sm border-b-4 border-[#CC7700] active:translate-y-1 active:border-b-0 transition-all duration-150"
          >
            <Plus className="w-4 h-4" strokeWidth={3} />
            Nova Meta
          </button>
        </div>

        {goalsWithCalculations.length === 0 ? (
          <div className="rounded-3xl p-10 bg-card border text-center space-y-3">
            <div className="w-14 h-14 mx-auto rounded-3xl bg-[#FF9600]/10 flex items-center justify-center text-3xl">
              🎯
            </div>
            <p className="font-extrabold text-base">Nenhuma meta cadastrada</p>
            <p className="text-muted-foreground font-semibold text-xs max-w-sm mx-auto">
              Crie metas como "Reserva de Emergência", "Carro Novo" ou "Aposentadoria" para planejar
              seus aportes mensais.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {goalsWithCalculations.map((g) => {
              const isFinished = g.progressPct >= 100

              return (
                <div
                  key={g.id}
                  className="rounded-3xl p-5 bg-card border border-b-4 space-y-3.5 relative overflow-hidden"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="font-extrabold text-base">{g.name}</h4>
                      {g.deadline && (
                        <p className="text-xs text-muted-foreground font-semibold flex items-center gap-1 mt-0.5">
                          <Calendar className="w-3.5 h-3.5 text-[#1CB0F6]" /> Prazo:{' '}
                          {formatSafeDateBR(g.deadline)}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingGoal(g)
                          setGoalModalOpen(true)
                        }}
                        className="p-1.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted"
                        title="Editar"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteGoal(g.id)}
                        className="p-1.5 rounded-xl text-muted-foreground hover:text-[#FF4B4B] hover:bg-red-50"
                        title="Excluir"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Barra de progresso 3D estilo Duolingo */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs font-extrabold">
                      <span className="text-[#58CC02]">{fmt(g.accumulated)}</span>
                      <span className="text-muted-foreground">Alvo: {fmt(g.targetAmount)}</span>
                    </div>

                    <div className="relative w-full h-7 rounded-2xl bg-muted/60 p-1 border border-border shadow-inner">
                      <div
                        className={cn(
                          'h-full rounded-xl transition-all duration-500 border-b-2',
                          isFinished
                            ? 'bg-[#58CC02] border-[#46A302]'
                            : 'bg-[#1CB0F6] border-[#1899D6]',
                        )}
                        style={{ width: `${Math.max(g.progressPct, 4)}%` }}
                      />
                      <div className="absolute inset-0 flex items-center justify-center text-[11px] font-extrabold drop-shadow">
                        {g.progressPct.toFixed(1)}% atingido
                      </div>
                    </div>
                  </div>

                  {/* Projeção inteligente */}
                  <div className="p-3 rounded-2xl bg-muted/40 text-xs font-semibold space-y-1">
                    {isFinished ? (
                      <p className="font-extrabold text-[#58CC02] flex items-center gap-1">
                        <Sparkles className="w-4 h-4" /> Parabéns! Meta 100% concluída! 🎉
                      </p>
                    ) : (
                      <>
                        <p className="text-muted-foreground">
                          Faltam <strong>{fmt(g.remaining)}</strong> para atingir o objetivo.
                        </p>
                        {g.requiredPerMonth > 0 && (
                          <p className="text-[#1CB0F6] font-bold">
                            💡 Economize <strong>{fmt(g.requiredPerMonth)}/mês</strong> por{' '}
                            {g.monthsRemaining} {g.monthsRemaining === 1 ? 'mês' : 'meses'} até o
                            prazo.
                          </p>
                        )}
                      </>
                    )}
                  </div>

                  {/* BARRA DE AÇÕES: APORTE, RETIRADA E HISTÓRICO DA META (DUOLINGO 3D) */}
                  <div className="grid grid-cols-3 gap-2 pt-2 border-t">
                    <button
                      type="button"
                      onClick={() => openGoalContribution(g)}
                      className="py-2 px-2.5 rounded-2xl bg-[#58CC02] hover:bg-[#46B302] text-white font-extrabold text-xs border-b-4 border-[#46A302] active:translate-y-0.5 active:border-b-0 flex items-center justify-center gap-1 transition-all"
                    >
                      <Plus className="w-3.5 h-3.5 stroke-[3]" /> Aportar
                    </button>
                    <button
                      type="button"
                      onClick={() => openGoalWithdrawal(g)}
                      className="py-2 px-2.5 rounded-2xl bg-[#FF4B4B] hover:bg-[#CC3B3B] text-white font-extrabold text-xs border-b-4 border-[#CC3B3B] active:translate-y-0.5 active:border-b-0 flex items-center justify-center gap-1 transition-all"
                    >
                      <Minus className="w-3.5 h-3.5 stroke-[3]" /> Retirar
                    </button>
                    <button
                      type="button"
                      onClick={() => openGoalHistory(g)}
                      className="py-2 px-2.5 rounded-2xl bg-muted/80 hover:bg-muted text-foreground font-extrabold text-xs border-b-4 border-border active:translate-y-0.5 active:border-b-0 flex items-center justify-center gap-1 transition-all"
                    >
                      <History className="w-3.5 h-3.5" /> Histórico
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </section>

      {/* Modais */}
      <InvestmentModal
        open={invModalOpen}
        onOpenChange={setInvModalOpen}
        editingInvestment={editingInv}
      />

      <InvestmentGoalModal
        open={goalModalOpen}
        onOpenChange={setGoalModalOpen}
        editingGoal={editingGoal}
      />

      <InvestmentMovementModal
        open={movementModalOpen}
        onOpenChange={setMovementModalOpen}
        investment={movementTargetInv}
        goal={movementTargetGoal}
        initialMode={movementInitialMode}
      />
    </div>
  )
}
