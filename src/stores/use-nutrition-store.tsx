import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { supabase } from '@/lib/supabase/client'
import { toast } from 'sonner'

export type DietPlanItem = {
  id: string
  description: string
  quantity: string
  calories: number
  carbsG: number
  proteinG: number
  fatG: number
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
      },
      {
        id: 'di2',
        description: 'Ovo Cozido',
        quantity: '2unid',
        calories: 156,
        carbsG: 1.2,
        proteinG: 12.6,
        fatG: 10.6,
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
      },
      {
        id: 'di4',
        description: 'Arroz Integral',
        quantity: '150g',
        calories: 168,
        carbsG: 35,
        proteinG: 3.5,
        fatG: 1.2,
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
  },
  {
    id: 'cf2',
    name: 'Batata Doce Cozida',
    baseUnit: '100g',
    calories: 86,
    carbsG: 20,
    proteinG: 1.6,
    fatG: 0.1,
  },
]

interface NutritionState {
  dietPlans: DietPlan[]
  customFoods: CustomFood[]
  fetchDietPlans: () => Promise<void>
  addDietPlan: (name: string, time: string) => void
  deleteDietPlan: (id: string) => void
  addDietPlanItem: (planId: string, item: Omit<DietPlanItem, 'id'>) => void
  deleteDietPlanItem: (planId: string, itemId: string) => void
  fetchCustomFoods: () => Promise<void>
  addCustomFood: (food: Omit<CustomFood, 'id'>) => Promise<void>
  deleteCustomFood: (id: string) => void
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

  useEffect(() => {
    localStorage.setItem('vt_nutrition_diet_plans', JSON.stringify(dietPlans))
  }, [dietPlans])
  useEffect(() => {
    localStorage.setItem('vt_nutrition_custom_foods', JSON.stringify(customFoods))
  }, [customFoods])

  const fetchDietPlans = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return
    const { data } = await (supabase as any)
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
          items: (d.diet_plan_items || []).map((i: any) => ({
            id: i.id,
            description: i.description || '',
            quantity: i.quantity || '',
            calories: Number(i.calories) || 0,
            carbsG: Number(i.carbs_g) || 0,
            proteinG: Number(i.protein_g) || 0,
            fatG: Number(i.fat_g) || 0,
          })),
        })),
      )
  }
  const addDietPlan = (name: string, time: string) => {
    const tempId = genId()
    setDietPlans((p) => [...p, { id: tempId, name, time, orderIndex: p.length, items: [] }])
    supabase.auth.getUser().then(({ data: { user: u } }) => {
      if (!u) return
      ;(supabase as any)
        .from('diet_plans')
        .insert({ name, time, order_index: dietPlans.length, user_id: u.id })
        .then(({ error }: { error: any }) => {
          if (error) {
            setDietPlans((p) => p.filter((d) => d.id !== tempId))
            toast.error('Erro ao criar refeição.')
          } else fetchDietPlans()
        })
    })
  }
  const deleteDietPlan = (id: string) => {
    setDietPlans((p) => p.filter((d) => d.id !== id))
    ;(supabase as any).from('diet_plans').delete().eq('id', id).then()
  }
  const addDietPlanItem = (planId: string, item: Omit<DietPlanItem, 'id'>) => {
    const tempId = genId()
    setDietPlans((p) =>
      p.map((d) => (d.id === planId ? { ...d, items: [...d.items, { ...item, id: tempId }] } : d)),
    )
    supabase.auth.getUser().then(({ data: { user: u } }) => {
      if (!u) return
      ;(supabase as any)
        .from('diet_plan_items')
        .insert({
          plan_id: planId,
          description: item.description,
          quantity: item.quantity,
          calories: item.calories,
          carbs_g: item.carbsG,
          protein_g: item.proteinG,
          fat_g: item.fatG,
        })
        .then(({ error }: { error: any }) => {
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
  const deleteDietPlanItem = (planId: string, itemId: string) => {
    setDietPlans((p) =>
      p.map((d) => (d.id === planId ? { ...d, items: d.items.filter((i) => i.id !== itemId) } : d)),
    )
    ;(supabase as any).from('diet_plan_items').delete().eq('id', itemId).then()
  }
  const fetchCustomFoods = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return
    const { data } = await (supabase as any)
      .from('custom_foods')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
    if (data)
      setCustomFoods(
        data.map((d: any) => ({
          id: d.id,
          name: d.name,
          baseUnit: d.base_unit || '100g',
          calories: Number(d.calories) || 0,
          carbsG: Number(d.carbs_g) || 0,
          proteinG: Number(d.protein_g) || 0,
          fatG: Number(d.fat_g) || 0,
        })),
      )
  }
  const addCustomFood = async (food: Omit<CustomFood, 'id'>) => {
    const tempId = genId()
    setCustomFoods((p) => [{ ...food, id: tempId }, ...p])
    const {
      data: { user: u },
    } = await supabase.auth.getUser()
    if (!u) return
    const { data } = await (supabase as any)
      .from('custom_foods')
      .insert({
        name: food.name,
        base_unit: food.baseUnit,
        calories: food.calories,
        carbs_g: food.carbsG,
        protein_g: food.proteinG,
        fat_g: food.fatG,
        user_id: u.id,
      })
      .select()
      .single()
    if (data) setCustomFoods((p) => p.map((f) => (f.id === tempId ? { ...f, id: data.id } : f)))
  }
  const deleteCustomFood = (id: string) => {
    setCustomFoods((p) => p.filter((f) => f.id !== id))
    ;(supabase as any).from('custom_foods').delete().eq('id', id).then()
  }

  return (
    <Ctx.Provider
      value={{
        dietPlans,
        customFoods,
        fetchDietPlans,
        addDietPlan,
        deleteDietPlan,
        addDietPlanItem,
        deleteDietPlanItem,
        fetchCustomFoods,
        addCustomFood,
        deleteCustomFood,
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
