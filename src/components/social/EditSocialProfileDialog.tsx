import { useState, useEffect, useRef } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { PublicProfile, uploadSocialImage, checkUsernameAvailability } from '@/services/social'
import { useSocialStore } from '@/stores/useSocialStore'
import { Camera, Check, X, Loader2, Sparkles } from 'lucide-react'
import { toast } from 'sonner'

interface EditSocialProfileDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  profile: PublicProfile
}

export function EditSocialProfileDialog({
  open,
  onOpenChange,
  profile,
}: EditSocialProfileDialogProps) {
  const { updateProfileDetails } = useSocialStore()

  const [displayName, setDisplayName] = useState(profile.display_name || '')
  const [username, setUsername] = useState(profile.username || '')
  const [bio, setBio] = useState(profile.bio || '')
  const [phrase, setPhrase] = useState(profile.motivational_phrase || '')
  const [avatarUrl, setAvatarUrl] = useState(profile.avatar_url || '')
  const [bannerUrl, setBannerUrl] = useState(profile.banner_url || '')

  // Username validation state
  const [usernameStatus, setUsernameStatus] = useState<
    'idle' | 'checking' | 'available' | 'taken' | 'invalid'
  >('idle')
  const [usernameMessage, setUsernameMessage] = useState('')

  // Upload states
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [uploadingBanner, setUploadingBanner] = useState(false)
  const [saving, setSaving] = useState(false)

  const avatarInputRef = useRef<HTMLInputElement>(null)
  const bannerInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open) {
      setDisplayName(profile.display_name || '')
      setUsername(profile.username || '')
      setBio(profile.bio || '')
      setPhrase(profile.motivational_phrase || '')
      setAvatarUrl(profile.avatar_url || '')
      setBannerUrl(profile.banner_url || '')
      setUsernameStatus('idle')
      setUsernameMessage('')
    }
  }, [open, profile])

  // Debounce username validation
  useEffect(() => {
    const clean = username.trim().toLowerCase()
    if (!clean) {
      setUsernameStatus('idle')
      setUsernameMessage('')
      return
    }

    if (clean === profile.username?.toLowerCase()) {
      setUsernameStatus('available')
      setUsernameMessage('Seu @ atual')
      return
    }

    if (clean.length < 3) {
      setUsernameStatus('invalid')
      setUsernameMessage('Mínimo de 3 caracteres')
      return
    }

    if (clean.length > 24) {
      setUsernameStatus('invalid')
      setUsernameMessage('Máximo de 24 caracteres')
      return
    }

    if (!/^[a-z0-9._]+$/.test(clean)) {
      setUsernameStatus('invalid')
      setUsernameMessage('Apenas letras minúsculas, números, ponto e underline')
      return
    }

    setUsernameStatus('checking')
    const timer = setTimeout(async () => {
      try {
        const available = await checkUsernameAvailability(clean, profile.id)
        if (available) {
          setUsernameStatus('available')
          setUsernameMessage('@ disponível!')
        } else {
          setUsernameStatus('taken')
          setUsernameMessage('@ já está em uso')
        }
      } catch {
        setUsernameStatus('idle')
      }
    }, 400)

    return () => clearTimeout(timer)
  }, [username, profile.id, profile.username])

  const handleAvatarFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadingAvatar(true)
    try {
      const url = await uploadSocialImage(file, 'avatars', profile.id)
      setAvatarUrl(url)
      toast.success('Foto de perfil carregada!')
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro ao enviar avatar'
      toast.error(msg)
    } finally {
      setUploadingAvatar(false)
    }
  }

  const handleBannerFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadingBanner(true)
    try {
      const url = await uploadSocialImage(file, 'banners', profile.id)
      setBannerUrl(url)
      toast.success('Capa do perfil carregada!')
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro ao enviar capa'
      toast.error(msg)
    } finally {
      setUploadingBanner(false)
    }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    const cleanUsername = username.trim().toLowerCase()

    if (!cleanUsername || usernameStatus === 'taken' || usernameStatus === 'invalid') {
      toast.error('Escolha um @ válido e disponível.')
      return
    }

    setSaving(true)
    const success = await updateProfileDetails(profile.id, {
      display_name: displayName.trim() || undefined,
      username: cleanUsername,
      bio: bio.trim() || undefined,
      motivational_phrase: phrase.trim() || undefined,
      avatar_url: avatarUrl || undefined,
      banner_url: bannerUrl || undefined,
    })

    setSaving(false)
    if (success) {
      onOpenChange(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px] rounded-3xl p-0 overflow-hidden border-2 max-h-[90vh] flex flex-col">
        <DialogHeader className="p-5 pb-3 border-b bg-card">
          <DialogTitle className="text-xl font-black tracking-tight flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-[#58CC02]" />
            Editar Perfil Social
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSave} className="overflow-y-auto p-5 space-y-5 flex-1">
          {/* Banner & Avatar Pickers */}
          <div className="space-y-3">
            <Label className="text-xs font-black uppercase text-muted-foreground">
              Capa e Avatar
            </Label>
            <div className="relative rounded-2xl overflow-hidden border-2 bg-muted/40">
              {/* Cover Banner Preview */}
              <div
                onClick={() => bannerInputRef.current?.click()}
                className="h-28 w-full cursor-pointer relative group flex items-center justify-center overflow-hidden bg-gradient-to-r from-[#58CC02]/30 via-[#1CB0F6]/30 to-[#CE82FF]/30"
              >
                {bannerUrl ? (
                  <img
                    src={bannerUrl}
                    alt="Banner"
                    className="w-full h-full object-cover group-hover:opacity-80 transition-opacity"
                  />
                ) : (
                  <div className="text-xs font-bold text-muted-foreground group-hover:text-foreground flex items-center gap-1.5">
                    <Camera className="w-4 h-4" /> Alterar Capa (16:9)
                  </div>
                )}
                {uploadingBanner && (
                  <div className="absolute inset-0 bg-background/70 flex items-center justify-center">
                    <Loader2 className="w-6 h-6 animate-spin text-[#1CB0F6]" />
                  </div>
                )}
                <div className="absolute bottom-2 right-2 bg-black/60 text-white rounded-full p-1.5 text-xs opacity-0 group-hover:opacity-100 transition-opacity">
                  <Camera className="w-3.5 h-3.5" />
                </div>
              </div>

              {/* Avatar Preview */}
              <div className="px-4 pb-3 flex items-end justify-between -mt-10">
                <div
                  onClick={() => avatarInputRef.current?.click()}
                  className="w-20 h-20 rounded-full border-4 border-card bg-card overflow-hidden shadow-md cursor-pointer relative group"
                >
                  {avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt="Avatar"
                      className="w-full h-full object-cover group-hover:opacity-80 transition-opacity"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-[#58CC02]/20 text-[#58CC02] font-black text-2xl">
                      {(displayName || username || 'U').charAt(0).toUpperCase()}
                    </div>
                  )}
                  {uploadingAvatar ? (
                    <div className="absolute inset-0 bg-background/70 flex items-center justify-center">
                      <Loader2 className="w-5 h-5 animate-spin text-[#58CC02]" />
                    </div>
                  ) : (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-white">
                      <Camera className="w-4 h-4" />
                    </div>
                  )}
                </div>

                <div className="text-[11px] text-muted-foreground font-semibold">
                  Toque na capa ou avatar para trocar
                </div>
              </div>
            </div>

            {/* Hidden file inputs */}
            <input
              ref={avatarInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="hidden"
              onChange={handleAvatarFile}
            />
            <input
              ref={bannerInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="hidden"
              onChange={handleBannerFile}
            />
          </div>

          {/* Nome */}
          <div className="space-y-1.5">
            <Label className="text-xs font-black uppercase text-muted-foreground">
              Nome de Exibição
            </Label>
            <Input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Seu nome"
              className="rounded-2xl h-11 font-bold border-2"
              maxLength={50}
            />
          </div>

          {/* @Username com validação em tempo real */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-black uppercase text-muted-foreground">
                Nome de Usuário (@)
              </Label>
              {usernameMessage && (
                <span
                  className={`text-[11px] font-bold flex items-center gap-1 ${
                    usernameStatus === 'available'
                      ? 'text-[#58CC02]'
                      : usernameStatus === 'checking'
                        ? 'text-muted-foreground'
                        : 'text-[#FF4B4B]'
                  }`}
                >
                  {usernameStatus === 'checking' && <Loader2 className="w-3 h-3 animate-spin" />}
                  {usernameStatus === 'available' && <Check className="w-3 h-3 text-[#58CC02]" />}
                  {(usernameStatus === 'taken' || usernameStatus === 'invalid') && (
                    <X className="w-3 h-3 text-[#FF4B4B]" />
                  )}
                  {usernameMessage}
                </span>
              )}
            </div>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-black text-[#1CB0F6]">
                @
              </span>
              <Input
                value={username}
                onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/\s+/g, ''))}
                placeholder="seu.usuario"
                className={`rounded-2xl h-11 font-bold pl-8 border-2 transition-colors ${
                  usernameStatus === 'available'
                    ? 'border-[#58CC02] focus-visible:ring-[#58CC02]'
                    : usernameStatus === 'taken' || usernameStatus === 'invalid'
                      ? 'border-[#FF4B4B] focus-visible:ring-[#FF4B4B]'
                      : ''
                }`}
                maxLength={24}
              />
            </div>
          </div>

          {/* Frase motivadora */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <Label className="text-xs font-black uppercase text-muted-foreground">
                Frase Motivadora (Subtítulo)
              </Label>
              <span className="text-[10px] text-muted-foreground font-semibold">
                {phrase.length}/120
              </span>
            </div>
            <Input
              value={phrase}
              onChange={(e) => setPhrase(e.target.value)}
              placeholder="Ex: Foco no progresso diário ✨"
              className="rounded-2xl h-11 font-semibold italic border-2"
              maxLength={120}
            />
          </div>

          {/* Bio */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <Label className="text-xs font-black uppercase text-muted-foreground">
                Biografia
              </Label>
              <span className="text-[10px] text-muted-foreground font-semibold">
                {bio.length}/160
              </span>
            </div>
            <Textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Compartilhe seus interesses e metas..."
              className="rounded-2xl border-2 font-medium resize-none min-h-[80px]"
              maxLength={160}
              rows={3}
            />
          </div>

          {/* Actions */}
          <div className="pt-2 flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1 rounded-2xl h-12 font-bold border-2"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={
                saving ||
                uploadingAvatar ||
                uploadingBanner ||
                usernameStatus === 'taken' ||
                usernameStatus === 'invalid' ||
                usernameStatus === 'checking'
              }
              className="flex-1 rounded-2xl h-12 font-black bg-[#58CC02] hover:bg-[#58CC02]/90 border-b-4 border-[#46A302] active:translate-y-0.5 active:border-b-0 text-white shadow-sm"
            >
              {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Salvar Alterações'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
