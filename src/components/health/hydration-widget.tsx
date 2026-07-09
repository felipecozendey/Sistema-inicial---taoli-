import { useState } from 'react'
import { useAppStore } from '@/stores/useAppStore'
import { Droplets, Trash2, Pencil } from 'lucide-react'
import { GameProgress } from '@/components/ui/game-progress'
import { Input } from '@/components/ui/input'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'

export function HydrationWidget() {
  const { user, hydrationLogs, addHydrationLog, deleteHydrationLog, setWaterGoal } = useAppStore()
  const today = new Date().toISOString().split('T')[0]
  const todayLogs = hydrationLogs
    .filter((l) => l.date === today)
    .sort((a, b) => b.timestamp.localeCompare(a.timestamp))
  const total = todayLogs.reduce((s, l) => s + l.amount, 0)
  const waterGoal = user.waterGoal || 2000
  const percent = Math.min(100, Math.round((total / waterGoal) * 100))
  const [customAmount, setCustomAmount] = useState('')
  const [goalInput, setGoalInput] = useState(String(waterGoal))
  const [goalOpen, setGoalOpen] = useState(false)

  const handleAddCustom = () => {
    const amount = parseInt(customAmount)
    if (amount > 0 && amount <= 9999) {
      addHydrationLog(today, amount)
      setCustomAmount('')
    }
  }

  const handleSaveGoal = () => {
    const goal = parseInt(goalInput)
    if (goal > 0 && goal <= 9999) {
      setWaterGoal(goal)
      setGoalOpen(false)
    }
  }

  const mostRecent = todayLogs[0]
  const hasMultiple = todayLogs.length > 1

  return (
    <div className="bg-card border-2 border-b-4 border-[#E5E5E5] dark:border-[#3B4A55] rounded-3xl p-6 shadow-sm flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <div className="w-10 h-10 rounded-2xl bg-[#1CB0F6]/15 flex items-center justify-center">
          <Droplets className="w-5 h-5 text-[#1CB0F6]" strokeWidth={2.5} />
        </div>
        <h3 className="text-lg font-extrabold">Hidratação</h3>
      </div>

      <div className="flex items-baseline gap-2">
        <span className="text-3xl font-extrabold text-[#1CB0F6]">{total}</span>
        <span className="text-sm font-bold text-muted-foreground">/ {waterGoal} ml</span>
        <Popover
          open={goalOpen}
          onOpenChange={(open) => {
            setGoalOpen(open)
            if (open) setGoalInput(String(waterGoal))
          }}
        >
          <PopoverTrigger asChild>
            <button className="ml-1 p-1 rounded-lg hover:bg-muted/50 transition-colors">
              <Pencil className="w-3.5 h-3.5 text-muted-foreground" strokeWidth={2.5} />
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-56 rounded-2xl">
            <div className="space-y-3">
              <p className="text-sm font-extrabold">Meta diária (ml)</p>
              <Input
                type="number"
                min="1"
                max="9999"
                value={goalInput}
                onChange={(e) => setGoalInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSaveGoal()}
                className="rounded-2xl bg-muted/50 border-transparent font-semibold"
              />
              <button
                onClick={handleSaveGoal}
                className="w-full py-2.5 rounded-2xl bg-[#1CB0F6] text-white font-extrabold border-b-4 border-[#0E8FCC] active:translate-y-1 active:border-b-0 transition-all duration-150"
              >
                Salvar
              </button>
            </div>
          </PopoverContent>
        </Popover>
      </div>

      <GameProgress value={percent} variant="info" height="lg" />

      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => addHydrationLog(today, 250)}
          className="py-3 rounded-2xl bg-[#1CB0F6] text-white font-extrabold border-b-4 border-[#0E8FCC] active:translate-y-1 active:border-b-0 transition-all duration-150"
        >
          +250ml
        </button>
        <button
          onClick={() => addHydrationLog(today, 500)}
          className="py-3 rounded-2xl bg-[#1CB0F6] text-white font-extrabold border-b-4 border-[#0E8FCC] active:translate-y-1 active:border-b-0 transition-all duration-150"
        >
          +500ml
        </button>
      </div>

      <div className="flex gap-2">
        <Input
          type="number"
          min="1"
          max="9999"
          value={customAmount}
          onChange={(e) => setCustomAmount(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAddCustom()}
          placeholder="Custom (ml)"
          className="rounded-2xl bg-muted/50 border-transparent font-semibold"
        />
        <button
          onClick={handleAddCustom}
          className="px-4 py-2 rounded-2xl bg-[#1CB0F6] text-white font-extrabold border-b-4 border-[#0E8FCC] active:translate-y-1 active:border-b-0 transition-all duration-150 whitespace-nowrap"
        >
          Add
        </button>
      </div>

      {mostRecent && (
        <div className="space-y-2 mt-1">
          <div className="flex items-center justify-between bg-muted/40 rounded-xl px-3 py-2">
            <div className="flex items-center gap-2">
              <Droplets className="w-4 h-4 text-[#1CB0F6]" strokeWidth={2.5} />
              <span className="text-sm font-bold">{mostRecent.amount}ml</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-muted-foreground">
                {new Date(mostRecent.timestamp).toLocaleTimeString('pt-BR', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
              <button
                onClick={() => deleteHydrationLog(mostRecent.id)}
                className="p-1 hover:bg-[#FF4B4B]/10 hover:text-[#FF4B4B] rounded-full transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" strokeWidth={2.5} />
              </button>
            </div>
          </div>
          {hasMultiple && (
            <p className="text-xs font-semibold text-muted-foreground text-center">
              Ver histórico completo na aba ao lado
            </p>
          )}
        </div>
      )}
    </div>
  )
}
