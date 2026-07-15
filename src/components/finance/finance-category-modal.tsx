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
import { useAppStore, FinanceCategory } from '@/stores/useAppStore'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

const EMOJIS = [
  '🏠',
  '🍔',
  '🚗',
  '💰',
  '💼',
  '📺',
  '🏋️',
  '💊',
  '📚',
  '🎮',
  '🛒',
  '📦',
  '⚡',
  '🔥',
  '💡',
  '🎯',
  '📱',
  '💻',
  '✈️',
  '🎵',
  '📷',
  '☕',
  '🍕',
  '🎁',
  '🏦',
  '💳',
  '📊',
  '💎',
]
const COLORS = [
  '#1CB0F6',
  '#58CC02',
  '#FF4B4B',
  '#FF9600',
  '#CE82FF',
  '#FFC800',
  '#82D936',
  '#FF6B6B',
]

interface FinanceCategoryModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  editingCategory?: FinanceCategory | null
  parentCategory?: FinanceCategory | null
}

export function FinanceCategoryModal({
  open,
  onOpenChange,
  editingCategory,
  parentCategory,
}: FinanceCategoryModalProps) {
  const addFinanceCategory = useAppStore((s) => s.addFinanceCategory)
  const updateFinanceCategory = useAppStore((s) => s.updateFinanceCategory)
  const [name, setName] = useState('')
  const [icon, setIcon] = useState('📦')
  const [color, setColor] = useState('#1CB0F6')

  useEffect(() => {
    if (open) {
      setName(editingCategory?.name || '')
      setIcon(editingCategory?.icon || '📦')
      setColor(editingCategory?.color || '#1CB0F6')
    }
  }, [open, editingCategory])

  const handleSubmit = () => {
    if (!name.trim()) {
      toast.error('Digite um nome')
      return
    }
    onOpenChange(false)
    if (editingCategory) {
      updateFinanceCategory(editingCategory.id, { name: name.trim(), icon, color })
      toast.success('Categoria atualizada! 🎉')
    } else {
      addFinanceCategory({
        name: name.trim(),
        icon,
        color,
        parentId: parentCategory?.id || null,
      })
      toast.success(parentCategory ? 'Subcategoria adicionada! 🎉' : 'Categoria adicionada! 🎉')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md rounded-3xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-extrabold">
            {editingCategory
              ? 'Editar Categoria'
              : parentCategory
                ? `Nova Subcategoria em ${parentCategory.name}`
                : 'Nova Categoria'}
          </DialogTitle>
          <DialogDescription>Personalize sua organização financeira</DialogDescription>
        </DialogHeader>
        <div className="space-y-5">
          <div className="space-y-2">
            <Label className="text-sm font-extrabold">Nome</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Casa"
              className="rounded-xl"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-extrabold">Ícone</Label>
            <div className="grid grid-cols-7 gap-2">
              {EMOJIS.map((e) => (
                <button
                  key={e}
                  onClick={() => setIcon(e)}
                  className={cn(
                    'w-9 h-9 rounded-xl text-lg flex items-center justify-center border-2 transition-all',
                    icon === e ? 'border-[#1CB0F6] bg-[#1CB0F6]/10' : 'border-transparent bg-muted',
                  )}
                >
                  {e}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-extrabold">Cor</Label>
            <div className="flex gap-2 flex-wrap">
              {COLORS.map((c) => (
                <button
                  key={c}
                  onClick={() => setColor(c)}
                  className={cn(
                    'w-9 h-9 rounded-xl border-2 transition-all',
                    color === c ? 'border-foreground scale-110' : 'border-transparent',
                  )}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>
          <Button
            onClick={handleSubmit}
            className="w-full py-6 rounded-3xl bg-[#1CB0F6] hover:bg-[#1899D6] text-white font-extrabold border-b-4 border-[#1899D6] active:translate-y-1 active:border-b-0 transition-all duration-150"
          >
            {editingCategory ? 'Salvar Alterações' : 'Adicionar'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
