import { useEffect, useState, useMemo } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useAppStore } from '@/stores/useAppStore'
import { BodyGoalsDashboard } from '@/components/health/body-goals-dashboard'
import { AnthropometryModal } from '@/components/health/anthropometry-modal'
import { EvolutionChart } from '@/components/health/evolution-chart'
import { EvolutionGallery } from '@/components/health/evolution-gallery'
import { MedicalExamsSection } from '@/components/health/medical-exams-section'
import { MetabolicDashboard } from '@/components/health/metabolic-dashboard'
import { AssessmentHistory } from '@/components/health/assessment-history'
import { GameButton } from '@/components/ui/game-button'
import { Plus, Heart, Moon, Brain, Scale, Flame, Dumbbell } from 'lucide-react'
import { cn } from '@/lib/utils'

function getBmiStatus(bmi: number) {
  if (bmi <= 0)
    return {
      label: 'N/A',
      bg: 'bg-gray-100 dark:bg-gray-800',
      textColor: 'text-gray-600 dark:text-gray-400',
    }
  if (bmi < 18.5)
    return {
      label: 'Abaixo',
      bg: 'bg-blue-100 dark:bg-blue-900/30',
      textColor: 'text-blue-600 dark:text-blue-400',
    }
  if (bmi < 25)
    return {
      label: 'Normal',
      bg: 'bg-green-100 dark:bg-green-900/30',
      textColor: 'text-green-600 dark:text-green-400',
    }
  if (bmi < 30)
    return {
      label: 'Sobrepeso',
      bg: 'bg-yellow-100 dark:bg-yellow-900/30',
      textColor: 'text-yellow-600 dark:text-yellow-400',
    }
  return {
    label: 'Obesidade',
    bg: 'bg-red-100 dark:bg-red-900/30',
    textColor: 'text-red-600 dark:text-red-400',
  }
}

const STRESS_EMOJIS = ['😌', '🙂', '😐', '😟', '😰']

