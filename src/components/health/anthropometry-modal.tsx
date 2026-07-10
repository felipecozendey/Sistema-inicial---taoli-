import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { GameButton } from '@/components/ui/game-button'
import { useAppStore } from '@/stores/useAppStore'
import { uploadImage } from '@/lib/image-upload'
import { toast } from 'sonner'
import { Camera, X } from 'lucide-react'

const MEASUREMENTS = [
  { key: 'waist', label: 'Cintura', emoji: '📏' },
  { key: 'hip', label: 'Quadril', emoji: '📐' },
  { key: 'chest', label: 'Peito', emoji: '🏋️' },
  { key: 'leftArm', label: 'Braço E.', emoji: '💪' },
  { key: 'rightArm', label: 'Braço D.', emoji: '💪' },
  { key: 'leftThigh', label: 'Coxa E.', emoji: '🦵' },
  { key: 'rightThigh', label: 'Coxa D.', emoji: '🦵' },
]

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
  const [measurements, setMeasurements] = useState<Record<string, string>>({})
  const [photos, setPhotos] = useState<string[]>([])
  const [uploading, setUploading] = useState(false)

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
    addBodyMetric({
      date,
      weight: parseFloat(weight) || 0,
      bodyFatPercentage: parseFloat(bodyFat) || 0,
      muscleMass: parseFloat(muscleMass) || 0,
      measurements: numericMeasurements,
      photoUrls: photos,
    })
    setWeight('')
    setBodyFat('')
    setMuscleMass('')
    setMeasurements({})
    setPhotos([])
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
          <GameButton onClick={handleSave} variant="primary" size="lg" className="w-full">
            Salvar Avaliação
          </GameButton>
        </div>
      </DialogContent>
    </Dialog>
  )
}
