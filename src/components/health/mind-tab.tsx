import { useEffect } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useAppStore } from '@/stores/useAppStore'
import { MindDailyAssessment } from '@/components/health/mind-daily-assessment'
import { MindEmotionalJournal } from '@/components/health/mind-emotional-journal'
import { MindClinicalReport } from '@/components/health/mind-clinical-report'

export function MindTab() {
  const { fetchMentalHealthLogs, fetchJournalEntries } = useAppStore()

  useEffect(() => {
    fetchMentalHealthLogs()
    fetchJournalEntries()
  }, [])

  return (
    <Tabs defaultValue="avaliacao">
      <TabsList className="w-full rounded-2xl">
        <TabsTrigger value="avaliacao" className="rounded-xl font-bold">
          Avaliação do Dia
        </TabsTrigger>
        <TabsTrigger value="diario" className="rounded-xl font-bold">
          📖 Diário Emocional
        </TabsTrigger>
        <TabsTrigger value="relatorio" className="rounded-xl font-bold">
          Relatório Clínico
        </TabsTrigger>
      </TabsList>
      <TabsContent value="avaliacao" className="mt-6">
        <MindDailyAssessment />
      </TabsContent>
      <TabsContent value="diario" className="mt-6">
        <MindEmotionalJournal />
      </TabsContent>
      <TabsContent value="relatorio" className="mt-6">
        <MindClinicalReport />
      </TabsContent>
    </Tabs>
  )
}
