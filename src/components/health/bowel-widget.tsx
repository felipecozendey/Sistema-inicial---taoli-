import { useState } from 'react'
import { useAppStore, BowelType } from '@/stores/useAppStore'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Trash2, HelpCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

const BRISTOL_TYPES: { type: BowelType; label: string; color: string; description: string }[] = [
  {
    type: 1,
    label: 'Tipo 1',
    color: '#FF4B4B',
    description: 'Pélotas duras separadas (como nozes). Constipação severa.',
  },
  {
    type: 2,
    label: 'Tipo 2',
    color: '#FF9600',
    description: 'Formato de salsicha, mas granulado. Constipação.',
  },
  {
    type: 3,
    label: 'Tipo 3',
    color: '#58CC02',
    description: 'Como salsicha mas com rachaduras. Normal.',
  },
  {
    type: 4,
    label: 'Tipo 4',
    color: '#58CC02',
    description: 'Salsicha ou cobra, lisa e macia. Ideal!',
  },
  {
    type: 5,
    label: 'Tipo 5',
    color: '#FFC800',
    description: 'Blobes macios com bordas claras. Falta de fibras.',
  },
  {
    type: 6,
    label: 'Tipo 6',
    color: '#FF9600',
    description: 'Pedaços fofos com bordas irregulares. Diarreia leve.',
  },
  {
    type: 7,
    label: 'Tipo 7',
    color: '#FF4B4B',
    description: 'Aquoso, sem pedaços sólidos. Diarreia severa.',
  },
]

export function BowelWidget() {
  const { digestionLogs, addDigestionLog, deleteDigestionLog } = useAppStore()
  const today = new Date().toISOString().split('T')[0]
  const todayLogs = digestionLogs
    .filter((l) => l.date === today)
    .sort((a, b) => b.timestamp.localeCompare(a.timestamp))
  const [helpOpen, setHelpOpen] = useState(false)

  const selectType = (type: BowelType) => {
    addDigestionLog(today, type, '')
  }

  return (
    <div className="bg-card border-2 border-b-4 border-[#E5E5E5] dark:border-[#3B4A55] rounded-3xl p-6 shadow-sm flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <div className="w-10 h-10 rounded-2xl bg-[#FF9600]/15 flex items-center justify-center">
          <span className="text-xl">🚽</span>
        </div>
        <h3 className="text-lg font-extrabold">Digestão</h3>
        <Dialog open={helpOpen} onOpenChange={setHelpOpen}>
          <DialogTrigger asChild>
            <button className="ml-auto w-7 h-7 rounded-full bg-muted/50 flex items-center justify-center hover:bg-muted transition-colors">
              <HelpCircle className="w-4 h-4 text-muted-foreground" strokeWidth={2.5} />
            </button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[420px] rounded-3xl">
            <DialogHeader>
              <DialogTitle className="text-xl font-extrabold">Escala de Bristol</DialogTitle>
            </DialogHeader>
            <div className="space-y-3 mt-2 max-h-[60vh] overflow-y-auto">
              {BRISTOL_TYPES.map((item) => (
                <div key={item.type} className="flex items-start gap-3 p-3 rounded-2xl bg-muted/40">
                  <span
                    className="w-8 h-8 rounded-full shrink-0 mt-0.5"
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
        Selecione o tipo do dia — toque para registrar
      </p>

      <div className="flex gap-2 overflow-x-auto pb-2">
        {BRISTOL_TYPES.map((item) => (
          <button
            key={item.type}
            onClick={() => selectType(item.type)}
            className={cn(
              'flex flex-col items-center gap-1.5 px-3 py-3 rounded-2xl border-2 border-b-4 transition-all duration-150 active:translate-y-1 active:border-b-0 min-w-[68px] hover:bg-muted/30',
            )}
            style={{ borderColor: item.color, borderBottomColor: item.color }}
          >
            <span className="w-8 h-8 rounded-full" style={{ backgroundColor: item.color }} />
            <span className="text-[10px] font-extrabold text-muted-foreground">{item.label}</span>
          </button>
        ))}
      </div>

      {todayLogs.length > 0 && (
        <div className="space-y-2 mt-1">
          {todayLogs.map((log) => {
            const item = BRISTOL_TYPES.find((b) => b.type === log.bristolType)
            return (
              <div
                key={log.id}
                className="flex items-center justify-between bg-muted/40 rounded-xl px-3 py-2"
              >
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full" style={{ backgroundColor: item?.color }} />
                  <span className="text-sm font-bold">{item?.label}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-muted-foreground">
                    {new Date(log.timestamp).toLocaleTimeString('pt-BR', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                  <button
                    onClick={() => deleteDigestionLog(log.id)}
                    className="p-1 hover:bg-[#FF4B4B]/10 hover:text-[#FF4B4B] rounded-full transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" strokeWidth={2.5} />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