export function BodyXrayTab() {
  const { bodyMetrics, patientGoals, fetchBodyMetrics, fetchPatientGoals, fetchMedicalExams } =
    useAppStore()
  const [modalOpen, setModalOpen] = useState(false)

  useEffect(() => {
    fetchBodyMetrics()
    fetchPatientGoals()
    fetchMedicalExams()
  }, [fetchBodyMetrics, fetchPatientGoals, fetchMedicalExams])

  const latest = useMemo(() => {
    const sorted = [...bodyMetrics].sort((a, b) => a.date.localeCompare(b.date))
    return sorted[sorted.length - 1]
  }, [bodyMetrics])

  const bmi = useMemo(() => {
    if (!latest) return 0
    const h = (latest.height || patientGoals.height || 0) / 100
    return h > 0 ? latest.weight / (h * h) : 0
  }, [latest, patientGoals.height])

  const bmiStatus = useMemo(() => getBmiStatus(bmi), [bmi])

  const v = useMemo(
    () =>
      latest
        ? {
            hr: latest.heartRateRest,
            sleep: latest.sleepQuality,
            stress: latest.stressLevel,
            bp: latest.bloodPressure,
          }
        : null,
    [latest],
  )

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-extrabold">Raio-X Corporal</h3>
        <GameButton onClick={() => setModalOpen(true)} variant="primary" size="sm">
          <Plus className="w-4 h-4 mr-1" strokeWidth={3} />
          Nova Avaliação
        </GameButton>
      </div>

      <Tabs defaultValue="dossie">
        <TabsList className="w-full rounded-2xl">
          <TabsTrigger value="dossie" className="rounded-xl font-bold">
            Dossiê Atual
          </TabsTrigger>
          <TabsTrigger value="historico" className="rounded-xl font-bold">
            Histórico de Avaliações
          </TabsTrigger>
        </TabsList>

        <TabsContent value="dossie" className="space-y-6 mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="bg-card border-2 border-b-4 border-[#E5E5E5] dark:border-[#3B4A55] rounded-3xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-base font-extrabold flex items-center gap-2">
                  <Scale className="w-5 h-5 text-[#1CB0F6]" />
                  Composição Corporal
                </h4>
                <span
                  className={cn(
                    'px-3 py-1 rounded-full text-xs font-extrabold',
                    bmiStatus.bg,
                    bmiStatus.textColor,
                  )}
                >
                  IMC {bmi > 0 ? bmi.toFixed(1) : '—'} · {bmiStatus.label}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="text-center">
                  <div className="w-12 h-12 mx-auto rounded-2xl bg-[#1CB0F6]/10 flex items-center justify-center mb-2">
                    <Scale className="w-6 h-6 text-[#1CB0F6]" />
                  </div>
                  <p className="text-2xl font-extrabold">{latest?.weight?.toFixed(1) || '—'}</p>
                  <p className="text-xs font-bold text-muted-foreground">Peso (kg)</p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 mx-auto rounded-2xl bg-[#FF9600]/10 flex items-center justify-center mb-2">
                    <Flame className="w-6 h-6 text-[#FF9600]" />
                  </div>
                  <p className="text-2xl font-extrabold">
                    {latest?.bodyFatPercentage?.toFixed(1) || '—'}
                  </p>
                  <p className="text-xs font-bold text-muted-foreground">Gordura (%)</p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 mx-auto rounded-2xl bg-[#58CC02]/10 flex items-center justify-center mb-2">
                    <Dumbbell className="w-6 h-6 text-[#58CC02]" />
                  </div>
                  <p className="text-2xl font-extrabold">{latest?.muscleMass?.toFixed(1) || '—'}</p>
                  <p className="text-xs font-bold text-muted-foreground">Músculo (kg)</p>
                </div>
              </div>
            </div>

            <div className="bg-card border-2 border-b-4 border-[#E5E5E5] dark:border-[#3B4A55] rounded-3xl p-6 shadow-sm">
              <h4 className="text-base font-extrabold flex items-center gap-2 mb-4">
                <Heart className="w-5 h-5 text-[#FF4B4B]" />
                Sinais Vitais & Bem-Estar
              </h4>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Heart className="w-4 h-4 text-[#FF4B4B] animate-pulse" />
                    <span className="text-sm font-bold">Freq. Cardíaca</span>
                  </div>
                  <span className="font-extrabold">
                    {v?.hr || '—'}{' '}
                    <span className="text-xs text-muted-foreground font-bold">bpm</span>
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-base">🩺</span>
                    <span className="text-sm font-bold">Pressão Arterial</span>
                  </div>
                  <span className="font-extrabold">{v?.bp || '—'}</span>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <Moon className="w-4 h-4 text-[#8B5CF6]" />
                      <span className="text-sm font-bold">Qualidade do Sono</span>
                    </div>
                    <div className="flex gap-0.5">
                      {[1, 2, 3, 4, 5].map((n) => (
                        <span
                          key={n}
                          className={cn(
                            'text-sm',
                            (v?.sleep || 0) >= n ? 'opacity-100' : 'opacity-20',
                          )}
                        >
                          ⭐
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full bg-[#8B5CF6] transition-all duration-500"
                      style={{ width: `${((v?.sleep || 0) / 5) * 100}%` }}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <Brain className="w-4 h-4 text-[#FF9600]" />
                      <span className="text-sm font-bold">Nível de Estresse</span>
                    </div>
                    <span className="text-lg">{v?.stress ? STRESS_EMOJIS[v.stress - 1] : '—'}</span>
                  </div>
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full bg-[#FF9600] transition-all duration-500"
                      style={{ width: `${((v?.stress || 0) / 5) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <MetabolicDashboard />
          <BodyGoalsDashboard />
          <EvolutionChart />
          <EvolutionGallery />
          <MedicalExamsSection />
        </TabsContent>

        <TabsContent value="historico" className="mt-6">
          <AssessmentHistory />
        </TabsContent>
      </Tabs>

      <AnthropometryModal open={modalOpen} onOpenChange={setModalOpen} />
    </div>
  )
}
