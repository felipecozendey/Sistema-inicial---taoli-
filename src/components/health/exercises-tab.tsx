import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { WorkoutDashboard } from '@/components/health/workout-dashboard'
import { WorkoutPlans } from '@/components/health/workout-plans'
import { WorkoutHistoryView } from '@/components/health/workout-history-view'

export function ExercisesTab() {
  return (
    <Tabs defaultValue="dashboard">
      <TabsList className="w-full rounded-2xl">
        <TabsTrigger value="dashboard" className="rounded-xl font-bold">
          Dashboard
        </TabsTrigger>
        <TabsTrigger value="fichas" className="rounded-xl font-bold">
          Minhas Fichas
        </TabsTrigger>
        <TabsTrigger value="historico" className="rounded-xl font-bold">
          Histórico
        </TabsTrigger>
      </TabsList>
      <TabsContent value="dashboard" className="mt-6">
        <WorkoutDashboard />
      </TabsContent>
      <TabsContent value="fichas" className="mt-6">
        <WorkoutPlans />
      </TabsContent>
      <TabsContent value="historico" className="mt-6">
        <WorkoutHistoryView />
      </TabsContent>
    </Tabs>
  )
}
