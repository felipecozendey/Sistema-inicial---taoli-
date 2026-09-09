import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useAppStore } from '@/stores/useAppStore'
import { useNutritionStore, type DietPlan, type CustomFood } from '@/stores/use-nutrition-store'
import { uploadImage } from '@/lib/image-upload'
import { calcMacrosForAmount } from '@/lib/nutrition-utils'
import { cn } from '@/lib/utils'
import { Camera, X, Loader2, Flame, Utensils, BookOpen, Search } from 'lucide-react'
import { toast } from 'sonner'
import type { MealLog } from '@/stores/store-data'

const MEAL_TYPES = [
  { value: 'Café da Manhã', label: 'Café da Manhã', emoji: '☀️' },
  { value: 'Almoço', label: 'Almoço', emoji: '🍽️' },
  { value: 'Jantar', label: 'Jantar', emoji: '🌙' },
  { value: 'Lanche', label: 'Lanche', emoji: '🥪' },
]

const ADHERENCE_OPTIONS = [
  { value: 'perfect', label: 'No Plano', emoji: '🟢' },
  { value: 'adapted', label: 'Adaptado', emoji: '🟡' },
  { value: 'cheat', label: 'Livre', emoji: '🔴' },
]

interface NewMealModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  mealToEdit?: MealLog | null
}

