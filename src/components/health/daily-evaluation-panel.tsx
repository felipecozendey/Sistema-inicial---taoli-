import { useMemo } from 'react'
import { useAppStore } from '@/stores/useAppStore'
import { calculateIMC, calculateRCQ, calculate4CompartmentModel } from '@/lib/anthropometry-utils'
import { FourCompartmentChart } from '@/components/health/four-compartment-chart'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Scale, Percent, Ruler, Activity, Info } from 'lucide-react'
import type { ReactNode } from 'react'

const PROTOCOL_LABELS: Record<string, string> = {
  none: 'Manual',
  durnin: 'Durnin',
  pollock_7: 'Pollock 7',
  pollock_3: 'Pollock 3',
  petroski: 'Petroski',
  guedes: 'Guedes',
  faulkner: 'Faulkner',
}

const COMPOSITION_LABELS: Record<string, string> = {
  skinfolds: 'Pregas Cutâneas',
  bioimpedance: 'Bioimpedância',
}

function getImcBadge(value: number): { bg: string; text: string; label: string } {
  if (value < 18.5)
    return {
      bg: 'bg-blue-100 dark:bg-blue-900/30',
      text: 'text-blue-600 dark:text-blue-400',
      label: 'Baixo peso',
    }
  if (value < 25)
    return {
      bg: 'bg-green-100 dark:bg-green-900/30',
      text: 'text-green-600 dark:text-green-400',
      label: 'Normal',
    }
  if (value < 30)
    return {
      bg: 'bg-yellow-100 dark:bg-yellow-900/30',
      text: 'text-yellow-600 dark:text-yellow-400',
      label: 'Sobrepeso',
    }
  if (value < 35)
    return {
      bg: 'bg-orange-100 dark:bg-orange-900/30',
      text: 'text-orange-600 dark:text-orange-400',
      label: 'Obesidade I',
    }
  if (value < 40)
    return {
      bg: 'bg-red-100 dark:bg-red-900/30',
      text: 'text-red-600 dark:text-red-400',
      label: 'Obesidade II',
    }
  return {
    bg: 'bg-purple-100 dark:bg-purple-900/30',
    text: 'text-purple-600 dark:text-purple-400',
    label: 'Obesidade III',
  }
}

function getRcqRisk(index: number, gender?: string): { label: string; color: string } {
  const threshold = gender === 'female' ? 0.85 : 0.9
  if (index <= threshold * 0.9) return { label: 'Baixo', color: 'text-green-600' }
  if (index <= threshold) return { label: 'Moderado', color: 'text-yellow-600' }
  return { label: 'Alto', color: 'text-red-600' }
}

