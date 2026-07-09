import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { useAppStore } from '@/stores/useAppStore'
import { useFocusRadar } from '@/components/focus-radar/focus-radar-provider'
import { playFocusSound } from '@/lib/focus-sounds'
import { Bell, BellOff, Volume2 } from 'lucide-react'
import { cn } from '@/lib/utils'

const INTERVALS = [15, 30, 60]
const SOUNDS = [
  { value: 'ding' as const, label: 'Ding', emoji: '🔔' },
  { value: 'pop' as const, label: 'Pop', emoji: '💥' },
  { value: 'tibetan' as const, label: 'Sino Tibetano', emoji: '🪷' },
]

export function FocusRadarConfig({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const { focusRadar, updateFocusRadar } = useAppStore()
  const { toggle } = useFocusRadar()
  const [message, setMessage] = useState(focusRadar.message)

  const notifPermission = 'Notification' in window ? Notification.permission : 'denied'

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px] rounded-3xl p-6">
        <DialogHeader>
          <DialogTitle className="text-2xl font-extrabold">Radar de Foco</DialogTitle>
          <DialogDescription className="font-semibold">
            Mantenha-se focado e evite procrastinação.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          <div className="flex items-center justify-between p-4 rounded-2xl bg-muted/50">
            <div className="flex items-center gap-3">
              {focusRadar.enabled ? (
                <Bell className="w-5 h-5 text-[#58CC02]" strokeWidth={2.5} />
              ) : (
                <BellOff className="w-5 h-5 text-muted-foreground" strokeWidth={2.5} />
              )}
              <div>
                <p className="font-bold text-sm">
                  Radar {focusRadar.enabled ? 'Ativo' : 'Inativo'}
                </p>
                <p className="text-xs text-muted-foreground">
                  {notifPermission === 'granted'
                    ? 'Notificações ativas'
                    : notifPermission === 'denied'
                      ? 'Notificações bloqueadas'
                      : 'Permissão pendente'}
                </p>
              </div>
            </div>
            <Switch checked={focusRadar.enabled} onCheckedChange={toggle} />
          </div>

          <div className="space-y-2">
            <Label className="font-bold">Intervalo</Label>
            <div className="grid grid-cols-3 gap-2">
              {INTERVALS.map((min) => (
                <button
                  key={min}
                  onClick={() => updateFocusRadar({ interval: min })}
                  className={cn(
                    'p-3 rounded-2xl text-sm font-bold border-2 border-b-4 transition-all active:translate-y-1 active:border-b-0',
                    focusRadar.interval === min
                      ? 'border-[#58CC02] bg-[#58CC02]/10 text-[#58CC02]'
                      : 'border-[#E5E5E5] dark:border-[#3B4A55] bg-muted/50',
                  )}
                >
                  {min === 60 ? '1 hora' : `${min} min`}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label className="font-bold">Mensagem de Notificação</Label>
            <Input
              value={message}
              onChange={(e) => {
                setMessage(e.target.value)
                updateFocusRadar({ message: e.target.value })
              }}
              placeholder="Ex: Ainda focado? 👀"
              className="rounded-2xl bg-muted/50 border-transparent font-semibold"
            />
          </div>

          <div className="space-y-2">
            <Label className="font-bold">Som de Alerta</Label>
            <div className="grid grid-cols-3 gap-2">
              {SOUNDS.map((sound) => (
                <button
                  key={sound.value}
                  onClick={() => {
                    updateFocusRadar({ soundProfile: sound.value })
                    playFocusSound(sound.value)
                  }}
                  className={cn(
                    'flex flex-col items-center gap-1 p-3 rounded-2xl border-2 border-b-4 transition-all active:translate-y-1 active:border-b-0',
                    focusRadar.soundProfile === sound.value
                      ? 'border-[#1CB0F6] bg-[#1CB0F6]/10'
                      : 'border-[#E5E5E5] dark:border-[#3B4A55] bg-muted/50',
                  )}
                >
                  <span className="text-2xl">{sound.emoji}</span>
                  <span className="text-xs font-bold">{sound.label}</span>
                  <Volume2 className="w-3 h-3 text-muted-foreground" />
                </button>
              ))}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
