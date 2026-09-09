import { create } from 'zustand'
import { persist } from 'zustand/middleware'
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

export interface NutritionState {
  dietPlans: DietPlan[]
  customFoods: CustomFood[]
  nutritionRecipes: NutritionRecipe[]
  fetchDietPlans: () => Promise<void>
  addDietPlan: (name: string, time: string) => Promise<void>
  deleteDietPlan: (id: string) => Promise<void>
  addDietPlanItem: (planId: string, item: Omit<DietPlanItem, 'id'>) => Promise<void>
  updateDietPlanItem: (
    planId: string,
    itemId: string,
    updates: Partial<DietPlanItem>,
  ) => Promise<void>
  deleteDietPlanItem: (planId: string, itemId: string) => Promise<void>
  fetchCustomFoods: () => Promise<void>
  addCustomFood: (food: Omit<CustomFood, 'id'>) => Promise<void>
  updateCustomFood: (id: string, updates: Partial<Omit<CustomFood, 'id'>>) => Promise<void>
  deleteCustomFood: (id: string) => Promise<void>
  fetchRecipes: () => Promise<void>
  addRecipe: (
    name: string,
    description: string,
    instructions: string,
    tags: string[],
    ingredients: { foodId: string; amount: string }[],
  ) => Promise<void>
  deleteRecipe: (id: string) => Promise<void>
}

