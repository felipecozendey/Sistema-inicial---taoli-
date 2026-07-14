import { MetActivity, calculateMetExpenditure } from '@/lib/metabolic-utils'
import { Plus, Trash2 } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface MetActivityTableProps {
  activities: MetActivity[]
  onChange: (activities: MetActivity[]) => void
  weight: number
}

const genId = () => Math.random().toString(36).substring(2, 9)
const inputCls =
  'rounded-lg bg-muted/50 border-transparent font-semibold text-sm h-9 text-center px-1'

export function MetActivityTable({ activities, onChange, weight }: MetActivityTableProps) {
  const addRow = () => {
    onChange([...activities, { id: genId(), name: '', met: 0, duration: 0, weeklyFrequency: 0 }])
  }

  const updateRow = (id: string, field: keyof MetActivity, value: string | number) => {
    onChange(activities.map((a) => (a.id === id ? { ...a, [field]: value } : a)))
  }

  const removeRow = (id: string) => {
    onChange(activities.filter((a) => a.id !== id))
  }

  return (
    <div className="space-y-2">
      {activities.length > 0 && (
        <div className="grid grid-cols-[1fr_52px_52px_48px_52px_28px] gap-1 items-center px-1">
          <Label className="text-[10px] font-bold text-muted-foreground">Atividade</Label>
          <Label className="text-[10px] font-bold text-muted-foreground text-center">MET</Label>
          <Label className="text-[10px] font-bold text-muted-foreground text-center">Min</Label>
          <Label className="text-[10px] font-bold text-muted-foreground text-center">Freq</Label>
          <Label className="text-[10px] font-bold text-muted-foreground text-center">kcal/d</Label>
          <span />
        </div>
      )}
      {activities.map((a) => {
        const dailyKcal =
          (calculateMetExpenditure(a.met, weight, a.duration) * a.weeklyFrequency) / 7
        return (
          <div
            key={a.id}
            className="grid grid-cols-[1fr_52px_52px_48px_52px_28px] gap-1 items-center"
          >
            <Input
              value={a.name}
              onChange={(e) => updateRow(a.id, 'name', e.target.value)}
              className={inputCls}
              placeholder="Corrida"
            />
            <Input
              type="number"
              step="0.1"
              value={a.met || ''}
              onChange={(e) => updateRow(a.id, 'met', parseFloat(e.target.value) || 0)}
              className={inputCls}
            />
            <Input
              type="number"
              value={a.duration || ''}
              onChange={(e) => updateRow(a.id, 'duration', parseInt(e.target.value) || 0)}
              className={inputCls}
            />
            <Input
              type="number"
              value={a.weeklyFrequency || ''}
              onChange={(e) => updateRow(a.id, 'weeklyFrequency', parseInt(e.target.value) || 0)}
              className={inputCls}
            />
            <span className="text-xs font-extrabold text-[#FF9600] text-center">
              {dailyKcal > 0 ? Math.round(dailyKcal) : '—'}
            </span>
            <button
              onClick={() => removeRow(a.id)}
              className="w-7 h-7 rounded-lg bg-[#FF4B4B]/10 flex items-center justify-center hover:bg-[#FF4B4B]/20 transition-colors"
            >
              <Trash2 className="w-3 h-3 text-[#FF4B4B]" />
            </button>
          </div>
        )
      })}
      <button
        onClick={addRow}
        className="w-full py-2 rounded-xl border-2 border-dashed border-[#1CB0F6]/40 text-[#1CB0F6] font-bold text-sm flex items-center justify-center gap-1 hover:bg-[#1CB0F6]/5 transition-colors"
      >
        <Plus className="w-4 h-4" strokeWidth={3} />
        Adicionar Atividade
      </button>
    </div>
  )
}
