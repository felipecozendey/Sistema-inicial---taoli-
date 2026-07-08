import { useState, ReactNode } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { useAppStore } from '@/stores/useAppStore'

export function TaskModal({ children }: { children: ReactNode }) {
  const { categories, addTask } = useAppStore()
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium')
  const [isRoutine, setIsRoutine] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title || !categoryId) return
    addTask({
      title,
      categoryId,
      priority,
      isRoutine,
      date: new Date().toISOString().split('T')[0],
      streak: isRoutine ? 0 : undefined,
    })
    setOpen(false)
    setTitle('')
    setCategoryId('')
    setIsRoutine(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px] rounded-[2rem] p-6">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">Nova Meta</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6 mt-4">
          <div className="space-y-2">
            <Label htmlFor="title">O que você quer realizar?</Label>
            <Input
              id="title"
              placeholder="Ex: Exercício Físico"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="rounded-xl h-12"
              required
            />
          </div>
          <div className="space-y-2">
            <Label>Categoria</Label>
            <Select value={categoryId} onValueChange={setCategoryId} required>
              <SelectTrigger className="rounded-xl h-12">
                <SelectValue placeholder="Selecione a área" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Prioridade</Label>
            <Select value={priority} onValueChange={(v: any) => setPriority(v)}>
              <SelectTrigger className="rounded-xl h-12">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Baixa</SelectItem>
                <SelectItem value="medium">Média</SelectItem>
                <SelectItem value="high">Alta</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center space-x-2 pt-2">
            <Checkbox
              id="routine"
              checked={isRoutine}
              onCheckedChange={(c: boolean) => setIsRoutine(c)}
            />
            <label htmlFor="routine" className="text-sm font-medium leading-none cursor-pointer">
              Transformar em Rotina (Hábito Contínuo)
            </label>
          </div>
          <Button
            type="submit"
            className="w-full h-12 rounded-xl text-md font-semibold active:scale-95 transition-transform"
          >
            Adicionar à jornada
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
