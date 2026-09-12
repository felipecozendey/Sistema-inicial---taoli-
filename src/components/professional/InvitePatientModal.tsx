import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useProfessionalStore } from '@/stores/useProfessionalStore'
import { UserPlus, Mail, ShieldAlert } from 'lucide-react'

interface InvitePatientModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function InvitePatientModal({ open, onOpenChange }: InvitePatientModalProps) {
  const { invitePatientByEmail } = useProfessionalStore()
  const [email, setEmail] = useState('')
  const [inviting, setInviting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setInviting(true)
    const ok = await invitePatientByEmail(email)
    setInviting(false)
    if (ok) {
      setEmail('')
      onOpenChange(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md rounded-3xl border-2 p-6 shadow-2xl">
        <DialogHeader>
          <div className="w-12 h-12 rounded-2xl bg-[#1CB0F6]/15 text-[#1CB0F6] flex items-center justify-center mb-1">
            <UserPlus className="w-6 h-6" />
          </div>
          <DialogTitle className="text-xl font-black text-foreground">
            Convidar Paciente
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Digite o e-mail do paciente cadastrado na plataforma para solicitar vínculo de
            acompanhamento.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-foreground">E-mail do Paciente *</Label>
            <div className="relative">
              <Mail className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
              <Input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="paciente@dominio.com"
                className="pl-9 rounded-2xl border-2 h-11 text-xs"
              />
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-[#1CB0F6]/10 border border-[#1CB0F6]/20 text-xs text-foreground flex items-start gap-2.5">
            <ShieldAlert className="w-4 h-4 text-[#1CB0F6] shrink-0 mt-0.5" />
            <p className="text-[11px] leading-relaxed text-muted-foreground">
              <strong>Consentimento explícito:</strong> o paciente receberá o pedido no perfil dele
              e só compartilhará métricas e exames após <strong>aceitar expressamente</strong> o
              convite.
            </p>
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="rounded-2xl h-11 font-bold"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={inviting}
              className="rounded-2xl h-11 font-black bg-[#1CB0F6] hover:bg-[#1899d6] text-white border-b-4 border-[#1899d6] active:border-b-0 active:translate-y-1 transition-all"
            >
              {inviting ? 'Enviando convite...' : 'Enviar Convite'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
