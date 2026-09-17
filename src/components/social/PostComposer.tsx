import { useState, useRef } from 'react'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { useSocialStore } from '@/stores/useSocialStore'
import { useAuth } from '@/hooks/use-auth'
import { MessageSquare, Camera, Sparkles, X, Loader2, ImagePlus } from 'lucide-react'
import { toast } from 'sonner'

export function PostComposer() {
  const { user } = useAuth()
  const { publishPost, posting, myProfile } = useSocialStore()

  const [mode, setMode] = useState<'reminder' | 'photo'>('reminder')
  const [content, setContent] = useState('')
  const [selectedImage, setSelectedImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 5 * 1024 * 1024) {
      toast.error('A imagem deve ter no máximo 5MB.')
      return
    }

    setSelectedImage(file)
    const reader = new FileReader()
    reader.onload = (ev) => {
      setImagePreview(ev.target?.result as string)
    }
    reader.readAsDataURL(file)
  }

  const handleRemoveImage = () => {
    setSelectedImage(null)
    setImagePreview(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    if (mode === 'photo' && !selectedImage) {
      toast.error('Escolha uma imagem para publicar.')
      return
    }

    if (mode === 'reminder' && !content.trim()) {
      toast.error('Escreva uma mensagem para seu lembrete.')
      return
    }

    const ok = await publishPost(user.id, mode, content, selectedImage)
    if (ok) {
      setContent('')
      handleRemoveImage()
    }
  }

  return (
    <div className="bg-card rounded-3xl border-2 p-4 sm:p-5 shadow-sm space-y-4">
      {/* Header with mini mode selector */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full overflow-hidden bg-muted border shrink-0">
            {myProfile?.avatar_url ? (
              <img src={myProfile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-[#58CC02]/20 text-[#58CC02] font-black text-xs">
                {(myProfile?.display_name || user?.email || 'U').charAt(0).toUpperCase()}
              </div>
            )}
          </div>
          <span className="text-xs font-black text-foreground">Compartilhe algo</span>
        </div>

        {/* Tab pills */}
        <div className="flex items-center gap-1 bg-muted p-1 rounded-2xl border">
          <button
            type="button"
            onClick={() => setMode('reminder')}
            className={`px-3 py-1 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              mode === 'reminder'
                ? 'bg-[#58CC02] text-white shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            Lembrete
          </button>
          <button
            type="button"
            onClick={() => setMode('photo')}
            className={`px-3 py-1 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              mode === 'photo'
                ? 'bg-[#1CB0F6] text-white shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Camera className="w-3.5 h-3.5" />
            Foto
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        {/* Text Input */}
        <div className="relative">
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={
              mode === 'reminder'
                ? 'Deixe um lembrete para quem te segue 💚'
                : 'Adicione uma legenda para sua foto (opcional)...'
            }
            className="rounded-2xl border-2 font-medium resize-none min-h-[75px] max-h-[140px] text-xs sm:text-sm"
            maxLength={500}
          />
          <span className="absolute bottom-2 right-3 text-[10px] text-muted-foreground font-semibold pointer-events-none">
            {content.length}/500
          </span>
        </div>

        {/* Image upload area for photo mode */}
        {mode === 'photo' && (
          <div>
            {imagePreview ? (
              <div className="relative rounded-2xl overflow-hidden border-2 max-h-60 bg-muted/30">
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="w-full h-full object-cover max-h-60"
                />
                <button
                  type="button"
                  onClick={handleRemoveImage}
                  className="absolute top-2 right-2 p-1.5 bg-black/70 hover:bg-black text-white rounded-full transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-border/80 hover:border-[#1CB0F6] rounded-2xl p-6 text-center cursor-pointer transition-colors bg-muted/20 hover:bg-[#1CB0F6]/5 flex flex-col items-center gap-2"
              >
                <div className="w-10 h-10 rounded-2xl bg-[#1CB0F6]/15 text-[#1CB0F6] flex items-center justify-center">
                  <ImagePlus className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-bold">Toque para escolher uma foto</p>
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
              onChange={handleImageChange}
            />
          </div>
        )}

        {/* Submit Button */}
        <div className="flex justify-end pt-1">
          <Button
            type="submit"
            disabled={
              posting ||
              (mode === 'photo' && !selectedImage) ||
              (mode === 'reminder' && !content.trim())
            }
            className="rounded-2xl px-6 h-11 font-black text-xs bg-[#58CC02] hover:bg-[#58CC02]/90 border-b-4 border-[#46A302] active:translate-y-0.5 active:border-b-0 text-white shadow-sm flex items-center gap-2"
          >
            {posting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Publicando...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Publicar</span>
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}
