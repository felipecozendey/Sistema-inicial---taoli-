import { useState, useMemo, type ReactNode } from 'react'
import { HeartPulse, Activity, Droplet, Plus, Scale, Ruler } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { QuickVitalsModal } from '@/components/health/quick-vitals-modal'
import { useAppStore } from '@/stores/useAppStore'

export function ClinicalVitalsCard() {
  const { bodyMetrics, patientGoals } = useAppStore()
  const [open, setOpen] = useState(false)

  // Find most recent body metric record with weight or height
  const latestBody = useMemo(() => {
    if (!bodyMetrics?.length) return null
    return [...bodyMetrics]
      .filter((b: any) => (b.weight && b.weight > 0) || (b.height && b.height > 0))
      .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime())[0] as any
  }, [bodyMetrics])

  // Current weight & height with fallback logic
  const currentWeight = useMemo(() => {
    if (latestBody?.weight && Number(latestBody.weight) > 0) {
      return Number(latestBody.weight)
    }
    return null
  }, [latestBody])

  const currentHeight = useMemo(() => {
    if (latestBody?.height && Number(latestBody.height) > 0) {
      return Number(latestBody.height)
    }
    if (patientGoals?.height && Number(patientGoals.height) > 0) {
      return Number(patientGoals.height)
    }
    return null
  }, [latestBody, patientGoals])

  // Most recent vitals record (BPM, Blood pressure, Glucose)
  const latestVitals = useMemo(() => {
    if (!bodyMetrics?.length) return null
    return [...bodyMetrics]
      .filter(
        (b: any) =>
          b.heart_rate_rest || b.heartRateRest || b.blood_pressure || b.bloodPressure || b.glucose,
      )
      .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime())[0] as any
  }, [bodyMetrics])

  const bpmValue = latestVitals?.heart_rate_rest
    ? `${latestVitals.heart_rate_rest}`
    : latestVitals?.heartRateRest
      ? `${latestVitals.heartRateRest}`
      : '-'

  const bpValue = latestVitals?.blood_pressure || latestVitals?.bloodPressure || '-'
  const glucoseValue = latestVitals?.glucose ? `${latestVitals.glucose}` : '-'
  const weightDisplay = currentWeight !== null ? `${currentWeight} kg` : '-'
  const heightDisplay = currentHeight !== null ? `${currentHeight} cm` : '-'

  return (
    <section className="space-y-4">
      {/* Header com estilo Duolingo */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-black tracking-tight flex items-center gap-2">
            <span className="flex items-center justify-center w-8 h-8 rounded-2xl bg-[#58CC02]/15 text-[#58CC02]">
              ⚡
            </span>
            Avaliação Rápida
          </h3>
          <p className="text-xs font-bold text-muted-foreground mt-0.5">
            Sinais vitais e medidas corporais essenciais
          </p>
        </div>

        <Button
          onClick={() => setOpen(true)}
          className="bg-[#58CC02] hover:bg-[#58CC02]/90 text-white border-b-4 border-[#46A302] rounded-3xl font-extrabold px-4 py-2 text-sm shadow-sm active:translate-y-0.5 active:border-b-2 transition-all select-none"
          size="sm"
        >
          <Plus className="w-4 h-4 mr-1 stroke-[3]" /> Registrar
        </Button>
      </div>

      {/* Grid de Métricas Principais (Peso, Altura, BPM, PA, Glicose) */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
        <VitalTile
          icon={<Scale className="w-4 h-4" />}
          label="Peso"
          value={weightDisplay}
          color="#58CC02"
          sub="Corporal"
        />
        <VitalTile
          icon={<Ruler className="w-4 h-4" />}
          label="Altura"
          value={heightDisplay}
          color="#1CB0F6"
          sub="Estatura"
        />
        <VitalTile
          icon={<HeartPulse className="w-4 h-4" />}
          label="BPM"
          value={bpmValue}
          color="#FF4B4B"
          sub="Cardíaco"
        />
        <VitalTile
          icon={<Activity className="w-4 h-4" />}
          label="Pressão"
          value={bpValue}
          color="#1CB0F6"
          sub="mmHg"
        />
        <VitalTile
          icon={<Droplet className="w-4 h-4" />}
          label="Glicose"
          value={glucoseValue}
          color="#FF9600"
          sub="mg/dL"
          className="col-span-2 sm:col-span-1"
        />
      </div>

      {/* Modal de Avaliação Rápida */}
      <QuickVitalsModal
        open={open}
        onOpenChange={setOpen}
        initialWeight={currentWeight}
        initialHeight={currentHeight}
      />
    </section>
  )
}

function VitalTile({
  icon,
  label,
  value,
  color,
  sub,
  className,
}: {
  icon: ReactNode
  label: string
  value: string
  color: string
  sub?: string
  className?: string
}) {
  return (
    <div
      className={`flex flex-col items-center justify-center gap-1 bg-card border-2 border-b-4 border-[#E5E5E5] dark:border-[#3B4A55] rounded-3xl p-3 shadow-xs hover:border-muted-foreground/30 transition-all ${className || ''}`}
    >
      <div className="flex items-center gap-1.5" style={{ color }}>
        {icon}
        <span className="text-xs font-black uppercase tracking-wider">{label}</span>
      </div>
      <span className="text-lg font-black tracking-tight" style={{ color }}>
        {value}
      </span>
      {sub && <span className="text-[10px] font-bold text-muted-foreground -mt-0.5">{sub}</span>}
    </div>
  )
}
