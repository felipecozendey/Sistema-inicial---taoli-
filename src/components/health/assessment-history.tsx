import { useState } from 'react'
import { useAppStore, type BodyMetric, type MetabolicLog } from '@/stores/useAppStore'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import {
  Scale,
  Flame,
  Dumbbell,
  ChevronRight,
  Pencil,
  Trash2,
  Calculator,
  Heart,
  Moon,
  Brain,
  Ruler,
} from 'lucide-react'
import { safeFormatDateLong } from '@/lib/date-utils'
import { CALC_FORMULA_LABELS, type CalcFormula } from '@/lib/metabolic-math'

const MEASUREMENT_LABELS: Record<string, string> = {
  waist: 'Cintura',
  hip: 'Quadril',
  chest: 'Peito',
  leftArm: 'Braço E.',
  rightArm: 'Braço D.',
  leftThigh: 'Coxa E.',
  rightThigh: 'Coxa D.',
}

const getFormulaLabel = (formula: string) =>
  CALC_FORMULA_LABELS[formula as CalcFormula] || formula || '—'

interface Props {
  onEdit?: (metric: BodyMetric) => void
  onEditMetabolic?: (log: MetabolicLog) => void
}

export function AssessmentHistory({ onEdit, onEditMetabolic }: Props) {
  const { bodyMetrics, metabolicLogs, deleteAnthropometryLog, deleteMetabolicLog } = useAppStore()
  const [selected, setSelected] = useState<BodyMetric | null>(null)
  const [selectedMetabolic, setSelectedMetabolic] = useState<MetabolicLog | null>(null)
  const [currentPage, setCurrentPage] = useState(0)
  const [metabolicPage, setMetabolicPage] = useState(0)

  const sorted = [...bodyMetrics].sort((a, b) => b.date.localeCompare(a.date))
  const metabolicSorted = [...metabolicLogs].sort((a, b) => b.date.localeCompare(a.date))
  const itemsPerPage = 5
  const totalPages = Math.ceil(sorted.length / itemsPerPage)
  const metabolicTotalPages = Math.ceil(metabolicSorted.length / itemsPerPage)
  const paginated = sorted.slice(currentPage * itemsPerPage, (currentPage + 1) * itemsPerPage)
  const metabolicPaginated = metabolicSorted.slice(
    metabolicPage * itemsPerPage,
    (metabolicPage + 1) * itemsPerPage,
  )

  const renderPagination = (
    page: number,
    total: number,
    setPage: (fn: (p: number) => number) => void,
  ) => {
    if (total <= 1) return null
    return (
      <div className="flex gap-3 pt-2">
        <button
          disabled={page === 0}
          onClick={() => setPage((p) => Math.max(0, p - 1))}
          className="flex-1 py-3 rounded-2xl bg-card border-2 border-b-4 border-[#E5E5E5] dark:border-[#3B4A55] font-extrabold text-sm transition-all active:translate-y-0.5 active:border-b-2 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-muted/30"
        >
          ← Anterior
        </button>
        <span className="flex items-center px-4 text-sm font-bold text-muted-foreground">
          {page + 1}/{total}
        </span>
        <button
          disabled={page >= total - 1}
          onClick={() => setPage((p) => Math.min(total - 1, p + 1))}
          className="flex-1 py-3 rounded-2xl bg-card border-2 border-b-4 border-[#E5E5E5] dark:border-[#3B4A55] font-extrabold text-sm transition-all active:translate-y-0.5 active:border-b-2 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-muted/30"
        >
          Próxima →
        </button>
      </div>
    )
  }

  if (sorted.length === 0 && metabolicSorted.length === 0) {
    return (
      <div className="bg-card border-2 border-dashed border-[#E5E5E5] dark:border-[#3B4A55] rounded-3xl p-10 text-center">
        <span className="text-4xl block mb-3">📋</span>
        <p className="text-sm font-bold text-muted-foreground">
          Nenhuma avaliação registrada ainda.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <h3 className="text-lg font-extrabold">Histórico de Avaliações</h3>
      <Tabs defaultValue="anthropometry">
        <TabsList className="grid grid-cols-2 w-full rounded-2xl">
          <TabsTrigger value="anthropometry">Antropometria</TabsTrigger>
          <TabsTrigger value="metabolic">Gasto Energético</TabsTrigger>
        </TabsList>

        <TabsContent value="anthropometry" className="mt-3 space-y-3">
          {paginated.length === 0 ? (
            <div className="bg-card border-2 border-dashed border-[#E5E5E5] dark:border-[#3B4A55] rounded-2xl p-8 text-center">
              <p className="text-sm font-bold text-muted-foreground">
                Nenhuma avaliação antropométrica.
              </p>
            </div>
          ) : (
            paginated.map((m) => (
              <div
                key={m.id}
                className="w-full flex items-center gap-3 bg-card border-2 border-b-4 border-[#E5E5E5] dark:border-[#3B4A55] rounded-2xl p-4 hover:shadow-md hover:-translate-y-0.5 transition-all"
              >
                <button
                  onClick={() => setSelected(m)}
                  className="flex items-center gap-3 flex-1 min-w-0 text-left"
                >
                  <div className="w-12 h-12 rounded-xl bg-[#1CB0F6]/10 flex items-center justify-center shrink-0">
                    <Scale className="w-6 h-6 text-[#1CB0F6]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-extrabold text-sm">{safeFormatDateLong(m.date)}</p>
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
                </button>
                <div className="flex items-center gap-1 shrink-0">
                  {onEdit && (
                    <span
                      onClick={() => onEdit(m)}
                      className="p-2 rounded-lg hover:bg-muted transition-colors cursor-pointer"
                    >
                      <Pencil className="w-4 h-4 text-muted-foreground" />
                    </span>
                  )}
                  <span
                    onClick={() => deleteAnthropometryLog(m.id)}
                    className="p-2 rounded-lg hover:bg-[#FF4B4B]/10 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4 text-[#FF4B4B]" />
                  </span>
                  <ChevronRight
                    className="w-5 h-5 text-muted-foreground cursor-pointer"
                    onClick={() => setSelected(m)}
                  />
                </div>
              </div>
            ))
          )}
          {renderPagination(currentPage, totalPages, setCurrentPage)}
        </TabsContent>

        <TabsContent value="metabolic" className="mt-3 space-y-3">
          {metabolicPaginated.length === 0 ? (
            <div className="bg-card border-2 border-dashed border-[#E5E5E5] dark:border-[#3B4A55] rounded-2xl p-8 text-center">
              <p className="text-sm font-bold text-muted-foreground">
                Nenhuma avaliação de gasto energético.
              </p>
            </div>
          ) : (
            metabolicPaginated.map((log) => (
              <div
                key={log.id}
                className="w-full flex items-center gap-3 bg-card border-2 border-b-4 border-[#E5E5E5] dark:border-[#3B4A55] rounded-2xl p-4 hover:shadow-md hover:-translate-y-0.5 transition-all"
              >
                <button
                  onClick={() => setSelectedMetabolic(log)}
                  className="flex items-center gap-3 flex-1 min-w-0 text-left"
                >
                  <div className="w-12 h-12 rounded-xl bg-[#FF9600]/10 flex items-center justify-center shrink-0">
                    <Calculator className="w-6 h-6 text-[#FF9600]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-extrabold text-sm">{safeFormatDateLong(log.date)}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs font-bold text-muted-foreground">
                        {getFormulaLabel(log.formula)}
                      </span>
                      <span className="text-xs font-bold text-muted-foreground">|</span>
                      <span className="text-xs font-bold text-muted-foreground">
                        TMB: {log.tmb} kcal
                      </span>
                    </div>
                  </div>
                </button>
                <div className="shrink-0">
                  <span className="inline-block bg-[#58CC02]/10 text-[#58CC02] font-extrabold text-base px-3 py-1.5 rounded-xl">
                    {log.ventaTarget}
                    <span className="text-[10px] ml-0.5">kcal</span>
                  </span>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  {onEditMetabolic && (
                    <span
                      onClick={() => onEditMetabolic(log)}
                      className="p-2 rounded-lg hover:bg-muted transition-colors cursor-pointer"
                    >
                      <Pencil className="w-4 h-4 text-muted-foreground" />
                    </span>
                  )}
                  <span
                    onClick={() => deleteMetabolicLog(log.id)}
                    className="p-2 rounded-lg hover:bg-[#FF4B4B]/10 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4 text-[#FF4B4B]" />
                  </span>
                </div>
              </div>
            ))
          )}
          {renderPagination(metabolicPage, metabolicTotalPages, setMetabolicPage)}
        </TabsContent>
      </Tabs>

      <Dialog open={!!selected} onOpenChange={(v) => !v && setSelected(null)}>
        <DialogContent className="sm:max-w-[500px] rounded-3xl max-h-[85vh] overflow-y-auto">
          {selected && (
            <>
              <DialogHeader>
                <DialogTitle className="text-2xl font-extrabold">
                  {safeFormatDateLong(selected.date)}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-2">
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-[#1CB0F6]/10 border-2 border-b-4 border-[#1CB0F6]/30 rounded-2xl p-3 text-center">
                    <Scale className="w-5 h-5 text-[#1CB0F6] mx-auto mb-1" />
                    <p className="text-lg font-extrabold">{selected.weight?.toFixed(1) || '—'}</p>
                    <p className="text-[10px] font-bold text-muted-foreground">Peso (kg)</p>
                  </div>
                  <div className="bg-[#CE82FF]/10 border-2 border-b-4 border-[#CE82FF]/30 rounded-2xl p-3 text-center">
                    <Ruler className="w-5 h-5 text-[#CE82FF] mx-auto mb-1" />
                    <p className="text-lg font-extrabold">{selected.height || '—'}</p>
                    <p className="text-[10px] font-bold text-muted-foreground">Altura (cm)</p>
                  </div>
                  <div className="bg-[#58CC02]/10 border-2 border-b-4 border-[#58CC02]/30 rounded-2xl p-3 text-center">
                    <Dumbbell className="w-5 h-5 text-[#58CC02] mx-auto mb-1" />
                    <p className="text-lg font-extrabold">
                      {selected.leanMass?.toFixed(1) || selected.muscleMass?.toFixed(1) || '—'}
                    </p>
                    <p className="text-[10px] font-bold text-muted-foreground">Massa Magra (kg)</p>
                  </div>
                  <div className="bg-[#FF9600]/10 border-2 border-b-4 border-[#FF9600]/30 rounded-2xl p-3 text-center">
                    <Flame className="w-5 h-5 text-[#FF9600] mx-auto mb-1" />
                    <p className="text-lg font-extrabold">
                      {selected.bodyFatPercentage?.toFixed(1) || '—'}%
                    </p>
                    <p className="text-[10px] font-bold text-muted-foreground">Gordura Corporal</p>
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
                          <Heart className="w-4 h-4 text-[#FF4B4B] animate-pulse" /> Freq. Cardíaca
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
                          <Moon className="w-4 h-4 text-[#8B5CF6]" /> Sono
                        </span>
                        <span className="font-extrabold">{'⭐'.repeat(selected.sleepQuality)}</span>
                      </div>
                    )}
                    {selected.stressLevel && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-bold flex items-center gap-2">
                          <Brain className="w-4 h-4 text-[#FF9600]" /> Estresse
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
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!selectedMetabolic} onOpenChange={(v) => !v && setSelectedMetabolic(null)}>
        <DialogContent className="sm:max-w-[500px] rounded-3xl max-h-[85vh] overflow-y-auto">
          {selectedMetabolic && (
            <>
              <DialogHeader>
                <DialogTitle className="text-2xl font-extrabold">
                  {safeFormatDateLong(selectedMetabolic.date)}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-2">
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-[#58CC02]/10 border-2 border-b-4 border-[#58CC02]/30 rounded-2xl p-3 text-center">
                    <Flame className="w-5 h-5 text-[#58CC02] mx-auto mb-1" />
                    <p className="text-lg font-extrabold">{selectedMetabolic.ventaTarget}</p>
                    <p className="text-[10px] font-bold text-muted-foreground">VENTA (kcal/dia)</p>
                  </div>
                  <div className="bg-[#1CB0F6]/10 border-2 border-b-4 border-[#1CB0F6]/30 rounded-2xl p-3 text-center">
                    <Calculator className="w-5 h-5 text-[#1CB0F6] mx-auto mb-1" />
                    <p className="text-lg font-extrabold">{selectedMetabolic.tmb}</p>
                    <p className="text-[10px] font-bold text-muted-foreground">TMB (kcal)</p>
                  </div>
                  <div className="bg-[#FF9600]/10 border-2 border-b-4 border-[#FF9600]/30 rounded-2xl p-3 text-center">
                    <p className="text-[10px] font-bold text-muted-foreground">Fórmula</p>
                    <p className="text-sm font-extrabold text-[#FF9600] mt-1">
                      {getFormulaLabel(selectedMetabolic.formula)}
                    </p>
                  </div>
                  <div className="bg-[#FF4B4B]/10 border-2 border-b-4 border-[#FF4B4B]/30 rounded-2xl p-3 text-center">
                    <p className="text-[10px] font-bold text-muted-foreground">Fator de Injúria</p>
                    <p className="text-lg font-extrabold text-[#FF4B4B] mt-1">
                      ×{selectedMetabolic.injuryFactor || 1.0}
                    </p>
                  </div>
                </div>
                {selectedMetabolic.extraActivities &&
                  selectedMetabolic.extraActivities.length > 0 && (
                    <div className="bg-muted/30 rounded-2xl p-4">
                      <p className="text-sm font-extrabold mb-2">🏃 Atividades Físicas</p>
                      <div className="space-y-1">
                        {selectedMetabolic.extraActivities.map((a: any, i: number) => (
                          <div
                            key={a.id || i}
                            className="flex items-center justify-between text-sm"
                          >
                            <span className="font-bold">{a.item_name || a.name || '—'}</span>
                            <span className="font-extrabold text-[#FF9600]">
                              {a.energy_kcal || 0} kcal
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
