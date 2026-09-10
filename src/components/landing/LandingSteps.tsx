import { useSiteSettingsStore } from '@/stores/useSiteSettingsStore'

export function LandingSteps() {
  const { settings } = useSiteSettingsStore()
  const steps = settings.steps || []

  return (
    <section className="py-16 sm:py-24 border-b">
      <div className="max-w-5xl mx-auto px-4 space-y-12">
        <div className="text-center space-y-3 max-w-xl mx-auto">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FFC800]/20 text-[#CCA000] dark:text-[#FFC800] text-xs font-black">
            <span>Passo a Passo</span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-black tracking-tight text-foreground">
            Como funciona o VibeCoding
          </h2>
          <p className="text-muted-foreground text-xs sm:text-sm font-semibold">
            Construa o hábito da consistência com um fluxo desenhado para evitar sobrecargas e
            procrastinação.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
          {steps.map((s, idx) => (
            <div
              key={s.step || idx}
              className="bg-card rounded-3xl border-2 border-b-4 border-b-[#58CC02] p-6 space-y-4 shadow-sm relative flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-[#58CC02] text-white flex items-center justify-center font-black text-xl shadow-md border-b-2 border-[#46A302]">
                  {s.step || idx + 1}
                </div>
                <h3 className="text-lg font-black text-foreground">{s.title}</h3>
                <p className="text-xs sm:text-sm text-muted-foreground font-semibold leading-relaxed">
                  {s.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
