import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { HydrationWidget } from '@/components/health/hydration-widget'
import { MoodWidget } from '@/components/health/mood-widget'
import { BowelWidget } from '@/components/health/bowel-widget'
import { UrineWidget } from '@/components/health/urine-widget'
import { NutritionWidget } from '@/components/health/nutrition-widget'
import { ExerciseWidget } from '@/components/health/exercise-widget'
import { BodyXrayTab } from '@/components/health/body-xray-tab'
import { HealthHistory } from '@/components/health/health-history'
import { FastingTab } from '@/components/health/fasting-tab'

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
          <TabsTrigger value="jejum" className="rounded-xl font-bold">
            Jejum
          </TabsTrigger>
          <TabsTrigger value="nutricao" className="rounded-xl font-bold">
            Nutrição
          </TabsTrigger>
          <TabsTrigger value="exercicios" className="rounded-xl font-bold">
            Exercícios
          </TabsTrigger>
          <TabsTrigger value="raio-x" className="rounded-xl font-bold">
            Raio-X Corporal
          </TabsTrigger>
        </TabsList>

        <TabsContent value="geral" className="mt-6">
          <Tabs defaultValue="registrar">
            <TabsList className="w-full rounded-2xl print:hidden">
              <TabsTrigger value="registrar" className="rounded-xl font-bold">
                Registrar Hoje
              </TabsTrigger>
              <TabsTrigger value="historico" className="rounded-xl font-bold">
                Histórico de Registros
              </TabsTrigger>
            </TabsList>
            <TabsContent value="registrar" className="space-y-6 mt-6 print:hidden">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <HydrationWidget />
                <MoodWidget />
                <BowelWidget />
                <UrineWidget />
              </div>
            </TabsContent>
            <TabsContent value="historico" className="mt-6">
              <HealthHistory />
            </TabsContent>
          </Tabs>
        </TabsContent>

        <TabsContent value="jejum" className="mt-6 print:hidden">
          <FastingTab />
        </TabsContent>

        <TabsContent value="nutricao" className="mt-6 print:hidden">
          <NutritionWidget />
        </TabsContent>

        <TabsContent value="exercicios" className="mt-6 print:hidden">
          <ExerciseWidget />
        </TabsContent>

        <TabsContent value="raio-x" className="mt-6 print:hidden">
          <BodyXrayTab />
        </TabsContent>
      </Tabs>
    </div>
  )
}
