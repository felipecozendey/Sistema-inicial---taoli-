import { useEffect } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useAppStore } from '@/stores/useAppStore'
import { NutritionOverview } from '@/components/health/nutrition-overview'
import { MealHistory } from '@/components/health/meal-history'

export function NutritionWidget() {
  const { fetchNutritionMicroGoals, fetchMealLogs, fetchDailyChecklist } = useAppStore()

  useEffect(() => {
    fetchNutritionMicroGoals()
    fetchMealLogs()
    fetchDailyChecklist()
  }, [fetchNutritionMicroGoals, fetchMealLogs, fetchDailyChecklist])

  return (
    <Tabs defaultValue="overview" className="space-y-6">
      <TabsList className="w-full rounded-2xl">
        <TabsTrigger value="overview" className="rounded-xl font-bold">
          Visão Geral
        </TabsTrigger>
        <TabsTrigger value="history" className="rounded-xl font-bold">
          Histórico
        </TabsTrigger>
      </TabsList>
      <TabsContent value="overview">
        <NutritionOverview />
      </TabsContent>
      <TabsContent value="history">
        <MealHistory />
      </TabsContent>
    </Tabs>
  )
}
