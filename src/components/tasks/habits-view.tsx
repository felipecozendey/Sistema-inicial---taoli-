import { useMemo } from 'react'
import { Habit, useAppStore } from '@/stores/useAppStore'
import { HabitCard } from '@/components/habits/habit-card'
import { Shield, Sparkles, Flame, Trophy, Repeat } from 'lucide-react'

interface HabitsViewProps {
  selectedTags: string[]
}

export function HabitsView({ selectedTags }: HabitsViewProps) {
  const { habits } = useAppStore()

  // Filtragem puramente síncrona por tags (Zero Lag)
  const filteredHabits = useMemo(() => {
    return habits.filter((h) => selectedTags.length === 0 || selectedTags.includes(h.tagId))
  }, [habits, selectedTags])

  // Métricas consolidadas dos hábitos
  const today = new Date().toISOString().split('T')[0]
  const completedTodayCount = filteredHabits.filter((h) => h.completions.includes(today)).length
  const totalShields = filteredHabits.reduce((acc, h) => acc + (h.escudos || 0), 0)
  const activeStreaksCount = filteredHabits.filter((h) => h.completions.length > 0).length

  return (
    <div className="space-y-6">
      {/* Banner de Status dos Hábitos - Escudos e Progresso estilo Duolingo */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Card Concluídos Hoje */}
        <div className="flex items-center gap-3.5 p-4 rounded-3xl bg-card border-2 border-b-4 border-[#58CC02] shadow-sm">
          <div className="w-12 h-12 rounded-2xl bg-[#58CC02]/15 flex items-center justify-center shrink-0">
            <Sparkles className="w-6 h-6 text-[#58CC02]" strokeWidth={2.5} />
          </div>
          <div>
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Hoje</p>
            <p className="text-xl font-black text-foreground">
              {completedTodayCount} / {filteredHabits.length}
            </p>
            <p className="text-[11px] font-semibold text-[#58CC02]">
              {filteredHabits.length > 0 && completedTodayCount === filteredHabits.length
                ? 'Todos feitos! 🎯'
                : 'hábitos concluídos'}
            </p>
          </div>
        </div>

        {/* Card Escudos Ativos */}
        <div className="flex items-center gap-3.5 p-4 rounded-3xl bg-card border-2 border-b-4 border-[#1CB0F6] shadow-sm">
          <div className="w-12 h-12 rounded-2xl bg-[#1CB0F6]/15 flex items-center justify-center shrink-0">
            <Shield className="w-6 h-6 text-[#1CB0F6]" strokeWidth={2.5} />
          </div>
          <div>
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              Escudos de Proteção
            </p>
            <p className="text-xl font-black text-[#1CB0F6]">{totalShields}</p>
            <p className="text-[11px] font-semibold text-muted-foreground">
              Protegendo seus streaks
            </p>
          </div>
        </div>

        {/* Card Hábitos em Andamento */}
        <div className="flex items-center gap-3.5 p-4 rounded-3xl bg-card border-2 border-b-4 border-[#FFC800] shadow-sm">
          <div className="w-12 h-12 rounded-2xl bg-[#FFC800]/15 flex items-center justify-center shrink-0">
            <Flame className="w-6 h-6 text-[#E0A800]" strokeWidth={2.5} />
          </div>
          <div>
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              Com Sequência
            </p>
            <p className="text-xl font-black text-foreground">{activeStreaksCount}</p>
            <p className="text-[11px] font-semibold text-[#E0A800]">Hábitos mantendo fogo 🔥</p>
          </div>
        </div>
      </div>

      {/* Lista de Hábitos Ativos ou Estado Vazio */}
      {filteredHabits.length === 0 ? (
        <div className="text-center p-10 bg-card rounded-3xl border-2 border-b-4 border-dashed border-[#E5E5E5] dark:border-[#3B4A55] space-y-4 animate-fade-in">
          <div className="w-16 h-16 mx-auto rounded-3xl bg-[#58CC02]/10 flex items-center justify-center">
            <Repeat className="w-8 h-8 text-[#58CC02]" strokeWidth={2.5} />
          </div>
          <div className="space-y-1">
            <h4 className="text-lg font-extrabold">Nenhum hábito cadastrado</h4>
            <p className="text-sm text-muted-foreground max-w-sm mx-auto font-medium">
              Comece pequenos rituais diários para transformar sua rotina com consistência!
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredHabits.map((habit) => (
            <HabitCard key={habit.id} habit={habit} />
          ))}
        </div>
      )}
    </div>
  )
}
