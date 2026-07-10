import { useState, useEffect } from 'react'
import { useAppStore, MealType, MealQuality } from '@/stores/useAppStore'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { MicroGoalsChecklist } from '@/components/health/micro-goals-checklist'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { Camera } from 'lucide-react'

const MEALS: { type: MealType; label: string; query: string; emoji: string }[] = [
  { type: 'breakfast', label: 'Café', query: 'breakfast food', emoji: '☀️' },
  { type: 'lunch', label: 'Almoço', query: 'lunch plate', emoji: '🍽️' },
  { type: 'dinner', label: 'Jantar', query: 'dinner meal', emoji: '🌙' },
  { type: 'snack', label: 'Lanche', query: 'healthy snack', emoji: '🥪' },
]

const QUALITIES: {
  value: MealQuality
  label: string
  emoji: string
  color: string
  border: string
}[] = [
  { value: 'clean', label: 'Limpo', emoji: '🍏', color: '#58CC02', border: '#46A302' },
  { value: 'balanced', label: 'Moderado', emoji: '🍲', color: '#FFC800', border: '#CC9F00' },
  { value: 'cheat', label: 'Livre', emoji: '🍕', color: '#FF4B4B', border: '#CC3C3C' },
]

const DIET_PLAN = [
  {
    id: 'breakfast',
    title: 'Café da Manhã',
    emoji: '☀️',
    items: ['Ovos mexidos (2 un.)', 'Pão integral (1 fatia)', 'Café sem açúcar', 'Fruta (1 un.)'],
  },
  {
    id: 'lunch',
    title: 'Almoço',
    emoji: '🍽️',
    items: [
      'Arroz integral (4 col.)',
      'Feijão (3 col.)',
      'Frango grelhado (120g)',
      'Salada mista',
      'Legumes refogados',
    ],
  },
  {
    id: 'dinner',
    title: 'Jantar',
    emoji: '🌙',
    items: ['Sopa de legumes', 'Peixe assado (100g)', 'Salada verde', 'Chá verde'],
  },
  {
    id: 'snacks',
    title: 'Lanches',
    emoji: '🥪',
    items: ['Iogurte natural', 'Castanhas (30g)', 'Fruta (1 un.)', 'Água de coco'],
  },
  {
    id: 'hydration',
    title: 'Hidratação',
    emoji: '💧',
    items: ['2L de água ao longo do dia', 'Evitar refrigerantes', 'Chá sem açúcar liberado'],
  },
]

