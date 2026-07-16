import { useEffect } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useAppStore } from '@/stores/useAppStore'
import { MindDailyAssessment } from '@/components/health/mind-daily-assessment'
import { MindEmotionalJournal } from '@/components/health/mind-emotional-journal'
import { MindHistoryTab } from '@/components/health/mind-history-tab'
import { MindClinicalReport } from '@/components/health/mind-clinical-report'

export function MindTab() {
  const { fetchMentalHealthLogs, fetchJournalEntries, fetchMindEvents } = useAppStore()

  useEffect(() => {
    fetchMentalHealthLogs()
    fetchJournalEntries()
    fetchMindEvents()
  }, [])

  return (
    <Tabs defaultValue="avaliacao">
      <TabsList className="w-full rounded-2xl">
        <TabsTrigger value="avaliacao" className="rounded-xl font-bold">
          Avaliação
        </TabsTrigger>
        <TabsTrigger value="diario" className="rounded-xl font-bold">
          📖 Diário
        </TabsTrigger>
        <TabsTrigger value="registros" className="rounded-xl font-bold">
          Registros
        </TabsTrigger>
        <TabsTrigger value="relatorio" className="rounded-xl font-bold">
          Relatório
        </TabsTrigger>
      </TabsList>
      <TabsContent value="avaliacao" className="mt-6">
        <MindDailyAssessment />
      </TabsContent>
      <TabsContent value="diario" className="mt-6">
        <MindEmotionalJournal />
      </TabsContent>
      <TabsContent value="registros" className="mt-6">
        <MindHistoryTab />
      </TabsContent>
      <TabsContent value="relatorio" className="mt-6">
        <MindClinicalReport />
      </TabsContent>
    </Tabs>
  )
}
