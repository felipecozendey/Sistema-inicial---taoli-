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
import { useFinanceStore, type PaymentMethod } from '@/stores/useFinanceStore'
import { toast } from 'sonner'

const COLOR_PRESETS = [
  '#1CB0F6', // azul Duolingo
  '#58CC02', // verde
  '#FF4B4B', // vermelho
  '#FF9600', // laranja
  '#CE82FF', // roxo
  '#FFC800', // amarelo
  '#46CDCF', // ciano
  '#2B2B2B', // escuro
]

const PAYMENT_TYPE_LABELS: Record<string, string> = {
  credit_card: 'Cartão de Crédito 💳',
  debit_card: 'Cartão de Débito 💳',
  pix: 'Pix ⚡',
  cash: 'Dinheiro 💵',
  boleto: 'Boleto Bancário 📄',
  other: 'Outro 📦',
}

interface PaymentMethodModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  editingMethod?: PaymentMethod | null
}

export function PaymentMethodModal({ open, onOpenChange, editingMethod }: PaymentMethodModalProps) {
  const addPaymentMethod = useFinanceStore((s) => s.addPaymentMethod)
  const updatePaymentMethod = useFinanceStore((s) => s.updatePaymentMethod)

  const [name, setName] = useState('')
  const [type, setType] = useState<PaymentMethod['type']>('credit_card')
  const [color, setColor] = useState('#1CB0F6')

  const isEditing = !!editingMethod

  useEffect(() => {
    if (open) {
      if (editingMethod) {
        setName(editingMethod.name)
        setType(editingMethod.type)
        setColor(editingMethod.color || '#1CB0F6')
      } else {
        setName('')
        setType('credit_card')
        setColor('#1CB0F6')
      }
    }
  }, [open, editingMethod])

  const handleSubmit = () => {
    if (!name.trim()) {
      toast.error('Informe o nome do método de pagamento')
      return
    }

    onOpenChange(false)

    if (isEditing && editingMethod) {
      updatePaymentMethod(editingMethod.id, { name: name.trim(), type, color })
      toast.success('Método atualizado! 🎉')
    } else {
      addPaymentMethod({ name: name.trim(), type, color })
      toast.success('Método criado! 🎉')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md rounded-3xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-extrabold">
            {isEditing ? 'Editar Método de Pagamento' : 'Novo Método de Pagamento'}
          </DialogTitle>
          <DialogDescription>
            Ex: Cartão Nubank, Cartão Inter, Pix, Dinheiro, etc.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-sm font-extrabold">Nome do Método</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Cartão Nubank Platinum"
              className="rounded-xl font-bold"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-sm font-extrabold">Tipo</Label>
            <Select value={type} onValueChange={(v: any) => setType(v)}>
              <SelectTrigger className="rounded-xl font-bold">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(PAYMENT_TYPE_LABELS).map(([key, label]) => (
                  <SelectItem key={key} value={key}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
            className="w-full py-6 rounded-3xl bg-[#1CB0F6] hover:bg-[#1899D6] text-white font-extrabold border-b-4 border-[#1899D6] active:translate-y-1 active:border-b-0 transition-all duration-150"
          >
            {isEditing ? 'Salvar Alterações' : 'Criar Método'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