export const useNutritionStore = create<NutritionState>()(
  persist(
    (set, get) => ({
      dietPlans: initialDietPlans,
      customFoods: initialCustomFoods,
      nutritionRecipes: [],

      fetchDietPlans: async () => {
        const {
          data: { user },
        } = await supabase.auth.getUser()
        if (!user) return
        const { data, error } = await supabase
          .from('diet_plans')
          .select('*, diet_plan_items(*)')
          .eq('user_id', user.id)
          .order('order_index', { ascending: true })

        if (error) {
          toast.error('Erro ao carregar planos alimentares.')
          return
        }

        if (data) {
          set({
            dietPlans: data.map((d: any) => ({
              id: d.id,
              name: d.name,
              time: d.time || '',
              orderIndex: d.order_index || 0,
              items: (d.diet_plan_items || []).map(mapDietItem),
            })),
          })
        }
      },

      addDietPlan: async (name: string, time: string) => {
        const tempId = genId()
        const previousDietPlans = get().dietPlans
        const newPlan: DietPlan = {
          id: tempId,
          name,
          time,
          orderIndex: previousDietPlans.length,
          items: [],
        }

        // 1. Atualização otimista imediata ("Zero Lag")
        set({ dietPlans: [...previousDietPlans, newPlan] })

        const {
          data: { user: u },
        } = await supabase.auth.getUser()
        if (!u) return

        // 2. Chamada ao Supabase com .select('id').single()
        const { data, error } = await supabase
          .from('diet_plans')
          .insert({ name, time, order_index: previousDietPlans.length, user_id: u.id })
          .select('id')
          .single()

        if (error || !data) {
          // 3. Rollback silencioso revertendo para o estado anterior + toast.error
          set({ dietPlans: previousDietPlans })
          toast.error('Erro ao criar refeição.')
          return
        }

        // 4. Sucesso: swap silencioso de tempId pelo UUID definitivo
        set({
          dietPlans: get().dietPlans.map((d) => (d.id === tempId ? { ...d, id: data.id } : d)),
        })
      },

      deleteDietPlan: async (id: string) => {
        const previousDietPlans = get().dietPlans
        // Atualização otimista imediata
        set({ dietPlans: previousDietPlans.filter((d) => d.id !== id) })

        const { error } = await supabase.from('diet_plans').delete().eq('id', id)
        if (error) {
          set({ dietPlans: previousDietPlans })
          toast.error('Erro ao excluir refeição.')
        }
      },

      addDietPlanItem: async (planId: string, item: Omit<DietPlanItem, 'id'>) => {
        const tempId = genId()
        const previousDietPlans = get().dietPlans
        const newItem: DietPlanItem = { ...item, id: tempId }

        // 1. Atualização otimista imediata
        set({
          dietPlans: previousDietPlans.map((d) =>
            d.id === planId ? { ...d, items: [...d.items, newItem] } : d,
          ),
        })

        const {
          data: { user: u },
        } = await supabase.auth.getUser()
        if (!u) return

        // 2. Chamada ao Supabase com .select('id').single()
        const { data, error } = await supabase
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
          .select('id')
          .single()

        if (error || !data) {
          // 3. Rollback silencioso para estado anterior + toast.error
          set({ dietPlans: previousDietPlans })
          toast.error('Erro ao adicionar alimento.')
          return
        }

        // 4. Swap silencioso de tempId pelo UUID real do Supabase
        set({
          dietPlans: get().dietPlans.map((d) =>
            d.id === planId
              ? {
                  ...d,
                  items: d.items.map((i) => (i.id === tempId ? { ...i, id: data.id } : i)),
                }
              : d,
          ),
        })
      },

      updateDietPlanItem: async (
        planId: string,
        itemId: string,
        updates: Partial<DietPlanItem>,
      ) => {
        const previousDietPlans = get().dietPlans
        // Atualização otimista imediata no estado local
        set({
          dietPlans: previousDietPlans.map((plan) =>
            plan.id !== planId
              ? plan
              : {
                  ...plan,
                  items: plan.items.map((item) =>
                    item.id === itemId ? { ...item, ...updates } : item,
                  ),
                },
          ),
        })

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

        const { error } = await (supabase as any)
          .from('diet_plan_items')
          .update(dbU)
          .eq('id', itemId)

        if (error) {
          // Rollback silencioso para estado anterior sem refetch
          set({ dietPlans: previousDietPlans })
          toast.error('Erro ao atualizar item.')
        }
      },

      deleteDietPlanItem: async (planId: string, itemId: string) => {
        const previousDietPlans = get().dietPlans
        // Atualização otimista imediata
        set({
          dietPlans: previousDietPlans.map((d) =>
            d.id === planId ? { ...d, items: d.items.filter((i) => i.id !== itemId) } : d,
          ),
        })

        const { error } = await supabase.from('diet_plan_items').delete().eq('id', itemId)
        if (error) {
          set({ dietPlans: previousDietPlans })
          toast.error('Erro ao excluir item.')
        }
      },

      fetchCustomFoods: async () => {
        const {
          data: { user },
        } = await supabase.auth.getUser()
        if (!user) return
        const { data, error } = await supabase
          .from('custom_foods')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })

        if (error) {
          toast.error('Erro ao carregar alimentos personalizados.')
          return
        }

        if (data) set({ customFoods: data.map(mapFood) })
      },

      addCustomFood: async (food: Omit<CustomFood, 'id'>) => {
        const tempId = genId()
        const previousCustomFoods = get().customFoods
        const newFood: CustomFood = { ...food, id: tempId }

        // 1. Atualização otimista imediata
        set({ customFoods: [newFood, ...previousCustomFoods] })

        const {
          data: { user: u },
        } = await supabase.auth.getUser()
        if (!u) return

        // 2. Chamada ao Supabase com .select('id').single()
        const { data, error } = await supabase
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
          .select('id')
          .single()

        if (error || !data) {
          // 3. Rollback silencioso para o estado anterior
          set({ customFoods: previousCustomFoods })
          toast.error('Erro ao cadastrar alimento.')
          return
        }

        // 4. Swap silencioso de tempId pelo UUID real do Supabase
        set({
          customFoods: get().customFoods.map((f) => (f.id === tempId ? { ...f, id: data.id } : f)),
        })
      },

      updateCustomFood: async (id: string, updates: Partial<Omit<CustomFood, 'id'>>) => {
        const previousCustomFoods = get().customFoods
        // Atualização otimista imediata
        set({
          customFoods: previousCustomFoods.map((f) => (f.id === id ? { ...f, ...updates } : f)),
        })

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

        const { error } = await (supabase as any).from('custom_foods').update(dbU).eq('id', id)
        if (error) {
          // Rollback silencioso sem refetch
          set({ customFoods: previousCustomFoods })
          toast.error('Erro ao atualizar alimento.')
        }
      },

      deleteCustomFood: async (id: string) => {
        const previousCustomFoods = get().customFoods
        set({ customFoods: previousCustomFoods.filter((f) => f.id !== id) })

        const { error } = await supabase.from('custom_foods').delete().eq('id', id)
        if (error) {
          set({ customFoods: previousCustomFoods })
          toast.error('Erro ao excluir alimento.')
        }
      },

      fetchRecipes: async () => {
        const {
          data: { user },
        } = await supabase.auth.getUser()
        if (!user) return
        const { data, error } = await supabase
          .from('nutrition_recipes')
          .select('*, recipe_ingredients(*, custom_foods(*))')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })

        if (error) {
          toast.error('Erro ao carregar receitas.')
          return
        }

        if (data) {
          set({
            nutritionRecipes: data.map((r: any) => ({
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
          })
        }
      },

      addRecipe: async (
        name: string,
        description: string,
        instructions: string,
        tags: string[],
        ingredients: { foodId: string; amount: string }[],
      ) => {
        const tempId = genId()
        const previousRecipes = get().nutritionRecipes
        const customFoodsList = get().customFoods

        const recipeIngredients: RecipeIngredient[] = ingredients.map((ing, i) => {
          const food = customFoodsList.find((f) => f.id === ing.foodId)
          const macros = calcMacrosForAmount(food?.baseUnit || '100g', ing.amount || '', {
            calories: food?.calories || 0,
            carbsG: food?.carbsG || 0,
            proteinG: food?.proteinG || 0,
            fatG: food?.fatG || 0,
            fibersG: food?.fibersG || 0,
            sodiumMg: food?.sodiumMg || 0,
          })
          return {
            id: `temp_${i}_${genId()}`,
            foodId: ing.foodId,
            foodName: food?.name || '',
            foodBaseUnit: food?.baseUnit || '100g',
            amount: ing.amount,
            ...macros,
          }
        })

        const newRecipe: NutritionRecipe = {
          id: tempId,
          name,
          description,
          instructions,
          tags,
          ingredients: recipeIngredients,
        }

        // 1. Atualização otimista imediata ("Zero Lag")
        set({ nutritionRecipes: [newRecipe, ...previousRecipes] })

        const {
          data: { user: u },
        } = await supabase.auth.getUser()
        if (!u) return

        // 2. Chamada ao Supabase com .select('id').single()
        const { data: recipeData, error } = await supabase
          .from('nutrition_recipes')
          .insert({ name, description, instructions, tags, user_id: u.id })
          .select('id')
          .single()

        if (error || !recipeData) {
          // 3. Rollback silencioso para o estado anterior
          set({ nutritionRecipes: previousRecipes })
          toast.error('Erro ao criar receita.')
          return
        }

        // Inserir os ingredientes da receita no Supabase
        const { data: insertedIngredients, error: ingError } = await supabase
          .from('recipe_ingredients')
          .insert(
            ingredients.map((ing) => ({
              recipe_id: recipeData.id,
              food_id: ing.foodId,
              amount: ing.amount,
            })),
          )
          .select('id, food_id')

        if (ingError) {
          // Se falhou inserir ingredientes, faz rollback do recipe inserido
          await supabase.from('nutrition_recipes').delete().eq('id', recipeData.id)
          set({ nutritionRecipes: previousRecipes })
          toast.error('Erro ao salvar ingredientes da receita.')
          return
        }

        // 4. Sucesso: swap silencioso de tempId pelo UUID real do Supabase (e dos ingredientes caso retornados)
        const ingredientIdMap = new Map<string, string>()
        if (insertedIngredients) {
          insertedIngredients.forEach((ii: any) => {
            if (ii.food_id && ii.id) ingredientIdMap.set(ii.food_id, ii.id)
          })
        }

        set({
          nutritionRecipes: get().nutritionRecipes.map((r) => {
            if (r.id !== tempId) return r
            return {
              ...r,
              id: recipeData.id,
              ingredients: r.ingredients.map((ing) => ({
                ...ing,
                id: ingredientIdMap.get(ing.foodId) || ing.id,
              })),
            }
          }),
        })
      },

      deleteRecipe: async (id: string) => {
        const previousRecipes = get().nutritionRecipes
        set({ nutritionRecipes: previousRecipes.filter((r) => r.id !== id) })

        const { error } = await supabase.from('nutrition_recipes').delete().eq('id', id)
        if (error) {
          set({ nutritionRecipes: previousRecipes })
          toast.error('Erro ao excluir receita.')
        }
      },
    }),
    {
      name: 'vt_nutrition_storage',
      partialize: (state) => ({
        dietPlans: state.dietPlans,
        customFoods: state.customFoods,
        nutritionRecipes: state.nutritionRecipes,
      }),
    },
  ),
)

// Exportação compatível para facilitar caso algum componente ainda importe NutritionStoreProvider
export function NutritionStoreProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
