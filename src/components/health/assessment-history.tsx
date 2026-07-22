import { useState } from 'react'
import { useAppStore, BodyMetric } from '@/stores/useAppStore'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Scale, Flame, Dumbbell, Heart, Moon, Brain, ChevronRight, Pencil } from 'lucide-react'

const MEASUREMENT_LABELS: Record<string, string> = {
  waist: 'Cintura',
  hip: 'Quadril',
  chest: 'Peito',
  leftArm: 'Braço E.',
  rightArm: 'Braço D.',
  leftThigh: 'Coxa E.',
  rightThigh: 'Coxa D.',
}
const ACTIVITY_LABELS: Record<string, string> = {
  sedentary: 'Sedentário',
  light: 'Levemente Ativo',
  moderate: 'Moderadamente Ativo',
  intense: 'Muito Ativo',
}

export function AssessmentHistory({ onEdit }: { onEdit?: (metric: BodyMetric) => void }) {
  const { bodyMetrics } = useAppStore()
  const [selected, setSelected] = useState<BodyMetric | null>(null)
  const [currentPage, setCurrentPage] = useState(0)
  const sorted = [...bodyMetrics].sort((a, b) => b.date.localeCompare(a.date))
  const itemsPerPage = 5
  const totalPages = Math.ceil(sorted.length / itemsPerPage)
  const paginated = sorted.slice(currentPage * itemsPerPage, (currentPage + 1) * itemsPerPage)

  if (sorted.length === 0) {
    return (
      <div className="bg-card border-2 border-dashed border-[#E5E5E5] dark:border-[#3B4A55] rounded-3xl p-10 text-center">
        <span className="text-4xl block mb-3">📋</span>
        <p className="text-sm font-bold text-muted-foreground">
          Nenhuma avaliação registrada ainda.
        </p>
      </div>
    )
  }

  const fmtDate = (d: string) =>
    new Date(d + 'T00:00:00').toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    })

  return (
    <div className="space-y-3">
      <h3 className="text-lg font-extrabold">Histórico de Avaliações</h3>
      {paginated.map((m) => (
        <button
          key={m.id}
          onClick={() => setSelected(m)}
          className="w-full flex items-center gap-3 bg-card border-2 border-b-4 border-[#E5E5E5] dark:border-[#3B4A55] rounded-2xl p-4 hover:shadow-md hover:-translate-y-0.5 transition-all text-left"
        >
          <div className="w-12 h-12 rounded-xl bg-[#1CB0F6]/10 flex items-center justify-center shrink-0">
            <Scale className="w-6 h-6 text-[#1CB0F6]" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-extrabold text-sm">{fmtDate(m.date)}</p>
            <div className="flex gap-4 mt-1">
              <span className="text-xs font-bold text-muted-foreground">
                ⚖️ {m.weight?.toFixed(1) || '—'} kg
              </span>
              <span className="text-xs font-bold text-muted-foreground">
                🔥 {m.bodyFatPercentage?.toFixed(1) || '—'}%
              </span>
              {m.muscleMass > 0 && (
                <span className="text-xs font-bold text-muted-foreground">
                  💪 {m.muscleMass?.toFixed(1)} kg
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            {onEdit && (
              <span
                onClick={(e) => {
                  e.stopPropagation()
                  onEdit(m)
                }}
                className="p-2 rounded-lg hover:bg-muted transition-colors cursor-pointer"
              >
                <Pencil className="w-4 h-4 text-muted-foreground" />
              </span>
            )}
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
          </div>
        </button>
      ))}

      <Dialog open={!!selected} onOpenChange={(v) => !v && setSelected(null)}>
        <DialogContent className="sm:max-w-[500px] rounded-3xl max-h-[85vh] overflow-y-auto">
          {selected && (
            <>
              <DialogHeader>
                <DialogTitle className="text-2xl font-extrabold">
                  {fmtDate(selected.date)}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-2">
                <div className="grid grid-cols-3 gap-3">
                  <div className="text-center bg-[#1CB0F6]/10 rounded-2xl p-3">
                    <Scale className="w-5 h-5 text-[#1CB0F6] mx-auto mb-1" />
                    <p className="text-lg font-extrabold">{selected.weight?.toFixed(1) || '—'}</p>
                    <p className="text-[10px] font-bold text-muted-foreground">Peso (kg)</p>
                  </div>
                  <div className="text-center bg-[#FF9600]/10 rounded-2xl p-3">
                    <Flame className="w-5 h-5 text-[#FF9600] mx-auto mb-1" />
                    <p className="text-lg font-extrabold">
                      {selected.bodyFatPercentage?.toFixed(1) || '—'}
                    </p>
                    <p className="text-[10px] font-bold text-muted-foreground">Gordura (%)</p>
                  </div>
                  <div className="text-center bg-[#58CC02]/10 rounded-2xl p-3">
                    <Dumbbell className="w-5 h-5 text-[#58CC02] mx-auto mb-1" />
                    <p className="text-lg font-extrabold">
                      {selected.muscleMass?.toFixed(1) || '—'}
                    </p>
                    <p className="text-[10px] font-bold text-muted-foreground">Músculo (kg)</p>
                  </div>
                </div>
                {selected.tmb && selected.get && (
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-[#1CB0F6]/10 rounded-2xl p-3 text-center">
                      <p className="text-[10px] font-bold text-muted-foreground">TMB</p>
                      <p className="text-xl font-extrabold text-[#1CB0F6]">{selected.tmb} kcal</p>
                    </div>
                    <div className="bg-[#FF9600]/10 rounded-2xl p-3 text-center">
                      <p className="text-[10px] font-bold text-muted-foreground">GET</p>
                      <p className="text-xl font-extrabold text-[#FF9600]">{selected.get} kcal</p>
                    </div>
                  </div>
                )}
                {(selected.heartRateRest ||
                  selected.bloodPressure ||
                  selected.sleepQuality ||
                  selected.stressLevel) && (
                  <div className="bg-muted/30 rounded-2xl p-4 space-y-2">
                    <p className="text-sm font-extrabold">📋 Sinais Vitais</p>
                    {selected.heartRateRest && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-bold flex items-center gap-2">
                          <Heart className="w-4 h-4 text-[#FF4B4B] animate-pulse" />
                          Freq. Cardíaca
                        </span>
                        <span className="font-extrabold">{selected.heartRateRest} bpm</span>
                      </div>
                    )}
                    {selected.bloodPressure && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-bold">🩺 Pressão Arterial</span>
                        <span className="font-extrabold">{selected.bloodPressure}</span>
                      </div>
                    )}
                    {selected.sleepQuality && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-bold flex items-center gap-2">
                          <Moon className="w-4 h-4 text-[#8B5CF6]" />
                          Sono
                        </span>
                        <span className="font-extrabold">{'⭐'.repeat(selected.sleepQuality)}</span>
                      </div>
                    )}
                    {selected.stressLevel && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-bold flex items-center gap-2">
                          <Brain className="w-4 h-4 text-[#FF9600]" />
                          Estresse
                        </span>
                        <span className="font-extrabold">{selected.stressLevel}/5</span>
                      </div>
                    )}
                  </div>
                )}
                {Object.keys(selected.measurements || {}).length > 0 && (
                  <div className="bg-muted/30 rounded-2xl p-4">
                    <p className="text-sm font-extrabold mb-2">📏 Medidas Corporais (cm)</p>
                    <div className="grid grid-cols-2 gap-2">
                      {Object.entries(selected.measurements).map(([k, v]) => (
                        <div key={k} className="flex justify-between text-sm">
                          <span className="font-bold text-muted-foreground">
                            {MEASUREMENT_LABELS[k] || k}
                          </span>
                          <span className="font-extrabold">{v} cm</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {selected.gender && selected.age && selected.height && (
                  <div className="grid grid-cols-2 gap-2 bg-muted/30 rounded-2xl p-3 text-sm">
                    <div>
                      <span className="font-bold text-muted-foreground">Sexo:</span>{' '}
                      <span className="font-extrabold">
                        {selected.gender === 'male' ? 'Masculino' : 'Feminino'}
                      </span>
                    </div>
                    <div>
                      <span className="font-bold text-muted-foreground">Idade:</span>{' '}
                      <span className="font-extrabold">{selected.age} anos</span>
                    </div>
                    <div>
                      <span className="font-bold text-muted-foreground">Altura:</span>{' '}
                      <span className="font-extrabold">{selected.height} cm</span>
                    </div>
                    {selected.activityLevel && (
                      <div>
                        <span className="font-bold text-muted-foreground">Atividade:</span>{' '}
                        <span className="font-extrabold">
                          {ACTIVITY_LABELS[selected.activityLevel] || selected.activityLevel}
                        </span>
                      </div>
                    )}
                  </div>
                )}
                {selected.primaryGoal && (
                  <div className="flex items-center gap-2 bg-muted/30 rounded-2xl p-3">
                    <span className="text-sm font-bold">Objetivo:</span>
                    <span className="text-sm font-extrabold">{selected.primaryGoal}</span>
                  </div>
                )}
                {selected.photoUrls && selected.photoUrls.length > 0 && (
                  <div>
                    <p className="text-sm font-extrabold mb-2">📸 Fotos</p>
                    <div className="flex flex-wrap gap-2">
                      {selected.photoUrls.map((url, i) => (
                        <img
                          key={i}
                          src={url}
                          alt={`Foto ${i + 1}`}
                          className="w-24 h-24 rounded-xl object-cover"
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {totalPages > 1 && (
        <div className="flex gap-3 pt-2">
          <button
            disabled={currentPage === 0}
            onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
            className="flex-1 py-3 rounded-2xl bg-card border-2 border-b-4 border-[#E5E5E5] dark:border-[#3B4A55] font-extrabold text-sm transition-all active:translate-y-0.5 active:border-b-2 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-muted/30"
          >
            ← Anterior
          </button>
          <span className="flex items-center px-4 text-sm font-bold text-muted-foreground">
            {currentPage + 1}/{totalPages}
          </span>
          <button
            disabled={currentPage >= totalPages - 1}
            onClick={() => setCurrentPage((p) => Math.min(totalPages - 1, p + 1))}
            className="flex-1 py-3 rounded-2xl bg-card border-2 border-b-4 border-[#E5E5E5] dark:border-[#3B4A55] font-extrabold text-sm transition-all active:translate-y-0.5 active:border-b-2 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-muted/30"
          >
            Próxima →
          </button>
        </div>
      )}
    </div>
  )
}
