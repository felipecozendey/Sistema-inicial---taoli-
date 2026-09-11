import React, { useState, useEffect } from 'react'
import { useGardenStore } from '@/stores/useGardenStore'
import { useGardenDecorationsStore } from '@/stores/useGardenDecorationsStore'
import { useTaskSettingsStore } from '@/stores/useTaskSettingsStore'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import {
  Sparkles,
  Flame,
  Trophy,
  ShoppingBag,
  HelpCircle,
  CheckCircle2,
  Package,
} from 'lucide-react'
import { GardenPixelCanvas } from './GardenPixelCanvas'
import { GardenShopModal } from './GardenShopModal'
import { GardenEditToolbar } from './GardenEditToolbar'

export const GardenView: React.FC = () => {
  const { state, fetchGarden } = useGardenStore()
  const { placed, inventory, fetchDecorations } = useGardenDecorationsStore()
  const { settings, fetchSettings } = useTaskSettingsStore()

  const [shopOpen, setShopOpen] = useState(false)
  const [showTutorial, setShowTutorial] = useState(false)

  useEffect(() => {
    fetchGarden()
    fetchDecorations()
    fetchSettings()
  }, [fetchGarden, fetchDecorations, fetchSettings])

  // Mini-tutorial: exibe se nunca colocou nenhum item e o inventário estiver vazio
  useEffect(() => {
    const hasSeenTutorial = localStorage.getItem('vibecoding_garden_tutorial_seen')
    if (!hasSeenTutorial && placed.length <= 1) {
      setShowTutorial(true)
    }
  }, [placed.length])

  const dismissTutorial = () => {
    setShowTutorial(false)
    localStorage.setItem('vibecoding_garden_tutorial_seen', 'true')
  }

  const ptsPerLevel = settings.points_per_level || 100
  const currentLevelProgress = ((state.points % ptsPerLevel) / ptsPerLevel) * 100
  const nextLevelPoints = state.level * ptsPerLevel - state.points
  const totalDecorationsCount = placed.length

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-300">
      {/* Top Banner Gamification Card - Duolingo Design System */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#58CC02]/20 via-emerald-500/15 to-[#1CB0F6]/20 border-2 border-b-4 border-[#58CC02]/40 p-6 shadow-sm">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            {/* Ícone Pixel Art da Fazendinha */}
            <div className="w-16 h-16 rounded-3xl bg-[#58CC02] text-white flex items-center justify-center text-3xl shadow-md border-b-4 border-[#46a302] shrink-0">
              <svg
                viewBox="0 0 24 24"
                className="w-10 h-10"
                style={{ shapeRendering: 'crispEdges' }}
              >
                <rect x="8" y="10" width="8" height="10" fill="#78350F" />
                <rect x="6" y="7" width="12" height="3" fill="#DC2626" />
                <rect x="8" y="5" width="8" height="2" fill="#EF4444" />
                <rect x="10" y="3" width="4" height="2" fill="#F87171" />
                <rect x="11" y="14" width="2" height="6" fill="#1C1917" />
                {/* Janela iluminada */}
                <rect x="10" y="9" width="4" height="3" fill="#FEF08A" />
              </svg>
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-2xl font-black tracking-tight text-foreground">
                  Fazendinha Pixel
                </h2>
                <Badge className="bg-[#58CC02] text-white hover:bg-[#58CC02] border-0 font-black px-2.5 py-0.5 rounded-full text-xs">
                  Nível {state.level}
                </Badge>
              </div>
              <p className="text-xs sm:text-sm text-muted-foreground font-semibold mt-0.5">
                Jardim livre 16-bit: complete tarefas e hábitos para ornamentar sua fazendinha!
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            {/* Points pill */}
            <div className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-card rounded-2xl border-2 border-b-4 border-border shadow-sm">
              <Sparkles className="w-5 h-5 text-amber-500 animate-pulse" />
              <div>
                <p className="text-[10px] uppercase font-bold text-muted-foreground">Pontos</p>
                <p className="text-lg font-black text-[#58CC02] leading-none">{state.points}</p>
              </div>
            </div>

            {/* Streak pill */}
            <div className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-card rounded-2xl border-2 border-b-4 border-border shadow-sm">
              <Flame className="w-5 h-5 text-orange-500" />
              <div>
                <p className="text-[10px] uppercase font-bold text-muted-foreground">Ofensiva</p>
                <p className="text-lg font-black text-foreground leading-none">
                  {state.streak_days} {state.streak_days === 1 ? 'dia' : 'dias'}
                </p>
              </div>
            </div>

            {/* Itens Colocados pill */}
            <div className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-card rounded-2xl border-2 border-b-4 border-border shadow-sm">
              <Package className="w-5 h-5 text-[#1CB0F6]" />
              <div>
                <p className="text-[10px] uppercase font-bold text-muted-foreground">Ornamentos</p>
                <p className="text-lg font-black text-foreground leading-none">
                  {totalDecorationsCount}
                </p>
              </div>
            </div>

            {/* Botão de abrir lojinha no header */}
            <Button
              type="button"
              onClick={() => setShopOpen(true)}
              className="rounded-2xl bg-[#58CC02] hover:bg-[#46a302] text-white border-b-4 border-[#46a302] active:border-b-0 active:translate-y-1 font-black text-xs h-11 px-4 shadow-sm gap-2 transition-all ml-auto md:ml-0"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Loja Pixel</span>
            </Button>
          </div>
        </div>

        {/* Progress to next level */}
        <div className="mt-6 pt-4 border-t border-border/60">
          <div className="flex justify-between items-center text-xs font-semibold mb-1.5">
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <Trophy className="w-3.5 h-3.5 text-amber-500" />
              Progresso para o Nível {state.level + 1}
            </span>
            <span className="text-[#58CC02] font-black">
              {Math.max(0, nextLevelPoints)} pts restantes
            </span>
          </div>
          <Progress
            value={currentLevelProgress}
            className="h-3 rounded-full bg-muted/60 [&>div]:bg-[#58CC02]"
          />
        </div>
      </div>

      {/* Mini Tutorial de 3 passos */}
      {showTutorial && (
        <div className="relative overflow-hidden rounded-3xl bg-amber-50/90 dark:bg-amber-950/40 border-2 border-amber-300 dark:border-amber-700/60 p-5 shadow-sm animate-in fade-in-50">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0" />
                <h4 className="font-black text-sm text-amber-950 dark:text-amber-100">
                  Bem-vindo à sua Fazendinha Pixel! Como funciona o loop:
                </h4>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                <div className="flex items-start gap-2 text-xs text-amber-900 dark:text-amber-200">
                  <span className="w-5 h-5 rounded-full bg-amber-200 dark:bg-amber-900 text-amber-900 dark:text-amber-100 flex items-center justify-center font-black shrink-0">
                    1
                  </span>
                  <span>
                    <strong>Faça atividades:</strong> Conclua tarefas e hábitos diários para ganhar
                    pontos.
                  </span>
                </div>
                <div className="flex items-start gap-2 text-xs text-amber-900 dark:text-amber-200">
                  <span className="w-5 h-5 rounded-full bg-amber-200 dark:bg-amber-900 text-amber-900 dark:text-amber-100 flex items-center justify-center font-black shrink-0">
                    2
                  </span>
                  <span>
                    <strong>Compre na Lojinha:</strong> Escolha flores, árvores, fontes, caminhos e
                    especiais.
                  </span>
                </div>
                <div className="flex items-start gap-2 text-xs text-amber-900 dark:text-amber-200">
                  <span className="w-5 h-5 rounded-full bg-amber-200 dark:bg-amber-900 text-amber-900 dark:text-amber-100 flex items-center justify-center font-black shrink-0">
                    3
                  </span>
                  <span>
                    <strong>Decore à vontade:</strong> Posicione, mova e reorganize no Modo Edição
                    livre!
                  </span>
                </div>
              </div>
            </div>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={dismissTutorial}
              className="shrink-0 rounded-2xl border-2 border-amber-400 bg-white hover:bg-amber-100 font-extrabold text-xs text-amber-900 dark:bg-card dark:text-amber-100"
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-[#58CC02] mr-1" />
              Entendi!
            </Button>
          </div>
        </div>
      )}

      {/* Barra de Edição / Mochila */}
      <GardenEditToolbar onOpenShop={() => setShopOpen(true)} />

      {/* Cena Pixel Art 2.5D Ornamentável */}
      <GardenPixelCanvas />

      {/* Modal da Loja */}
      <GardenShopModal open={shopOpen} onOpenChange={setShopOpen} />
    </div>
  )
}

export default GardenView
