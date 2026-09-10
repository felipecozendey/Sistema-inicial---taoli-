import React, { useEffect, useState } from 'react'
import { useGardenStore, GardenPlant } from '@/stores/useGardenStore'
import { useTaskSettingsStore } from '@/stores/useTaskSettingsStore'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  Sprout,
  Flame,
  Trophy,
  Sparkles,
  Droplet,
  PlusCircle,
  CheckCircle2,
  Info,
  Flower2,
} from 'lucide-react'

export const GardenView: React.FC = () => {
  const { state, plants, isLoading, fetchGarden, waterPlant, harvestPlant, unlockNextPlot } =
    useGardenStore()
  const { settings, fetchSettings } = useTaskSettingsStore()
  const [selectedPlant, setSelectedPlant] = useState<GardenPlant | null>(null)

  useEffect(() => {
    fetchGarden()
    fetchSettings()
  }, [fetchGarden, fetchSettings])

  const ptsPerLevel = settings.points_per_level || 100
  const currentLevelProgress = ((state.points % ptsPerLevel) / ptsPerLevel) * 100
  const nextLevelPoints = state.level * ptsPerLevel - state.points

  const getStageInfo = (stage: number) => {
    switch (stage) {
      case 0:
        return {
          name: 'Semente',
          emoji: '🌰',
          iconBg: 'bg-amber-100 dark:bg-amber-950/60 text-amber-600',
        }
      case 1:
        return {
          name: 'Broto',
          emoji: '🌱',
          iconBg: 'bg-lime-100 dark:bg-lime-950/60 text-lime-600',
        }
      case 2:
        return {
          name: 'Crescendo',
          emoji: '🌿',
          iconBg: 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600',
        }
      case 3:
      default:
        return {
          name: 'Florida',
          emoji: '🌸',
          iconBg: 'bg-rose-100 dark:bg-rose-950/60 text-rose-500',
        }
    }
  }

  const plots = Array.from({ length: state.plot_count }, (_, i) => {
    const plant = plants.find((p) => p.plot_index === i)
    return { index: i, plant }
  })

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-300">
      {/* Top Banner Gamification Card */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#58CC02]/15 via-emerald-500/10 to-[#1CB0F6]/15 border-2 border-[#58CC02]/30 p-6 shadow-sm">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-3xl bg-[#58CC02] text-white flex items-center justify-center text-3xl shadow-md border-b-4 border-[#46a302]">
              <Flower2 className="w-8 h-8" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-2xl font-black tracking-tight">Meu Jardim de Conquistas</h2>
                <Badge className="bg-[#58CC02] text-white hover:bg-[#58CC02] border-0 font-bold px-2.5 py-0.5 rounded-full">
                  Nível {state.level}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground mt-0.5">
                Cada tarefa e hábito concluído faz florescer uma vida no seu jardim!
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            {/* Points pill */}
            <div className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-card rounded-2xl border-2 border-border shadow-sm">
              <Sparkles className="w-5 h-5 text-amber-500 animate-pulse" />
              <div>
                <p className="text-[10px] uppercase font-bold text-muted-foreground">Pontos</p>
                <p className="text-lg font-black text-foreground leading-none">{state.points}</p>
              </div>
            </div>

            {/* Streak pill */}
            <div className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-card rounded-2xl border-2 border-border shadow-sm">
              <Flame className="w-5 h-5 text-orange-500" />
              <div>
                <p className="text-[10px] uppercase font-bold text-muted-foreground">Ofensiva</p>
                <p className="text-lg font-black text-foreground leading-none">
                  {state.streak_days} dias
                </p>
              </div>
            </div>

            {/* Plots pill */}
            <div className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-card rounded-2xl border-2 border-border shadow-sm">
              <Sprout className="w-5 h-5 text-[#58CC02]" />
              <div>
                <p className="text-[10px] uppercase font-bold text-muted-foreground">Canteiros</p>
                <p className="text-lg font-black text-foreground leading-none">
                  {plants.length}/{state.plot_count}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Progress to next level */}
        <div className="mt-6 pt-4 border-t border-border/60">
          <div className="flex justify-between items-center text-xs font-semibold mb-1.5">
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <Trophy className="w-3.5 h-3.5 text-amber-500" />
              Progresso para o Nível {state.level + 1}
            </span>
            <span className="text-[#58CC02] font-bold">
              {Math.max(0, nextLevelPoints)} pts restantes
            </span>
          </div>
          <Progress
            value={currentLevelProgress}
            className="h-3 rounded-full bg-muted/60 [&>div]:bg-[#58CC02]"
          />
        </div>
      </div>

      {/* Action / Help banner */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-800/40 text-amber-900 dark:text-amber-200 text-sm">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-200/80 dark:bg-amber-900/60 flex items-center justify-center shrink-0">
            <Info className="w-5 h-5 text-amber-700 dark:text-amber-300" />
          </div>
          <div>
            <span className="font-bold">Como funciona a gamificação:</span> Concluir tarefas dá +
            {settings.points_per_task} pts e planta mudas. Concluir hábitos dá +
            {settings.points_per_habit} pts e acelera o crescimento até a flor desabrochar!
          </div>
        </div>

        <Button
          onClick={() => unlockNextPlot()}
          variant="outline"
          className="shrink-0 rounded-2xl border-2 border-amber-400 bg-white hover:bg-amber-100/50 dark:bg-card dark:hover:bg-amber-950 font-bold text-xs gap-1.5 text-amber-800 dark:text-amber-200 shadow-sm"
        >
          <PlusCircle className="w-4 h-4 text-amber-600" />
          Novo Canteiro ({settings.unlock_plot_cost} pts)
        </Button>
      </div>

      {/* Grid of plots */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {plots.map(({ index, plant }) => {
          if (!plant) {
            return (
              <Card
                key={index}
                className="group relative rounded-3xl border-2 border-dashed border-border/80 hover:border-[#58CC02]/60 hover:bg-[#58CC02]/5 transition-all duration-200 flex flex-col items-center justify-center min-h-[170px] p-4 text-center cursor-pointer"
              >
                <div className="w-12 h-12 rounded-2xl bg-muted/60 group-hover:bg-[#58CC02]/20 flex items-center justify-center text-muted-foreground group-hover:text-[#58CC02] transition-colors mb-2">
                  <Sprout className="w-6 h-6 stroke-[1.5]" />
                </div>
                <span className="text-xs font-bold text-muted-foreground group-hover:text-foreground">
                  Canteiro #{index + 1}
                </span>
                <span className="text-[11px] text-muted-foreground/70 mt-0.5">
                  Livre para plantio
                </span>
                <span className="text-[10px] text-[#58CC02] font-semibold opacity-0 group-hover:opacity-100 transition-opacity mt-1">
                  Conclua tarefas 🌱
                </span>
              </Card>
            )
          }

          const stage = getStageInfo(plant.stage)

          return (
            <Card
              key={plant.id}
              onClick={() => setSelectedPlant(plant)}
              className="relative overflow-hidden rounded-3xl border-2 border-border hover:border-[#58CC02] transition-all duration-200 flex flex-col items-center justify-between min-h-[170px] p-4 text-center cursor-pointer shadow-sm hover:shadow group bg-card"
            >
              {/* Top tag */}
              <div className="w-full flex items-center justify-between">
                <span className="text-[10px] font-bold text-muted-foreground">
                  #{plant.plot_index + 1}
                </span>
                <Badge
                  variant="outline"
                  className={`text-[10px] px-1.5 py-0 rounded-md font-bold ${stage.iconBg}`}
                >
                  {stage.name}
                </Badge>
              </div>

              {/* Plant visual with bounce on hover */}
              <div className="my-2 flex flex-col items-center">
                <div className="text-4xl transition-transform duration-200 group-hover:scale-125 select-none drop-shadow">
                  {stage.emoji}
                </div>
                <h4 className="font-bold text-xs mt-2 line-clamp-1">{plant.species}</h4>
              </div>

              {/* Action buttons */}
              <div className="w-full flex items-center gap-1.5 pt-1">
                {plant.stage < 3 ? (
                  <Button
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      waterPlant(plant.plot_index)
                    }}
                    className="w-full h-8 text-[11px] font-bold rounded-xl bg-sky-500 hover:bg-sky-600 text-white border-b-2 border-sky-700 active:border-b-0 gap-1 px-2"
                  >
                    <Droplet className="w-3.5 h-3.5 fill-current" />
                    Regar
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      harvestPlant(plant.plot_index)
                    }}
                    className="w-full h-8 text-[11px] font-bold rounded-xl bg-[#58CC02] hover:bg-[#46a302] text-white border-b-2 border-[#46a302] active:border-b-0 gap-1 px-2"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Colher
                  </Button>
                )}
              </div>
            </Card>
          )
        })}
      </div>
    </div>
  )
}

export default GardenView
