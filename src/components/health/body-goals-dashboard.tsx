import { useState } from 'react'
import { useAppStore } from '@/stores/useAppStore'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { GameButton } from '@/components/ui/game-button'

export function BodyGoalsDashboard() {
  const { bodyMetrics, patientGoals, updatePatientGoals } = useAppStore()
  const [editOpen, setEditOpen] = useState(false)
  const [draftWeight, setDraftWeight] = useState('')
  const [draftFat, setDraftFat] = useState('')
  const [draftHeight, setDraftHeight] = useState('')

  const sorted = [...bodyMetrics].sort((a, b) => a.date.localeCompare(b.date))
  const latest = sorted[sorted.length - 1]
  const first = sorted[0]
  const currentWeight = latest?.weight || 0
  const currentFat = latest?.bodyFatPercentage || 0
  const startWeight = first?.weight || currentWeight
  const startFat = first?.bodyFatPercentage || currentFat
  const targetWeight = patientGoals.targetWeight || 0
  const targetFat = patientGoals.targetBodyFat || 0

  const weightProgress =
    targetWeight > 0 && startWeight > targetWeight
      ? Math.min(
          100,
          Math.round(((startWeight - currentWeight) / (startWeight - targetWeight)) * 100),
        )
      : 0
  const fatProgress =
    targetFat > 0 && startFat > targetFat
      ? Math.min(100, Math.round(((startFat - currentFat) / (startFat - targetFat)) * 100))
      : 0

  const handleSave = () => {
    updatePatientGoals({
      targetWeight: parseFloat(draftWeight) || 0,
      targetBodyFat: parseFloat(draftFat) || 0,
      height: parseFloat(draftHeight) || 0,
    })
    setEditOpen(false)
  }

  const openEdit = () => {
    setDraftWeight(String(targetWeight || ''))
    setDraftFat(String(targetFat || ''))
    setDraftHeight(String(patientGoals.height || ''))
    setEditOpen(true)
  }

  const cards = [
    {
      title: 'Peso Atual vs. Meta',
      current: currentWeight,
      target: targetWeight,
      unit: 'kg',
      progress: weightProgress,
      color: '#1CB0F6',
      emoji: '⚖️',
    },
    {
      title: 'Gordura Corporal vs. Meta',
      current: currentFat,
      target: targetFat,
      unit: '%',
      progress: fatProgress,
      color: '#FF9600',
      emoji: '🔥',
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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {cards.map((card) => (
          <div
            key={card.title}
            className="bg-card border-2 border-b-4 rounded-3xl p-5 shadow-sm"
            style={{ borderColor: card.color + '40', borderBottomColor: card.color }}
          >
            <div className="flex items-center gap-2 mb-3">
              <span className="text-2xl">{card.emoji}</span>
              <div>
                <p className="text-xs font-bold text-muted-foreground">{card.title}</p>
                <p className="text-xl font-extrabold" style={{ color: card.color }}>
                  {card.current}
                  {card.unit}
                  <span className="text-sm text-muted-foreground font-bold">
                    {' '}
                    ➔ {card.target}
                    {card.unit}
                  </span>
                </p>
              </div>
            </div>
            <div className="h-4 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{ width: `${card.progress}%`, backgroundColor: card.color }}
              />
            </div>
            <p className="text-xs font-bold text-muted-foreground mt-1">{card.progress}% da meta</p>
          </div>
        ))}
      </div>

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
            <GameButton onClick={handleSave} variant="primary" size="lg" className="w-full">
              Salvar Metas
            </GameButton>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
