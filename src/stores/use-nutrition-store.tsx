import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { supabase } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { calcMacrosForAmount } from '@/lib/nutrition-utils'

export type DietPlanItem = {
  id: string
  description: string
  quantity: string
  calories: number
  carbsG: number
  proteinG: number
  fatG: number
  fibersG: number
  sodiumMg: number
  allergens: string | null
}
export type DietPlan = {
  id: string
  name: string
  time: string
  orderIndex: number
  items: DietPlanItem[]
}
export type CustomFood = {
  id: string
  name: string
  baseUnit: string
  calories: number
  carbsG: number
  proteinG: number
  fatG: number
  fibersG: number
  sodiumMg: number
  allergens: string | null
  tags: string[]
}
export type RecipeIngredient = {
  id: string
  foodId: string
  foodName: string
  foodBaseUnit: string
  amount: string
  calories: number
  carbsG: number
  proteinG: number
  fatG: number
  fibersG: number
  sodiumMg: number
}
export type NutritionRecipe = {
  id: string
  name: string
  description: string
  instructions: string
  tags: string[]
  ingredients: RecipeIngredient[]
}

const genId = () => Math.random().toString(36).substring(2, 9)

const initialDietPlans: DietPlan[] = [
  {
    id: 'dp1',
    name: 'Café da Manhã',
    time: '07:00',
    orderIndex: 0,
    items: [
      {
        id: 'di1',
        description: 'Aveia com Banana',
        quantity: '150g',
        calories: 180,
        carbsG: 32,
        proteinG: 5,
        fatG: 3,
        fibersG: 4,
        sodiumMg: 2,
        allergens: null,
      },
      {
        id: 'di2',
        description: 'Ovo Cozido',
        quantity: '2unid',
        calories: 156,
        carbsG: 1.2,
        proteinG: 12.6,
        fatG: 10.6,
        fibersG: 0,
        sodiumMg: 124,
        allergens: 'ovos',
      },
    ],
  },
  {
    id: 'dp2',
    name: 'Almoço',
    time: '12:30',
    orderIndex: 1,
    items: [
      {
        id: 'di3',
        description: 'Frango Grelhado',
        quantity: '200g',
        calories: 330,
        carbsG: 0,
        proteinG: 62,
        fatG: 7.2,
        fibersG: 0,
        sodiumMg: 120,
        allergens: null,
      },
      {
        id: 'di4',
        description: 'Arroz Integral',
        quantity: '150g',
        calories: 168,
        carbsG: 35,
        proteinG: 3.5,
        fatG: 1.2,
        fibersG: 1.5,
        sodiumMg: 5,
        allergens: null,
      },
    ],
  },
  { id: 'dp3', name: 'Jantar', time: '19:30', orderIndex: 2, items: [] },
]
const initialCustomFoods: CustomFood[] = [
  {
    id: 'cf1',
    name: 'Whey Protein',
    baseUnit: '30g',
    calories: 120,
    carbsG: 3,
    proteinG: 24,
    fatG: 1.5,
    fibersG: 0,
    sodiumMg: 50,
    allergens: 'leite',
    tags: ['Alta Proteína'],
  },
  {
    id: 'cf2',
    name: 'Batata Doce Cozida',
    baseUnit: '100g',
    calories: 86,
    carbsG: 20,
    proteinG: 1.6,
    fatG: 0.1,
    fibersG: 3,
    sodiumMg: 18,
    allergens: null,
    tags: ['Vegano', 'Vegetariano'],
  },
]

const mapDietItem = (i: any): DietPlanItem => ({
  id: i.id,
  description: i.description || '',
  quantity: i.quantity || '',
  calories: Number(i.calories) || 0,
  carbsG: Number(i.carbs_g) || 0,
  proteinG: Number(i.protein_g) || 0,
  fatG: Number(i.fat_g) || 0,
  fibersG: Number(i.fibers_g) || 0,
  sodiumMg: Number(i.sodium_mg) || 0,
  allergens: i.allergens || null,
})
const mapFood = (d: any): CustomFood => ({
  id: d.id,
  name: d.name,
  baseUnit: d.base_unit || '100g',
  calories: Number(d.calories) || 0,
  carbsG: Number(d.carbs_g) || 0,
  proteinG: Number(d.protein_g) || 0,
  fatG: Number(d.fat_g) || 0,
  fibersG: Number(d.fibers_g) || 0,
  sodiumMg: Number(d.sodium_mg) || 0,
  allergens: d.allergens || null,
  tags: d.tags || [],
})

