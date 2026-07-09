import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { GameButton } from '@/components/ui/game-button'
import { useAppStore, HydrationLog, MoodLog, DigestionLog, UrineLog } from '@/stores/useAppStore'

type LogType = 'hydration' | 'mood' | 'digestion' | 'urine'
type UnionLog =
  | (HydrationLog & { type: LogType })
  | (MoodLog & { type: LogType })
  | (DigestionLog & { type: LogType })
  | (UrineLog & { type: LogType })

const MOOD_OPTIONS = [
  { value: '1', label: '😩 Péssimo' },
  { value: '2', label: '😕 Ruim' },
  { value: '3', label: '😐 Neutro' },
  { value: '4', label: '🙂 Bom' },
  { value: '5', label: '😄 Excelente' },
]
const BRISTOL_OPTIONS = Array.from({ length: 7 }, (_, i) => ({
  value: String(i + 1),
  label: `Tipo ${i + 1}`,
}))
const URINE_OPTIONS = ['Transparente', 'Am. Claro', 'Amarelo', 'Am. Escuro', 'Âmbar', 'Marrom'].map(
  (l, i) => ({ value: String(i + 1), label: l }),
)

export function EditHealthLogDialog({
  log,
  open,
  onOpenChange,
}: {
  log: UnionLog | null
  open: boolean
  onOpenChange: (v: boolean) => void
}) {
  const { tags, updateHydrationLog, updateMoodLog, updateDigestionLog, updateUrineLog } =
    useAppStore()
  const [amount, setAmount] = useState('')
  const [moodLevel, setMoodLevel] = useState('3')
  const [note, setNote] = useState('')
  const [tagId, setTagId] = useState('')
  const [bristolType, setBristolType] = useState('4')
  const [colorType, setColorType] = useState('2')

  useEffect(() => {
    if (!log || !open) return
    if (log.type === 'hydration') setAmount(String(log.amount))
    if (log.type === 'mood') {
      setMoodLevel(String(log.moodLevel))
      setNote(log.note)
      setTagId(log.tagId)
    }
    if (log.type === 'digestion') {
      setBristolType(String(log.bristolType))
      setNote(log.note)
    }
    if (log.type === 'urine') {
      setColorType(String(log.colorType))
      setNote(log.note)
    }
  }, [log, open])

  if (!log) return null

  const handleSave = () => {
    if (log.type === 'hydration') updateHydrationLog(log.id, { amount: parseInt(amount) || 0 })
    if (log.type === 'mood')
      updateMoodLog(log.id, { moodLevel: Number(moodLevel) as any, note, tagId })
    if (log.type === 'digestion')
      updateDigestionLog(log.id, { bristolType: Number(bristolType) as any, note })
    if (log.type === 'urine') updateUrineLog(log.id, { colorType: Number(colorType), note })
    onOpenChange(false)
  }

  const selectOptions = log.type === 'digestion' ? BRISTOL_OPTIONS : URINE_OPTIONS
  const selectValue = log.type === 'digestion' ? bristolType : colorType
  const selectSetter = log.type === 'digestion' ? setBristolType : setColorType

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] rounded-3xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-extrabold">Editar Registro</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-4">
          {log.type === 'hydration' && (
            <div className="space-y-2">
              <Label className="font-bold">Quantidade (ml)</Label>
              <Input
                type="number"
                min="1"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="rounded-2xl bg-muted/50 border-transparent font-semibold"
              />
            </div>
          )}
          {log.type === 'mood' && (
            <>
              <div className="space-y-2">
                <Label className="font-bold">Humor</Label>
                <Select value={moodLevel} onValueChange={setMoodLevel}>
                  <SelectTrigger className="rounded-2xl bg-muted/50 border-transparent font-semibold">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {MOOD_OPTIONS.map((o) => (
                      <SelectItem key={o.value} value={o.value}>
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="font-bold">Nota</Label>
                <Input
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="rounded-2xl bg-muted/50 border-transparent font-semibold"
                />
              </div>
              {tags.length > 0 && (
                <div className="space-y-2">
                  <Label className="font-bold">Tag</Label>
                  <Select value={tagId} onValueChange={setTagId}>
                    <SelectTrigger className="rounded-2xl bg-muted/50 border-transparent font-semibold">
                      <SelectValue placeholder="Nenhuma" />
                    </SelectTrigger>
                    <SelectContent>
                      {tags.map((t) => (
                        <SelectItem key={t.id} value={t.id}>
                          {t.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </>
          )}
          {(log.type === 'digestion' || log.type === 'urine') && (
            <>
              <div className="space-y-2">
                <Label className="font-bold">
                  {log.type === 'digestion' ? 'Tipo Bristol' : 'Cor da Urina'}
                </Label>
                <Select value={selectValue} onValueChange={selectSetter}>
                  <SelectTrigger className="rounded-2xl bg-muted/50 border-transparent font-semibold">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {selectOptions.map((o) => (
                      <SelectItem key={o.value} value={o.value}>
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="font-bold">Nota</Label>
                <Input
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="rounded-2xl bg-muted/50 border-transparent font-semibold"
                />
              </div>
            </>
          )}
          <GameButton onClick={handleSave} variant="primary" size="lg" className="w-full">
            Salvar Alterações
          </GameButton>
        </div>
      </DialogContent>
    </Dialog>
  )
}
