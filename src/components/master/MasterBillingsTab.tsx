import { useState, useMemo } from 'react'
import { useMasterStore } from '@/stores/useMasterStore'
import { safeFormatDate, todayStr } from '@/lib/date-utils'
import { formatCurrency } from '@/lib/finance-utils'
import { CreditCard, Plus, CheckCircle2, Clock, AlertCircle, Receipt, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { toast } from 'sonner'

export function MasterBillingsTab() {
  const { billings, profiles, createBilling, markBillingPaid } = useMasterStore()

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'paid' | 'overdue'>('all')

  // Create Modal
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [selectedUserId, setSelectedUserId] = useState('')
  const [description, setDescription] = useState('')
  const [amountStr, setAmountStr] = useState('')
  const [dueDate, setDueDate] = useState(todayStr())
  const [creating, setCreating] = useState(false)
  const [userSearchText, setUserSearchText] = useState('')

  // Derive status based on dueDate if not paid
  const billingsWithComputedStatus = useMemo(() => {
    const today = todayStr()
    return billings.map((b) => {
      let computedStatus = b.status
      if (b.status === 'pending' && b.dueDate < today) {
        computedStatus = 'overdue'
      }
      return {
        ...b,
        displayStatus: computedStatus,
      }
    })
  }, [billings])

  const filteredBillings = useMemo(() => {
    return billingsWithComputedStatus.filter((b) => {
      const matchSearch =
        b.description.toLowerCase().includes(search.toLowerCase()) ||
        (b.userName && b.userName.toLowerCase().includes(search.toLowerCase())) ||
        (b.userEmail && b.userEmail.toLowerCase().includes(search.toLowerCase()))
      const matchStatus = statusFilter === 'all' || b.displayStatus === statusFilter
      return matchSearch && matchStatus
    })
  }, [billingsWithComputedStatus, search, statusFilter])

  // Summary stats
  const summary = useMemo(() => {
    let pendingTotal = 0
    let paidTotal = 0
    let overdueTotal = 0

    billingsWithComputedStatus.forEach((b) => {
      if (b.displayStatus === 'paid') {
        paidTotal += b.amount
      } else if (b.displayStatus === 'overdue') {
        overdueTotal += b.amount
      } else {
        pendingTotal += b.amount
      }
    })

    return { pendingTotal, paidTotal, overdueTotal }
  }, [billingsWithComputedStatus])

  const handleOpenCreateModal = () => {
    setSelectedUserId(profiles[0]?.id || '')
    setDescription('')
    setAmountStr('')
    setDueDate(todayStr())
    setUserSearchText('')
    setCreateModalOpen(true)
  }

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedUserId) {
      toast.error('Selecione o usuário destinatário.')
      return
    }

    const numAmount = parseFloat(amountStr.replace(',', '.'))
    if (isNaN(numAmount) || numAmount <= 0) {
      toast.error('Informe um valor monetário válido.')
      return
    }

    if (!description.trim()) {
      toast.error('Informe a descrição da cobrança.')
      return
    }

    if (!dueDate) {
      toast.error('Informe a data de vencimento.')
      return
    }

    setCreating(true)
    const success = await createBilling({
      userId: selectedUserId,
      description: description.trim(),
      amount: numAmount,
      dueDate,
    })
    setCreating(false)

    if (success) {
      setCreateModalOpen(false)
    }
  }

  const filteredUserOptions = useMemo(() => {
    if (!userSearchText.trim()) return profiles
    return profiles.filter(
      (p) =>
        p.email.toLowerCase().includes(userSearchText.toLowerCase()) ||
        (p.displayName && p.displayName.toLowerCase().includes(userSearchText.toLowerCase())),
    )
  }, [profiles, userSearchText])

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="rounded-3xl border-2 border-b-4 border-b-amber-500/40 p-5 bg-card shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-black uppercase tracking-wider text-muted-foreground">
              A Receber
            </span>
            <div className="text-2xl font-black text-amber-500 mt-1">
              {formatCurrency(summary.pendingTotal)}
            </div>
            <span className="text-[11px] font-bold text-muted-foreground">Cobranças pendentes</span>
          </div>
          <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-500">
            <Clock className="w-6 h-6" />
          </div>
        </Card>

        <Card className="rounded-3xl border-2 border-b-4 border-b-[#58CC02]/40 p-5 bg-card shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-black uppercase tracking-wider text-muted-foreground">
              Recebido
            </span>
            <div className="text-2xl font-black text-[#58CC02] mt-1">
              {formatCurrency(summary.paidTotal)}
            </div>
            <span className="text-[11px] font-bold text-muted-foreground">Cobranças quitadas</span>
          </div>
          <div className="p-3 rounded-2xl bg-[#58CC02]/10 text-[#58CC02]">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </Card>

        <Card className="rounded-3xl border-2 border-b-4 border-b-rose-500/40 p-5 bg-card shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-black uppercase tracking-wider text-muted-foreground">
              Vencido
            </span>
            <div className="text-2xl font-black text-rose-500 mt-1">
              {formatCurrency(summary.overdueTotal)}
            </div>
            <span className="text-[11px] font-bold text-muted-foreground">Cobranças em atraso</span>
          </div>
          <div className="p-3 rounded-2xl bg-rose-500/10 text-rose-500">
            <AlertCircle className="w-6 h-6" />
          </div>
        </Card>
      </div>

      {/* Action Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="flex-1 flex flex-wrap gap-2 items-center">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por descrição ou cliente..."
              className="pl-9 rounded-2xl border-2 h-11"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e: any) => setStatusFilter(e.target.value)}
            className="h-11 px-3 rounded-2xl border-2 bg-card text-xs font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="all">Todos os Status</option>
            <option value="pending">🟡 Pendentes</option>
            <option value="paid">🟢 Pagas</option>
            <option value="overdue">🔴 Vencidas</option>
          </select>
        </div>

        <Button
          onClick={handleOpenCreateModal}
          className="rounded-2xl h-11 px-5 font-black bg-[#1CB0F6] hover:bg-[#1899d6] text-white border-b-4 border-[#1899d6] active:border-b-0 active:translate-y-1 transition-all shadow-sm flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          <span>Nova Cobrança</span>
        </Button>
      </div>

      {/* Billings Table */}
      <div className="bg-card border-2 rounded-3xl overflow-hidden shadow-sm">
        {filteredBillings.length === 0 ? (
          <div className="py-16 text-center space-y-2">
            <Receipt className="w-10 h-10 text-muted-foreground mx-auto opacity-50" />
            <p className="font-extrabold text-foreground">Nenhuma cobrança encontrada</p>
            <p className="text-xs text-muted-foreground">
              Clique em "Nova Cobrança" para gerar uma fatura para um usuário.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b bg-muted/40 text-[11px] font-black uppercase tracking-wider text-muted-foreground">
                  <th className="py-3.5 px-4">Descrição</th>
                  <th className="py-3.5 px-4">Cliente</th>
                  <th className="py-3.5 px-4">Valor</th>
                  <th className="py-3.5 px-4">Vencimento</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredBillings.map((b) => (
                  <tr key={b.id} className="hover:bg-muted/30 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-foreground">
                      <div className="flex items-center gap-2">
                        <CreditCard className="w-4 h-4 text-muted-foreground shrink-0" />
                        <span className="truncate max-w-[200px]">{b.description}</span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-xs">
                      <div className="font-bold text-foreground truncate max-w-[180px]">
                        {b.userName}
                      </div>
                      <div className="text-muted-foreground text-[11px] truncate max-w-[180px]">
                        {b.userEmail}
                      </div>
                    </td>

                    <td className="py-3.5 px-4 font-black text-foreground">
                      {formatCurrency(b.amount)}
                    </td>

                    <td className="py-3.5 px-4 text-xs font-semibold text-muted-foreground">
                      {safeFormatDate(b.dueDate)}
                    </td>

                    <td className="py-3.5 px-4">
                      {b.displayStatus === 'paid' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Paga
                        </span>
                      )}
                      {b.displayStatus === 'pending' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                          <Clock className="w-3.5 h-3.5" /> Pendente
                        </span>
                      )}
                      {b.displayStatus === 'overdue' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30">
                          <AlertCircle className="w-3.5 h-3.5" /> Vencida
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      {b.displayStatus !== 'paid' ? (
                        <Button
                          size="sm"
                          onClick={() => markBillingPaid(b.id)}
                          className="rounded-xl h-8 text-xs font-bold bg-[#58CC02] hover:bg-[#46a302] text-white border-b-2 border-[#46a302] active:border-b-0 active:translate-y-0.5"
                        >
                          Marcar como Paga
                        </Button>
                      ) : (
                        <span className="text-[11px] text-muted-foreground font-semibold">
                          Quitada {b.paidAt ? `em ${safeFormatDate(b.paidAt)}` : ''}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL: NOVA COBRANÇA */}
      <Dialog open={createModalOpen} onOpenChange={setCreateModalOpen}>
        <DialogContent className="sm:max-w-md rounded-3xl border-2 p-6 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-black text-foreground flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-[#1CB0F6]" />
              Emitir Nova Cobrança
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Gere uma cobrança vinculada à conta do usuário selecionado.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateSubmit} className="space-y-4 py-2">
            {/* Usuário via Select Buscável */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-foreground">Destinatário (Usuário) *</Label>
              <Input
                type="text"
                placeholder="Filtrar usuário por nome ou e-mail..."
                value={userSearchText}
                onChange={(e) => setUserSearchText(e.target.value)}
                className="rounded-2xl border-2 h-9 text-xs mb-1.5"
              />
              <select
                required
                value={selectedUserId}
                onChange={(e) => setSelectedUserId(e.target.value)}
                className="w-full h-11 px-3 rounded-2xl border-2 bg-card text-xs font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              >
                {filteredUserOptions.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.displayName ? `${p.displayName} (${p.email})` : p.email}
                  </option>
                ))}
              </select>
            </div>

            {/* Descrição */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-foreground">Descrição / Referência *</Label>
              <Input
                required
                placeholder="Ex: Mensalidade VIP Pro - Mês 09"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="rounded-2xl border-2 h-11"
              />
            </div>

            {/* Valor R$ */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-foreground">Valor (R$) *</Label>
              <Input
                required
                type="number"
                step="0.01"
                min="0.01"
                placeholder="Ex: 97.00"
                value={amountStr}
                onChange={(e) => setAmountStr(e.target.value)}
                className="rounded-2xl border-2 h-11"
              />
            </div>

            {/* Data de Vencimento pt-BR */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-foreground">Data de Vencimento *</Label>
              <Input
                required
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="rounded-2xl border-2 h-11"
              />
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setCreateModalOpen(false)}
                className="rounded-2xl h-11 font-bold"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={creating}
                className="rounded-2xl h-11 font-black bg-[#1CB0F6] hover:bg-[#1899d6] text-white border-b-4 border-[#1899d6] active:border-b-0 active:translate-y-1 transition-all"
              >
                {creating ? 'Gerando...' : 'Gerar Cobrança'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
