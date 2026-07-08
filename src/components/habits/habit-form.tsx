import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
        <Button variant="outline" className="rounded-2xl gap-2 font-medium">
          <Plus className="w-5 h-5" /> Novo Hábito
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] rounded-3xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">Criar Hábito</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6 mt-4">
          <div className="space-y-2">
            <Label htmlFor="habit-title">O que você quer cultivar?</Label>
            <Input
              id="habit-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Beber 2L de água"
              className="rounded-xl bg-muted/50 border-transparent"
              autoFocus
            />
          </div>
          <div className="space-y-2">
            <Label>Tag</Label>
            <Select value={tagId} onValueChange={setTagId}>
              <SelectTrigger className="rounded-xl bg-muted/50 border-transparent">
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
            <Label>Frequência</Label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setFrequency('daily')}
                className={cn(
                  'p-3 rounded-xl text-sm font-medium border-2 transition-all',
                  frequency === 'daily'
                    ? 'border-primary bg-primary/10'
                    : 'border-transparent bg-muted/50',
                )}
              >
                Diário
              </button>
              <button
                type="button"
                onClick={() => setFrequency('weekly')}
                className={cn(
                  'p-3 rounded-xl text-sm font-medium border-2 transition-all',
                  frequency === 'weekly'
                    ? 'border-primary bg-primary/10'
                    : 'border-transparent bg-muted/50',
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
                    'flex-1 py-2 rounded-lg text-xs font-medium transition-all',
                    weekDays.includes(i)
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted/50 text-muted-foreground',
                  )}
                >
                  {d}
                </button>
              ))}
            </div>
          )}
          <Button type="submit" className="w-full rounded-xl py-6 text-base font-semibold">
            Criar Hábito
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
