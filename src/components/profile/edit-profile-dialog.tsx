import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { GameButton } from '@/components/ui/game-button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useAppStore, SocialLink } from '@/stores/useAppStore'
import { Pencil, Plus, X } from 'lucide-react'

const PLATFORMS = ['Instagram', 'Twitter', 'GitHub', 'LinkedIn', 'YouTube', 'Website']

export function EditProfileDialog() {
  const { user, updateUser } = useAppStore()
  const [open, setOpen] = useState(false)
  const [name, setName] = useState(user.name)
  const [handle, setHandle] = useState(user.handle)
  const [bio, setBio] = useState(user.bio)
  const [avatar, setAvatar] = useState(user.avatar)
  const [dailyGoal, setDailyGoal] = useState(user.dailyGoal)
  const [socialLinks, setSocialLinks] = useState<SocialLink[]>(user.socialLinks)
  const [linkPlatform, setLinkPlatform] = useState('Instagram')
  const [linkUrl, setLinkUrl] = useState('')

  useEffect(() => {
    if (open) {
      setName(user.name)
      setHandle(user.handle)
      setBio(user.bio)
      setAvatar(user.avatar)
      setDailyGoal(user.dailyGoal)
      setSocialLinks([...user.socialLinks])
    }
  }, [open, user])

  const addLink = () => {
    if (!linkUrl.trim()) return
    setSocialLinks((prev) => [
      ...prev,
      {
        id: Math.random().toString(36).substring(2, 9),
        platform: linkPlatform,
        url: linkUrl.trim(),
      },
    ])
    setLinkUrl('')
  }

  const removeLink = (id: string) => setSocialLinks((prev) => prev.filter((l) => l.id !== id))

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    const formattedHandle = handle.startsWith('@') ? handle : '@' + handle
    updateUser({ name, handle: formattedHandle, bio, avatar, dailyGoal, socialLinks })
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <GameButton variant="outline" size="md" className="gap-2">
          <Pencil className="w-4 h-4" strokeWidth={2.5} /> Editar Perfil
        </GameButton>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] rounded-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-extrabold">Editar Perfil</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSave} className="space-y-5 mt-4">
          <div className="space-y-2">
            <Label className="font-bold">Nome</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="rounded-2xl bg-muted/50 border-transparent font-semibold"
            />
          </div>
          <div className="space-y-2">
            <Label className="font-bold">Handle</Label>
            <Input
              value={handle}
              onChange={(e) => setHandle(e.target.value)}
              placeholder="@usuario"
              className="rounded-2xl bg-muted/50 border-transparent font-semibold"
            />
          </div>
          <div className="space-y-2">
            <Label className="font-bold">Bio</Label>
            <Textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Conte sobre você..."
              className="rounded-2xl bg-muted/50 border-transparent font-semibold resize-none"
              rows={3}
            />
          </div>
          <div className="space-y-2">
            <Label className="font-bold">URL do Avatar</Label>
            <Input
              value={avatar}
              onChange={(e) => setAvatar(e.target.value)}
              placeholder="https://..."
              className="rounded-2xl bg-muted/50 border-transparent font-semibold"
            />
          </div>
          <div className="space-y-2">
            <Label className="font-bold">Meta de Tarefas Diárias</Label>
            <Input
              type="number"
              min="1"
              max="50"
              value={dailyGoal}
              onChange={(e) => setDailyGoal(parseInt(e.target.value) || 1)}
              className="rounded-2xl bg-muted/50 border-transparent font-semibold"
            />
          </div>
          <div className="space-y-2">
            <Label className="font-bold">Links Sociais</Label>
            {socialLinks.map((link) => (
              <div key={link.id} className="flex items-center gap-2 p-2.5 rounded-2xl bg-muted/50">
                <span className="flex-1 text-sm font-semibold truncate">
                  {link.platform}: {link.url}
                </span>
                <button
                  type="button"
                  onClick={() => removeLink(link.id)}
                  className="text-muted-foreground hover:text-[#FF4B4B] transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
            <div className="flex gap-2">
              <Select value={linkPlatform} onValueChange={setLinkPlatform}>
                <SelectTrigger className="rounded-2xl bg-muted/50 border-transparent font-semibold w-[130px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PLATFORMS.map((p) => (
                    <SelectItem key={p} value={p}>
                      {p}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    addLink()
                  }
                }}
                placeholder="https://..."
                className="rounded-2xl bg-muted/50 border-transparent font-semibold"
              />
              <button
                type="button"
                onClick={addLink}
                className="shrink-0 w-10 h-10 rounded-2xl bg-[#1CB0F6] text-white flex items-center justify-center border-2 border-b-4 border-[#0E8FCF] active:translate-y-1 active:border-b-0 transition-all"
              >
                <Plus className="w-5 h-5" strokeWidth={2.5} />
              </button>
            </div>
          </div>
          <GameButton type="submit" variant="primary" size="lg" className="w-full">
            Salvar
          </GameButton>
        </form>
      </DialogContent>
    </Dialog>
  )
}
