import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { GameButton } from '@/components/ui/game-button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useAppStore } from '@/stores/useAppStore'
import { Plus } from 'lucide-react'
import { cn } from '@/lib/utils'

const DAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

export function HabitForm() {
  const { tags, addHabit } = useAppStore()
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [tagId, setTagId] = useState(tags[0]?.id || '')
  const [frequency, setFrequency] = useState<'daily' | 'weekly'>('daily')
  const [weekDays, setWeekDays] = useState<number[]>([1, 3, 5])

  const toggleDay = (day: number) => {
    setWeekDays((prev) => (prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return
    addHabit({ title, tagId, frequency, weekDays: frequency === 'daily' ? [] : weekDays })
    setTitle('')
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <GameButton variant="outline" size="md" className="gap-2">
          <Plus className="w-5 h-5" strokeWidth={2.5} /> Novo Hábito
        </GameButton>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] rounded-3xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-extrabold">Criar Hábito</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6 mt-4">
          <div className="space-y-2">
            <Label htmlFor="habit-title" className="font-bold">
              O que você quer cultivar?
            </Label>
            <Input
              id="habit-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Beber 2L de água"
              className="rounded-2xl bg-muted/50 border-transparent font-semibold"
              autoFocus
            />
          </div>
          <div className="space-y-2">
            <Label className="font-bold">Tag</Label>
            <Select value={tagId} onValueChange={setTagId}>
              <SelectTrigger className="rounded-2xl bg-muted/50 border-transparent font-semibold">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {tags.map((t: any) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label className="font-bold">Frequência</Label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setFrequency('daily')}
                className={cn(
                  'p-3 rounded-2xl text-sm font-bold border-2 border-b-4 transition-all active:translate-y-0.5 active:border-b-2',
                  frequency === 'daily'
                    ? 'border-[#FFC800] bg-[#FFC800]/10 text-[#374151]'
                    : 'border-[#E5E5E5] dark:border-[#3B4A55] bg-muted/50',
                )}
              >
                Diário
              </button>
              <button
                type="button"
                onClick={() => setFrequency('weekly')}
                className={cn(
                  'p-3 rounded-2xl text-sm font-bold border-2 border-b-4 transition-all active:translate-y-0.5 active:border-b-2',
                  frequency === 'weekly'
                    ? 'border-[#FFC800] bg-[#FFC800]/10 text-[#374151]'
                    : 'border-[#E5E5E5] dark:border-[#3B4A55] bg-muted/50',
                )}
              >
                Semanal
              </button>
            </div>
          </div>
          {frequency === 'weekly' && (
            <div className="flex gap-1.5">
              {DAYS.map((d, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => toggleDay(i)}
                  className={cn(
                    'flex-1 py-2 rounded-xl text-xs font-bold transition-all',
                    weekDays.includes(i)
                      ? 'bg-[#FFC800] text-[#374151]'
                      : 'bg-muted/50 text-muted-foreground',
                  )}
                >
                  {d}
                </button>
              ))}
            </div>
          )}
          <GameButton type="submit" variant="gold" size="lg" className="w-full">
            Criar Hábito
          </GameButton>
        </form>
      </DialogContent>
    </Dialog>
  )
}
