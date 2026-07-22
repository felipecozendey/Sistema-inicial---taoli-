import { useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  buildMetActivityItem,
  calculateActivityBurn,
  type MetActivityItem,
} from '@/lib/metabolic-math'

interface Props {
  activities: MetActivityItem[]
  onChange: (activities: MetActivityItem[]) => void
  weight: number
}

export function MetabolicActivityList({ activities, onChange, weight }: Props) {
  const [name, setName] = useState('')
  const [met, setMet] = useState('')
  const [duration, setDuration] = useState('')
  const [frequency, setFrequency] = useState('')

  const add = () => {
    if (!name || !met) return
    const item = buildMetActivityItem(
      name,
      parseFloat(met) || 0,
      parseInt(duration) || 0,
      parseInt(frequency) || 1,
      weight,
    )
    onChange([...activities, item])
    setName('')
    setMet('')
    setDuration('')
    setFrequency('')
  }

  return (
    <div className="space-y-2">
      {activities.length > 0 && (
        <div className="grid grid-cols-[1fr_52px_52px_48px_52px_28px] gap-1 items-center px-1">
          <Label className="text-[10px] font-bold text-muted-foreground">Atividade</Label>
          <Label className="text-[10px] font-bold text-muted-foreground text-center">MET</Label>
          <Label className="text-[10px] font-bold text-muted-foreground text-center">Min</Label>
          <Label className="text-[10px] font-bold text-muted-foreground text-center">Freq</Label>
          <Label className="text-[10px] font-bold text-muted-foreground text-center">kcal</Label>
          <span />
        </div>
      )}
      {activities.map((a) => {
        const kcal = calculateActivityBurn(a.met_value, weight, a.duration_min)
        return (
          <div
            key={a.id}
            className="grid grid-cols-[1fr_52px_52px_48px_52px_28px] gap-1 items-center"
          >
            <span className="text-xs font-bold truncate px-1">{a.item_name}</span>
            <span className="text-xs font-bold text-center text-muted-foreground">
              {a.met_value}
            </span>
            <span className="text-xs font-bold text-center text-muted-foreground">
              {a.duration_min}
            </span>
            <span className="text-xs font-bold text-center text-muted-foreground">
              {a.frequency}
            </span>
            <span className="text-xs font-extrabold text-center text-[#FF9600]">{kcal}</span>
            <button
              onClick={() => onChange(activities.filter((x) => x.id !== a.id))}
              className="w-7 h-7 rounded-lg bg-[#FF4B4B]/10 flex items-center justify-center hover:bg-[#FF4B4B]/20 transition-colors"
            >
              <Trash2 className="w-3 h-3 text-[#FF4B4B]" />
            </button>
          </div>
        )
      })}
      <div className="grid grid-cols-[1fr_52px_52px_48px_36px] gap-1">
        <Input
          placeholder="Corrida"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="rounded-lg border-2 h-9 text-sm"
        />
        <Input
          type="number"
          placeholder="MET"
          value={met}
          onChange={(e) => setMet(e.target.value)}
          className="rounded-lg border-2 h-9 text-sm text-center px-1"
        />
        <Input
          type="number"
          placeholder="Min"
          value={duration}
          onChange={(e) => setDuration(e.target.value)}
          className="rounded-lg border-2 h-9 text-sm text-center px-1"
        />
        <Input
          type="number"
          placeholder="Freq"
          value={frequency}
          onChange={(e) => setFrequency(e.target.value)}
          className="rounded-lg border-2 h-9 text-sm text-center px-1"
        />
        <button
          onClick={add}
          className="w-9 h-9 rounded-lg bg-[#1CB0F6] flex items-center justify-center hover:bg-[#1CB0F6]/80 transition-colors"
        >
          <Plus className="w-4 h-4 text-white" strokeWidth={3} />
        </button>
      </div>
    </div>
  )
}
