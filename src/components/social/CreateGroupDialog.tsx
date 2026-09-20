import { useState, useRef } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { useSocialStore } from '@/stores/useSocialStore'
import { useAuth } from '@/hooks/use-auth'
import { Users, Lock, Globe, ImagePlus, X, Loader2, Sparkles } from 'lucide-react'
import { toast } from 'sonner'

interface CreateGroupDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: (groupId: string) => void
}

export function CreateGroupDialog({ open, onOpenChange, onSuccess }: CreateGroupDialogProps) {
  const { user } = useAuth()
  const { createNewGroup } = useSocialStore()

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [isClosed, setIsClosed] = useState(false)
  const [coverFile, setCoverFile] = useState<File | null>(null)
  const [coverPreview, setCoverPreview] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleCoverSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 5 * 1024 * 1024) {
      toast.error('A imagem de capa deve ter no máximo 5MB.')
      return
    }

    setCoverFile(file)
    const reader = new FileReader()
    reader.onload = (ev) => {
      setCoverPreview(ev.target?.result as string)
    }
    reader.readAsDataURL(file)
  }

  const handleRemoveCover = () => {
    setCoverFile(null)
    setCoverPreview(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    const trimmedName = name.trim()
    if (!trimmedName) {
      toast.error('Informe o nome do grupo.')
      return
    }
    if (trimmedName.length > 60) {
      toast.error('O nome do grupo pode ter no máximo 60 caracteres.')
      return
    }

    setSubmitting(true)
    try {
      const created = await createNewGroup(user.id, {
        name: trimmedName,
        description: description.trim() || undefined,
        coverFile,
        isClosed,
      })

      if (created) {
        setName('')
        setDescription('')
        setIsClosed(false)
        handleRemoveCover()
        onOpenChange(false)
        if (onSuccess) onSuccess(created.id)
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-3xl border-2 sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader className="text-left space-y-1">
          <div className="w-12 h-12 rounded-2xl bg-[#58CC02]/15 text-[#58CC02] border-2 border-[#58CC02]/30 flex items-center justify-center mb-1">
            <Users className="w-6 h-6" />
          </div>
          <DialogTitle className="text-xl font-black text-foreground">Criar Novo Grupo</DialogTitle>
          <DialogDescription className="text-xs font-semibold text-muted-foreground">
            Crie um espaço para compartilhar lembretes e fotos com foco e comunidade.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          {/* Nome do grupo */}
          <div className="space-y-1.5">
            <Label className="text-xs font-black text-foreground flex items-center justify-between">
              <span>Nome do grupo *</span>
              <span className="text-[10px] text-muted-foreground font-semibold">
                {name.length}/60
              </span>
            </Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Foco nos Estudos & Hábitos 🎯"
              maxLength={60}
              className="rounded-2xl h-11 border-2 font-bold text-xs sm:text-sm"
              required
            />
          </div>

          {/* Descrição */}
          <div className="space-y-1.5">
            <Label className="text-xs font-black text-foreground flex items-center justify-between">
              <span>Descrição (opcional)</span>
              <span className="text-[10px] text-muted-foreground font-semibold">
                {description.length}/300
              </span>
            </Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Compartilhe o propósito ou as regras da sua comunidade..."
              maxLength={300}
              className="rounded-2xl border-2 font-medium text-xs sm:text-sm min-h-[70px] resize-none"
            />
          </div>

          {/* Imagem de Capa */}
          <div className="space-y-1.5">
            <Label className="text-xs font-black text-foreground">Capa do grupo (opcional)</Label>
            {coverPreview ? (
              <div className="relative rounded-2xl overflow-hidden border-2 h-28 bg-muted">
                <img src={coverPreview} alt="Capa" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={handleRemoveCover}
                  className="absolute top-2 right-2 p-1.5 bg-black/75 hover:bg-black text-white rounded-full transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-border/80 hover:border-[#58CC02] rounded-2xl p-4 text-center cursor-pointer transition-colors bg-muted/20 hover:bg-[#58CC02]/5 flex items-center justify-center gap-3"
              >
                <div className="w-9 h-9 rounded-xl bg-[#58CC02]/15 text-[#58CC02] flex items-center justify-center shrink-0">
                  <ImagePlus className="w-4 h-4" />
                </div>
                <div className="text-left">
                  <p className="text-xs font-bold text-foreground">Escolher imagem de capa</p>
                  <p className="text-[10px] text-muted-foreground font-semibold">
                    JPG, PNG ou WEBP até 5MB
                  </p>
                </div>
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="hidden"
              onChange={handleCoverSelect}
            />
          </div>

          {/* Toggle Aberto vs Fechado com Duolingo Style */}
          <div className="rounded-2xl border-2 p-3.5 bg-muted/30 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {isClosed ? (
                  <span className="p-1.5 rounded-xl bg-amber-500/15 text-amber-500 border border-amber-500/30">
                    <Lock className="w-4 h-4" />
                  </span>
                ) : (
                  <span className="p-1.5 rounded-xl bg-[#1CB0F6]/15 text-[#1CB0F6] border border-[#1CB0F6]/30">
                    <Globe className="w-4 h-4" />
                  </span>
                )}
                <div>
                  <div className="text-xs font-black text-foreground">
                    {isClosed ? 'Grupo Fechado' : 'Grupo Aberto'}
                  </div>
                  <div className="text-[11px] font-semibold text-muted-foreground">
                    {isClosed
                      ? 'No grupo fechado, você aprova quem entra'
                      : 'Qualquer pessoa pode entrar e participar'}
                  </div>
                </div>
              </div>
              <Switch
                checked={isClosed}
                onCheckedChange={setIsClosed}
                className="data-[state=checked]:bg-[#58CC02]"
              />
            </div>
          </div>

          <DialogFooter className="pt-2 flex-col sm:flex-row gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={submitting}
              onClick={() => onOpenChange(false)}
              className="rounded-2xl border-2 font-bold h-11 text-xs cursor-pointer flex-1"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={submitting || !name.trim()}
              className="rounded-2xl font-black h-11 text-xs bg-[#58CC02] hover:bg-[#58CC02]/90 border-b-4 border-[#46A302] text-white active:translate-y-0.5 active:border-b-0 cursor-pointer flex-1"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  <span>Criando...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-1.5" />
                  <span>Criar Grupo</span>
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
