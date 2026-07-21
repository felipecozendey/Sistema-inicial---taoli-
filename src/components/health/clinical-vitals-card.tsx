import { useState, useMemo, type ReactNode } from 'react'
import { HeartPulse, Activity, Droplet, Calendar as CalendarIcon, Plus } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { VitalsChart } from '@/components/health/vitals-chart'
import { useAppStore } from '@/stores/useAppStore'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export function ClinicalVitalsCard() {
  const { bodyMetrics, addBodyMetric } = useAppStore()
  const [open, setOpen] = useState(false)
  const [date, setDate] = useState<Date>(new Date())
  const [heartRate, setHeartRate] = useState('')
  const [bloodPressure, setBloodPressure] = useState('')
  const [glucose, setGlucose] = useState('')

  const latest = useMemo(() => {
    if (!bodyMetrics?.length) return null
    return [...bodyMetrics]
      .filter((b: any) => b.heart_rate_rest || b.blood_pressure || b.glucose)
      .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime())[0]
  }, [bodyMetrics])

  const handleSave = () => {
    setOpen(false)
    addBodyMetric?.({
      date: date.toISOString(),
      heart_rate_rest: heartRate ? parseInt(heartRate) : null,
      blood_pressure: bloodPressure || null,
      glucose: glucose ? parseFloat(glucose) : null,
    })
    setHeartRate('')
    setBloodPressure('')
    setGlucose('')
    setDate(new Date())
  }

  const hasVitals = heartRate || bloodPressure || glucose

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-extrabold flex items-center gap-2">
          <HeartPulse className="w-5 h-5 text-[#FF4B4B]" />
          Sinais Vitais Clínicos
        </h3>
        <Button
          onClick={() => setOpen(true)}
          className="bg-[#58CC02] hover:bg-[#58CC02]/90 text-white border-b-4 border-[#58A300] rounded-2xl font-bold"
          size="sm"
        >
          <Plus className="w-4 h-4" /> Registrar
        </Button>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <VitalTile
          icon={<HeartPulse className="w-4 h-4" />}
          label="BPM"
          value={latest?.heart_rate_rest ? `${latest.heart_rate_rest}` : '--'}
          color="#FF4B4B"
        />
        <VitalTile
          icon={<Activity className="w-4 h-4" />}
          label="PA (mmHg)"
          value={latest?.blood_pressure || '--'}
          color="#1CB0F6"
        />
        <VitalTile
          icon={<Droplet className="w-4 h-4" />}
          label="Glicose"
          value={latest?.glucose ? `${latest.glucose}` : '--'}
          color="#FF9600"
        />
      </div>

      <div className="bg-card border-2 border-b-4 border-[#E5E5E5] dark:border-[#3B4A55] rounded-3xl p-4">
        <VitalsChart />
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="rounded-3xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-extrabold">Registrar Sinais Vitais</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="font-bold text-sm">Data do Registro *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start border-2 rounded-2xl font-bold"
                  >
                    <CalendarIcon className="w-4 h-4 mr-2" />
                    {format(date, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={(d) => d && setDate(d)}
                    locale={ptBR}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="grid grid-cols-1 gap-3">
              <div className="space-y-2">
                <Label className="font-bold text-sm">Frequência Cardíaca (BPM)</Label>
                <Input
                  type="number"
                  value={heartRate}
                  onChange={(e) => setHeartRate(e.target.value)}
                  placeholder="ex: 72"
                  className="rounded-2xl border-2"
                />
              </div>
              <div className="space-y-2">
                <Label className="font-bold text-sm">Pressão Arterial (mmHg)</Label>
                <Input
                  value={bloodPressure}
                  onChange={(e) => setBloodPressure(e.target.value)}
                  placeholder="ex: 120/80"
                  className="rounded-2xl border-2"
                />
              </div>
              <div className="space-y-2">
                <Label className="font-bold text-sm">Glicose (mg/dL)</Label>
                <Input
                  type="number"
                  value={glucose}
                  onChange={(e) => setGlucose(e.target.value)}
                  placeholder="ex: 95"
                  className="rounded-2xl border-2"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              onClick={handleSave}
              disabled={!hasVitals}
              className="w-full bg-[#58CC02] hover:bg-[#58CC02]/90 text-white border-b-4 border-[#58A300] rounded-2xl font-bold disabled:opacity-50"
            >
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  )
}

function VitalTile({
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
    <div className="flex flex-col items-center gap-1 bg-card border-2 border-b-4 border-[#E5E5E5] dark:border-[#3B4A55] rounded-2xl p-3">
      <div className="flex items-center gap-1" style={{ color }}>
        {icon}
        <span className="text-xs font-bold">{label}</span>
      </div>
      <span className="text-lg font-extrabold" style={{ color }}>
        {value}
      </span>
    </div>
  )
}
