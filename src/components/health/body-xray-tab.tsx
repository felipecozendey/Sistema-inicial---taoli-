import { useEffect, useState } from 'react'
import { useAppStore } from '@/stores/useAppStore'
import { BodyGoalsDashboard } from '@/components/health/body-goals-dashboard'
import { AnthropometryModal } from '@/components/health/anthropometry-modal'
import { EvolutionChart } from '@/components/health/evolution-chart'
import { EvolutionGallery } from '@/components/health/evolution-gallery'
import { MedicalExamsSection } from '@/components/health/medical-exams-section'
import { GameButton } from '@/components/ui/game-button'
import { Plus } from 'lucide-react'

export function BodyXrayTab() {
  const { fetchBodyMetrics, fetchPatientGoals, fetchMedicalExams } = useAppStore()
  const [modalOpen, setModalOpen] = useState(false)

  useEffect(() => {
    fetchBodyMetrics()
    fetchPatientGoals()
    fetchMedicalExams()
  }, [fetchBodyMetrics, fetchPatientGoals, fetchMedicalExams])

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-extrabold">Raio-X Corporal</h3>
        <GameButton onClick={() => setModalOpen(true)} variant="primary" size="sm">
          <Plus className="w-4 h-4 mr-1" strokeWidth={3} />
          Nova Avaliação
        </GameButton>
      </div>
      <BodyGoalsDashboard />
      <EvolutionChart />
      <EvolutionGallery />
      <MedicalExamsSection />
      <AnthropometryModal open={modalOpen} onOpenChange={setModalOpen} />
    </div>
  )
}
