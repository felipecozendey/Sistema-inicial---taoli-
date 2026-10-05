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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useProfessionalStore } from '@/stores/useProfessionalStore'
import { ClinicConfigModal } from './ClinicConfigModal'
import {
  UserPlus,
  Mail,
  User,
  Phone,
  Calendar,
  AlertTriangle,
  XCircle,
  FileText,
  Loader2,
  Info,
  MapPin,
  Check,
  Sparkles,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface CreateOfflinePatientModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CreateOfflinePatientModal({ open, onOpenChange }: CreateOfflinePatientModalProps) {
  const { checkOfflineEmail, createOfflinePatient, professionalLocations, profile } =
    useProfessionalStore()

  const [displayName, setDisplayName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [birthDate, setBirthDate] = useState('')
  const [gender, setGender] = useState<string>('')
  const [notes, setNotes] = useState('')
  const [selectedLocations, setSelectedLocations] = useState<string[]>([])
  const [clinicConfigModalOpen, setClinicConfigModalOpen] = useState(false)

  const [saving, setSaving] = useState(false)
  const [checkingEmail, setCheckingEmail] = useState(false)
  const [emailStatus, setEmailStatus] = useState<
    'idle' | 'free' | 'offline_patient' | 'registered_user' | 'already_linked'
  >('idle')
  const [emailMessage, setEmailMessage] = useState<string | null>(null)
  const [firstProfName, setFirstProfName] = useState<string | null>(null)
  const [acknowledgedSecondary, setAcknowledgedSecondary] = useState(false)

  // Reset form when opened
  useEffect(() => {
    if (open) {
      setDisplayName('')
      setEmail('')
      setPhone('')
      setBirthDate('')
      setGender('')
      setNotes('')
      setSelectedLocations([])
      setEmailStatus('idle')
      setEmailMessage(null)
      setFirstProfName(null)
      setAcknowledgedSecondary(false)
      setSaving(false)
      setCheckingEmail(false)
    }
  }, [open])

  // Debounced check on email change
  useEffect(() => {
    const clean = email.trim().toLowerCase()
    if (!clean || !clean.includes('@') || clean.length < 5) {
      setEmailStatus('idle')
      setEmailMessage(null)
      setFirstProfName(null)
      setAcknowledgedSecondary(false)
      return
    }

    let active = true
    const timer = setTimeout(async () => {
      setCheckingEmail(true)
      try {
        const result = await checkOfflineEmail(clean)
        if (!active) return

        setEmailStatus(result.status)
        setEmailMessage(result.message || null)
        setFirstProfName(result.first_professional_name || null)
        setAcknowledgedSecondary(false)
      } catch (e) {
        if (!active) return
        console.error('Erro ao verificar email offline:', e)
        setEmailStatus('idle')
      } finally {
        if (active) setCheckingEmail(false)
      }
    }, 450)

    return () => {
      active = false
      clearTimeout(timer)
    }
  }, [email, checkOfflineEmail])

  const cleanEmail = email.trim().toLowerCase()
  const hasEmail = cleanEmail.length > 0

  const isFormValid =
    displayName.trim().length > 0 &&
    (!hasEmail ||
      (cleanEmail.includes('@') &&
        emailStatus !== 'registered_user' &&
        emailStatus !== 'already_linked' &&
        (emailStatus !== 'offline_patient' || acknowledgedSecondary)))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isFormValid || saving) return

    setSaving(true)
    const res = await createOfflinePatient({
      displayName: displayName.trim(),
      email: cleanEmail || undefined,
      phone: phone.trim() || undefined,
      birthDate: birthDate || undefined,
      gender: gender || undefined,
      notes: notes.trim() || undefined,
      careLocations: selectedLocations,
    })
    setSaving(false)

    if (res.ok) {
      onOpenChange(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-lg rounded-3xl border-2 p-5 sm:p-6 shadow-2xl max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <div className="w-12 h-12 rounded-2xl bg-[#1CB0F6]/15 text-[#1CB0F6] flex items-center justify-center mb-1">
            <UserPlus className="w-6 h-6" />
          </div>
          <DialogTitle className="text-xl font-black text-foreground">
            Novo Paciente Offline
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Cadastre pacientes que ainda não possuem cadastro online. Você poderá registrar
            prontuário, evoluções, dietas e treinos imediatamente.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-1">
          {/* Nome Completo * */}
          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-foreground">Nome Completo *</Label>
            <div className="relative">
              <User className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
              <Input
                type="text"
                required
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Ex.: Maria Eduarda Santos"
                className="pl-9 rounded-2xl border-2 h-11 text-xs"
              />
            </div>
          </div>

          {/* E-mail do Paciente (opcional) com verificação */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-bold text-foreground">
                E-mail do Paciente (opcional)
              </Label>
              {checkingEmail && (
                <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                  <Loader2 className="w-3 h-3 animate-spin text-[#1CB0F6]" />
                  Verificando...
                </span>
              )}
            </div>
            <div className="relative">
              <Mail className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Deixe vazio se o paciente ainda não tem e-mail no sistema"
                className="pl-9 rounded-2xl border-2 h-11 text-xs"
              />
            </div>

            {/* Aviso 1: E-mail já registrado no sistema (Bloqueante) */}
            {emailStatus === 'registered_user' && (
              <div className="p-3 rounded-2xl bg-rose-500/10 border-2 border-rose-500/30 text-rose-700 dark:text-rose-400 text-xs flex items-start gap-2 animate-fade-in">
                <XCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
                <div className="space-y-0.5">
                  <p className="font-black text-[11px] uppercase tracking-wide">
                    Cadastro Bloqueado
                  </p>
                  <p className="text-[11px] leading-relaxed">
                    Este e-mail já possui cadastro no sistema. Utilize o botão{' '}
                    <strong>&quot;Convidar paciente&quot;</strong> para enviar uma solicitação de
                    vínculo regular.
                  </p>
                </div>
              </div>
            )}

            {/* Aviso 2: Paciente offline já vinculado a este profissional */}
            {emailStatus === 'already_linked' && (
              <div className="p-3 rounded-2xl bg-amber-500/10 border-2 border-amber-500/30 text-amber-800 dark:text-amber-300 text-xs flex items-start gap-2 animate-fade-in">
                <Info className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
                <div className="space-y-0.5">
                  <p className="font-black text-[11px] uppercase tracking-wide">Já Cadastrado</p>
                  <p className="text-[11px] leading-relaxed">
                    Você já possui este paciente offline em seu consultório. Acesse a lista de
                    pacientes para ver o prontuário.
                  </p>
                </div>
              </div>
            )}

            {/* Aviso 3: Paciente offline com OUTRO profissional (Informativo NÃO bloqueante) */}
            {emailStatus === 'offline_patient' && (
              <div className="p-3.5 rounded-2xl bg-amber-500/10 border-2 border-amber-500/40 text-amber-900 dark:text-amber-200 text-xs space-y-2.5 animate-fade-in">
                <div className="flex items-start gap-2.5">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
                  <div className="space-y-1">
                    <p className="font-black text-[11px] uppercase tracking-wide">
                      Paciente já registrado por outro profissional
                      {firstProfName ? ` (${firstProfName})` : ''}
                    </p>
                    <p className="text-[11px] leading-relaxed">
                      {emailMessage ||
                        'Este paciente já possui cadastro offline com outro profissional de saúde. Ao converter para online, apenas o primeiro profissional que solicitou a mudança terá os dados importados; as demais informações deverão ser incluídas manualmente.'}
                    </p>
                  </div>
                </div>

                <div className="pt-1 flex items-center justify-between gap-2 border-t border-amber-500/20">
                  <span className="text-[10px] text-muted-foreground font-semibold">
                    Deseja prosseguir com o vínculo em seu consultório?
                  </span>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setEmail('')
                        setEmailStatus('idle')
                        setAcknowledgedSecondary(false)
                      }}
                      className="rounded-xl h-7 px-2.5 text-[11px] font-bold"
                    >
                      Cancelar
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => setAcknowledgedSecondary(true)}
                      className={`rounded-xl h-7 px-3 text-[11px] font-black transition-all ${
                        acknowledgedSecondary
                          ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                          : 'bg-amber-600 hover:bg-amber-700 text-white'
                      }`}
                    >
                      {acknowledgedSecondary ? '✓ Confirmado' : 'Prosseguir'}
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Telefone e Data de Nascimento */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-foreground">Telefone / WhatsApp</Label>
              <div className="relative">
                <Phone className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                <Input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="(11) 99999-9999"
                  className="pl-9 rounded-2xl border-2 h-11 text-xs"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-foreground">Data de Nascimento</Label>
              <div className="relative">
                <Calendar className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                <Input
                  type="date"
                  value={birthDate}
                  onChange={(e) => setBirthDate(e.target.value)}
                  className="pl-9 rounded-2xl border-2 h-11 text-xs"
                />
              </div>
            </div>
          </div>

          {/* Sexo (Opcional) */}
          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-foreground">Sexo Biológico (Opcional)</Label>
            <Select value={gender} onValueChange={setGender}>
              <SelectTrigger className="rounded-2xl border-2 h-11 text-xs font-bold">
                <SelectValue placeholder="Selecione (para cálculos metabólicos e composição)" />
              </SelectTrigger>
              <SelectContent className="rounded-2xl border-2">
                <SelectItem value="male" className="text-xs font-bold">
                  Masculino
                </SelectItem>
                <SelectItem value="female" className="text-xs font-bold">
                  Feminino
                </SelectItem>
                <SelectItem value="other" className="text-xs font-bold">
                  Outro / Não especificado
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Locais de Atendimento */}
          <div className="space-y-2 pt-1 border-t">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-[#1CB0F6]" />
                Locais de Atendimento (Opcional)
              </Label>
              {professionalLocations.length > 0 && (
                <button
                  type="button"
                  onClick={() => setClinicConfigModalOpen(true)}
                  className="text-[11px] font-bold text-[#1CB0F6] hover:underline"
                >
                  Gerenciar locais
                </button>
              )}
            </div>

            {professionalLocations.length === 0 ? (
              <div className="p-3 rounded-2xl border-2 border-dashed bg-muted/20 space-y-2 text-center">
                <p className="text-xs text-muted-foreground font-medium">
                  Você ainda não cadastrou locais de atendimento (consultório, clínica, SUS etc.).
                </p>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => setClinicConfigModalOpen(true)}
                  className="rounded-xl h-8 px-3 text-xs font-bold border-2 text-[#1CB0F6] hover:bg-[#1CB0F6]/10"
                >
                  <Sparkles className="w-3.5 h-3.5 mr-1 text-[#1CB0F6]" />
                  Cadastrar locais de atendimento
                </Button>
              </div>
            ) : (
              <div className="flex flex-wrap items-center gap-1.5">
                {professionalLocations.map((loc) => {
                  const isSelected = selectedLocations.some(
                    (l) => l.toLowerCase() === loc.name.toLowerCase(),
                  )
                  return (
                    <button
                      key={loc.id}
                      type="button"
                      onClick={() => {
                        setSelectedLocations((prev) =>
                          isSelected
                            ? prev.filter((l) => l.toLowerCase() !== loc.name.toLowerCase())
                            : [...prev, loc.name],
                        )
                      }}
                      className={cn(
                        'px-2.5 py-1 rounded-xl text-[11px] font-bold border-2 transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer',
                        isSelected
                          ? 'bg-[#1CB0F6]/15 border-[#1CB0F6] text-foreground font-black shadow-xs'
                          : 'bg-card border-border/80 text-muted-foreground hover:bg-muted',
                      )}
                    >
                      <span
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ backgroundColor: loc.color || '#1CB0F6' }}
                      />
                      <span>{loc.name}</span>
                      {isSelected && <Check className="w-3 h-3 text-[#1CB0F6] stroke-[3]" />}
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          {/* Observações Iniciais */}
          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-foreground flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-muted-foreground" />
              Observações Iniciais
            </Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Motivo da consulta, histórico breve, encaminhamento, queixas principais..."
              rows={3}
              className="rounded-2xl border-2 text-xs p-3 resize-none"
            />
          </div>

          <DialogFooter className="pt-2 gap-2 flex-col-reverse sm:flex-row">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="rounded-2xl h-11 font-bold w-full sm:w-auto"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={!isFormValid || saving}
              className="rounded-2xl h-11 font-black bg-[#1CB0F6] hover:bg-[#1899d6] text-white border-b-4 border-[#1899d6] active:border-b-0 active:translate-y-1 transition-all w-full sm:w-auto cursor-pointer disabled:opacity-50"
            >
              {saving ? 'Cadastrando...' : 'Cadastrar Paciente Offline'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>

      <ClinicConfigModal
        open={clinicConfigModalOpen}
        onOpenChange={setClinicConfigModalOpen}
        profile={profile}
      />
    </Dialog>
  )
}
