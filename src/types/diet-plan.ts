export interface DietPlanMealItem {
  id: string
  description: string
  quantity?: string
}

export interface DietPlanMeal {
  id: string
  title: string
  time: string
  items: DietPlanMealItem[]
}
