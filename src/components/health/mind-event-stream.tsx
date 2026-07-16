import { useState } from 'react'
import { useAppStore } from '@/stores/useAppStore'
import { Trash2, Zap } from 'lucide-react'

export function MindEventStream({ dateStr }: { dateStr: string }) {
  const { mindEvents, addMindEvent, deleteMindEvent } = useAppStore()
  const [text, setText] = useState('')

  const dayEvents = mindEvents.filter((e) => e.date === dateStr)

  const handleAdd = () => {
    if (!text.trim()) return
    addMindEvent(text.trim())
    setText('')
  }

  return (
    <div className="bg-card border-2 border-b-4 border-[#E5E5E5] dark:border-[#3B4A55] rounded-3xl p-6 shadow-sm space-y-4">
      <div className="flex items-center gap-2">
        <div className="w-10 h-10 rounded-2xl bg-[#58CC02]/15 flex items-center justify-center">
          <Zap className="w-5 h-5 text-[#58CC02]" />
        </div>
        <div>
          <h3 className="text-lg font-extrabold">O que aconteceu?</h3>
          <p className="text-xs text-muted-foreground font-semibold">
            Registre eventos e gatilhos do dia
          </p>
        </div>
      </div>

      <div className="flex gap-2">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
          placeholder="O que aconteceu hoje?"
          className="flex-1 px-4 py-3 rounded-2xl bg-muted/50 border-transparent font-semibold text-sm focus:outline-none focus:ring-2 focus:ring-[#58CC02]/30"
        />
        <button
          onClick={handleAdd}
          className="px-4 py-3 rounded-2xl bg-[#58CC02] text-white font-extrabold border-b-4 border-[#46A302] active:translate-y-1 active:border-b-0 transition-all duration-150 whitespace-nowrap text-sm"
        >
          ⚡ Registrar
        </button>
      </div>

      {dayEvents.length > 0 && (
        <div className="space-y-2">
          {dayEvents.map((event) => (
            <div
              key={event.id}
              className="flex items-start gap-3 bg-muted/40 rounded-xl px-3 py-2.5 animate-fade-in-up"
            >
              <span className="text-sm flex-1 font-semibold">{event.description}</span>
              <span className="text-[10px] text-muted-foreground font-bold shrink-0">
                {new Date(event.createdAt).toLocaleTimeString('pt-BR', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
              <button
                onClick={() => deleteMindEvent(event.id)}
                className="p-1 hover:bg-[#FF4B4B]/10 hover:text-[#FF4B4B] rounded-full transition-colors shrink-0"
              >
                <Trash2 className="w-3.5 h-3.5" strokeWidth={2.5} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