export function NutritionWidget() {
  const { mealLogs, addMealLog, fetchMealLogs, fetchDailyChecklist } = useAppStore()
  const today = new Date().toISOString().split('T')[0]
  const [selectedMealType, setSelectedMealType] = useState<MealType | null>(null)
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>(() => {
    const s = localStorage.getItem(`vt_diet_plan_${today}`)
    return s ? JSON.parse(s) : {}
  })

  useEffect(() => {
    fetchMealLogs()
    fetchDailyChecklist()
  }, [fetchMealLogs, fetchDailyChecklist])

  useEffect(() => {
    localStorage.setItem(`vt_diet_plan_${today}`, JSON.stringify(checkedItems))
  }, [checkedItems, today])

  const todayMeals = mealLogs.filter(
    (l) => l.date === today && l.mealType !== ('checklist' as MealType),
  )

  const handleQualitySelect = (quality: MealQuality) => {
    if (!selectedMealType) return
    addMealLog(today, selectedMealType, quality, {})
    const mealLabel = MEALS.find((m) => m.type === selectedMealType)?.label
    const q = QUALITIES.find((qq) => qq.value === quality)
    toast.success(`${mealLabel}: ${q?.emoji} ${q?.label}!`, { duration: 2000 })
    setSelectedMealType(null)
  }

  const toggleItem = (key: string) => setCheckedItems((p) => ({ ...p, [key]: !p[key] }))

  return (
    <div className="space-y-6">
      <div className="bg-card border-2 border-b-4 border-[#E5E5E5] dark:border-[#3B4A55] rounded-3xl p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-10 h-10 rounded-2xl bg-[#FF9600]/15 flex items-center justify-center">
            <Camera className="w-5 h-5 text-[#FF9600]" strokeWidth={2.5} />
          </div>
          <h3 className="text-lg font-extrabold">Diário Alimentar</h3>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-4">
          {MEALS.map((meal) => {
            const logged = todayMeals.find((l) => l.mealType === meal.type)
            const isSelected = selectedMealType === meal.type
            return (
              <button
                key={meal.type}
                onClick={() => setSelectedMealType(isSelected ? null : meal.type)}
                className={cn(
                  'flex flex-col items-center gap-1 py-4 rounded-2xl border-2 border-b-4 transition-all duration-150 active:translate-y-1 active:border-b-0',
                  isSelected
                    ? 'bg-[#FF9600]/10 border-[#FF9600]'
                    : logged
                      ? 'bg-muted/30 border-transparent'
                      : 'border-[#E5E5E5] dark:border-[#3B4A55] hover:bg-muted/30',
                )}
              >
                <span className="text-2xl">{meal.emoji}</span>
                <span className="text-sm font-extrabold">{meal.label}</span>
                {logged && <span className="text-xs font-bold text-[#58CC02]">✓ Registrado</span>}
              </button>
            )
          })}
        </div>

        {selectedMealType && (
          <div className="space-y-3 animate-fade-in-up">
            <p className="text-xs font-extrabold text-muted-foreground text-center">
              Como foi sua refeição?
            </p>
            <div className="grid grid-cols-3 gap-3">
              {QUALITIES.map((q) => (
                <button
                  key={q.value}
                  onClick={() => handleQualitySelect(q.value)}
                  className="flex flex-col items-center gap-1 py-5 rounded-3xl text-white font-extrabold border-b-4 active:translate-y-1 active:border-b-0 transition-all duration-150 shadow-sm"
                  style={{ backgroundColor: q.color, borderBottomColor: q.border }}
                >
                  <span className="text-3xl">{q.emoji}</span>
                  <span className="text-sm">{q.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {todayMeals.length > 0 ? (
          <div className="flex gap-3 overflow-x-auto pb-2 mt-4">
            {todayMeals.map((meal) => {
              const mealInfo = MEALS.find((m) => m.type === meal.mealType)
              const q = QUALITIES.find((qq) => qq.value === meal.quality)
              return (
                <div
                  key={meal.id}
                  className="shrink-0 w-32 rounded-2xl overflow-hidden border-2 border-[#E5E5E5] dark:border-[#3B4A55]"
                >
                  <img
                    src={`https://img.usecurling.com/p/200/150?q=${mealInfo?.query || 'food'}`}
                    alt={mealInfo?.label}
                    className="w-full h-20 object-cover"
                  />
                  <div className="p-2">
                    <p className="text-xs font-extrabold">{mealInfo?.label}</p>
                    <p className="text-xs font-bold" style={{ color: q?.color }}>
                      {q?.emoji} {q?.label}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          !selectedMealType && (
            <p className="text-sm text-muted-foreground font-bold text-center py-2">
              Selecione uma refeição para registrar 📸
            </p>
          )
        )}
      </div>

      <MicroGoalsChecklist />

      <div className="bg-card border-2 border-b-4 border-[#E5E5E5] dark:border-[#3B4A55] rounded-3xl p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-10 h-10 rounded-2xl bg-[#58CC02]/15 flex items-center justify-center">
            <span className="text-xl">📋</span>
          </div>
          <h3 className="text-lg font-extrabold">Meu Plano</h3>
        </div>
        <Accordion type="single" collapsible defaultValue="breakfast">
          {DIET_PLAN.map((section) => (
            <AccordionItem key={section.id} value={section.id}>
              <AccordionTrigger className="font-extrabold text-sm hover:no-underline">
                <span className="flex items-center gap-2">
                  <span>{section.emoji}</span>
                  {section.title}
                </span>
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-2 pt-1">
                  {section.items.map((item, idx) => {
                    const key = `${section.id}-${idx}`
                    return (
                      <button
                        key={key}
                        onClick={() => toggleItem(key)}
                        className={cn(
                          'flex items-center gap-3 w-full p-2 rounded-xl transition-all duration-150',
                          checkedItems[key] ? 'bg-[#58CC02]/10' : 'hover:bg-muted/30',
                        )}
                      >
                        <div
                          className={cn(
                            'w-5 h-5 rounded-md flex items-center justify-center border-2 transition-all shrink-0',
                            checkedItems[key]
                              ? 'bg-[#58CC02] border-[#58CC02]'
                              : 'border-[#E5E5E5] dark:border-[#3B4A55]',
                          )}
                        >
                          {checkedItems[key] && (
                            <span className="text-white text-[10px] font-bold">✓</span>
                          )}
                        </div>
                        <span
                          className={cn(
                            'text-sm font-bold text-left',
                            checkedItems[key] && 'text-[#58CC02] line-through',
                          )}
                        >
                          {item}
                        </span>
                      </button>
                    )
                  })}
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </div>
  )
}