export function DailyEvaluationPanel() {
  const bodyMetrics = useAppStore((s) => s.bodyMetrics)

  const latest = useMemo(() => {
    if (!bodyMetrics?.length) return null
    return [...bodyMetrics]
      .filter((b) => b.weight || b.bodyFatPercentage || b.muscleMass)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0]
  }, [bodyMetrics])

  const imc = useMemo(() => {
    if (!latest?.weight || !latest?.height) return null
    return calculateIMC(latest.weight, latest.height)
  }, [latest])

  const rcq = useMemo(() => {
    if (!latest) return null
    const waist = latest.waistCirc || latest.measurements?.['waist']
    const hip = latest.hipCirc || latest.measurements?.['hip']
    if (!waist || !hip) return null
    return calculateRCQ(waist, hip, (latest.gender as 'male' | 'female') || 'male')
  }, [latest])

  const fourCompartment = useMemo(() => {
    if (!latest?.weight || !latest?.bodyFatPercentage || !latest?.compositionMethod) return null
    return calculate4CompartmentModel(
      latest.weight,
      latest.height || 0,
      latest.wristDiameter || 0,
      latest.femurDiameter || 0,
      latest.bodyFatPercentage,
      (latest.gender as 'male' | 'female') || 'male',
    )
  }, [latest])

  const canShow4Compartment = useMemo(() => {
    if (!latest) return false
    if (!latest.compositionMethod) return false
    if (!latest.bodyFatPercentage || latest.bodyFatPercentage <= 0) return false
    return true
  }, [latest])

  if (!latest) {
    return (
      <Alert className="border-2 border-dashed border-[#E5E5E5] dark:border-[#3B4A55] rounded-2xl bg-muted/20">
        <Info className="w-5 h-5" />
        <AlertDescription className="font-bold">
          Nenhuma avaliação registrada. Clique em "Registrar Medidas" para começar.
        </AlertDescription>
      </Alert>
    )
  }

  const imcBadge = imc ? getImcBadge(imc.value) : null
  const rcqRisk = rcq ? getRcqRisk(rcq.index, latest.gender) : null
  const protocolLabel =
    latest.calcProtocol && latest.calcProtocol !== 'none'
      ? PROTOCOL_LABELS[latest.calcProtocol] || latest.calcProtocol
      : latest.compositionMethod
        ? COMPOSITION_LABELS[latest.compositionMethod] || latest.compositionMethod
        : 'Manual'

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <SummaryTile
          icon={<Scale className="w-4 h-4" />}
          label="Peso"
          value={latest.weight ? `${latest.weight} kg` : '--'}
          color="#58CC02"
        />
        <SummaryTile
          icon={<Percent className="w-4 h-4" />}
          label="% Gordura"
          value={latest.bodyFatPercentage ? `${latest.bodyFatPercentage}%` : '--'}
          color="#FF9600"
        />
        <SummaryTile
          icon={<Activity className="w-4 h-4" />}
          label="M. Muscular"
          value={latest.muscleMass ? `${latest.muscleMass} kg` : '--'}
          color="#1CB0F6"
        />
        <SummaryTile
          icon={<Ruler className="w-4 h-4" />}
          label="IMC"
          value={imc ? imc.value.toFixed(1) : '--'}
          color="#CE82FF"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="bg-muted/30 rounded-2xl p-4 space-y-2">
          <div className="flex items-center gap-2">
            <Ruler className="w-4 h-4 text-[#CE82FF]" />
            <span className="text-sm font-extrabold">IMC</span>
          </div>
          {imc ? (
            <>
              <p className="text-2xl font-extrabold text-[#CE82FF]">{imc.value.toFixed(1)}</p>
              <span
                className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${imcBadge?.bg} ${imcBadge?.text}`}
              >
                {imcBadge?.label}
              </span>
            </>
          ) : (
            <p className="text-sm text-muted-foreground font-bold">Dados insuficientes</p>
          )}
        </div>

        <div className="bg-muted/30 rounded-2xl p-4 space-y-2">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-[#1CB0F6]" />
            <span className="text-sm font-extrabold">RCQ</span>
          </div>
          {rcq ? (
            <>
              <p className="text-2xl font-extrabold text-[#1CB0F6]">{rcq.index.toFixed(2)}</p>
              <span className={`text-xs font-bold ${rcqRisk?.color}`}>Risco {rcqRisk?.label}</span>
            </>
          ) : (
            <p className="text-sm text-muted-foreground font-bold">
              Cintura/Quadril não informados
            </p>
          )}
        </div>

        <div className="bg-muted/30 rounded-2xl p-4 space-y-2">
          <div className="flex items-center gap-2">
            <Percent className="w-4 h-4 text-[#FF9600]" />
            <span className="text-sm font-extrabold">% Gordura</span>
          </div>
          {latest.bodyFatPercentage ? (
            <>
              <p className="text-2xl font-extrabold text-[#FF9600]">{latest.bodyFatPercentage}%</p>
              <span className="text-xs font-bold text-muted-foreground">
                Fonte: {protocolLabel}
              </span>
            </>
          ) : (
            <p className="text-sm text-muted-foreground font-bold">Não informado</p>
          )}
        </div>
      </div>

      <div className="bg-muted/20 rounded-2xl p-4 space-y-3">
        <h4 className="text-sm font-extrabold">🧬 Modelo de 4 Compartimentos</h4>
        {canShow4Compartment && fourCompartment ? (
          <FourCompartmentChart
            muscular={fourCompartment.muscular}
            adiposo={fourCompartment.adiposo}
            osseo={fourCompartment.osseo}
            residual={fourCompartment.residual}
          />
        ) : (
          <Alert className="border-2 border-dashed border-[#E5E5E5] dark:border-[#3B4A55] rounded-xl bg-card">
            <Info className="w-4 h-4" />
            <AlertDescription className="text-xs font-bold">
              Para ver a distribuição de peso, preencha as dobras cutâneas ou bioimpedância na
              avaliação.
            </AlertDescription>
          </Alert>
        )}
      </div>
    </div>
  )
}

function SummaryTile({
  icon,
  label,
  value,
  color,
}: {
  icon: ReactNode
  label: string
  value: string
  color: string
}) {
  return (
    <div className="flex flex-col items-center gap-1 bg-background/50 border-2 border-[#E5E5E5] dark:border-[#3B4A55] rounded-2xl p-3">
      <div className="flex items-center gap-1" style={{ color }}>
        {icon}
        <span className="text-xs font-bold">{label}</span>
      </div>
      <span className="text-base font-extrabold" style={{ color }}>
        {value}
      </span>
    </div>
  )
}
