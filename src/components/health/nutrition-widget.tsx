import { useEffect } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useAppStore } from '@/stores/useAppStore'
import { NutritionOverview } from '@/components/health/nutrition-overview'
import { DietPlanBuilder } from '@/components/health/diet-plan-builder'
import { MealHistory } from '@/components/health/meal-history'

export function NutritionWidget() {
  const { fetchDietPlans, fetchNutritionMicroGoals, fetchMealLogs, fetchDailyChecklist } =
    useAppStore()

  useEffect(() => {
    fetchDietPlans()
    fetchNutritionMicroGoals()
    fetchMealLogs()
    fetchDailyChecklist()
  }, [fetchDietPlans, fetchNutritionMicroGoals, fetchMealLogs, fetchDailyChecklist])

  return (
    <Tabs defaultValue="overview" className="space-y-6">
      <TabsList className="w-full rounded-2xl">
        <TabsTrigger value="overview" className="rounded-xl font-bold">
          Visão Geral
        </TabsTrigger>
        <TabsTrigger value="plan" className="rounded-xl font-bold">
          Plano Alimentar
        </TabsTrigger>
        <TabsTrigger value="history" className="rounded-xl font-bold">
          Histórico
        </TabsTrigger>
      </TabsList>
      <TabsContent value="overview">
        <NutritionOverview />
      </TabsContent>
      <TabsContent value="plan">
        <DietPlanBuilder />
      </TabsContent>
      <TabsContent value="history">
        <MealHistory />
      </TabsContent>
    </Tabs>
  )
}
