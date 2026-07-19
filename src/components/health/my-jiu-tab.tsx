import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { JiuDashboard } from '@/components/health/jiu-dashboard'
import { JiuArsenal } from '@/components/health/jiu-arsenal'
import { JiuTrainingLog } from '@/components/health/jiu-training-log'

export function MyJiuTab() {
  return (
    <Tabs defaultValue="tatame">
      <TabsList className="w-full rounded-2xl">
        <TabsTrigger value="tatame" className="rounded-xl font-bold">
          🥋 Meu Tatame
        </TabsTrigger>
        <TabsTrigger value="arsenal" className="rounded-xl font-bold">
          📚 Arsenal
        </TabsTrigger>
        <TabsTrigger value="diario" className="rounded-xl font-bold">
          📝 Diário
        </TabsTrigger>
      </TabsList>
      <TabsContent value="tatame" className="mt-6">
        <JiuDashboard />
      </TabsContent>
      <TabsContent value="arsenal" className="mt-6">
        <JiuArsenal />
      </TabsContent>
      <TabsContent value="diario" className="mt-6">
        <JiuTrainingLog />
      </TabsContent>
    </Tabs>
  )
}
