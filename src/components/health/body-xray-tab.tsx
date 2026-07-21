import { useState } from 'react'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { AnthropometryModal } from '@/components/health/anthropometry-modal'
import { EvolutionChart } from '@/components/health/evolution-chart'
import { EvolutionGallery } from '@/components/health/evolution-gallery'
import { DailyEvaluationPanel } from '@/components/health/daily-evaluation-panel'
import { BodyGoalsDashboard } from '@/components/health/body-goals-dashboard'
import { MetabolicDashboard } from '@/components/health/metabolic-dashboard'
import { AssessmentHistory } from '@/components/health/assessment-history'
import { MedicalExamsSection } from '@/components/health/medical-exams-section'
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from '@/components/ui/accordion'

export function BodyXrayTab() {
  const [anthropometryOpen, setAnthropometryOpen] = useState(false)

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

        <Tabs defaultValue="daily">
          <TabsList className="grid grid-cols-2 w-full rounded-2xl">
            <TabsTrigger value="daily">Avaliação do Dia</TabsTrigger>
            <TabsTrigger value="history">Evolução Histórica</TabsTrigger>
          </TabsList>
          <TabsContent value="daily" className="mt-4">
            <DailyEvaluationPanel />
          </TabsContent>
          <TabsContent value="history" className="mt-4 space-y-4">
            <EvolutionChart />
            <EvolutionGallery />
          </TabsContent>
        </Tabs>
      </div>

      <Accordion type="single" collapsible defaultValue="metabolic">
        <AccordionItem
          value="metabolic"
          className="border-2 border-b-4 border-[#E5E5E5] dark:border-[#3B4A55] rounded-3xl px-4"
        >
          <AccordionTrigger className="text-xl font-extrabold">
            🧬 Inteligência Metabólica & Gasto Energético
          </AccordionTrigger>
          <AccordionContent>
            <MetabolicDashboard />
          </AccordionContent>
        </AccordionItem>
      </Accordion>
      <BodyGoalsDashboard />
      <AssessmentHistory />
      <MedicalExamsSection />

      <AnthropometryModal open={anthropometryOpen} onOpenChange={setAnthropometryOpen} />
    </div>
  )
}
