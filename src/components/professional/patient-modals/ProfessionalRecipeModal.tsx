import { useState, useEffect, useMemo } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { FOOD_TAG_PRESETS, calcMacrosForAmount } from '@/lib/nutrition-utils'
import { Search, Plus, Check, X, Stethoscope } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { supabase } from '@/lib/supabase/client'
import { useProfessionalPatientWrite } from '@/hooks/use-professional-patient-write'
import type { CustomFood } from '@/stores/use-nutrition-store'

type DraftIngredient = {
  foodId: string
  foodName: string
  foodBaseUnit: string
  amount: string
}

interface Props {
  open: boolean
  onOpenChange: (o: boolean) => void
  patientName: string
  onSuccess?: () => void
}

export function ProfessionalRecipeModal({ open, onOpenChange, patientName, onSuccess }: Props) {
  const { createRecipeForPatient } = useProfessionalPatientWrite()
  const [foods, setFoods] = useState<CustomFood[]>([])
  const [loadingFoods, setLoadingFoods] = useState(false)

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [instructions, setInstructions] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const [search, setSearch] = useState('')
  const [ingredients, setIngredients] = useState<DraftIngredient[]>([])
  const [saving, setSaving] = useState(false)

  // Carregar alimentos customizados (RLS permite ler os do paciente ou do próprio profissional)
  useEffect(() => {
    if (!open) return
    let active = true
    setLoadingFoods(true)
    supabase
      .from('custom_foods')
      .select('*')
      .order('name', { ascending: true })
      .then(({ data }) => {
        if (!active) return
        if (data) {
          setFoods(
            data.map((f: any) => ({
              id: f.id,
              userId: f.user_id,
              name: f.name,
              baseUnit: f.base_unit || '100g',
              calories: Number(f.calories) || 0,
              carbsG: Number(f.carbs_g) || 0,
              proteinG: Number(f.protein_g) || 0,
              fatG: Number(f.fat_g) || 0,
              fibersG: Number(f.fibers_g) || 0,
              sodiumMg: Number(f.sodium_mg) || 0,
              allergens: f.allergens || '',
              category: f.category || '',
              tags: f.tags || [],
              createdAt: f.created_at,
            })),
          )
        }
        setLoadingFoods(false)
      })

    return () => {
      active = false
    }
  }, [open])

  const searchResults = useMemo(() => {
    if (!search.trim()) return []
    return foods.filter((f) => f.name.toLowerCase().includes(search.toLowerCase()))
  }, [foods, search])

  const totals = useMemo(() => {
    return ingredients.reduce(
      (acc, ing) => {
        const food = foods.find((f) => f.id === ing.foodId)
        if (!food) return acc
        const macros = calcMacrosForAmount(food.baseUnit, ing.amount, {
          calories: food.calories,
          carbsG: food.carbsG,
          proteinG: food.proteinG,
          fatG: food.fatG,
        })
        return {
          calories: acc.calories + macros.calories,
          carbsG: +(acc.carbsG + macros.carbsG).toFixed(1),
          proteinG: +(acc.proteinG + macros.proteinG).toFixed(1),
          fatG: +(acc.fatG + macros.fatG).toFixed(1),
        }
      },
      { calories: 0, carbsG: 0, proteinG: 0, fatG: 0 },
    )
  }, [ingredients, foods])

  const addIngredient = (foodId: string) => {
    const food = foods.find((f) => f.id === foodId)
    if (!food || ingredients.some((i) => i.foodId === foodId)) return
    setIngredients((prev) => [
      ...prev,
      { foodId, foodName: food.name, foodBaseUnit: food.baseUnit, amount: '' },
    ])
    setSearch('')
  }

  const updateAmount = (foodId: string, amount: string) => {
    setIngredients((prev) => prev.map((i) => (i.foodId === foodId ? { ...i, amount } : i)))
  }

  const removeIngredient = (foodId: string) => {
    setIngredients((prev) => prev.filter((i) => i.foodId !== foodId))
  }

  const toggleTag = (tag: string) => {
    setTags((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]))
  }

  const handleSubmit = async () => {
    if (!name.trim()) {
      toast.error('Informe o nome da receita.')
      return
    }
    if (ingredients.length === 0) {
      toast.error('Adicione pelo menos um ingrediente.')
      return
    }

    setSaving(true)
    const res = await createRecipeForPatient(
      name.trim(),
      description.trim(),
      instructions.trim(),
      tags,
      ingredients.map((i) => ({ foodId: i.foodId, amount: i.amount || '1' })),
    )
    setSaving(false)

    if (res) {
      toast.success(`Receita prescrita para ${patientName}! 🍳`)
      setName('')
      setDescription('')
      setInstructions('')
      setTags([])
      setIngredients([])
      onOpenChange(false)
      onSuccess?.()
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg rounded-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-black text-white bg-[#1CB0F6]">
              <Stethoscope className="w-3 h-3" />
              Prescrição
            </span>
            <span className="text-xs font-bold text-muted-foreground truncate">
              Criando para: <strong>{patientName}</strong>
            </span>
          </div>
          <DialogTitle className="text-xl font-extrabold">Prescrever Receita</DialogTitle>
          <DialogDescription className="text-xs">
            Crie uma receita saudável recomendada diretamente para o paciente.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-xs font-extrabold">Nome da Receita</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Panqueca de Aveia com Whey"
              className="rounded-2xl font-bold"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-extrabold">Descrição (opcional)</Label>
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ex: Opção proteica rápida para café da manhã"
              className="rounded-2xl font-bold"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-extrabold">Modo de Preparo (opcional)</Label>
            <Textarea
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              placeholder="Instruções de preparo e dicas clínicas..."
              className="rounded-2xl font-bold min-h-[60px]"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-extrabold">Tags</Label>
            <div className="flex flex-wrap gap-2">
              {FOOD_TAG_PRESETS.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => toggleTag(tag)}
                  className={cn(
                    'px-3 py-1 rounded-full text-xs font-bold border-2 transition-all duration-150',
                    tags.includes(tag)
                      ? 'bg-[#1CB0F6] text-white border-[#1CB0F6]'
                      : 'border-[#E5E5E5] dark:border-[#3B4A55] text-muted-foreground',
                  )}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-extrabold">Ingredientes</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar alimento cadastrado..."
                className="rounded-2xl pl-9 font-bold"
              />
            </div>

            {loadingFoods && (
              <p className="text-xs text-muted-foreground text-center py-2">
                Carregando alimentos...
              </p>
            )}

            {searchResults.length > 0 && (
              <div className="max-h-[140px] overflow-y-auto space-y-1 rounded-2xl border-2 p-1 bg-muted/20">
                {searchResults.map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => addIngredient(f.id)}
                    className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-muted transition-colors text-left"
                  >
                    <div>
                      <p className="text-sm font-extrabold">{f.name}</p>
                      <p className="text-xs font-bold text-muted-foreground">
                        {f.baseUnit} · {f.calories} kcal
                      </p>
                    </div>
                    <Plus className="w-4 h-4 text-[#1CB0F6]" />
                  </button>
                ))}
              </div>
            )}

            <div className="space-y-2">
              {ingredients.map((ing) => {
                const food = foods.find((f) => f.id === ing.foodId)
                const macros = food
                  ? calcMacrosForAmount(food.baseUnit, ing.amount, {
                      calories: food.calories,
                      carbsG: food.carbsG,
                      proteinG: food.proteinG,
                      fatG: food.fatG,
                    })
                  : null

                return (
                  <div
                    key={ing.foodId}
                    className="flex items-center gap-2 bg-muted/30 rounded-2xl p-2"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-extrabold truncate">{ing.foodName}</p>
                      {macros && (
                        <p className="text-xs font-bold text-muted-foreground">
                          {macros.calories} kcal · {macros.proteinG}g P · {macros.carbsG}g C ·{' '}
                          {macros.fatG}g G
                        </p>
                      )}
                    </div>
                    <Input
                      value={ing.amount}
                      onChange={(e) => updateAmount(ing.foodId, e.target.value)}
                      placeholder={ing.foodBaseUnit}
                      className="w-24 rounded-xl font-bold text-center text-sm h-9"
                    />
                    <button
                      type="button"
                      onClick={() => removeIngredient(ing.foodId)}
                      className="p-1.5 rounded-lg hover:bg-rose-500/10 transition-colors shrink-0"
                    >
                      <X className="w-4 h-4 text-rose-500" />
                    </button>
                  </div>
                )
              })}
            </div>
          </div>

          {ingredients.length > 0 && (
            <div className="grid grid-cols-4 gap-2 bg-[#1CB0F6]/10 rounded-2xl p-3">
              {[
                { l: 'kcal', v: totals.calories, c: '#FF4B4B' },
                { l: 'Carbo', v: `${totals.carbsG}g`, c: '#FFC800' },
                { l: 'Prot', v: `${totals.proteinG}g`, c: '#58CC02' },
                { l: 'Gord', v: `${totals.fatG}g`, c: '#1CB0F6' },
              ].map((m) => (
                <div key={m.l} className="text-center">
                  <p className="text-[10px] font-bold text-muted-foreground">{m.l}</p>
                  <p className="text-sm font-extrabold" style={{ color: m.c }}>
                    {m.v}
                  </p>
                </div>
              ))}
            </div>
          )}

          <Button
            onClick={handleSubmit}
            disabled={saving}
            className="w-full py-5 rounded-3xl bg-[#1CB0F6] hover:bg-[#1899d6] text-white font-extrabold border-b-4 border-[#147eb0] active:translate-y-1 active:border-b-0 transition-all duration-150"
          >
            <Check className="w-5 h-5 mr-2" strokeWidth={3} />
            {saving ? 'Prescrevendo...' : 'Prescrever Receita'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
