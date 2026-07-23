import { useState } from 'react'
import { Plus } from 'lucide-react'
import type { BodyMetric, MetabolicLog } from '@/stores/useAppStore'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { AnthropometryModal } from '@/components/health/anthropometry-modal'
import { MetabolicCalculatorModal } from '@/components/health/metabolic-calculator-modal'
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
  const [editMetric, setEditMetric] = useState<BodyMetric | null>(null)
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [calcOpen, setCalcOpen] = useState(false)
  const [editMetabolicLog, setEditMetabolicLog] = useState<MetabolicLog | null>(null)

  const handleOpenNew = () => {
    setEditMetric(null)
    setAnthropometryOpen(true)
  }

  const handleOpenCalc = () => {
    setEditMetabolicLog(null)
    setCalcOpen(true)
  }

  const handleEditMetabolic = (log: MetabolicLog) => {
    setEditMetabolicLog(log)
    setCalcOpen(true)
  }

  const handleCloseCalc = (open: boolean) => {
    setCalcOpen(open)
    if (!open) setEditMetabolicLog(null)
  }

  const handleOpenEdit = (m: BodyMetric) => {
    setEditMetric(m)
    setAnthropometryOpen(true)
  }

  const handleClose = (open: boolean) => {
    setAnthropometryOpen(open)
    if (!open) setEditMetric(null)
  }

  return (
    <div className="space-y-6">
      <div className="bg-card border-2 border-b-4 border-[#E5E5E5] dark:border-[#3B4A55] rounded-3xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-extrabold">📈 Evolução e Composição Corporal</h3>
          <Button
            onClick={handleOpenNew}
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
            <DailyEvaluationPanel selectedDate={selectedDate} onDateChange={setSelectedDate} />
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
          className="border-2 border-b-4 border-[#E5E5E5] dark:border-[#3B4A55] rounded-3xl overflow-hidden"
        >
          <div className="flex items-center gap-2 px-4 pt-4">
            <AccordionTrigger className="text-lg sm:text-xl font-extrabold text-left flex-1 hover:no-underline">
              🧬 Inteligência Metabólica & Gasto Energético
            </AccordionTrigger>
            <Button
              onClick={(e) => {
                e.stopPropagation()
                handleOpenCalc()
              }}
              className="bg-[#58CC02] hover:bg-[#58CC02]/90 text-white border-b-4 border-[#58A300] rounded-2xl font-bold text-xs shrink-0"
              size="sm"
            >
              <Plus className="w-4 h-4" /> <span className="hidden sm:inline">Novo Gasto</span>
            </Button>
          </div>
          <AccordionContent className="px-4 pb-4">
            <MetabolicDashboard selectedDate={selectedDate} />
          </AccordionContent>
        </AccordionItem>
      </Accordion>
      <BodyGoalsDashboard />
      <AssessmentHistory onEdit={handleOpenEdit} onEditMetabolic={handleEditMetabolic} />
      <MedicalExamsSection />

      <AnthropometryModal
        open={anthropometryOpen}
        onOpenChange={handleClose}
        editMetric={editMetric}
      />

      <MetabolicCalculatorModal
        open={calcOpen}
        onOpenChange={handleCloseCalc}
        editLog={editMetabolicLog}
      />
    </div>
  )
}
