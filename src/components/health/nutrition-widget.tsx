import { useState, useEffect } from 'react'
import { useAppStore, MealType, MealQuality } from '@/stores/useAppStore'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

const MEALS: { type: MealType; label: string; emoji: string }[] = [
  { type: 'breakfast', label: 'Café', emoji: '🌅' },
  { type: 'lunch', label: 'Almoço', emoji: '🍽️' },
  { type: 'dinner', label: 'Jantar', emoji: '🌙' },
  { type: 'snack', label: 'Lanche', emoji: '🥪' },
]

const QUALITIES: {
  value: MealQuality
  label: string
  emoji: string
  color: string
  border: string
}[] = [
  { value: 'clean', label: 'Limpo', emoji: '🍏', color: '#58CC02', border: '#46a302' },
  { value: 'balanced', label: 'Moderado', emoji: '🍲', color: '#FFC800', border: '#ccb000' },
  { value: 'cheat', label: 'Livre', emoji: '🍕', color: '#FF4B4B', border: '#cc3c3c' },
]

const CHECKLIST_ITEMS = [
  { key: 'vegetables', label: 'Comi Vegetais 🥗' },
  { key: 'protein', label: 'Bati a Proteína 🥩' },
  { key: 'fruit', label: 'Comi Fruta 🍎' },
  { key: 'noSugar', label: 'Zero Açúcar hoje 🚫🍬' },
]

export function NutritionWidget() {
  const { mealLogs, addMealLog, fetchMealLogs } = useAppStore()
  const today = new Date().toISOString().split('T')[0]
  const [selectedMeal, setSelectedMeal] = useState<MealType | null>(null)
  const [checklist, setChecklist] = useState<Record<string, boolean>>(() => {
    const s = localStorage.getItem(`vt_nutrition_checklist_${today}`)
    return s ? JSON.parse(s) : {}
  })

  useEffect(() => {
    fetchMealLogs()
  }, [fetchMealLogs])
  useEffect(() => {
    localStorage.setItem(`vt_nutrition_checklist_${today}`, JSON.stringify(checklist))
  }, [checklist, today])

  const todayMeals = mealLogs.filter((l) => l.date === today)
  const getMealQuality = (type: MealType) => todayMeals.find((l) => l.mealType === type)?.quality

  const handleSelectQuality = (quality: MealQuality) => {
    if (!selectedMeal) return
    addMealLog(today, selectedMeal, quality, checklist)
    const mealLabel = MEALS.find((m) => m.type === selectedMeal)?.label
    toast.success(`${mealLabel} registrado!`, { duration: 1500 })
    setSelectedMeal(null)
  }

  const toggleChecklist = (key: string) => {
    setChecklist((p) => ({ ...p, [key]: !p[key] }))
  }

  return (
    <div className="bg-card border-2 border-b-4 border-[#E5E5E5] dark:border-[#3B4A55] rounded-3xl p-6 shadow-sm flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <div className="w-10 h-10 rounded-2xl bg-[#58CC02]/15 flex items-center justify-center">
          <span className="text-xl">🍽️</span>
        </div>
        <h3 className="text-lg font-extrabold">Nutrição</h3>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {MEALS.map((meal) => {
          const quality = getMealQuality(meal.type)
          const qData = QUALITIES.find((q) => q.value === quality)
          return (
            <button
              key={meal.type}
              onClick={() => setSelectedMeal(selectedMeal === meal.type ? null : meal.type)}
              className={cn(
                'flex flex-col items-center gap-1 py-4 rounded-2xl border-2 border-b-4 transition-all duration-150 active:translate-y-1 active:border-b-0',
                selectedMeal === meal.type
                  ? 'bg-muted/50 border-transparent scale-105'
                  : 'border-[#E5E5E5] dark:border-[#3B4A55] hover:bg-muted/30',
              )}
              style={qData ? { borderBottomColor: qData.color } : undefined}
            >
              <span className="text-2xl">{meal.emoji}</span>
              <span className="text-sm font-extrabold">{meal.label}</span>
              {qData ? (
                <span className="text-xs font-bold" style={{ color: qData.color }}>
                  {qData.emoji} {qData.label}
                </span>
              ) : (
                <span className="text-xs font-bold text-muted-foreground">Toque p/ registrar</span>
              )}
            </button>
          )
        })}
      </div>

      {selectedMeal && (
        <div className="space-y-3 animate-fade-in-up">
          <p className="text-sm font-extrabold text-muted-foreground">Como foi sua refeição?</p>
          <div className="grid grid-cols-3 gap-2">
            {QUALITIES.map((q) => (
              <button
                key={q.value}
                onClick={() => handleSelectQuality(q.value)}
                className="flex flex-col items-center gap-1 py-4 rounded-2xl text-white font-extrabold border-b-4 active:translate-y-1 active:border-b-0 transition-all duration-150"
                style={{ backgroundColor: q.color, borderBottomColor: q.border }}
              >
                <span className="text-2xl">{q.emoji}</span>
                <span className="text-xs">{q.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-2 mt-2">
        <p className="text-sm font-extrabold">🎯 Micro-metas diárias</p>
        {CHECKLIST_ITEMS.map((item) => (
          <button
            key={item.key}
            onClick={() => toggleChecklist(item.key)}
            className={cn(
              'flex items-center gap-3 w-full p-3 rounded-2xl border-2 transition-all duration-150',
              checklist[item.key]
                ? 'bg-[#58CC02]/10 border-[#58CC02]/30'
                : 'border-[#E5E5E5] dark:border-[#3B4A55] hover:bg-muted/30',
            )}
          >
            <div
              className={cn(
                'w-6 h-6 rounded-lg flex items-center justify-center border-2 transition-all',
                checklist[item.key]
                  ? 'bg-[#58CC02] border-[#58CC02]'
                  : 'border-[#E5E5E5] dark:border-[#3B4A55]',
              )}
            >
              {checklist[item.key] && <span className="text-white text-xs font-bold">✓</span>}
            </div>
            <span className={cn('text-sm font-bold', checklist[item.key] && 'text-[#58CC02]')}>
              {item.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}
