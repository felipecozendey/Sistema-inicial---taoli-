import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { useProfessionalStore, ClinicalNote } from '@/stores/useProfessionalStore'
import { FileText, HelpCircle, Users2, Lock, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

interface ClinicalNoteModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  patientId: string
  patientName?: string
  editNote?: ClinicalNote | null
  onSuccess?: () => void
}

export function ClinicalNoteModal({
  open,
  onOpenChange,
  patientId,
  patientName = 'Paciente',
  editNote = null,
  onSuccess,
}: ClinicalNoteModalProps) {
  const { createClinicalNote, updateClinicalNote } = useProfessionalStore()

  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [isMultidisciplinary, setIsMultidisciplinary] = useState(false)
  const [saving, setSaving] = useState(false)
  const [infoOpen, setInfoOpen] = useState(false)

  useEffect(() => {
    if (open) {
      if (editNote) {
        setTitle(editNote.title || '')
        setContent(editNote.content || '')
        setIsMultidisciplinary(Boolean(editNote.is_multidisciplinary))
      } else {
        setTitle('')
        setContent('')
        setIsMultidisciplinary(false)
      }
      setInfoOpen(false)
    }
  }, [open, editNote])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!content.trim()) {
      toast.error('Digite o registro de prontuário.')
      return
    }

    setSaving(true)
    let ok = false

    if (editNote) {
      ok = await updateClinicalNote(editNote.id, content.trim(), {
        title: title.trim() ? title.trim() : null,
        is_multidisciplinary: isMultidisciplinary,
      })
    } else {
      ok = await createClinicalNote({
        patient_id: patientId,
        title: title.trim() ? title.trim() : null,
        content: content.trim(),
        is_multidisciplinary: isMultidisciplinary,
      })
    }

    setSaving(false)

    if (ok) {
      onOpenChange(false)
      onSuccess?.()
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] max-w-lg rounded-3xl border-2 p-5 sm:p-6 shadow-2xl overflow-y-auto max-h-[92vh]">
        <DialogHeader className="text-left space-y-1.5">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-[#58CC02]/15 text-[#58CC02] flex items-center justify-center shrink-0">
              <FileText className="w-6 h-6" />
            </div>
            <div className="min-w-0 flex-1">
              <DialogTitle className="text-base sm:text-lg font-black text-foreground">
                {editNote ? 'Editar Entrada de Prontuário' : 'Nova Entrada de Prontuário'}
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground truncate">
                Paciente: <strong className="text-foreground">{patientName}</strong>
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {/* Título opcional */}
          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-foreground">
              Título da entrada{' '}
              <span className="text-[11px] font-normal text-muted-foreground">(opcional)</span>
            </Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex.: Evolução pós-consulta, ajuste de conduta..."
              maxLength={120}
              className="rounded-2xl border-2 text-xs font-semibold h-11"
              disabled={saving}
            />
          </div>

          {/* Textarea livre em texto corrido (estilo bloco de notas) */}
          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-foreground">Registro clínico *</Label>
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Registro de prontuário: queixas, evolução, conduta, observações..."
              rows={7}
              required
              className="rounded-2xl border-2 text-xs font-mono sm:font-sans leading-relaxed resize-y min-h-[140px] focus:ring-2 focus:ring-[#58CC02]"
              disabled={saving}
            />
          </div>

          {/* Checkbox Multidisciplinar com ? clicável e pop-over sem estourar 360px */}
          <div className="p-3 rounded-2xl border-2 bg-muted/30 flex items-start gap-2.5">
            <Checkbox
              id="multi-note-check"
              checked={isMultidisciplinary}
              onCheckedChange={(c) => setIsMultidisciplinary(Boolean(c))}
              disabled={saving}
              className="mt-0.5 data-[state=checked]:bg-[#58CC02] data-[state=checked]:border-[#58CC02]"
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <label
                  htmlFor="multi-note-check"
                  className="text-xs font-extrabold text-foreground cursor-pointer select-none"
                >
                  Entrada multidisciplinar
                </label>

                {/* Popover explicativo do '?' */}
                <Popover open={infoOpen} onOpenChange={setInfoOpen}>
                  <PopoverTrigger asChild>
                    <button
                      type="button"
                      aria-label="Ajuda sobre entrada multidisciplinar"
                      className="p-0.5 rounded-full text-muted-foreground hover:text-[#1CB0F6] hover:bg-muted focus:outline-none focus:ring-2 focus:ring-[#1CB0F6] transition-colors inline-flex items-center justify-center cursor-pointer"
                    >
                      <HelpCircle className="w-3.5 h-3.5" />
                    </button>
                  </PopoverTrigger>
                  <PopoverContent
                    side="top"
                    align="center"
                    sideOffset={6}
                    collisionPadding={12}
                    className="w-[min(calc(100vw-32px),320px)] max-w-xs p-3.5 rounded-2xl border-2 bg-popover text-foreground text-xs shadow-2xl leading-relaxed z-50 animate-in fade-in-50 zoom-in-95"
                  >
                    <p className="font-medium text-foreground">
                      Se marcado, esta entrada poderá ser vista por outros profissionais de saúde
                      que atendem este paciente, permitindo um atendimento multidisciplinar mais
                      claro. Se desmarcada, apenas você, que criou a nota, poderá vê-la.
                    </p>
                  </PopoverContent>
                </Popover>
              </div>

              <div className="text-[11px] text-muted-foreground mt-0.5 flex items-center gap-1">
                {isMultidisciplinary ? (
                  <span className="text-[#58CC02] font-bold flex items-center gap-1">
                    <Users2 className="w-3 h-3" /> Visível para a equipe multidisciplinar
                  </span>
                ) : (
                  <span className="text-muted-foreground flex items-center gap-1">
                    <Lock className="w-3 h-3" /> Privada (somente você tem acesso)
                  </span>
                )}
              </div>
            </div>
          </div>

          <DialogFooter className="pt-2 gap-2 flex-col-reverse sm:flex-row">
            <Button
              type="button"
              variant="outline"
              disabled={saving}
              onClick={() => onOpenChange(false)}
              className="rounded-2xl h-11 font-bold text-xs w-full sm:w-auto"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={saving || !content.trim()}
              className="rounded-2xl h-11 px-5 font-black text-xs bg-[#58CC02] hover:bg-[#46a302] text-white border-b-4 border-[#3c8c02] active:border-b-0 active:translate-y-1 transition-all shadow-md w-full sm:w-auto flex items-center justify-center gap-2"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Salvando...</span>
                </>
              ) : (
                <span>{editNote ? 'Salvar Alterações' : 'Salvar Entrada'}</span>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
