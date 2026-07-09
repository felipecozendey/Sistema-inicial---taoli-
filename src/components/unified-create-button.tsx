import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { GameButton } from '@/components/ui/game-button'
import { TaskForm } from '@/components/tasks/task-form'
import { HabitForm } from '@/components/habits/habit-form'
import { Plus, CheckSquare, Repeat } from 'lucide-react'

export function UnifiedCreateButton() {
  const [selectOpen, setSelectOpen] = useState(false)
  const [taskFormOpen, setTaskFormOpen] = useState(false)
  const [habitFormOpen, setHabitFormOpen] = useState(false)

  const handleSelect = (type: 'task' | 'habit') => {
    setSelectOpen(false)
    setTimeout(() => {
      if (type === 'task') setTaskFormOpen(true)
      else setHabitFormOpen(true)
    }, 200)
  }

  return (
    <>
      <Dialog open={selectOpen} onOpenChange={setSelectOpen}>
        <DialogTrigger asChild>
          <GameButton variant="primary" size="md" className="gap-2">
            <Plus className="w-5 h-5" strokeWidth={2.5} /> Criar Novo
          </GameButton>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[400px] rounded-3xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-extrabold text-center">Criar Novo</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 mt-4">
            <button
              onClick={() => handleSelect('task')}
              className="flex flex-col items-center gap-3 p-6 rounded-3xl border-2 border-b-4 border-[#58CC02] bg-[#58CC02]/10 hover:bg-[#58CC02]/20 transition-all active:translate-y-1 active:border-b-0"
            >
              <div className="w-14 h-14 rounded-2xl bg-[#58CC02] flex items-center justify-center">
                <CheckSquare className="w-7 h-7 text-white" strokeWidth={2.5} />
              </div>
              <span className="font-extrabold text-[#58CC02]">Nova Tarefa</span>
            </button>
            <button
              onClick={() => handleSelect('habit')}
              className="flex flex-col items-center gap-3 p-6 rounded-3xl border-2 border-b-4 border-[#FFC800] bg-[#FFC800]/10 hover:bg-[#FFC800]/20 transition-all active:translate-y-1 active:border-b-0"
            >
              <div className="w-14 h-14 rounded-2xl bg-[#FFC800] flex items-center justify-center">
                <Repeat className="w-7 h-7 text-[#374151]" strokeWidth={2.5} />
              </div>
              <span className="font-extrabold text-[#374151]">Novo Hábito</span>
            </button>
          </div>
        </DialogContent>
      </Dialog>
      <TaskForm open={taskFormOpen} onOpenChange={setTaskFormOpen} hideTrigger />
      <HabitForm open={habitFormOpen} onOpenChange={setHabitFormOpen} hideTrigger />
    </>
  )
}
