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
import { useFinanceStore, type BankAccount } from '@/stores/useFinanceStore'
import { toast } from 'sonner'

const COLOR_PRESETS = [
  '#58CC02', // verde
  '#1CB0F6', // azul
  '#8947FF', // roxo nubank
  '#FF9600', // laranja itaú/inter
  '#FF4B4B', // vermelho bradesco/santander
  '#00CD98', // verde água
  '#FFC800', // amarelo bb
  '#3C3C3C', // grafite
]

const ACCOUNT_TYPE_LABELS: Record<string, string> = {
  checking: 'Conta Corrente 🏦',
  savings: 'Poupança 🐖',
  wallet: 'Carteira Física 👛',
  investment: 'Conta de Investimentos 📈',
}

interface BankAccountModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  editingAccount?: BankAccount | null
}

export function BankAccountModal({ open, onOpenChange, editingAccount }: BankAccountModalProps) {
  const addBankAccount = useFinanceStore((s) => s.addBankAccount)
  const updateBankAccount = useFinanceStore((s) => s.updateBankAccount)

  const [name, setName] = useState('')
  const [accountType, setAccountType] = useState<BankAccount['accountType']>('checking')
  const [initialBalance, setInitialBalance] = useState('')
  const [color, setColor] = useState('#58CC02')

  const isEditing = !!editingAccount

  useEffect(() => {
    if (open) {
      if (editingAccount) {
        setName(editingAccount.name)
        setAccountType(editingAccount.accountType)
        setInitialBalance(String(editingAccount.initialBalance))
        setColor(editingAccount.color || '#58CC02')
      } else {
        setName('')
        setAccountType('checking')
        setInitialBalance('0')
        setColor('#58CC02')
      }
    }
  }, [open, editingAccount])

  const handleSubmit = () => {
    if (!name.trim()) {
      toast.error('Informe o nome da conta bancária')
      return
    }

    const balanceNum = parseFloat(initialBalance) || 0
    onOpenChange(false)

    if (isEditing && editingAccount) {
      updateBankAccount(editingAccount.id, {
        name: name.trim(),
        accountType,
        initialBalance: balanceNum,
        color,
      })
      toast.success('Conta bancária atualizada! 🎉')
    } else {
      addBankAccount({
        name: name.trim(),
        accountType,
        initialBalance: balanceNum,
        color,
      })
      toast.success('Conta bancária criada! 🎉')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md rounded-3xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-extrabold">
            {isEditing ? 'Editar Conta Bancária' : 'Nova Conta Bancária'}
          </DialogTitle>
          <DialogDescription>
            Ex: Nubank, Itaú, Inter, Carteira de Bolso, XP Investimentos
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-sm font-extrabold">Nome da Conta / Banco</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Nubank Conta Principal"
              className="rounded-xl font-bold"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-sm font-extrabold">Tipo de Conta</Label>
            <Select value={accountType} onValueChange={(v: any) => setAccountType(v)}>
              <SelectTrigger className="rounded-xl font-bold">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(ACCOUNT_TYPE_LABELS).map(([key, label]) => (
                  <SelectItem key={key} value={key}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-sm font-extrabold">Saldo Inicial (R$)</Label>
            <Input
              type="number"
              inputMode="decimal"
              value={initialBalance}
              onChange={(e) => setInitialBalance(e.target.value)}
              placeholder="0,00"
              className="rounded-xl font-bold text-lg"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-sm font-extrabold">Cor de Identificação</Label>
            <div className="flex items-center gap-2 flex-wrap">
              {COLOR_PRESETS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className="w-8 h-8 rounded-full border-2 transition-transform active:scale-90"
                  style={{
                    backgroundColor: c,
                    borderColor: color === c ? '#000' : 'transparent',
                    transform: color === c ? 'scale(1.15)' : 'scale(1)',
                  }}
                />
              ))}
            </div>
          </div>

          <Button
            type="button"
            onClick={handleSubmit}
            className="w-full py-6 rounded-3xl bg-[#58CC02] hover:bg-[#46B302] text-white font-extrabold border-b-4 border-[#46A302] active:translate-y-1 active:border-b-0 transition-all duration-150"
          >
            {isEditing ? 'Salvar Alterações' : 'Criar Conta'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
