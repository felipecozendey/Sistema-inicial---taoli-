import { useState, useMemo } from 'react'
import { Plus, Scale, Percent, Dumbbell, Ruler } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { AnthropometryModal } from '@/components/health/anthropometry-modal'
import { EvolutionChart } from '@/components/health/evolution-chart'
import { EvolutionGallery } from '@/components/health/evolution-gallery'
import { BodyGoalsDashboard } from '@/components/health/body-goals-dashboard'
import { MetabolicDashboard } from '@/components/health/metabolic-dashboard'
import { AssessmentHistory } from '@/components/health/assessment-history'
import { MedicalExamsSection } from '@/components/health/medical-exams-section'
import { useAppStore } from '@/stores/useAppStore'
import type { ReactNode } from 'react'

export function BodyXrayTab() {
  const { bodyMetrics } = useAppStore()
  const [anthropometryOpen, setAnthropometryOpen] = useState(false)

  const latest = useMemo(() => {
    if (!bodyMetrics?.length) return null
    return [...bodyMetrics]
      .filter((b: any) => b.weight || b.body_fat_percentage || b.muscle_mass)
      .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime())[0]
  }, [bodyMetrics])

  const bmi = useMemo(() => {
    if (!latest?.weight || !latest?.height) return null
    const h = latest.height / 100
    return latest.weight / (h * h)
  }, [latest])

  return (
    <div className="space-y-6">
      <div className="bg-card border-2 border-b-4 border-[#E5E5E5] dark:border-[#3B4A55] rounded-3xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-extrabold">📈 Evolução e Composição Corporal</h3>
          <Button
            onClick={() => setAnthropometryOpen(true)}
            className="bg-[#1CB0F6] hover:bg-[#1CB0F6]/90 text-white border-b-4 border-[#1899D6] rounded-2xl font-bold"
            size="sm"
          >
            <Plus className="w-4 h-4" /> Registrar Medidas
          </Button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <MetricTile
            icon={<Scale className="w-4 h-4" />}
            label="Peso"
            value={latest?.weight ? `${latest.weight} kg` : '--'}
            color="#58CC02"
          />
          <MetricTile
            icon={<Percent className="w-4 h-4" />}
            label="% Gordura"
            value={latest?.body_fat_percentage ? `${latest.body_fat_percentage}%` : '--'}
            color="#FF9600"
          />
          <MetricTile
            icon={<Dumbbell className="w-4 h-4" />}
            label="M. Muscular"
            value={latest?.muscle_mass ? `${latest.muscle_mass} kg` : '--'}
            color="#1CB0F6"
          />
          <MetricTile
            icon={<Ruler className="w-4 h-4" />}
            label="IMC"
            value={bmi ? bmi.toFixed(1) : '--'}
            color="#CE82FF"
          />
        </div>

        <EvolutionChart />
        <EvolutionGallery />
      </div>

      <BodyGoalsDashboard />
      <MetabolicDashboard />
      <AssessmentHistory />
      <MedicalExamsSection />

      <AnthropometryModal open={anthropometryOpen} onOpenChange={setAnthropometryOpen} />
    </div>
  )
}

function MetricTile({
  icon,
  label,
  value,
  color,
}: {
  icon: ReactNode
  label: string
  value: string
  color: string
}) {
  return (
    <div className="flex flex-col items-center gap-1 bg-background/50 border-2 border-[#E5E5E5] dark:border-[#3B4A55] rounded-2xl p-3">
      <div className="flex items-center gap-1" style={{ color }}>
        {icon}
        <span className="text-xs font-bold">{label}</span>
      </div>
      <span className="text-base font-extrabold" style={{ color }}>
        {value}
      </span>
    </div>
  )
}
