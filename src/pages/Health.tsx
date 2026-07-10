import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { HydrationWidget } from '@/components/health/hydration-widget'
import { MoodWidget } from '@/components/health/mood-widget'
import { BowelWidget } from '@/components/health/bowel-widget'
import { UrineWidget } from '@/components/health/urine-widget'
import { HealthHistory } from '@/components/health/health-history'
import { NutritionWidget } from '@/components/health/nutrition-widget'
import { ExerciseWidget } from '@/components/health/exercise-widget'

export default function HealthPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in-up pb-10">
      <header className="print:hidden">
        <h2 className="text-3xl font-extrabold tracking-tight">Saúde & Bem-estar</h2>
        <p className="text-muted-foreground mt-1 font-semibold">
          Cuide do seu corpo e mente todos os dias.
        </p>
      </header>

      <Tabs defaultValue="geral">
        <TabsList className="w-full rounded-2xl print:hidden">
          <TabsTrigger value="geral" className="rounded-xl font-bold">
            Geral
          </TabsTrigger>
          <TabsTrigger value="nutricao" className="rounded-xl font-bold">
            Nutrição
          </TabsTrigger>
          <TabsTrigger value="exercicios" className="rounded-xl font-bold">
            Exercícios
          </TabsTrigger>
          <TabsTrigger value="history" className="rounded-xl font-bold">
            Histórico
          </TabsTrigger>
        </TabsList>

        <TabsContent value="geral" className="space-y-6 mt-6 print:hidden">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <HydrationWidget />
            <MoodWidget />
            <BowelWidget />
            <UrineWidget />
          </div>
        </TabsContent>

        <TabsContent value="nutricao" className="mt-6 print:hidden">
          <NutritionWidget />
        </TabsContent>

        <TabsContent value="exercicios" className="mt-6 print:hidden">
          <ExerciseWidget />
        </TabsContent>

        <TabsContent value="history" className="mt-6 print:block">
          <HealthHistory />
        </TabsContent>
      </Tabs>
    </div>
  )
}
