import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tag, Loader2, Calendar } from 'lucide-react'
import { useSocialStore } from '@/stores/useSocialStore'
import { useAuth } from '@/hooks/use-auth'

interface AssignTagModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  groupId: string
  targetUserId: string
  targetUserName: string
  onAssigned?: () => void
}

const DUOLINGO_TAG_COLORS = [
  { label: 'Verde Duolingo', value: '#58CC02' },
  { label: 'Azul Celeste', value: '#1CB0F6' },
  { label: 'Âmbar Dourado', value: '#FFC800' },
  { label: 'Roxo Mágico', value: '#CE82FF' },
  { label: 'Vermelho Paixão', value: '#FF4B4B' },
  { label: 'Turquesa', value: '#00CD9C' },
]

export function AssignTagModal({
  open,
  onOpenChange,
  groupId,
  targetUserId,
  targetUserName,
  onAssigned,
}: AssignTagModalProps) {
  const { user } = useAuth()
  const { assignTag } = useSocialStore()

  const [label, setLabel] = useState('')
  const [color, setColor] = useState('#58CC02')
  const [expirationPreset, setExpirationPreset] = useState<
    'none' | '7d' | '30d' | 'month_end' | 'custom'
  >('month_end')
  const [customDate, setCustomDate] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const computeExpiresAt = (): string | null => {
    const now = new Date()
    if (expirationPreset === 'none') return null
    if (expirationPreset === '7d') {
      return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString()
    }
    if (expirationPreset === '30d') {
      return new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString()
    }
    if (expirationPreset === 'month_end') {
      // End of current month 23:59:59
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)
      return endOfMonth.toISOString()
    }
    if (expirationPreset === 'custom' && customDate) {
      return new Date(customDate).toISOString()
    }
    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return
    const cleanLabel = label.trim()
    if (!cleanLabel) return

    setSubmitting(true)
    try {
      const expiresAt = computeExpiresAt()
      const ok = await assignTag(groupId, targetUserId, user.id, cleanLabel, color, expiresAt)
      if (ok) {
        setLabel('')
        setColor('#58CC02')
        setExpirationPreset('month_end')
        setCustomDate('')
        onAssigned?.()
        onOpenChange(false)
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-3xl border-2 sm:max-w-md">
        <DialogHeader>
          <div className="w-12 h-12 rounded-2xl bg-[#CE82FF]/15 text-[#CE82FF] flex items-center justify-center mx-auto mb-1">
            <Tag className="w-6 h-6" />
          </div>
          <DialogTitle className="text-center font-black text-lg">
            Conceder Tag a Membro
          </DialogTitle>
          <p className="text-center text-xs text-muted-foreground font-semibold">
            Atribuindo etiqueta para{' '}
            <span className="text-[#1CB0F6] font-bold">@{targetUserName}</span> neste grupo.
          </p>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          {/* Label */}
          <div className="space-y-1.5">
            <Label className="text-xs font-black uppercase tracking-wider text-muted-foreground">
              Nome da Tag (máx. 40 caracteres)
            </Label>
            <Input
              value={label}
              onChange={(e) => setLabel(e.target.value.slice(0, 40))}
              placeholder="Ex.: Destaque do Mês, Monitor(a), Mais Ativo"
              required
              className="rounded-2xl border-2 text-xs sm:text-sm font-semibold h-11"
            />
          </div>

          {/* Color Pallet */}
          <div className="space-y-1.5">
            <Label className="text-xs font-black uppercase tracking-wider text-muted-foreground">
              Cor do Selo (Paleta Duolingo)
            </Label>
            <div className="flex items-center gap-2 flex-wrap">
              {DUOLINGO_TAG_COLORS.map((c) => {
                const isSelected = color === c.value
                return (
                  <button
                    key={c.value}
                    type="button"
                    onClick={() => setColor(c.value)}
                    className="w-8 h-8 rounded-xl border-2 transition-transform active:scale-90 flex items-center justify-center cursor-pointer"
                    style={{
                      backgroundColor: c.value,
                      borderColor: isSelected ? '#000000' : 'transparent',
                      transform: isSelected ? 'scale(1.15)' : 'scale(1)',
                    }}
                    title={c.label}
                  />
                )
              })}
            </div>
          </div>

          {/* Expiration Preset */}
          <div className="space-y-2">
            <Label className="text-xs font-black uppercase tracking-wider text-muted-foreground">
              Validade da Tag
            </Label>
            <div className="grid grid-cols-2 gap-2 text-xs font-bold">
              <button
                type="button"
                onClick={() => setExpirationPreset('month_end')}
                className={`p-2.5 rounded-2xl border-2 transition-all cursor-pointer text-left ${
                  expirationPreset === 'month_end'
                    ? 'border-[#58CC02] bg-[#58CC02]/10 text-foreground font-black'
                    : 'border-border bg-card text-muted-foreground'
                }`}
              >
                ⭐ Destaque do mês
                <span className="block text-[10px] font-normal text-muted-foreground">
                  Expira fim do mês
                </span>
              </button>

              <button
                type="button"
                onClick={() => setExpirationPreset('7d')}
                className={`p-2.5 rounded-2xl border-2 transition-all cursor-pointer text-left ${
                  expirationPreset === '7d'
                    ? 'border-[#1CB0F6] bg-[#1CB0F6]/10 text-foreground font-black'
                    : 'border-border bg-card text-muted-foreground'
                }`}
              >
                7 Dias
                <span className="block text-[10px] font-normal text-muted-foreground">
                  Semana de destaque
                </span>
              </button>

              <button
                type="button"
                onClick={() => setExpirationPreset('30d')}
                className={`p-2.5 rounded-2xl border-2 transition-all cursor-pointer text-left ${
                  expirationPreset === '30d'
                    ? 'border-[#FFC800] bg-[#FFC800]/10 text-foreground font-black'
                    : 'border-border bg-card text-muted-foreground'
                }`}
              >
                30 Dias
                <span className="block text-[10px] font-normal text-muted-foreground">
                  Período mensal
                </span>
              </button>

              <button
                type="button"
                onClick={() => setExpirationPreset('none')}
                className={`p-2.5 rounded-2xl border-2 transition-all cursor-pointer text-left ${
                  expirationPreset === 'none'
                    ? 'border-[#CE82FF] bg-[#CE82FF]/10 text-foreground font-black'
                    : 'border-border bg-card text-muted-foreground'
                }`}
              >
                ♾️ Sem expiração
                <span className="block text-[10px] font-normal text-muted-foreground">
                  Até remoção manual
                </span>
              </button>
            </div>

            {/* Custom option */}
            <div className="pt-1">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-foreground">
                <input
                  type="checkbox"
                  checked={expirationPreset === 'custom'}
                  onChange={(e) => setExpirationPreset(e.target.checked ? 'custom' : 'month_end')}
                  className="w-4 h-4 rounded text-primary"
                />
                <Calendar className="w-3.5 h-3.5 text-primary" />
                Data personalizada
              </label>

              {expirationPreset === 'custom' && (
                <Input
                  type="date"
                  value={customDate}
                  onChange={(e) => setCustomDate(e.target.value)}
                  required={expirationPreset === 'custom'}
                  className="mt-2 rounded-xl border-2 text-xs h-9 font-semibold"
                />
              )}
            </div>
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="rounded-2xl border-2 font-bold flex-1"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={submitting || !label.trim()}
              className="rounded-2xl font-black bg-[#58CC02] hover:bg-[#58CC02]/90 border-b-4 border-[#46A302] text-white flex-1 cursor-pointer"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-1.5" />
                  Salvando...
                </>
              ) : (
                'Conceder Tag'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
