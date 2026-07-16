import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { MindEvaluation } from '@/components/health/mind-evaluation'
import { MindClinicalReport } from '@/components/health/mind-clinical-report'

export function MindTab() {
  return (
    <Tabs defaultValue="avaliacao">
      <TabsList className="w-full rounded-2xl print:hidden">
        <TabsTrigger value="avaliacao" className="rounded-xl font-bold">
          Avaliação de Hoje
        </TabsTrigger>
        <TabsTrigger value="relatorio" className="rounded-xl font-bold">
          Relatório Clínico (Para o Psicólogo)
        </TabsTrigger>
      </TabsList>
      <TabsContent value="avaliacao" className="mt-6">
        <MindEvaluation />
      </TabsContent>
      <TabsContent value="relatorio" className="mt-6">
        <MindClinicalReport />
      </TabsContent>
    </Tabs>
  )
}