interface NutritionState {
  dietPlans: DietPlan[]
  customFoods: CustomFood[]
  nutritionRecipes: NutritionRecipe[]
  fetchDietPlans: () => Promise<void>
  addDietPlan: (name: string, time: string) => void
  deleteDietPlan: (id: string) => void
  addDietPlanItem: (planId: string, item: Omit<DietPlanItem, 'id'>) => void
  updateDietPlanItem: (planId: string, itemId: string, updates: Partial<DietPlanItem>) => void
  deleteDietPlanItem: (planId: string, itemId: string) => void
  fetchCustomFoods: () => Promise<void>
  addCustomFood: (food: Omit<CustomFood, 'id'>) => Promise<void>
  updateCustomFood: (id: string, updates: Partial<Omit<CustomFood, 'id'>>) => Promise<void>
  deleteCustomFood: (id: string) => void
  fetchRecipes: () => Promise<void>
  addRecipe: (
    name: string,
    description: string,
    instructions: string,
    tags: string[],
    ingredients: { foodId: string; amount: string }[],
  ) => Promise<void>
  deleteRecipe: (id: string) => void
}

const Ctx = createContext<NutritionState | undefined>(undefined)

export const NutritionStoreProvider = ({ children }: { children: ReactNode }) => {
  const [dietPlans, setDietPlans] = useState<DietPlan[]>(() => {
    const s = localStorage.getItem('vt_nutrition_diet_plans')
    return s ? JSON.parse(s) : initialDietPlans
  })
  const [customFoods, setCustomFoods] = useState<CustomFood[]>(() => {
    const s = localStorage.getItem('vt_nutrition_custom_foods')
    return s ? JSON.parse(s) : initialCustomFoods
  })
  const [nutritionRecipes, setNutritionRecipes] = useState<NutritionRecipe[]>(() => {
    const s = localStorage.getItem('vt_nutrition_recipes')
    return s ? JSON.parse(s) : []
  })

  useEffect(() => {
    localStorage.setItem('vt_nutrition_diet_plans', JSON.stringify(dietPlans))
  }, [dietPlans])
  useEffect(() => {
    localStorage.setItem('vt_nutrition_custom_foods', JSON.stringify(customFoods))
  }, [customFoods])
  useEffect(() => {
    localStorage.setItem('vt_nutrition_recipes', JSON.stringify(nutritionRecipes))
  }, [nutritionRecipes])

  const fetchDietPlans = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return
    const { data } = await supabase
      .from('diet_plans')
      .select('*, diet_plan_items(*)')
      .eq('user_id', user.id)
      .order('order_index', { ascending: true })
    if (data)
      setDietPlans(
        data.map((d: any) => ({
          id: d.id,
          name: d.name,
          time: d.time || '',
          orderIndex: d.order_index || 0,
          items: (d.diet_plan_items || []).map(mapDietItem),
        })),
      )
  }
  const addDietPlan = (name: string, time: string) => {
    const tempId = genId()
    setDietPlans((p) => [...p, { id: tempId, name, time, orderIndex: p.length, items: [] }])
    supabase.auth.getUser().then(({ data: { user: u } }) => {
      if (!u) return
      supabase
        .from('diet_plans')
        .insert({ name, time, order_index: dietPlans.length, user_id: u.id })
        .then(({ error }: any) => {
          if (error) {
            setDietPlans((p) => p.filter((d) => d.id !== tempId))
            toast.error('Erro ao criar refeição.')
          } else fetchDietPlans()
        })
    })
  }
  const deleteDietPlan = (id: string) => {
    setDietPlans((p) => p.filter((d) => d.id !== id))
    supabase.from('diet_plans').delete().eq('id', id).then()
  }
  const addDietPlanItem = (planId: string, item: Omit<DietPlanItem, 'id'>) => {
    const tempId = genId()
    setDietPlans((p) =>
      p.map((d) => (d.id === planId ? { ...d, items: [...d.items, { ...item, id: tempId }] } : d)),
    )
    supabase.auth.getUser().then(({ data: { user: u } }) => {
      if (!u) return
      supabase
        .from('diet_plan_items')
        .insert({
          plan_id: planId,
          description: item.description,
          quantity: item.quantity,
          calories: item.calories,
          carbs_g: item.carbsG,
          protein_g: item.proteinG,
          fat_g: item.fatG,
          fibers_g: item.fibersG,
          sodium_mg: item.sodiumMg,
          allergens: item.allergens,
        })
        .then(({ error }: any) => {
          if (error) {
            setDietPlans((p) =>
              p.map((d) =>
                d.id === planId ? { ...d, items: d.items.filter((i) => i.id !== tempId) } : d,
              ),
            )
            toast.error('Erro ao adicionar alimento.')
          }
        })
    })
  }
  const updateDietPlanItem = (planId: string, itemId: string, updates: Partial<DietPlanItem>) => {
    setDietPlans((p) =>
      p.map((plan) =>
        plan.id !== planId
          ? plan
          : {
              ...plan,
              items: plan.items.map((item) =>
                item.id === itemId ? { ...item, ...updates } : item,
              ),
            },
      ),
    )
    const dbU: Record<string, any> = {}
    if (updates.description !== undefined) dbU.description = updates.description
    if (updates.quantity !== undefined) dbU.quantity = updates.quantity
    if (updates.calories !== undefined) dbU.calories = updates.calories
    if (updates.carbsG !== undefined) dbU.carbs_g = updates.carbsG
    if (updates.proteinG !== undefined) dbU.protein_g = updates.proteinG
    if (updates.fatG !== undefined) dbU.fat_g = updates.fatG
    if (updates.fibersG !== undefined) dbU.fibers_g = updates.fibersG
    if (updates.sodiumMg !== undefined) dbU.sodium_mg = updates.sodiumMg
    if (updates.allergens !== undefined) dbU.allergens = updates.allergens
    supabase
      .from('diet_plan_items')
      .update(dbU)
      .eq('id', itemId)
      .then(({ error }: any) => {
        if (error) {
          toast.error('Erro ao atualizar item.')
          fetchDietPlans()
        }
      })
  }
  const deleteDietPlanItem = (planId: string, itemId: string) => {
    setDietPlans((p) =>
      p.map((d) => (d.id === planId ? { ...d, items: d.items.filter((i) => i.id !== itemId) } : d)),
    )
    supabase.from('diet_plan_items').delete().eq('id', itemId).then()
  }
  const fetchCustomFoods = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return
    const { data } = await supabase
      .from('custom_foods')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
    if (data) setCustomFoods(data.map(mapFood))
  }
  const addCustomFood = async (food: Omit<CustomFood, 'id'>) => {
    const tempId = genId()
    setCustomFoods((p) => [{ ...food, id: tempId }, ...p])
    const {
      data: { user: u },
    } = await supabase.auth.getUser()
    if (!u) return
    const { data } = await supabase
      .from('custom_foods')
      .insert({
        name: food.name,
        base_unit: food.baseUnit,
        calories: food.calories,
        carbs_g: food.carbsG,
        protein_g: food.proteinG,
        fat_g: food.fatG,
        fibers_g: food.fibersG,
        sodium_mg: food.sodiumMg,
        allergens: food.allergens,
        tags: food.tags,
        user_id: u.id,
      })
      .select()
      .single()
    if (data) setCustomFoods((p) => p.map((f) => (f.id === tempId ? { ...f, id: data.id } : f)))
    else {
      setCustomFoods((p) => p.filter((f) => f.id !== tempId))
      toast.error('Erro ao cadastrar alimento.')
    }
  }
  const updateCustomFood = async (id: string, updates: Partial<Omit<CustomFood, 'id'>>) => {
    setCustomFoods((p) => p.map((f) => (f.id === id ? { ...f, ...updates } : f)))
    const dbU: Record<string, any> = {}
    if (updates.name !== undefined) dbU.name = updates.name
    if (updates.baseUnit !== undefined) dbU.base_unit = updates.baseUnit
    if (updates.calories !== undefined) dbU.calories = updates.calories
    if (updates.carbsG !== undefined) dbU.carbs_g = updates.carbsG
    if (updates.proteinG !== undefined) dbU.protein_g = updates.proteinG
    if (updates.fatG !== undefined) dbU.fat_g = updates.fatG
    if (updates.fibersG !== undefined) dbU.fibers_g = updates.fibersG
    if (updates.sodiumMg !== undefined) dbU.sodium_mg = updates.sodiumMg
    if (updates.allergens !== undefined) dbU.allergens = updates.allergens
    if (updates.tags !== undefined) dbU.tags = updates.tags
    const { error } = await supabase.from('custom_foods').update(dbU).eq('id', id)
    if (error) {
      toast.error('Erro ao atualizar alimento.')
      fetchCustomFoods()
    }
  }
  const deleteCustomFood = (id: string) => {
    setCustomFoods((p) => p.filter((f) => f.id !== id))
    supabase.from('custom_foods').delete().eq('id', id).then()
  }
  const fetchRecipes = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return
    const { data } = await supabase
      .from('nutrition_recipes')
      .select('*, recipe_ingredients(*, custom_foods(*))')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
    if (data)
      setNutritionRecipes(
        data.map((r: any) => ({
          id: r.id,
          name: r.name,
          description: r.description || '',
          instructions: r.instructions || '',
          tags: r.tags || [],
          ingredients: (r.recipe_ingredients || []).map((ri: any) => {
            const food = ri.custom_foods
            const macros = calcMacrosForAmount(food?.base_unit || '100g', ri.amount || '', {
              calories: Number(food?.calories) || 0,
              carbsG: Number(food?.carbs_g) || 0,
              proteinG: Number(food?.protein_g) || 0,
              fatG: Number(food?.fat_g) || 0,
              fibersG: Number(food?.fibers_g) || 0,
              sodiumMg: Number(food?.sodium_mg) || 0,
            })
            return {
              id: ri.id,
              foodId: ri.food_id,
              foodName: food?.name || '',
              foodBaseUnit: food?.base_unit || '100g',
              amount: ri.amount || '',
              ...macros,
            }
          }),
        })),
      )
  }
  const addRecipe = async (
    name: string,
    description: string,
    instructions: string,
    tags: string[],
    ingredients: { foodId: string; amount: string }[],
  ) => {
    const tempId = genId()
    const recipeIngredients: RecipeIngredient[] = ingredients.map((ing, i) => {
      const food = customFoods.find((f) => f.id === ing.foodId)
      const macros = calcMacrosForAmount(food?.baseUnit || '100g', ing.amount || '', {
        calories: food?.calories || 0,
        carbsG: food?.carbsG || 0,
        proteinG: food?.proteinG || 0,
        fatG: food?.fatG || 0,
        fibersG: food?.fibersG || 0,
        sodiumMg: food?.sodiumMg || 0,
      })
      return {
        id: `temp_${i}`,
        foodId: ing.foodId,
        foodName: food?.name || '',
        foodBaseUnit: food?.baseUnit || '100g',
        amount: ing.amount,
        ...macros,
      }
    })
    setNutritionRecipes((p) => [
      { id: tempId, name, description, instructions, tags, ingredients: recipeIngredients },
      ...p,
    ])
    const {
      data: { user: u },
    } = await supabase.auth.getUser()
    if (!u) return
    const { data: recipeData, error } = await supabase
      .from('nutrition_recipes')
      .insert({ name, description, instructions, tags, user_id: u.id })
      .select()
      .single()
    if (error || !recipeData) {
      setNutritionRecipes((p) => p.filter((r) => r.id !== tempId))
      toast.error('Erro ao criar receita.')
      return
    }
    await supabase
      .from('recipe_ingredients')
      .insert(
        ingredients.map((ing) => ({
          recipe_id: recipeData.id,
          food_id: ing.foodId,
          amount: ing.amount,
        })),
      )
    setNutritionRecipes((p) => p.map((r) => (r.id === tempId ? { ...r, id: recipeData.id } : r)))
  }
  const deleteRecipe = (id: string) => {
    setNutritionRecipes((p) => p.filter((r) => r.id !== id))
    supabase.from('nutrition_recipes').delete().eq('id', id).then()
  }

  return (
    <Ctx.Provider
      value={{
        dietPlans,
        customFoods,
        nutritionRecipes,
        fetchDietPlans,
        addDietPlan,
        deleteDietPlan,
        addDietPlanItem,
        updateDietPlanItem,
        deleteDietPlanItem,
        fetchCustomFoods,
        addCustomFood,
        updateCustomFood,
        deleteCustomFood,
        fetchRecipes,
        addRecipe,
        deleteRecipe,
      }}
    >
      {children}
    </Ctx.Provider>
  )
}

export function useNutritionStore(): NutritionState
export function useNutritionStore<T>(selector: (s: NutritionState) => T): T
export function useNutritionStore<T>(selector?: (s: NutritionState) => T): T | NutritionState {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useNutritionStore must be used within NutritionStoreProvider')
  if (selector) return selector(ctx)
  return ctx
}
