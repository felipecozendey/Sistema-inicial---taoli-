import { useState } from 'react'
import { Habit, useAppStore } from '@/stores/useAppStore'
import { Check, Flame, Trash2, Shield, Pencil } from 'lucide-react'
import { cn } from '@/lib/utils'
import { calculateStreak, getHabitEvolution, getHabitWeeklyProgress } from '@/lib/habit-utils'
import { GameProgress } from '@/components/ui/game-progress'
import { HabitForm } from '@/components/habits/habit-form'

export function HabitCard({ habit }: { habit: Habit }) {
  const { tags, toggleHabitCompletion, deleteHabit } = useAppStore()
  const [editOpen, setEditOpen] = useState(false)
  const tag = tags.find((t) => t.id === habit.tagId)
  const today = new Date().toISOString().split('T')[0]
  const completedToday = habit.completions.includes(today)
  const streak = calculateStreak(habit.completions, habit.frozenDates)
  const evolution = getHabitEvolution(streak)
  const { current, goal, percent } = getHabitWeeklyProgress(habit)
  const isWeeklyMeta = habit.weeklyGoal && habit.weeklyGoal > 0

  return (
    <div
      className={cn(
        'group flex flex-col gap-3 p-4 rounded-3xl bg-card border-2 border-b-4 border-[#E5E5E5] dark:border-[#3B4A55] shadow-sm transition-all duration-200 animate-slide-up',
        completedToday ? 'opacity-80' : 'hover:shadow-md hover:-translate-y-0.5',
      )}
    >
      <div className="flex items-center gap-3">
        <button
          onClick={() => toggleHabitCompletion(habit.id, today)}
          className={cn(
            'w-8 h-8 shrink-0 rounded-full border-2 border-b-4 flex items-center justify-center transition-all active:translate-y-1 active:border-b-0',
            completedToday
              ? 'bg-[#58CC02] border-[#46A302] text-white'
              : 'border-[#E5E5E5] dark:border-[#3B4A55] text-transparent hover:border-[#58CC02]',
          )}
        >
          <Check className="w-4 h-4" strokeWidth={3} />
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-xl shrink-0" title={`${evolution.tier} - ${streak} dias`}>
              {evolution.emoji}
            </span>
            <p
              className={cn(
                'font-bold text-base truncate',
                completedToday && 'line-through text-muted-foreground',
              )}
            >
              {habit.title}
            </p>
          </div>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            {tag && (
              <span
                className="text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider"
                style={{ backgroundColor: tag.color + '20', color: tag.color }}
              >
                {tag.name}
              </span>
            )}
            {streak > 0 && (
              <span className="flex items-center text-[#374151] font-extrabold text-xs bg-[#FFC800] px-2 py-0.5 rounded-full">
                <Flame className="w-3 h-3 mr-1" strokeWidth={2.5} /> {streak}
              </span>
            )}
            {habit.escudos > 0 && (
              <span
                className="flex items-center text-[#1CB0F6] font-extrabold text-xs bg-[#1CB0F6]/10 px-2 py-0.5 rounded-full"
                title="Escudos de proteção de streak"
              >
                <Shield className="w-3 h-3 mr-1" strokeWidth={2.5} /> {habit.escudos}
              </span>
            )}
            <span className="text-xs text-muted-foreground font-semibold">
              {isWeeklyMeta
                ? `${habit.weeklyGoal}x/semana`
                : habit.frequency === 'daily'
                  ? 'Diário'
                  : `${habit.weekDays.length}x semana`}
            </span>
          </div>
        </div>
        <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => setEditOpen(true)}
            className="p-2 text-muted-foreground hover:text-[#1CB0F6] rounded-full hover:bg-[#1CB0F6]/10 transition-colors"
            aria-label="Edit habit"
          >
            <Pencil className="w-4 h-4" strokeWidth={2.5} />
          </button>
          <button
            onClick={() => deleteHabit(habit.id)}
            className="p-2 text-muted-foreground hover:text-[#FF4B4B] rounded-full hover:bg-[#FF4B4B]/10 transition-colors"
            aria-label="Delete habit"
          >
            <Trash2 className="w-4 h-4" strokeWidth={2.5} />
          </button>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <GameProgress value={percent} variant={isWeeklyMeta ? 'gold' : 'success'} height="sm" />
        <span className="text-xs font-bold text-muted-foreground whitespace-nowrap">
          {isWeeklyMeta ? `${current}/${goal}` : `${percent}%`}
        </span>
      </div>
      <HabitForm editHabit={habit} hideTrigger open={editOpen} onOpenChange={setEditOpen} />
    </div>
  )
}
