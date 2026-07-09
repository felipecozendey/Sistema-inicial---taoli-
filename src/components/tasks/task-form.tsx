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
import { useAppStore, EnergyLevel, Task, Subtask } from '@/stores/useAppStore'
import { Plus, X } from 'lucide-react'
import { cn } from '@/lib/utils'

const ENERGY_LEVELS: { value: EnergyLevel; label: string; bolts: number; color: string }[] = [
  { value: 1, label: 'Baixa', bolts: 1, color: '#58CC02' },
  { value: 2, label: 'Média', bolts: 2, color: '#FFC800' },
  { value: 3, label: 'Alta', bolts: 3, color: '#FF4B4B' },
]

interface TaskFormProps {
  editTask?: Task
  open?: boolean
  onOpenChange?: (open: boolean) => void
  hideTrigger?: boolean
}

export function TaskForm({
  editTask,
  open: controlledOpen,
  onOpenChange,
  hideTrigger,
}: TaskFormProps) {
  const { tags, addTask, updateTask } = useAppStore()
  const [internalOpen, setInternalOpen] = useState(false)
  const isControlled = controlledOpen !== undefined
  const open = isControlled ? controlledOpen : internalOpen
  const setOpen = (v: boolean) => {
    if (isControlled) onOpenChange?.(v)
    else setInternalOpen(v)
  }

  const [title, setTitle] = useState('')
  const [tagId, setTagId] = useState(tags[0]?.id || '')
  const [energyLevel, setEnergyLevel] = useState<EnergyLevel>(2)
  const [dueDate, setDueDate] = useState(new Date().toISOString().split('T')[0])
  const [estimatedTime, setEstimatedTime] = useState(30)
  const [subtasks, setSubtasks] = useState<Subtask[]>([])
  const [subtaskInput, setSubtaskInput] = useState('')

  useEffect(() => {
    if (editTask && open) {
      setTitle(editTask.title)
      setTagId(editTask.tagId)
      setEnergyLevel(editTask.energyLevel)
      setDueDate(editTask.dueDate)
      setEstimatedTime(editTask.estimatedTime)
      setSubtasks(editTask.subtasks.map((s) => ({ ...s })))
    } else if (!open && !editTask) {
      setTitle('')
      setTagId(tags[0]?.id || '')
      setEnergyLevel(2)
      setDueDate(new Date().toISOString().split('T')[0])
      setEstimatedTime(30)
      setSubtasks([])
      setSubtaskInput('')
    }
  }, [editTask, open])

  const addSubtask = () => {
    if (!subtaskInput.trim()) return
    setSubtasks((prev) => [...prev, { id: '', title: subtaskInput.trim(), completed: false }])
    setSubtaskInput('')
  }
  const removeSubtask = (i: number) => setSubtasks((prev) => prev.filter((_, idx) => idx !== i))

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return
    const data = {
      title,
      dueDate,
      energyLevel,
      estimatedTime,
      tagId,
      subtasks: subtasks.map((s) => ({ id: s.id, title: s.title, completed: s.completed })),
    }
    if (editTask) updateTask(editTask.id, data)
    else addTask(data)
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {!hideTrigger && (
        <DialogTrigger asChild>
          <GameButton variant="primary" size="md" className="gap-2">
            <Plus className="w-5 h-5" strokeWidth={2.5} /> {editTask ? 'Editar' : 'Nova'} Tarefa
          </GameButton>
        </DialogTrigger>
      )}
      <DialogContent className="sm:max-w-[425px] rounded-3xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-extrabold">
            {editTask ? 'Editar Tarefa' : 'Criar Nova Tarefa'}
          </DialogTitle>
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
                  {tags.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
          <div className="space-y-2">
            <Label className="font-bold">Nível de Energia</Label>
            <div className="grid grid-cols-3 gap-2">
              {ENERGY_LEVELS.map((level) => (
                <button
                  key={level.value}
                  type="button"
                  onClick={() => setEnergyLevel(level.value)}
                  className={cn(
                    'flex flex-col items-center gap-1 p-3 rounded-2xl border-2 border-b-4 transition-all active:translate-y-1 active:border-b-0',
                    energyLevel === level.value
                      ? 'border-current'
                      : 'border-[#E5E5E5] dark:border-[#3B4A55] bg-muted/50',
                  )}
                  style={
                    energyLevel === level.value
                      ? {
                          borderColor: level.color,
                          backgroundColor: `${level.color}15`,
                          color: level.color,
                        }
                      : undefined
                  }
                >
                  <span className="text-lg font-extrabold leading-none">
                    {'⚡'.repeat(level.bolts)}
                  </span>
                  <span className="text-xs font-bold">{level.label}</span>
                </button>
              ))}
            </div>
          </div>
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
            <Label className="font-bold">Subtarefas (Checklist)</Label>
            <div className="flex gap-2">
              <Input
                value={subtaskInput}
                onChange={(e) => setSubtaskInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    addSubtask()
                  }
                }}
                placeholder="Adicionar subtarefa..."
                className="rounded-2xl bg-muted/50 border-transparent font-semibold"
              />
              <button
                type="button"
                onClick={addSubtask}
                className="shrink-0 w-10 h-10 rounded-2xl bg-[#58CC02] text-white flex items-center justify-center border-2 border-b-4 border-[#46A302] active:translate-y-1 active:border-b-0 transition-all"
              >
                <Plus className="w-5 h-5" strokeWidth={2.5} />
              </button>
            </div>
            {subtasks.length > 0 && (
              <div className="space-y-2 mt-2">
                {subtasks.map((st, i) => (
                  <div key={i} className="flex items-center gap-2 p-2.5 rounded-2xl bg-muted/50">
                    <span className="w-2 h-2 rounded-full bg-muted-foreground" />
                    <span className="flex-1 text-sm font-semibold">{st.title}</span>
                    <button
                      type="button"
                      onClick={() => removeSubtask(i)}
                      className="text-muted-foreground hover:text-[#FF4B4B] transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
          <GameButton type="submit" variant="primary" size="lg" className="w-full">
            {editTask ? 'Salvar' : 'Criar Tarefa'}
          </GameButton>
        </form>
      </DialogContent>
    </Dialog>
  )
}
