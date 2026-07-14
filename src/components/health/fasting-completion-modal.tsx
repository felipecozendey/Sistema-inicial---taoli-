import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { FastingFeeling } from '@/types/fasting'
import { ConfettiBurst } from '@/components/ui/confetti-burst'

interface FastingCompletionModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  actualHours: number
  targetHours: number
  onSelectFeeling: (feeling: FastingFeeling) => void
}

const FEELINGS: {
  value: FastingFeeling
  emoji: string
  label: string
  color: string
  border: string
}[] = [
  { value: 'good', emoji: '🟢', label: 'Energizado', color: '#58CC02', border: '#46A302' },
  { value: 'normal', emoji: '🟡', label: 'Normal', color: '#FFC800', border: '#CC9F00' },
  { value: 'bad', emoji: '🔴', label: 'Fraco/Tonto', color: '#FF4B4B', border: '#CC3B3B' },
]

export function FastingCompletionModal({
  open,
  onOpenChange,
  actualHours,
  targetHours,
  onSelectFeeling,
}: FastingCompletionModalProps) {
  const hitGoal = actualHours >= targetHours

  const handleSelect = (feeling: FastingFeeling) => {
    onSelectFeeling(feeling)
    onOpenChange(false)
  }

  return (
    <>
      {hitGoal && open && <ConfettiBurst trigger={open} />}
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="rounded-3xl max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-center text-2xl font-extrabold">
              {hitGoal ? '🎉 Meta Concluída!' : 'Jejum Encerrado'}
            </DialogTitle>
            <DialogDescription className="text-center font-semibold">
              Você jejuou por{' '}
              <span className="font-extrabold text-foreground">{actualHours.toFixed(1)}h</span> de{' '}
              <span className="font-extrabold text-foreground">{targetHours}h</span>
              {hitGoal && (
                <span className="block mt-2 text-[#58CC02] font-extrabold">
                  +10 moedas conquistadas! 🪙
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 mt-4">
            <p className="text-center text-sm font-bold text-muted-foreground">
              Como você se sente?
            </p>
            <div className="grid grid-cols-3 gap-3">
              {FEELINGS.map((f) => (
                <button
                  key={f.value}
                  onClick={() => handleSelect(f.value)}
                  className="flex flex-col items-center gap-2 py-4 rounded-2xl border-2 border-b-4 transition-all duration-150 active:translate-y-1 active:border-b-2 hover:bg-muted/30"
                  style={{ borderColor: f.color, borderBottomColor: f.border }}
                >
                  <span className="text-3xl">{f.emoji}</span>
                  <span className="text-xs font-extrabold">{f.label}</span>
                </button>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
