import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useFinanceStore } from '@/stores/useFinanceStore'
import { toast } from 'sonner'
import { RefreshCw } from 'lucide-react'

const PASSWORD_CATEGORIES = ['Trabalho', 'Pessoal', 'Financeiro', 'Social', 'Outros']

function generatePassword(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*'
  let result = ''
  for (let i = 0; i < 12; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

interface PasswordModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function PasswordModal({ open, onOpenChange }: PasswordModalProps) {
  const addPassword = useFinanceStore((s) => s.addPassword)
  const [title, setTitle] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [url, setUrl] = useState('')
  const [category, setCategory] = useState('Outros')

  useEffect(() => {
    if (!open) {
      setTitle('')
      setUsername('')
      setPassword('')
      setUrl('')
      setCategory('Outros')
    }
  }, [open])

  const handleSubmit = () => {
    if (!title.trim()) {
      toast.error('Digite um título')
      return
    }
    if (!password) {
      toast.error('Digite ou gere uma senha')
      return
    }
    onOpenChange(false)
    addPassword({
      title: title.trim(),
      username: username.trim(),
      password,
      url: url.trim(),
      category,
    })
    toast.success('Senha salva com segurança! 🔐')
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md rounded-3xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-extrabold">Nova Senha</DialogTitle>
          <DialogDescription>Guarde suas credenciais com segurança</DialogDescription>
        </DialogHeader>
        <div className="space-y-5">
          <div className="space-y-2">
            <Label className="text-sm font-extrabold">Título</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Gmail"
              className="rounded-xl"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-extrabold">Usuário / Email</Label>
            <Input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="exemplo@email.com"
              className="rounded-xl"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-extrabold">Senha</Label>
            <div className="flex gap-2">
              <Input
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="rounded-xl font-mono"
              />
              <button
                onClick={() => setPassword(generatePassword())}
                className="flex-shrink-0 px-4 rounded-xl bg-[#58CC02] hover:bg-[#46A302] text-white font-extrabold text-sm border-b-4 border-[#46A302] active:translate-y-1 active:border-b-0 transition-all duration-150 flex items-center gap-1"
              >
                <RefreshCw className="w-4 h-4" strokeWidth={3} />
                Gerar
              </button>
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-extrabold">URL (opcional)</Label>
            <Input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://..."
              className="rounded-xl"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-extrabold">Categoria</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="rounded-xl font-bold">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PASSWORD_CATEGORIES.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button
            onClick={handleSubmit}
            className="w-full py-6 rounded-3xl bg-[#1CB0F6] hover:bg-[#1899D6] text-white font-extrabold border-b-4 border-[#1899D6] active:translate-y-1 active:border-b-0 transition-all duration-150"
          >
            Salvar Senha
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
