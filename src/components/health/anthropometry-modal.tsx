import { useState, useEffect, useCallback } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { GameButton } from '@/components/ui/game-button'
import { useAppStore } from '@/stores/useAppStore'
import { uploadImage } from '@/lib/image-upload'
import {
  calculateTMB,
  calculateGET,
  ACTIVITY_LABELS,
  Gender,
  ActivityLevel,
} from '@/lib/metabolic-utils'
import { toast } from 'sonner'
import { Camera, X, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

const MEASUREMENTS = [
  { key: 'waist', label: 'Cintura', emoji: '📏' },
  { key: 'hip', label: 'Quadril', emoji: '📐' },
  { key: 'chest', label: 'Peito', emoji: '🏋️' },
  { key: 'leftArm', label: 'Braço E.', emoji: '💪' },
  { key: 'rightArm', label: 'Braço D.', emoji: '💪' },
  { key: 'leftThigh', label: 'Coxa E.', emoji: '🦵' },
  { key: 'rightThigh', label: 'Coxa D.', emoji: '🦵' },
]

const PRIMARY_GOALS = ['Hipertrofia', 'Emagrecimento', 'Manutenção']
const SLEEP_EMOJIS = ['😴', '😪', '😐', '🙂', '😄']
const STRESS_EMOJIS = ['😌', '🙂', '😐', '😟', '😰']
const ACTIVITY_OPTIONS: ActivityLevel[] = ['sedentary', 'light', 'moderate', 'intense']

export function AnthropometryModal({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
}) {
  const { addBodyMetric } = useAppStore()
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [weight, setWeight] = useState('')
  const [bodyFat, setBodyFat] = useState('')
  const [muscleMass, setMuscleMass] = useState('')
  const [gender, setGender] = useState<Gender>('male')
  const [age, setAge] = useState('')
  const [height, setHeight] = useState('')
  const [activityLevel, setActivityLevel] = useState<ActivityLevel>('moderate')
  const [measurements, setMeasurements] = useState<Record<string, string>>({})
  const [photos, setPhotos] = useState<string[]>([])
  const [uploading, setUploading] = useState(false)
  const [heartRate, setHeartRate] = useState('')
  const [bloodPressure, setBloodPressure] = useState('')
  const [sleepQuality, setSleepQuality] = useState(3)
  const [stressLevel, setStressLevel] = useState(3)
  const [primaryGoal, setPrimaryGoal] = useState('')

  const tmbPreview =
    weight && height && age
      ? calculateTMB(gender, parseFloat(weight), parseFloat(height), parseInt(age))
      : 0
  const getPreview = tmbPreview ? calculateGET(tmbPreview, activityLevel) : 0

  const resetForm = useCallback(() => {
    setWeight('')
    setBodyFat('')
    setMuscleMass('')
    setMeasurements({})
    setPhotos([])
    setHeartRate('')
    setBloodPressure('')
    setSleepQuality(3)
    setStressLevel(3)
    setPrimaryGoal('')
    setAge('')
    setHeight('')
    setGender('male')
    setActivityLevel('moderate')
  }, [])

  useEffect(() => {
    if (!open) resetForm()
  }, [open, resetForm])

  const handlePhotos = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return
    setUploading(true)
    try {
      const urls: string[] = []
      for (const file of Array.from(files)) {
        const url = await uploadImage(file)
        urls.push(url)
      }
      setPhotos((p) => [...p, ...urls])
    } finally {
      setUploading(false)
      if (e.target) e.target.value = ''
    }
  }

  const handleSave = () => {
    const numericMeasurements: Record<string, number> = {}
    Object.entries(measurements).forEach(([k, v]) => {
      const n = parseFloat(v)
      if (!isNaN(n)) numericMeasurements[k] = n
    })
    const w = parseFloat(weight) || 0
    const h = parseFloat(height) || 0
    const a = parseInt(age) || 0
    const tmb = h > 0 && a > 0 ? calculateTMB(gender, w, h, a) : 0
    const get = tmb > 0 ? calculateGET(tmb, activityLevel) : 0
    addBodyMetric({
      date,
      weight: w,
      bodyFatPercentage: parseFloat(bodyFat) || 0,
      muscleMass: parseFloat(muscleMass) || 0,
      measurements: numericMeasurements,
      photoUrls: photos,
      heartRateRest: parseInt(heartRate) || undefined,
      bloodPressure: bloodPressure || undefined,
      sleepQuality,
      stressLevel,
      primaryGoal: primaryGoal || undefined,
      gender,
      age: a,
      height: h,
      activityLevel,
      tmb,
      get,
    })
    resetForm()
    toast.success('Avaliação registrada!')
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] rounded-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-extrabold">Nova Avaliação Física</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-2">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label className="font-bold">Data</Label>
              <Input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="rounded-2xl bg-muted/50 border-transparent font-semibold"
              />
            </div>
            <div className="space-y-2">
              <Label className="font-bold">Peso (kg)</Label>
              <Input
                type="number"
                step="0.1"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                className="rounded-2xl bg-muted/50 border-transparent font-semibold"
                placeholder="81.5"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label className="font-bold">Gordura (%)</Label>
              <Input
                type="number"
                step="0.1"
                value={bodyFat}
                onChange={(e) => setBodyFat(e.target.value)}
                className="rounded-2xl bg-muted/50 border-transparent font-semibold"
                placeholder="18.5"
              />
            </div>
            <div className="space-y-2">
              <Label className="font-bold">Massa Muscular (kg)</Label>
              <Input
                type="number"
                step="0.1"
                value={muscleMass}
                onChange={(e) => setMuscleMass(e.target.value)}
                className="rounded-2xl bg-muted/50 border-transparent font-semibold"
                placeholder="64"
              />
            </div>
          </div>
          <div className="bg-muted/30 rounded-2xl p-4 space-y-3">
            <p className="text-sm font-extrabold">👤 Dados Metabólicos</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="font-bold text-xs">Sexo</Label>
                <Select value={gender} onValueChange={(v) => setGender(v as Gender)}>
                  <SelectTrigger className="rounded-xl bg-background font-semibold text-sm h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Masculino</SelectItem>
                    <SelectItem value="female">Feminino</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="font-bold text-xs">Idade</Label>
                <Input
                  type="number"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  className="rounded-xl bg-background font-semibold text-sm h-9"
                  placeholder="30"
                />
              </div>
              <div className="space-y-2">
                <Label className="font-bold text-xs">Altura (cm)</Label>
                <Input
                  type="number"
                  value={height}
                  onChange={(e) => setHeight(e.target.value)}
                  className="rounded-xl bg-background font-semibold text-sm h-9"
                  placeholder="175"
                />
              </div>
              <div className="space-y-2">
                <Label className="font-bold text-xs">Nível de Atividade</Label>
                <Select
                  value={activityLevel}
                  onValueChange={(v) => setActivityLevel(v as ActivityLevel)}
                >
                  <SelectTrigger className="rounded-xl bg-background font-semibold text-sm h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ACTIVITY_OPTIONS.map((a) => (
                      <SelectItem key={a} value={a}>
                        {ACTIVITY_LABELS[a]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            {tmbPreview > 0 && (
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-[#1CB0F6]/10 rounded-xl p-2 text-center">
                  <p className="text-[10px] font-bold text-muted-foreground">TMB Calculada</p>
                  <p className="text-lg font-extrabold text-[#1CB0F6]">{tmbPreview} kcal</p>
                </div>
                <div className="bg-[#FF9600]/10 rounded-xl p-2 text-center">
                  <p className="text-[10px] font-bold text-muted-foreground">GET Calculado</p>
                  <p className="text-lg font-extrabold text-[#FF9600]">{getPreview} kcal</p>
                </div>
              </div>
            )}
          </div>
          <div className="bg-muted/30 rounded-2xl p-4 space-y-3">
            <p className="text-sm font-extrabold">📋 Anamnese</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="font-bold text-xs">Freq. Cardíaca (bpm)</Label>
                <Input
                  type="number"
                  value={heartRate}
                  onChange={(e) => setHeartRate(e.target.value)}
                  className="rounded-xl bg-background font-semibold text-sm h-9"
                  placeholder="65"
                />
              </div>
              <div className="space-y-2">
                <Label className="font-bold text-xs">Pressão Arterial</Label>
                <Input
                  value={bloodPressure}
                  onChange={(e) => setBloodPressure(e.target.value)}
                  className="rounded-xl bg-background font-semibold text-sm h-9"
                  placeholder="120/80"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="font-bold text-xs">Qualidade do Sono (1-5)</Label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    onClick={() => setSleepQuality(n)}
                    className={cn(
                      'flex-1 py-2 rounded-xl border-2 border-b-4 font-extrabold text-sm transition-all active:translate-y-0.5',
                      sleepQuality === n
                        ? 'border-[#1CB0F6] bg-[#1CB0F6]/10'
                        : 'border-[#E5E5E5] dark:border-[#3B4A55]',
                    )}
                  >
                    {SLEEP_EMOJIS[n - 1]}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label className="font-bold text-xs">Nível de Estresse (1-5)</Label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    onClick={() => setStressLevel(n)}
                    className={cn(
                      'flex-1 py-2 rounded-xl border-2 border-b-4 font-extrabold text-sm transition-all active:translate-y-0.5',
                      stressLevel === n
                        ? 'border-[#FF9600] bg-[#FF9600]/10'
                        : 'border-[#E5E5E5] dark:border-[#3B4A55]',
                    )}
                  >
                    {STRESS_EMOJIS[n - 1]}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label className="font-bold text-xs">Objetivo Principal</Label>
              <Select value={primaryGoal} onValueChange={setPrimaryGoal}>
                <SelectTrigger className="rounded-xl bg-background font-semibold text-sm h-9">
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  {PRIMARY_GOALS.map((g) => (
                    <SelectItem key={g} value={g}>
                      {g}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label className="font-bold mb-2 block">Medidas Corporais (cm)</Label>
            <div className="grid grid-cols-2 gap-2">
              {MEASUREMENTS.map((m) => (
                <div key={m.key} className="flex items-center gap-2">
                  <span className="text-lg shrink-0">{m.emoji}</span>
                  <Input
                    type="number"
                    placeholder={m.label}
                    value={measurements[m.key] || ''}
                    onChange={(e) => setMeasurements((p) => ({ ...p, [m.key]: e.target.value }))}
                    className="rounded-xl bg-muted/50 border-transparent font-semibold text-sm h-9"
                  />
                </div>
              ))}
            </div>
          </div>
          <div>
            <Label className="font-bold mb-2 block">Fotos (Antes/Depois)</Label>
            <div className="flex flex-wrap gap-2">
              {photos.map((url, i) => (
                <div key={i} className="relative">
                  <img
                    src={url}
                    alt={`Foto ${i + 1}`}
                    className="w-20 h-20 rounded-xl object-cover"
                  />
                  <button
                    onClick={() => setPhotos((p) => p.filter((_, idx) => idx !== i))}
                    className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-[#FF4B4B] text-white flex items-center justify-center"
                  >
                    <X className="w-3 h-3" strokeWidth={3} />
                  </button>
                </div>
              ))}
              <label className="w-20 h-20 rounded-xl border-2 border-dashed border-[#E5E5E5] dark:border-[#3B4A55] flex items-center justify-center cursor-pointer hover:bg-muted/30 transition-colors">
                <Camera className="w-5 h-5 text-muted-foreground" strokeWidth={2} />
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={handlePhotos}
                  disabled={uploading}
                />
              </label>
            </div>
          </div>
          <GameButton
            onClick={handleSave}
            variant="primary"
            size="lg"
            className="w-full"
            disabled={uploading}
          >
            {uploading ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="w-5 h-5 animate-spin" />
                Fazendo upload...
              </span>
            ) : (
              'Salvar Avaliação'
            )}
          </GameButton>
        </div>
      </DialogContent>
    </Dialog>
  )
}
