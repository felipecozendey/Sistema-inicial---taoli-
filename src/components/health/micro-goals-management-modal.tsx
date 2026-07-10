import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { GameButton } from '@/components/ui/game-button'
import { useAppStore } from '@/stores/useAppStore'
import { Plus, Pencil, Trash2, Check, X } from 'lucide-react'
import { cn } from '@/lib/utils'

export function MicroGoalsManagementModal({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
}) {
  const {
    nutritionMicroGoals,
    addNutritionMicroGoal,
    updateNutritionMicroGoal,
    deleteNutritionMicroGoal,
  } = useAppStore()
  const [newTitle, setNewTitle] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState('')

  const handleAdd = async () => {
    if (!newTitle.trim()) return
    await addNutritionMicroGoal(newTitle.trim())
    setNewTitle('')
  }

  const handleSaveEdit = async () => {
    if (!editingId || !editTitle.trim()) return
    await updateNutritionMicroGoal(editingId, { title: editTitle.trim() })
    setEditingId(null)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[420px] rounded-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-extrabold">Gerenciar Micro-metas</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 mt-4">
          <div className="flex gap-2">
            <Input
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Nova meta (ex: Beber chá verde)"
              className="rounded-2xl bg-muted/50 border-transparent font-bold text-sm"
              onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
            />
            <GameButton onClick={handleAdd} variant="primary" size="sm" className="shrink-0">
              <Plus className="w-4 h-4" strokeWidth={3} />
            </GameButton>
          </div>
          <div className="space-y-2">
            {nutritionMicroGoals.map((goal) => (
              <div key={goal.id} className="flex items-center gap-2 p-3 rounded-2xl bg-muted/30">
                {editingId === goal.id ? (
                  <>
                    <Input
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      className="h-8 rounded-lg font-bold text-sm flex-1"
                      autoFocus
                      onKeyDown={(e) => e.key === 'Enter' && handleSaveEdit()}
                    />
                    <button
                      onClick={handleSaveEdit}
                      className="p-2 rounded-lg bg-[#58CC02] text-white"
                    >
                      <Check className="w-4 h-4" strokeWidth={3} />
                    </button>
                    <button onClick={() => setEditingId(null)} className="p-2 rounded-lg bg-muted">
                      <X className="w-4 h-4" strokeWidth={3} />
                    </button>
                  </>
                ) : (
                  <>
                    <span className="text-lg">{goal.emoji || '✅'}</span>
                    <span className="text-sm font-extrabold flex-1">{goal.title}</span>
                    <span
                      className={cn(
                        'text-xs font-bold px-2 py-0.5 rounded-full',
                        goal.isActive
                          ? 'text-[#58CC02] bg-[#58CC02]/10'
                          : 'text-muted-foreground bg-muted',
                      )}
                    >
                      {goal.isActive ? 'Ativa' : 'Inativa'}
                    </span>
                    <button
                      onClick={() =>
                        updateNutritionMicroGoal(goal.id, { isActive: !goal.isActive })
                      }
                      className="text-xs font-bold text-[#1CB0F6] hover:underline px-1"
                    >
                      {goal.isActive ? 'Desativar' : 'Ativar'}
                    </button>
                    <button
                      onClick={() => {
                        setEditingId(goal.id)
                        setEditTitle(goal.title)
                      }}
                      className="p-1.5 rounded-lg hover:bg-muted transition-colors"
                    >
                      <Pencil className="w-3.5 h-3.5" strokeWidth={2.5} />
                    </button>
                    <button
                      onClick={() => deleteNutritionMicroGoal(goal.id)}
                      className="p-1.5 rounded-lg hover:bg-[#FF4B4B]/10 hover:text-[#FF4B4B] transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" strokeWidth={2.5} />
                    </button>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
