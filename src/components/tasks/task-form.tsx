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
import { useAppStore, Priority } from '@/stores/useAppStore'
import { Plus } from 'lucide-react'

export function TaskForm() {
  const { tags, addTask } = useAppStore()
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [tagId, setTagId] = useState(tags[0]?.id || '')
  const [priority, setPriority] = useState<Priority>('medium')
  const [dueDate, setDueDate] = useState(new Date().toISOString().split('T')[0])
  const [estimatedTime, setEstimatedTime] = useState(30)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return
    addTask({ title, dueDate, priority, estimatedTime, tagId })
    setTitle('')
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <GameButton variant="primary" size="md" className="gap-2">
          <Plus className="w-5 h-5" strokeWidth={2.5} /> Nova Tarefa
        </GameButton>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] rounded-3xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-extrabold">Criar Nova Tarefa</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6 mt-4">
          <div className="space-y-2">
            <Label htmlFor="title" className="font-bold">
              O que você precisa fazer?
            </Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Ler 10 páginas do livro..."
              className="rounded-2xl bg-muted/50 border-transparent focus-visible:ring-[#58CC02] font-semibold"
              autoFocus
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="font-bold">Tag</Label>
              <Select value={tagId} onValueChange={setTagId}>
                <SelectTrigger className="rounded-2xl bg-muted/50 border-transparent font-semibold">
                  <SelectValue placeholder="Selecione..." />
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
              <Label className="font-bold">Prioridade</Label>
              <Select value={priority} onValueChange={(v) => setPriority(v as Priority)}>
                <SelectTrigger className="rounded-2xl bg-muted/50 border-transparent font-semibold">
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Baixa</SelectItem>
                  <SelectItem value="medium">Média</SelectItem>
                  <SelectItem value="high">Alta</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="due-date" className="font-bold">
                Data
              </Label>
              <Input
                id="due-date"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="rounded-2xl bg-muted/50 border-transparent font-semibold"
              />
            </div>
            <div className="space-y-2">
              <Label className="font-bold">Tempo estimado</Label>
              <Select
                value={String(estimatedTime)}
                onValueChange={(v) => setEstimatedTime(Number(v))}
              >
                <SelectTrigger className="rounded-2xl bg-muted/50 border-transparent font-semibold">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="15">15 min</SelectItem>
                  <SelectItem value="30">30 min</SelectItem>
                  <SelectItem value="60">1 hora</SelectItem>
                  <SelectItem value="90">1h 30min</SelectItem>
                  <SelectItem value="120">2 horas</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <GameButton type="submit" variant="primary" size="lg" className="w-full">
            Criar Tarefa
          </GameButton>
        </form>
      </DialogContent>
    </Dialog>
  )
}
