import { useState, useEffect } from 'react'
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
import { useAppStore, Habit } from '@/stores/useAppStore'
import { Plus, Shield } from 'lucide-react'
import { cn } from '@/lib/utils'

const DAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
const WEEKLY_GOALS = [1, 2, 3, 4, 5, 6, 7]

interface HabitFormProps {
  editHabit?: Habit
  open?: boolean
  onOpenChange?: (open: boolean) => void
  hideTrigger?: boolean
}

export function HabitForm({
  editHabit,
  open: controlledOpen,
  onOpenChange,
  hideTrigger,
}: HabitFormProps) {
  const { tags, addHabit, updateHabit } = useAppStore()
  const [internalOpen, setInternalOpen] = useState(false)
  const isControlled = controlledOpen !== undefined
  const open = isControlled ? controlledOpen : internalOpen
  const setOpen = (v: boolean) => {
    if (isControlled) onOpenChange?.(v)
    else setInternalOpen(v)
  }

  const [title, setTitle] = useState('')
  const [tagId, setTagId] = useState(tags[0]?.id || '')
  const [frequency, setFrequency] = useState<'daily' | 'weekly'>('daily')
  const [weekDays, setWeekDays] = useState<number[]>([1, 3, 5])
  const [weeklyGoal, setWeeklyGoal] = useState(3)

  useEffect(() => {
    if (editHabit && open) {
      setTitle(editHabit.title)
      setTagId(editHabit.tagId)
      setFrequency(editHabit.frequency)
      setWeekDays(editHabit.weekDays)
      setWeeklyGoal(editHabit.weeklyGoal)
    } else if (!open && !editHabit) {
      setTitle('')
      setTagId(tags[0]?.id || '')
      setFrequency('daily')
      setWeekDays([1, 3, 5])
      setWeeklyGoal(3)
    }
  }, [editHabit, open])

  const toggleDay = (day: number) =>
    setWeekDays((prev) => (prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]))

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return
    const data = {
      title,
      tagId,
      frequency,
      weekDays: frequency === 'daily' ? [] : weekDays,
      weeklyGoal: frequency === 'weekly' ? weeklyGoal : 0,
    }
    if (editHabit) updateHabit(editHabit.id, data)
    else addHabit(data)
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {!hideTrigger && (
        <DialogTrigger asChild>
          <GameButton variant="outline" size="md" className="gap-2">
            <Plus className="w-5 h-5" strokeWidth={2.5} /> {editHabit ? 'Editar' : 'Novo'} Hábito
          </GameButton>
        </DialogTrigger>
      )}
      <DialogContent className="sm:max-w-[425px] rounded-3xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-extrabold">
            {editHabit ? 'Editar Hábito' : 'Criar Hábito'}
          </DialogTitle>
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
                {tags.map((t) => (
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
                  'p-3 rounded-2xl text-sm font-bold border-2 border-b-4 transition-all active:translate-y-1 active:border-b-0',
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
                  'p-3 rounded-2xl text-sm font-bold border-2 border-b-4 transition-all active:translate-y-1 active:border-b-0',
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
            <>
              <div className="space-y-2">
                <Label className="font-bold">Meta semanal</Label>
                <div className="grid grid-cols-4 gap-2">
                  {WEEKLY_GOALS.map((g) => (
                    <button
                      key={g}
                      type="button"
                      onClick={() => setWeeklyGoal(g)}
                      className={cn(
                        'py-2.5 rounded-2xl text-sm font-bold border-2 border-b-4 transition-all active:translate-y-1 active:border-b-0',
                        weeklyGoal === g
                          ? 'border-[#FFC800] bg-[#FFC800]/10 text-[#374151]'
                          : 'border-[#E5E5E5] dark:border-[#3B4A55] bg-muted/50',
                      )}
                    >
                      {g}x
                    </button>
                  ))}
                </div>
              </div>
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
            </>
          )}
          {!editHabit && (
            <div className="flex items-center gap-2 p-3 rounded-2xl bg-[#1CB0F6]/10">
              <Shield className="w-5 h-5 text-[#1CB0F6] shrink-0" strokeWidth={2.5} />
              <p className="text-xs font-semibold text-muted-foreground">
                Você começa com <span className="text-[#1CB0F6] font-bold">2 Escudos</span> de
                proteção de streak.
              </p>
            </div>
          )}
          <GameButton type="submit" variant="gold" size="lg" className="w-full">
            {editHabit ? 'Salvar' : 'Criar Hábito'}
          </GameButton>
        </form>
      </DialogContent>
    </Dialog>
  )
}
