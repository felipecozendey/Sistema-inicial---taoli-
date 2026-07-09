import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { HydrationWidget } from '@/components/health/hydration-widget'
import { MoodWidget } from '@/components/health/mood-widget'
import { BowelWidget } from '@/components/health/bowel-widget'
import { UrineWidget } from '@/components/health/urine-widget'
import { HealthHistory } from '@/components/health/health-history'
import { NutritionPlaceholder, ExercisePlaceholder } from '@/components/health/health-placeholders'

export default function HealthPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in-up pb-10">
      <header className="print:hidden">
        <h2 className="text-3xl font-extrabold tracking-tight">Saúde & Bem-estar</h2>
        <p className="text-muted-foreground mt-1 font-semibold">
          Cuide do seu corpo e mente todos os dias.
        </p>
      </header>

      <Tabs defaultValue="daily">
        <TabsList className="w-full rounded-2xl print:hidden">
          <TabsTrigger value="daily" className="rounded-xl font-bold">
            Registro Diário
          </TabsTrigger>
          <TabsTrigger value="history" className="rounded-xl font-bold">
            Histórico Completo
          </TabsTrigger>
        </TabsList>

        <TabsContent value="daily" className="space-y-6 mt-6 print:hidden">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <HydrationWidget />
            <MoodWidget />
            <BowelWidget />
            <UrineWidget />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <NutritionPlaceholder />
            <ExercisePlaceholder />
          </div>
          <p className="text-xs text-muted-foreground font-semibold text-center">
            ⚠️ Os dados são armazenados localmente no navegador. Conecte um backend para
            persistência permanente.
          </p>
        </TabsContent>

        <TabsContent value="history" className="mt-6 print:block">
          <HealthHistory />
        </TabsContent>
      </Tabs>
    </div>
  )
}
