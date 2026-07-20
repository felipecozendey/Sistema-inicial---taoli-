import { useMemo, useState } from 'react'
import { useAppStore } from '@/stores/useAppStore'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
  CartesianGrid,
} from 'recharts'
import { ChartContainer } from '@/components/ui/chart'
import { QuickVitalsModal } from '@/components/health/quick-vitals-modal'
import { Heart, Activity, Droplet, Plus } from 'lucide-react'

export function VitalsChart() {
  const bodyMetrics = useAppStore((s) => s.bodyMetrics)
  const [modalOpen, setModalOpen] = useState(false)

  const chartData = useMemo(() => {
    return [...bodyMetrics]
      .filter((m) => m.heartRateRest || m.bloodPressure || m.glucose)
      .sort((a, b) => a.date.localeCompare(b.date))
      .map((m) => ({
        date: new Date(m.date + 'T00:00:00').toLocaleDateString('pt-BR', {
          day: '2-digit',
          month: '2-digit',
        }),
        bpm: m.heartRateRest || null,
        systolic: m.bloodPressure
          ? parseInt(m.bloodPressure.match(/(\d+)/)?.[1] || '0') || null
          : null,
        glucose: m.glucose || null,
      }))
  }, [bodyMetrics])

  const latest = useMemo(() => {
    const sorted = [...bodyMetrics].sort((a, b) => a.date.localeCompare(b.date))
    return sorted[sorted.length - 1]
  }, [bodyMetrics])

  return (
    <div className="bg-card border-2 border-b-4 border-[#E5E5E5] dark:border-[#3B4A55] rounded-3xl p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-base font-extrabold flex items-center gap-2">
          <Heart className="w-5 h-5 text-[#FF4B4B]" />
          Sinais Vitais Clínicos
        </h4>
        <button
          onClick={() => setModalOpen(true)}
          className="py-2 px-3 rounded-xl bg-[#1CB0F6] hover:bg-[#1A9BE0] text-white font-extrabold text-xs border-b-4 border-[#1890D0] active:translate-y-0.5 active:border-b-0 transition-all duration-150 flex items-center gap-1"
        >
          <Plus className="w-3.5 h-3.5" strokeWidth={3} /> Registrar
        </button>
      </div>
      {chartData.length > 0 ? (
        <>
          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="text-center bg-[#FF4B4B]/10 rounded-2xl p-3">
              <Heart className="w-5 h-5 text-[#FF4B4B] mx-auto mb-1 animate-pulse" />
              <p className="text-lg font-extrabold">{latest?.heartRateRest || '—'}</p>
              <p className="text-[10px] font-bold text-muted-foreground">FC (bpm)</p>
            </div>
            <div className="text-center bg-[#1CB0F6]/10 rounded-2xl p-3">
              <Activity className="w-5 h-5 text-[#1CB0F6] mx-auto mb-1" />
              <p className="text-sm font-extrabold">{latest?.bloodPressure || '—'}</p>
              <p className="text-[10px] font-bold text-muted-foreground">PA (mmHg)</p>
            </div>
            <div className="text-center bg-[#FFC800]/10 rounded-2xl p-3">
              <Droplet className="w-5 h-5 text-[#FFC800] mx-auto mb-1" />
              <p className="text-lg font-extrabold">{latest?.glucose || '—'}</p>
              <p className="text-[10px] font-bold text-muted-foreground">Glicose (mg/dL)</p>
            </div>
          </div>
          <div className="h-48">
            <ChartContainer
              config={{
                bpm: { label: 'FC Repouso (bpm)', color: '#FF4B4B' },
                systolic: { label: 'PA Sistólica (mmHg)', color: '#1CB0F6' },
                glucose: { label: 'Glicose (mg/dL)', color: '#FFC800' },
              }}
              className="h-full"
            >
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} width={38} />
                  <Tooltip
                    contentStyle={{ borderRadius: '12px', border: '1px solid hsl(var(--border))' }}
                  />
                  <Line
                    type="monotone"
                    dataKey="bpm"
                    name="FC Repouso (bpm)"
                    stroke="#FF4B4B"
                    strokeWidth={3}
                    dot={{ fill: '#FF4B4B', r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="systolic"
                    name="PA Sistólica (mmHg)"
                    stroke="#1CB0F6"
                    strokeWidth={3}
                    dot={{ fill: '#1CB0F6', r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="glucose"
                    name="Glicose (mg/dL)"
                    stroke="#FFC800"
                    strokeWidth={3}
                    dot={{ fill: '#FFC800', r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </ChartContainer>
          </div>
        </>
      ) : (
        <div className="text-center py-8 text-muted-foreground font-bold text-sm">
          Sem dados vitais registrados.
        </div>
      )}
      <QuickVitalsModal open={modalOpen} onOpenChange={setModalOpen} />
    </div>
  )
}