export function NewMealModal({ open, onOpenChange, mealToEdit }: NewMealModalProps) {
  const addMealLog = useAppStore((s) => s.addMealLog)
  const updateMealLog = useAppStore((s) => s.updateMealLog)
  const { dietPlans, customFoods, fetchDietPlans, fetchCustomFoods } = useNutritionStore()

  const [mealType, setMealType] = useState('Café da Manhã')
  const [description, setDescription] = useState('')
  const [calories, setCalories] = useState('')
  const [protein, setProtein] = useState('')
  const [carbs, setCarbs] = useState('')
  const [fat, setFat] = useState('')
  const [fibersG, setFibersG] = useState('')
  const [sodiumMg, setSodiumMg] = useState('')
  const [adherence, setAdherence] = useState('perfect')
  const [photoUrl, setPhotoUrl] = useState('')
  const [uploading, setUploading] = useState(false)
  const isSubmittingRef = useRef(false)

  // Integrations state: Quick food calculator
  const [showFoodSearch, setShowFoodSearch] = useState(false)
  const [foodSearchQuery, setFoodSearchQuery] = useState('')
  const [selectedFood, setSelectedFood] = useState<CustomFood | null>(null)
  const [foodPortion, setFoodPortion] = useState('')

  // Plan picker popover/modal state
  const [showPlanPicker, setShowPlanPicker] = useState(false)

  useEffect(() => {
    if (open) {
      fetchDietPlans()
      fetchCustomFoods()
    }
  }, [open, fetchDietPlans, fetchCustomFoods])

  const resetForm = useCallback(() => {
    setMealType('Café da Manhã')
    setDescription('')
    setCalories('')
    setProtein('')
    setCarbs('')
    setFat('')
    setFibersG('')
    setSodiumMg('')
    setAdherence('perfect')
    setPhotoUrl('')
    setShowFoodSearch(false)
    setFoodSearchQuery('')
    setSelectedFood(null)
    setFoodPortion('')
    setShowPlanPicker(false)
    isSubmittingRef.current = false
  }, [])

  useEffect(() => {
    if (open) {
      if (mealToEdit) {
        setMealType(mealToEdit.mealType || 'Café da Manhã')
        setDescription(mealToEdit.description || '')
        setCalories(mealToEdit.calories ? String(mealToEdit.calories) : '')
        setProtein(mealToEdit.protein ? String(mealToEdit.protein) : '')
        setCarbs(mealToEdit.carbs ? String(mealToEdit.carbs) : '')
        setFat(mealToEdit.fat ? String(mealToEdit.fat) : '')
        setFibersG(mealToEdit.fibersG ? String(mealToEdit.fibersG) : '')
        setSodiumMg(mealToEdit.sodiumMg ? String(mealToEdit.sodiumMg) : '')
        setAdherence(mealToEdit.adherence || 'perfect')
        setPhotoUrl(mealToEdit.photoUrl || '')
      } else {
        resetForm()
      }
    } else {
      resetForm()
    }
  }, [open, mealToEdit, resetForm])

  // Filter custom foods for autocomplete
  const filteredFoods = useMemo(() => {
    if (!foodSearchQuery.trim()) return customFoods.slice(0, 5)
    const q = foodSearchQuery.toLowerCase()
    return customFoods.filter((f) => f.name.toLowerCase().includes(q)).slice(0, 8)
  }, [customFoods, foodSearchQuery])

  // When a food and amount are chosen, calculate macros and populate
  const handleApplyFood = (food: CustomFood, amount: string) => {
    const macros = calcMacrosForAmount(food.baseUnit, amount || food.baseUnit, {
      calories: food.calories,
      carbsG: food.carbsG,
      proteinG: food.proteinG,
      fatG: food.fatG,
      fibersG: food.fibersG,
      sodiumMg: food.sodiumMg,
    })

    const portionStr = amount ? ` (${amount})` : ''
    setDescription((prev) => {
      const added = `${food.name}${portionStr}`
      return prev ? `${prev}, ${added}` : added
    })

    // If inputs already have values, add them up; else set them
    setCalories((c) => String(Math.round((parseFloat(c) || 0) + macros.calories)))
    setProtein((p) => String(Math.round((parseFloat(p) || 0) + macros.proteinG)))
    setCarbs((cb) => String(Math.round((parseFloat(cb) || 0) + macros.carbsG)))
    setFat((f) => String(Math.round((parseFloat(f) || 0) + macros.fatG)))
    setFibersG((fb) => String(Math.round((parseFloat(fb) || 0) + macros.fibersG)))
    setSodiumMg((s) => String(Math.round((parseFloat(s) || 0) + macros.sodiumMg)))

    toast.success(`Adicionado: ${food.name}!`)
    setSelectedFood(null)
    setFoodPortion('')
    setShowFoodSearch(false)
    setFoodSearchQuery('')
  }

  // Choose from Diet Plan
  const handleSelectDietPlan = (plan: DietPlan) => {
    const planCalories = plan.items.reduce((s, i) => s + (i.calories || 0), 0)
    const planProtein = plan.items.reduce((s, i) => s + (i.proteinG || 0), 0)
    const planCarbs = plan.items.reduce((s, i) => s + (i.carbsG || 0), 0)
    const planFat = plan.items.reduce((s, i) => s + (i.fatG || 0), 0)
    const planFibers = plan.items.reduce((s, i) => s + (i.fibersG || 0), 0)
    const planSodium = plan.items.reduce((s, i) => s + (i.sodiumMg || 0), 0)

    const itemsDesc = plan.items
      .map((i) => `${i.description} ${i.quantity}`.trim())
      .filter(Boolean)
      .join(', ')

    // Match mealType if known
    const matchType = MEAL_TYPES.find(
      (mt) =>
        plan.name.toLowerCase().includes(mt.label.toLowerCase()) ||
        mt.label.toLowerCase().includes(plan.name.toLowerCase()),
    )
    if (matchType) {
      setMealType(matchType.value)
    }

    setDescription(itemsDesc || plan.name)
    setCalories(String(Math.round(planCalories)))
    setProtein(String(Math.round(planProtein)))
    setCarbs(String(Math.round(planCarbs)))
    setFat(String(Math.round(planFat)))
    setFibersG(String(Math.round(planFibers)))
    setSodiumMg(String(Math.round(planSodium)))

    setShowPlanPicker(false)
    toast.success(`Dados preenchidos a partir de "${plan.name}"! 🎉`)
  }

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const url = await uploadImage(file)
      setPhotoUrl(url)
    } catch {
      toast.error('Erro ao enviar foto')
    } finally {
      setUploading(false)
      if (e.target) e.target.value = ''
    }
  }

  const parseNonNegative = (val: string): number => {
    const n = parseFloat(val) || 0
    return n < 0 ? 0 : n
  }

  const handleSubmit = () => {
    if (isSubmittingRef.current) return
    if (!description.trim()) {
      toast.error('Adicione uma descrição para a refeição')
      return
    }

    const cal = parseNonNegative(calories)
    const prot = parseNonNegative(protein)
    const crb = parseNonNegative(carbs)
    const ft = parseNonNegative(fat)
    const fib = parseNonNegative(fibersG)
    const sod = parseNonNegative(sodiumMg)

    isSubmittingRef.current = true
    onOpenChange(false)

    if (mealToEdit) {
      updateMealLog(mealToEdit.id, {
        mealType,
        description: description.trim(),
        calories: cal,
        protein: prot,
        carbs: crb,
        fat: ft,
        fibersG: fib,
        sodiumMg: sod,
        adherence,
        photoUrl: photoUrl || undefined,
      })
      toast.success('Refeição atualizada! 🎉')
    } else {
      addMealLog({
        mealType,
        description: description.trim(),
        calories: cal,
        protein: prot,
        carbs: crb,
        fat: ft,
        fibersG: fib,
        sodiumMg: sod,
        adherence,
        photoUrl: photoUrl || undefined,
      })
      toast.success('Refeição registrada! 🎉')
    }
    resetForm()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg rounded-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-extrabold">
            {mealToEdit ? 'Editar Refeição' : 'Registrar Refeição'}
          </DialogTitle>
          <DialogDescription>
            {mealToEdit
              ? 'Atualize os dados e nutrientes da sua refeição'
              : 'Adicione uma refeição ao seu diário nutricional'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          {/* Action buttons: Import from Diet Plan or Quick Food Lookup */}
          {!mealToEdit && (
            <div className="flex flex-col sm:flex-row gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowPlanPicker((v) => !v)
                  setShowFoodSearch(false)
                }}
                className={cn(
                  'flex-1 rounded-2xl font-extrabold border-2 border-b-4 transition-all duration-150 py-5 text-xs',
                  showPlanPicker
                    ? 'border-[#1CB0F6] bg-[#1CB0F6]/10 text-[#1CB0F6]'
                    : 'border-[#E5E5E5] dark:border-[#3B4A55]',
                )}
              >
                <BookOpen className="w-4 h-4 mr-1.5" /> Registrar a partir do Plano
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowFoodSearch((v) => !v)
                  setShowPlanPicker(false)
                }}
                className={cn(
                  'flex-1 rounded-2xl font-extrabold border-2 border-b-4 transition-all duration-150 py-5 text-xs',
                  showFoodSearch
                    ? 'border-[#58CC02] bg-[#58CC02]/10 text-[#58CC02]'
                    : 'border-[#E5E5E5] dark:border-[#3B4A55]',
                )}
              >
                <Search className="w-4 h-4 mr-1.5" /> Buscar Alimento
              </Button>
            </div>
          )}

          {/* Plan Picker dropdown section */}
          {showPlanPicker && (
            <div className="bg-muted/40 border-2 border-b-4 border-[#1CB0F6]/40 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold text-[#1CB0F6] uppercase tracking-wider flex items-center gap-1.5">
                  <BookOpen className="w-4 h-4" /> Escolha uma refeição do seu plano
                </span>
                <button
                  onClick={() => setShowPlanPicker(false)}
                  className="text-xs font-bold text-muted-foreground hover:text-foreground"
                >
                  Fechar
                </button>
              </div>

              {dietPlans.length === 0 ? (
                <p className="text-xs font-bold text-muted-foreground text-center py-2">
                  Nenhuma refeição no plano alimentar cadastrada ainda.
                </p>
              ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {dietPlans.map((plan) => {
                    const cals = plan.items.reduce((s, i) => s + (i.calories || 0), 0)
                    const prot = plan.items.reduce((s, i) => s + (i.proteinG || 0), 0)
                    return (
                      <button
                        key={plan.id}
                        type="button"
                        onClick={() => handleSelectDietPlan(plan)}
                        className="w-full text-left p-2.5 rounded-xl border-2 border-[#E5E5E5] dark:border-[#3B4A55] bg-card hover:border-[#1CB0F6] transition-colors flex items-center justify-between gap-2"
                      >
                        <div className="min-w-0">
                          <p className="font-extrabold text-sm truncate">{plan.name}</p>
                          <p className="text-xs text-muted-foreground truncate">
                            {plan.items.length} alimentos • {plan.time || 'Sem horário'}
                          </p>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="text-xs font-extrabold text-[#FF4B4B] block">
                            {Math.round(cals)} kcal
                          </span>
                          <span className="text-[10px] font-bold text-muted-foreground">
                            {Math.round(prot)}g prot
                          </span>
                        </div>
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {/* Custom Food Autocomplete Search & Calculator */}
          {showFoodSearch && (
            <div className="bg-muted/40 border-2 border-b-4 border-[#58CC02]/40 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold text-[#58CC02] uppercase tracking-wider flex items-center gap-1.5">
                  <Utensils className="w-4 h-4" /> Alimentos cadastrados
                </span>
                <button
                  onClick={() => setShowFoodSearch(false)}
                  className="text-xs font-bold text-muted-foreground hover:text-foreground"
                >
                  Fechar
                </button>
              </div>

              {!selectedFood ? (
                <>
                  <Input
                    value={foodSearchQuery}
                    onChange={(e) => setFoodSearchQuery(e.target.value)}
                    placeholder="Digite o nome do alimento..."
                    className="rounded-xl font-bold bg-background text-sm"
                  />
                  {filteredFoods.length === 0 ? (
                    <p className="text-xs font-bold text-muted-foreground text-center py-2">
                      Nenhum alimento encontrado. Cadastre em "Alimentos & Receitas".
                    </p>
                  ) : (
                    <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                      {filteredFoods.map((f) => (
                        <button
                          key={f.id}
                          type="button"
                          onClick={() => {
                            setSelectedFood(f)
                            setFoodPortion(f.baseUnit)
                          }}
                          className="w-full text-left p-2 rounded-xl border border-[#E5E5E5] dark:border-[#3B4A55] bg-card hover:border-[#58CC02] transition-colors flex items-center justify-between text-xs"
                        >
                          <span className="font-extrabold truncate">{f.name}</span>
                          <span className="text-muted-foreground shrink-0 font-bold">
                            {f.baseUnit} • {f.calories} kcal
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <div className="space-y-3 bg-card p-3 rounded-xl border border-[#58CC02]">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-extrabold text-sm">{selectedFood.name}</p>
                      <p className="text-xs text-muted-foreground">
                        Base: {selectedFood.baseUnit} ({selectedFood.calories} kcal,{' '}
                        {selectedFood.proteinG}g P, {selectedFood.carbsG}g C, {selectedFood.fatG}g
                        G)
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedFood(null)}
                      className="text-xs h-7 px-2"
                    >
                      Trocar
                    </Button>
                  </div>
                  <div className="flex items-center gap-2">
                    <Input
                      value={foodPortion}
                      onChange={(e) => setFoodPortion(e.target.value)}
                      placeholder={`Ex: ${selectedFood.baseUnit} ou 150g`}
                      className="rounded-xl font-bold text-sm h-10"
                    />
                    <Button
                      type="button"
                      onClick={() => handleApplyFood(selectedFood, foodPortion)}
                      className="rounded-xl font-extrabold bg-[#58CC02] hover:bg-[#46B302] text-white shrink-0 h-10"
                    >
                      Preencher Macros
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="space-y-2">
            <Label className="text-sm font-extrabold">Tipo de Refeição</Label>
            <Select value={mealType} onValueChange={setMealType}>
              <SelectTrigger className="rounded-xl font-bold">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MEAL_TYPES.map((meal) => (
                  <SelectItem key={meal.value} value={meal.value}>
                    {meal.emoji} {meal.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-extrabold">Descrição</Label>
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ex: Frango grelhado com arroz integral e salada"
              className="rounded-xl"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-extrabold">Nutrientes</Label>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5">
                  <Flame className="w-4 h-4 text-[#FF4B4B]" />
                  <span className="text-xs font-extrabold">Calorias (kcal)</span>
                </div>
                <Input
                  type="number"
                  min="0"
                  step="any"
                  inputMode="decimal"
                  value={calories}
                  onChange={(e) => setCalories(e.target.value)}
                  placeholder="0"
                  className="rounded-xl text-center font-extrabold text-lg h-12 border-2 border-b-4"
                />
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm">🥩</span>
                  <span className="text-xs font-extrabold">Proteína (g)</span>
                </div>
                <Input
                  type="number"
                  min="0"
                  step="any"
                  inputMode="decimal"
                  value={protein}
                  onChange={(e) => setProtein(e.target.value)}
                  placeholder="0"
                  className="rounded-xl text-center font-extrabold text-lg h-12 border-2 border-b-4"
                />
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm">🍞</span>
                  <span className="text-xs font-extrabold">Carbo (g)</span>
                </div>
                <Input
                  type="number"
                  min="0"
                  step="any"
                  inputMode="decimal"
                  value={carbs}
                  onChange={(e) => setCarbs(e.target.value)}
                  placeholder="0"
                  className="rounded-xl text-center font-extrabold text-lg h-12 border-2 border-b-4"
                />
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm">🥑</span>
                  <span className="text-xs font-extrabold">Gordura (g)</span>
                </div>
                <Input
                  type="number"
                  min="0"
                  step="any"
                  inputMode="decimal"
                  value={fat}
                  onChange={(e) => setFat(e.target.value)}
                  placeholder="0"
                  className="rounded-xl text-center font-extrabold text-lg h-12 border-2 border-b-4"
                />
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm">🌾</span>
                  <span className="text-xs font-extrabold">Fibras (g)</span>
                </div>
                <Input
                  type="number"
                  min="0"
                  step="any"
                  inputMode="decimal"
                  value={fibersG}
                  onChange={(e) => setFibersG(e.target.value)}
                  placeholder="0"
                  className="rounded-xl text-center font-extrabold text-base h-11 border-2 border-b-4"
                />
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm">🧂</span>
                  <span className="text-xs font-extrabold">Sódio (mg)</span>
                </div>
                <Input
                  type="number"
                  min="0"
                  step="any"
                  inputMode="decimal"
                  value={sodiumMg}
                  onChange={(e) => setSodiumMg(e.target.value)}
                  placeholder="0"
                  className="rounded-xl text-center font-extrabold text-base h-11 border-2 border-b-4"
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-extrabold">Adesão</Label>
            <div className="grid grid-cols-3 gap-2">
              {ADHERENCE_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setAdherence(opt.value)}
                  className={cn(
                    'flex flex-col items-center gap-1 p-3 rounded-2xl border-2 border-b-4 text-xs font-bold transition-all duration-150 active:translate-y-1 active:border-b-2',
                    adherence === opt.value
                      ? 'border-[#1CB0F6] bg-[#1CB0F6]/10'
                      : 'border-[#E5E5E5] dark:border-[#3B4A55]',
                  )}
                >
                  <span className="text-lg">{opt.emoji}</span>
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-extrabold">Foto</Label>
            {photoUrl ? (
              <div className="relative">
                <img
                  src={photoUrl}
                  alt="Refeição"
                  className="w-full h-40 rounded-2xl object-cover"
                />
                <button
                  type="button"
                  onClick={() => setPhotoUrl('')}
                  className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-[#FF4B4B] text-white flex items-center justify-center"
                >
                  <X className="w-4 h-4" strokeWidth={3} />
                </button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center gap-2 w-full h-28 rounded-2xl border-2 border-dashed border-[#E5E5E5] dark:border-[#3B4A55] cursor-pointer hover:bg-muted/30 transition-colors">
                {uploading ? (
                  <Loader2 className="w-6 h-6 text-muted-foreground animate-spin" />
                ) : (
                  <>
                    <Camera className="w-6 h-6 text-muted-foreground" strokeWidth={2} />
                    <span className="text-xs font-bold text-muted-foreground">Adicionar foto</span>
                  </>
                )}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handlePhotoUpload}
                  disabled={uploading}
                />
              </label>
            )}
          </div>

          <Button
            type="button"
            onClick={handleSubmit}
            disabled={uploading}
            className="w-full py-6 rounded-3xl bg-[#58CC02] hover:bg-[#46B302] text-white font-extrabold border-b-4 border-[#46A602] active:translate-y-1 active:border-b-0 transition-all duration-150 disabled:opacity-50 disabled:active:translate-y-0 disabled:active:border-b-4 disabled:cursor-not-allowed"
          >
            {uploading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
                Fazendo upload...
              </>
            ) : mealToEdit ? (
              'Salvar Alterações'
            ) : (
              'Salvar Refeição'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
