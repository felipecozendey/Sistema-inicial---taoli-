import { StudiesPanel } from '@/components/studies/studies-panel'
import { GraduationCap } from 'lucide-react'

export default function Studies() {
  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in-up pb-10">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-2xl bg-[#1CB0F6]/15 flex items-center justify-center text-[#1CB0F6]">
          <GraduationCap className="w-6 h-6" strokeWidth={2.5} />
        </div>
        <div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Estudos</h2>
          <p className="text-xs sm:text-sm font-semibold text-muted-foreground mt-0.5">
            Cadernos inteligentes, notas interconectadas e repetição espaçada.
          </p>
        </div>
      </div>

      <StudiesPanel />
    </div>
  )
}
