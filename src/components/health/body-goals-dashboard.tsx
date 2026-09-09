import { useState } from 'react'
import { useAppStore } from '@/stores/useAppStore'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { GameButton } from '@/components/ui/game-button'

export function BodyGoalsDashboard() {
  const bodyMetrics = useAppStore((s) => s.bodyMetrics)
  const patientGoals = useAppStore((s) => s.patientGoals)
  const updatePatientGoals = useAppStore((s) => s.updatePatientGoals)
  const [editOpen, setEditOpen] = useState(false)
  const [draftWeight, setDraftWeight] = useState('')
  const [draftFat, setDraftFat] = useState('')
  const [draftLean, setDraftLean] = useState('')
  const [draftHeight, setDraftHeight] = useState('')

  const sorted = [...bodyMetrics].sort((a, b) => a.date.localeCompare(b.date))
  const latest = sorted[sorted.length - 1]
  const first = sorted[0]
  const currentWeight = latest?.weight || 0
  const currentFat = latest?.bodyFatPercentage || 0
  const currentLean = latest?.leanMass || 0
  const startWeight = first?.weight || currentWeight
  const startFat = first?.bodyFatPercentage || currentFat
  const startLean = first?.leanMass || currentLean
  const targetWeight = patientGoals.targetWeight || 0
  const targetFat = patientGoals.targetBodyFat || 0
  const targetLean = patientGoals.targetLeanMass || 0

  const calcBidirectional = (
    current: number,
    start: number,
    target: number,
  ): { progress: number; remaining: number; direction: 'loss' | 'gain' | 'equal' } => {
    if (target <= 0 || current <= 0) {
      return { progress: 0, remaining: 0, direction: 'equal' }
    }
    const baseline = start > 0 ? start : current
    if (Math.abs(target - baseline) < 0.001) {
      const reached = current >= target
      return { progress: reached ? 100 : 0, remaining: 0, direction: 'equal' }
    }
    const isGain = target > baseline
    const totalDistance = Math.abs(target - baseline)
    const coveredDistance = isGain ? current - baseline : baseline - current
    const remaining = Math.max(0, Math.abs(target - current))
    const rawProgress = (coveredDistance / totalDistance) * 100
    const progress = Math.max(0, Math.min(100, Math.round(rawProgress)))
    return {
      progress,
      remaining: Math.round(remaining * 10) / 10,
      direction: isGain ? 'gain' : 'loss',
    }
  }

  const weightCalc = calcBidirectional(currentWeight, startWeight, targetWeight)
  const fatCalc = calcBidirectional(currentFat, startFat, targetFat)
  const leanCalc = calcBidirectional(currentLean, startLean, targetLean)

  const handleSave = () => {
    updatePatientGoals({
      targetWeight: parseFloat(draftWeight) || 0,
      targetBodyFat: parseFloat(draftFat) || 0,
      targetLeanMass: parseFloat(draftLean) || 0,
      height: parseFloat(draftHeight) || 0,
    })
    setEditOpen(false)
  }

  const openEdit = () => {
    setDraftWeight(String(targetWeight || ''))
    setDraftFat(String(targetFat || ''))
    setDraftLean(String(targetLean || ''))
    setDraftHeight(String(patientGoals.height || ''))
    setEditOpen(true)
  }

  const cards = [
    {
      title: 'Peso Atual vs. Meta',
      current: currentWeight,
      target: targetWeight,
      start: startWeight,
      unit: 'kg',
      progress: weightCalc.progress,
      remaining: weightCalc.remaining,
      direction: weightCalc.direction,
      color: '#1CB0F6',
      emoji: '⚖️',
    },
    {
      title: 'Gordura Corporal vs. Meta',
      current: currentFat,
      target: targetFat,
      start: startFat,
      unit: '%',
      progress: fatCalc.progress,
      remaining: fatCalc.remaining,
      direction: fatCalc.direction,
      color: '#FF9600',
      emoji: '🔥',
    },
    {
      title: 'Massa Magra vs. Meta',
      current: currentLean,
      target: targetLean,
      start: startLean,
      unit: 'kg',
      progress: leanCalc.progress,
      remaining: leanCalc.remaining,
      direction: leanCalc.direction,
      color: '#10b981',
      emoji: '💪',
    },
  ]

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-extrabold">Metas Corporais</h3>
        <button onClick={openEdit} className="text-sm font-bold text-[#1CB0F6] hover:underline">
          Definir Metas
        </button>
      </div>
      {bodyMetrics.length === 0 && targetWeight === 0 && targetFat === 0 && targetLean === 0 ? (
        <div className="bg-card border-2 border-dashed border-[#E5E5E5] dark:border-[#3B4A55] rounded-3xl p-8 text-center space-y-2">
          <span className="text-3xl block">🎯</span>
          <p className="text-sm font-bold text-muted-foreground">
            Nenhuma avaliação ainda. Registre sua primeira medida!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {cards.map((card) => (
            <div
              key={card.title}
              className="bg-card border-2 border-b-4 rounded-3xl p-5 shadow-sm"
              style={{ borderColor: card.color + '40', borderBottomColor: card.color }}
            >
              <div className="flex items-center gap-2 mb-3">
                <span className="text-2xl">{card.emoji}</span>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-muted-foreground">{card.title}</p>
                  <div className="flex items-baseline gap-1.5 flex-wrap">
                    <span className="text-xl font-extrabold" style={{ color: card.color }}>
                      {card.current}
                      {card.unit}
                    </span>
                    {card.target > 0 && (
                      <span className="text-sm text-muted-foreground font-bold flex items-center gap-0.5">
                        ➔ {card.target}
                        {card.unit}
                        {card.direction === 'gain' && (
                          <span className="text-xs font-black text-emerald-500" title="Ganho">
                            ↑
                          </span>
                        )}
                        {card.direction === 'loss' && (
                          <span className="text-xs font-black text-amber-500" title="Perda">
                            ↓
                          </span>
                        )}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="h-4 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${card.progress}%`, backgroundColor: card.color }}
                />
              </div>
              <div className="flex items-center justify-between mt-2 text-xs font-bold">
                <span className="text-muted-foreground">{card.progress}% da meta</span>
                {card.target > 0 && (
                  <span
                    className={
                      card.remaining === 0
                        ? 'text-emerald-500 font-extrabold'
                        : 'text-muted-foreground font-extrabold'
                    }
                  >
                    {card.remaining === 0
                      ? 'Meta atingida! 🎉'
                      : `faltam ${card.remaining} ${card.unit}`}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-[400px] rounded-3xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-extrabold">Definir Metas</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="space-y-2">
              <Label className="font-bold">Altura (cm)</Label>
              <Input
                type="number"
                value={draftHeight}
                onChange={(e) => setDraftHeight(e.target.value)}
                className="rounded-2xl bg-muted/50 border-transparent font-semibold"
                placeholder="175"
              />
            </div>
            <div className="space-y-2">
              <Label className="font-bold">Peso Alvo (kg)</Label>
              <Input
                type="number"
                value={draftWeight}
                onChange={(e) => setDraftWeight(e.target.value)}
                className="rounded-2xl bg-muted/50 border-transparent font-semibold"
                placeholder="75"
              />
            </div>
            <div className="space-y-2">
              <Label className="font-bold">Gordura Alvo (%)</Label>
              <Input
                type="number"
                value={draftFat}
                onChange={(e) => setDraftFat(e.target.value)}
                className="rounded-2xl bg-muted/50 border-transparent font-semibold"
                placeholder="15"
              />
            </div>
            <div className="space-y-2">
              <Label className="font-bold">Massa Magra Alvo (kg)</Label>
              <Input
                type="number"
                value={draftLean}
                onChange={(e) => setDraftLean(e.target.value)}
                className="rounded-2xl bg-muted/50 border-transparent font-semibold"
                placeholder="65"
              />
            </div>
            <GameButton onClick={handleSave} variant="primary" size="lg" className="w-full">
              Salvar Metas
            </GameButton>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
