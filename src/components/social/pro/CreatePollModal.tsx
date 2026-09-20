import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Plus, Trash2, BarChart2, Loader2, Calendar } from 'lucide-react'
import { useSocialStore } from '@/stores/useSocialStore'
import { useAuth } from '@/hooks/use-auth'

interface CreatePollModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  groupId: string
}

export function CreatePollModal({ open, onOpenChange, groupId }: CreatePollModalProps) {
  const { user } = useAuth()
  const { publishPoll } = useSocialStore()

  const [question, setQuestion] = useState('')
  const [options, setOptions] = useState<string[]>(['', ''])
  const [hasClosesAt, setHasClosesAt] = useState(false)
  const [closesDate, setClosesDate] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleAddOption = () => {
    if (options.length < 6) {
      setOptions([...options, ''])
    }
  }

  const handleRemoveOption = (index: number) => {
    if (options.length > 2) {
      setOptions(options.filter((_, idx) => idx !== index))
    }
  }

  const handleOptionChange = (index: number, val: string) => {
    const updated = [...options]
    updated[index] = val
    setOptions(updated)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    const cleanQuestion = question.trim()
    const cleanOptions = options.map((o) => o.trim()).filter(Boolean)

    if (!cleanQuestion) return
    if (cleanOptions.length < 2) return

    setSubmitting(true)
    try {
      const closesAt = hasClosesAt && closesDate ? new Date(closesDate).toISOString() : null
      const ok = await publishPoll(groupId, user.id, cleanQuestion, cleanOptions, closesAt)
      if (ok) {
        setQuestion('')
        setOptions(['', ''])
        setHasClosesAt(false)
        setClosesDate('')
        onOpenChange(false)
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-3xl border-2 sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="w-12 h-12 rounded-2xl bg-[#1CB0F6]/15 text-[#1CB0F6] flex items-center justify-center mx-auto mb-1">
            <BarChart2 className="w-6 h-6" />
          </div>
          <DialogTitle className="text-center font-black text-lg">
            Nova Pesquisa com Relatório
          </DialogTitle>
          <p className="text-center text-xs text-muted-foreground font-semibold">
            Crie uma enquete para os membros do grupo responderem. Você terá um relatório detalhado
            de quem votou.
          </p>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          {/* Question */}
          <div className="space-y-1.5">
            <Label className="text-xs font-black uppercase tracking-wider text-muted-foreground">
              Pergunta (máx. 300 caracteres)
            </Label>
            <Textarea
              value={question}
              onChange={(e) => setQuestion(e.target.value.slice(0, 300))}
              placeholder="Ex.: Qual tema devemos priorizar no próximo encontro?"
              rows={3}
              required
              className="rounded-2xl border-2 resize-none text-xs sm:text-sm font-semibold"
            />
            <div className="text-[11px] font-bold text-right text-muted-foreground">
              {question.length}/300
            </div>
          </div>

          {/* Options (2-6) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-black uppercase tracking-wider text-muted-foreground">
                Opções de Resposta ({options.length}/6)
              </Label>
              {options.length < 6 && (
                <button
                  type="button"
                  onClick={handleAddOption}
                  className="text-xs font-black text-[#58CC02] hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" /> Adicionar opção
                </button>
              )}
            </div>

            <div className="space-y-2">
              {options.map((opt, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-muted border font-black text-xs flex items-center justify-center text-muted-foreground shrink-0">
                    {idx + 1}
                  </span>
                  <Input
                    value={opt}
                    onChange={(e) => handleOptionChange(idx, e.target.value.slice(0, 140))}
                    placeholder={`Opção ${idx + 1}`}
                    required
                    className="rounded-xl border-2 text-xs sm:text-sm font-medium h-9 flex-1"
                  />
                  {options.length > 2 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveOption(idx)}
                      className="h-8 w-8 text-muted-foreground hover:text-destructive shrink-0 cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Optional closes_at */}
          <div className="space-y-2 pt-1 border-t">
            <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-foreground">
              <input
                type="checkbox"
                checked={hasClosesAt}
                onChange={(e) => setHasClosesAt(e.target.checked)}
                className="w-4 h-4 rounded text-[#1CB0F6] focus:ring-[#1CB0F6]"
              />
              <Calendar className="w-3.5 h-3.5 text-[#1CB0F6]" />
              Definir data/hora de encerramento automático
            </label>

            {hasClosesAt && (
              <Input
                type="datetime-local"
                value={closesDate}
                onChange={(e) => setClosesDate(e.target.value)}
                required={hasClosesAt}
                className="rounded-xl border-2 text-xs h-9 font-semibold"
              />
            )}
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="rounded-2xl border-2 font-bold flex-1"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={
                submitting || !question.trim() || options.filter((o) => o.trim()).length < 2
              }
              className="rounded-2xl font-black bg-[#58CC02] hover:bg-[#58CC02]/90 border-b-4 border-[#46A302] text-white flex-1 cursor-pointer"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-1.5" />
                  Publicando...
                </>
              ) : (
                'Publicar Pesquisa'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
