import { useState, useEffect } from 'react'
import { useAppStore } from '@/stores/useAppStore'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

const PAGE_SIZE = 5

export function JiuTrainingLog() {
  const jiuLogs = useAppStore((s) => s.jiuLogs)
  const fetchJiuLogs = useAppStore((s) => s.fetchJiuLogs)
  const addJiuLog = useAppStore((s) => s.addJiuLog)
  const deleteJiuLog = useAppStore((s) => s.deleteJiuLog)
  const [modalOpen, setModalOpen] = useState(false)
  const [page, setPage] = useState(0)
  const [duration, setDuration] = useState('')
  const [rounds, setRounds] = useState('')
  const [notes, setNotes] = useState('')

  useEffect(() => {
    fetchJiuLogs()
  }, [fetchJiuLogs])

  const totalPages = Math.ceil(jiuLogs.length / PAGE_SIZE)
  const pageLogs = jiuLogs.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)

  const handleSubmit = () => {
    const dur = parseInt(duration) || 0
    const rnd = parseInt(rounds) || 0
    if (dur <= 0) return
    addJiuLog({ durationMinutes: dur, sparringRounds: rnd, notes: notes.trim() })
    setModalOpen(false)
    setDuration('')
    setRounds('')
    setNotes('')
    toast.success('Mais um dia de sobrevivência no tatame! Oss! 🥋')
  }

  return (
    <div className="space-y-4">
      {pageLogs.length > 0 ? (
        pageLogs.map((log) => (
          <div
            key={log.id}
            className="bg-card rounded-3xl p-5 border-2 border-b-4 border-[#E5E5E5] dark:border-[#3B4A55]"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="font-extrabold text-lg">
                  {new Date(log.date + 'T12:00:00').toLocaleDateString('pt-BR', {
                    day: '2-digit',
                    month: 'long',
                  })}
                </p>
                <div className="flex gap-4 mt-2 text-sm">
                  <span className="font-bold text-[#1CB0F6]">⏱ {log.durationMinutes} min</span>
                  <span className="font-bold text-[#58CC02]">🤼 {log.sparringRounds} rolas</span>
                </div>
              </div>
              <button
                onClick={() => deleteJiuLog(log.id)}
                className="text-muted-foreground hover:text-red-500 text-sm"
              >
                ✕
              </button>
            </div>
            {log.notes && <p className="mt-3 text-sm text-muted-foreground">{log.notes}</p>}
          </div>
        ))
      ) : (
        <div className="text-center py-12 text-muted-foreground">
          <p className="text-5xl mb-3">📝</p>
          <p className="font-bold">Nenhum treino registrado ainda</p>
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex justify-center gap-3 items-center">
          <button
            onClick={() => setPage(Math.max(0, page - 1))}
            disabled={page === 0}
            className={cn(
              'px-5 py-2.5 rounded-2xl font-extrabold border-b-4 transition-all',
              page === 0
                ? 'bg-muted text-muted-foreground/50 border-transparent'
                : 'bg-[#1CB0F6] text-white border-[#1899D6] active:translate-y-1 active:border-b-0',
            )}
          >
            Anterior
          </button>
          <span className="px-4 py-2.5 font-bold text-muted-foreground">
            {page + 1} / {totalPages}
          </span>
          <button
            onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
            disabled={page === totalPages - 1}
            className={cn(
              'px-5 py-2.5 rounded-2xl font-extrabold border-b-4 transition-all',
              page === totalPages - 1
                ? 'bg-muted text-muted-foreground/50 border-transparent'
                : 'bg-[#1CB0F6] text-white border-[#1899D6] active:translate-y-1 active:border-b-0',
            )}
          >
            Próxima
          </button>
        </div>
      )}

      <button
        onClick={() => setModalOpen(true)}
        className="fixed bottom-24 right-6 z-30 w-14 h-14 rounded-full bg-[#58CC02] text-white text-2xl font-bold border-b-4 border-[#46A302] active:translate-y-1 active:border-b-0 transition-all shadow-lg"
      >
        +
      </button>

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-sm rounded-3xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-extrabold">Registrar Treino</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-sm font-extrabold">Duração (min)</Label>
                <Input
                  type="number"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  placeholder="90"
                  className="rounded-xl font-bold text-center text-lg"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-extrabold">Rolas</Label>
                <Input
                  type="number"
                  value={rounds}
                  onChange={(e) => setRounds(e.target.value)}
                  placeholder="5"
                  className="rounded-xl font-bold text-center text-lg"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-extrabold">Notas</Label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Como foi o treino?"
                className="rounded-xl min-h-[100px]"
              />
            </div>
            <Button
              onClick={handleSubmit}
              className="w-full py-6 rounded-3xl bg-[#58CC02] hover:bg-[#46A302] text-white font-extrabold border-b-4 border-[#46A302] active:translate-y-1 active:border-b-0 transition-all"
            >
              Salvar Treino
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
