import { Lock, Apple, Dumbbell } from 'lucide-react'

export function HealthPlaceholder({
  title,
  icon,
  description,
}: {
  title: string
  icon: React.ReactNode
  description: string
}) {
  return (
    <div className="bg-card border-2 border-dashed border-[#E5E5E5] dark:border-[#3B4A55] rounded-3xl p-6 shadow-sm flex flex-col items-center justify-center gap-3 min-h-[180px] opacity-70">
      <div className="w-12 h-12 rounded-2xl bg-muted/50 flex items-center justify-center text-muted-foreground">
        {icon}
      </div>
      <h3 className="text-lg font-extrabold text-muted-foreground">{title}</h3>
      <p className="text-xs font-semibold text-muted-foreground text-center">{description}</p>
      <span className="flex items-center gap-1 text-[10px] font-extrabold uppercase tracking-wider bg-muted text-muted-foreground px-3 py-1 rounded-full">
        <Lock className="w-3 h-3" strokeWidth={2.5} /> Em Breve
      </span>
    </div>
  )
}

export function NutritionPlaceholder() {
  return (
    <HealthPlaceholder
      title="Nutrição"
      icon={<Apple className="w-6 h-6" strokeWidth={2.5} />}
      description="Acompanhe refeições, calorias e macronutrientes."
    />
  )
}

export function ExercisePlaceholder() {
  return (
    <HealthPlaceholder
      title="Exercício Físico"
      icon={<Dumbbell className="w-6 h-6" strokeWidth={2.5} />}
      description="Registre treinos, duração e intensidade."
    />
  )
}
