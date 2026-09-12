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
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useProfessionalStore, ProfessionalProfile } from '@/stores/useProfessionalStore'
import { StethoscopeIcon } from './StethoscopeIcon'

interface ClinicConfigModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  profile: ProfessionalProfile | null
}

const PROFESSIONS = [
  'Nutricionista',
  'Educador Físico',
  'Psicólogo',
  'Médico',
  'Fisioterapeuta',
  'Outro',
]

export function ClinicConfigModal({ open, onOpenChange, profile }: ClinicConfigModalProps) {
  const { upsertClinicProfile } = useProfessionalStore()
  const [profession, setProfession] = useState('Nutricionista')
  const [registerCode, setRegisterCode] = useState('')
  const [specialty, setSpecialty] = useState('')
  const [clinicName, setClinicName] = useState('')
  const [phone, setPhone] = useState('')
  const [bio, setBio] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (profile) {
      setProfession(profile.profession || 'Nutricionista')
      setRegisterCode(profile.register_code || '')
      setSpecialty(profile.specialty || '')
      setClinicName(profile.clinic_name || '')
      setPhone(profile.phone || '')
      setBio(profile.bio || '')
    }
  }, [profile, open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    const ok = await upsertClinicProfile({
      profession,
      register_code: registerCode.trim() || null,
      specialty: specialty.trim() || null,
      clinic_name: clinicName.trim() || null,
      phone: phone.trim() || null,
      bio: bio.trim() || null,
    })
    setSaving(false)
    if (ok) {
      onOpenChange(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md rounded-3xl border-2 p-6 shadow-2xl">
        <DialogHeader>
          <div className="w-12 h-12 rounded-2xl bg-[#1CB0F6]/15 text-[#1CB0F6] flex items-center justify-center mb-1">
            <StethoscopeIcon size={24} />
          </div>
          <DialogTitle className="text-xl font-black text-foreground">
            Configurar Consultório
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Defina seus dados profissionais para identificação em consultas e convites.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-foreground">Profissão *</Label>
            <select
              value={profession}
              onChange={(e) => setProfession(e.target.value)}
              className="w-full rounded-2xl border-2 bg-card text-xs font-bold text-foreground h-11 px-3 focus:outline-none focus:ring-2 focus:ring-[#1CB0F6]"
            >
              {PROFESSIONS.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-foreground">Registro (CRN/CRM/CREF)</Label>
              <Input
                value={registerCode}
                onChange={(e) => setRegisterCode(e.target.value)}
                placeholder="Ex: CRN-3 12345"
                className="rounded-2xl border-2 h-11 text-xs"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-foreground">Especialidade</Label>
              <Input
                value={specialty}
                onChange={(e) => setSpecialty(e.target.value)}
                placeholder="Ex: Esportiva / Clínica"
                className="rounded-2xl border-2 h-11 text-xs"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-foreground">
              Nome do Consultório / Clínica
            </Label>
            <Input
              value={clinicName}
              onChange={(e) => setClinicName(e.target.value)}
              placeholder="Ex: Consultório Dr. Silva"
              className="rounded-2xl border-2 h-11 text-xs"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-foreground">
              Telefone / WhatsApp Comercial
            </Label>
            <Input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="(11) 99999-9999"
              className="rounded-2xl border-2 h-11 text-xs"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-foreground">Apresentação / Bio Breve</Label>
            <Textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Descreva brevemente sua atuação e abordagem..."
              rows={3}
              className="rounded-2xl border-2 text-xs"
            />
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
              disabled={saving}
              className="rounded-2xl h-11 font-black bg-[#1CB0F6] hover:bg-[#1899d6] text-white border-b-4 border-[#1899d6] active:border-b-0 active:translate-y-1 transition-all"
            >
              {saving ? 'Salvando...' : 'Salvar Consultório'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
