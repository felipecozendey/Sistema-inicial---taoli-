import { useState } from 'react'
import { useAppStore } from '@/stores/useAppStore'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Droplet, Trash2, HelpCircle } from 'lucide-react'

const URINE_COLORS: { type: number; label: string; color: string; description: string }[] = [
  {
    type: 1,
    label: 'Transparente',
    color: '#FFF9C4',
    description: 'Excelente hidratação. Urina ideal.',
  },
  { type: 2, label: 'Am. Claro', color: '#FFF176', description: 'Hidratação adequada.' },
  { type: 3, label: 'Amarelo', color: '#FFEE58', description: 'Hidratação moderada.' },
  { type: 4, label: 'Am. Escuro', color: '#FBC02D', description: 'Beba mais água.' },
  { type: 5, label: 'Âmbar', color: '#EF6C00', description: 'Desidratação moderada.' },
  {
    type: 6,
    label: 'Marrom',
    color: '#6D4C41',
    description: 'Alerta: possível desidratação severa.',
  },
]

export function UrineWidget() {
  const { urineLogs, addUrineLog, deleteUrineLog } = useAppStore()
  const today = new Date().toISOString().split('T')[0]
  const todayLogs = urineLogs
    .filter((l) => l.date === today)
    .sort((a, b) => b.timestamp.localeCompare(a.timestamp))
  const [helpOpen, setHelpOpen] = useState(false)

  const mostRecent = todayLogs[0]
  const hasMultiple = todayLogs.length > 1

  return (
    <div className="bg-card border-2 border-b-4 border-[#E5E5E5] dark:border-[#3B4A55] rounded-3xl p-6 shadow-sm flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <div className="w-10 h-10 rounded-2xl bg-[#FFC800]/15 flex items-center justify-center">
          <Droplet className="w-5 h-5 text-[#FFC800]" strokeWidth={2.5} />
        </div>
        <h3 className="text-lg font-extrabold">Qualidade da Urina</h3>
        <Dialog open={helpOpen} onOpenChange={setHelpOpen}>
          <DialogTrigger asChild>
            <button className="ml-auto w-7 h-7 rounded-full bg-muted/50 flex items-center justify-center hover:bg-muted transition-colors">
              <HelpCircle className="w-4 h-4 text-muted-foreground" strokeWidth={2.5} />
            </button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[420px] rounded-3xl">
            <DialogHeader>
              <DialogTitle className="text-xl font-extrabold">Escala de Hidratação</DialogTitle>
            </DialogHeader>
            <div className="space-y-3 mt-2 max-h-[60vh] overflow-y-auto">
              {URINE_COLORS.map((item) => (
                <div key={item.type} className="flex items-start gap-3 p-3 rounded-2xl bg-muted/40">
                  <span
                    className="w-8 h-8 rounded-full shrink-0 mt-0.5 border border-black/10"
                    style={{ backgroundColor: item.color }}
                  />
                  <div>
                    <p className="text-sm font-extrabold">{item.label}</p>
                    <p className="text-xs text-muted-foreground font-semibold">
                      {item.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <p className="text-xs font-bold text-muted-foreground">
        Selecione a cor da urina — toque para registrar
      </p>

      <div className="flex gap-2 overflow-x-auto pb-2">
        {URINE_COLORS.map((item) => (
          <button
            key={item.type}
            onClick={() => addUrineLog(today, item.type, '')}
            className="flex flex-col items-center gap-1.5 px-3 py-3 rounded-2xl border-2 border-b-4 transition-all duration-150 active:translate-y-1 active:border-b-0 min-w-[68px] hover:bg-muted/30"
            style={{ borderColor: item.color, borderBottomColor: item.color }}
          >
            <span
              className="w-8 h-8 rounded-full border border-black/10"
              style={{ backgroundColor: item.color }}
            />
            <span className="text-[9px] font-extrabold text-muted-foreground">{item.label}</span>
          </button>
        ))}
      </div>

      {mostRecent && (
        <div className="space-y-2 mt-1">
          <div className="flex items-center justify-between bg-muted/40 rounded-xl px-3 py-2">
            <div className="flex items-center gap-2">
              <span
                className="w-5 h-5 rounded-full border border-black/10"
                style={{
                  backgroundColor: URINE_COLORS.find((u) => u.type === mostRecent.colorType)?.color,
                }}
              />
              <span className="text-sm font-bold">
                {URINE_COLORS.find((u) => u.type === mostRecent.colorType)?.label}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-muted-foreground">
                {new Date(mostRecent.timestamp).toLocaleTimeString('pt-BR', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
              <button
                onClick={() => deleteUrineLog(mostRecent.id)}
                className="p-1 hover:bg-[#FF4B4B]/10 hover:text-[#FF4B4B] rounded-full transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" strokeWidth={2.5} />
              </button>
            </div>
          </div>
          {hasMultiple && (
            <p className="text-xs font-semibold text-muted-foreground text-center">
              Ver histórico completo na aba ao lado
            </p>
          )}
        </div>
      )}
    </div>
  )
}
