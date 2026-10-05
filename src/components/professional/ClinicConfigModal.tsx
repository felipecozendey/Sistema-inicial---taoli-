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
  useProfessionalStore,
  ProfessionalProfile,
  CareLocation,
} from '@/stores/useProfessionalStore'
import { StethoscopeIcon } from './StethoscopeIcon'
import { MapPin, Plus, Trash2, Edit2, Check, Building, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'

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

const LOCATION_TYPES = [
  'Consultório Particular',
  'Clínica',
  'Hospital',
  'SUS',
  'Domiciliar',
  'Teleatendimento',
]

const QUICK_SUGGESTIONS = [
  { name: 'Clínica', type: 'Clínica', color: '#1CB0F6' },
  { name: 'Particular', type: 'Consultório Particular', color: '#58CC02' },
  { name: 'SUS', type: 'SUS', color: '#FFC800' },
  { name: 'Prefeitura', type: 'SUS', color: '#CE82FF' },
  { name: 'Online', type: 'Teleatendimento', color: '#0284c7' },
]

export function ClinicConfigModal({ open, onOpenChange, profile }: ClinicConfigModalProps) {
  const { upsertClinicProfile, professionalLocations, saveProfessionalLocations } =
    useProfessionalStore()

  const [activeTab, setActiveTab] = useState<'profile' | 'locations'>('profile')

  // Clinic profile form
  const [profession, setProfession] = useState('Nutricionista')
  const [registerCode, setRegisterCode] = useState('')
  const [specialty, setSpecialty] = useState('')
  const [clinicName, setClinicName] = useState('')
  const [phone, setPhone] = useState('')
  const [bio, setBio] = useState('')
  const [savingProfile, setSavingProfile] = useState(false)

  // Locations state
  const [locations, setLocations] = useState<CareLocation[]>([])
  const [editingLocId, setEditingLocId] = useState<string | null>(null)
  const [locName, setLocName] = useState('')
  const [locType, setLocType] = useState('Consultório Particular')
  const [locColor, setLocColor] = useState('#1CB0F6')
  const [savingLocations, setSavingLocations] = useState(false)
  const [isAddingNew, setIsAddingNew] = useState(false)

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

  useEffect(() => {
    if (open) {
      setLocations(professionalLocations || [])
      setIsAddingNew(false)
      setEditingLocId(null)
      setLocName('')
      setLocType('Consultório Particular')
      setLocColor('#1CB0F6')
    }
  }, [open, professionalLocations])

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSavingProfile(true)
    const ok = await upsertClinicProfile({
      profession,
      register_code: registerCode.trim() || null,
      specialty: specialty.trim() || null,
      clinic_name: clinicName.trim() || null,
      phone: phone.trim() || null,
      bio: bio.trim() || null,
    })
    setSavingProfile(false)
    if (ok) {
      onOpenChange(false)
    }
  }

  const handleQuickAdd = async (sug: { name: string; type: string; color: string }) => {
    // Check if location with same name already exists
    if (locations.some((l) => l.name.toLowerCase() === sug.name.toLowerCase())) {
      return
    }
    const newLoc: CareLocation = {
      id: `loc-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      name: sug.name,
      type: sug.type,
      color: sug.color,
    }
    const updated = [...locations, newLoc]
    setLocations(updated)
    setSavingLocations(true)
    await saveProfessionalLocations(updated)
    setSavingLocations(false)
  }

  const handleSaveLocationForm = async (e: React.FormEvent) => {
    e.preventDefault()
    const cleanName = locName.trim()
    if (!cleanName) return

    let updated: CareLocation[]
    if (editingLocId) {
      updated = locations.map((loc) =>
        loc.id === editingLocId
          ? { ...loc, name: cleanName, type: locType, color: locColor || undefined }
          : loc,
      )
    } else {
      const newLoc: CareLocation = {
        id: `loc-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        name: cleanName,
        type: locType,
        color: locColor || undefined,
      }
      updated = [...locations, newLoc]
    }

    setLocations(updated)
    setEditingLocId(null)
    setIsAddingNew(false)
    setLocName('')
    setLocType('Consultório Particular')
    setLocColor('#1CB0F6')

    setSavingLocations(true)
    await saveProfessionalLocations(updated)
    setSavingLocations(false)
  }

  const handleStartEdit = (loc: CareLocation) => {
    setEditingLocId(loc.id)
    setIsAddingNew(true)
    setLocName(loc.name)
    setLocType(loc.type || 'Consultório Particular')
    setLocColor(loc.color || '#1CB0F6')
  }

  const handleDeleteLocation = async (id: string) => {
    const updated = locations.filter((loc) => loc.id !== id)
    setLocations(updated)
    if (editingLocId === id) {
      setEditingLocId(null)
      setIsAddingNew(false)
    }
    setSavingLocations(true)
    await saveProfessionalLocations(updated)
    setSavingLocations(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full sm:max-w-lg rounded-3xl border-2 p-5 sm:p-6 shadow-2xl max-h-[92vh] flex flex-col overflow-hidden">
        <DialogHeader className="shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-[#1CB0F6]/15 text-[#1CB0F6] flex items-center justify-center shrink-0">
              <StethoscopeIcon size={24} />
            </div>
            <div>
              <DialogTitle className="text-xl font-black text-foreground">
                Configurar Consultório
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Dados profissionais e locais de atendimento clínico
              </DialogDescription>
            </div>
          </div>

          {/* Abas de Navegação */}
          <div className="flex items-center gap-2 pt-3 border-b">
            <button
              type="button"
              onClick={() => setActiveTab('profile')}
              className={cn(
                'flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-black transition-all border-b-2',
                activeTab === 'profile'
                  ? 'bg-[#1CB0F6] text-white border-[#147eb0] shadow-sm'
                  : 'bg-transparent text-muted-foreground hover:bg-muted border-transparent',
              )}
            >
              <Building className="w-4 h-4" />
              <span>Dados do Consultório</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('locations')}
              className={cn(
                'flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-black transition-all border-b-2',
                activeTab === 'locations'
                  ? 'bg-[#1CB0F6] text-white border-[#147eb0] shadow-sm'
                  : 'bg-transparent text-muted-foreground hover:bg-muted border-transparent',
              )}
            >
              <MapPin className="w-4 h-4" />
              <span>Locais de Atendimento</span>
              {locations.length > 0 && (
                <span className="w-5 h-5 rounded-full bg-white/20 text-white text-[10px] font-black flex items-center justify-center">
                  {locations.length}
                </span>
              )}
            </button>
          </div>
        </DialogHeader>

        {/* CONTEÚDO DA ABA 1: DADOS DO CONSULTÓRIO */}
        {activeTab === 'profile' && (
          <form
            onSubmit={handleProfileSubmit}
            className="space-y-4 py-2 flex-1 overflow-y-auto pr-1"
          >
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
                disabled={savingProfile}
                className="rounded-2xl h-11 font-black bg-[#1CB0F6] hover:bg-[#1899d6] text-white border-b-4 border-[#1899d6] active:border-b-0 active:translate-y-1 transition-all"
              >
                {savingProfile ? 'Salvando...' : 'Salvar Consultório'}
              </Button>
            </DialogFooter>
          </form>
        )}

        {/* CONTEÚDO DA ABA 2: LOCAIS DE ATENDIMENTO */}
        {activeTab === 'locations' && (
          <div className="space-y-4 py-2 flex-1 overflow-y-auto pr-1">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-black text-foreground flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-[#1CB0F6]" />
                  Locais Cadastrados
                </h4>
                <p className="text-xs text-muted-foreground">
                  Organize seus atendimentos por clínica, consultório particular ou SUS
                </p>
              </div>

              {!isAddingNew && (
                <Button
                  type="button"
                  size="sm"
                  onClick={() => {
                    setEditingLocId(null)
                    setLocName('')
                    setLocType('Consultório Particular')
                    setLocColor('#1CB0F6')
                    setIsAddingNew(true)
                  }}
                  className="rounded-2xl h-9 px-3.5 font-black bg-[#1CB0F6] hover:bg-[#1899d6] text-white border-b-4 border-[#147eb0] active:border-b-0 active:translate-y-1 transition-all text-xs flex items-center gap-1.5 shadow-sm"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Novo Local</span>
                </Button>
              )}
            </div>

            {/* Formulário inline para criar ou editar local */}
            {isAddingNew && (
              <form
                onSubmit={handleSaveLocationForm}
                className="p-4 rounded-3xl border-2 border-[#1CB0F6]/40 bg-[#1CB0F6]/5 space-y-3 animate-fade-in"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-foreground">
                    {editingLocId ? 'Editar Local' : 'Adicionar Novo Local'}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setIsAddingNew(false)
                      setEditingLocId(null)
                    }}
                    className="text-xs text-muted-foreground hover:text-foreground font-bold"
                  >
                    Cancelar
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs font-bold text-foreground">Nome do Local *</Label>
                    <Input
                      required
                      value={locName}
                      onChange={(e) => setLocName(e.target.value)}
                      placeholder="Ex: Consultório Jardins / UBS Centro"
                      className="rounded-2xl border-2 h-10 text-xs"
                      autoFocus
                    />
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs font-bold text-foreground">Tipo</Label>
                    <select
                      value={locType}
                      onChange={(e) => setLocType(e.target.value)}
                      className="w-full rounded-2xl border-2 bg-card text-xs font-bold text-foreground h-10 px-3 focus:outline-none focus:ring-2 focus:ring-[#1CB0F6]"
                    >
                      {LOCATION_TYPES.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-3 pt-1">
                  <div className="flex items-center gap-2">
                    <Label className="text-xs font-bold text-foreground">Cor da Etiqueta:</Label>
                    <div className="flex items-center gap-1.5">
                      {['#1CB0F6', '#58CC02', '#FFC800', '#CE82FF', '#FF4B4B', '#2DD4BF'].map(
                        (color) => (
                          <button
                            key={color}
                            type="button"
                            onClick={() => setLocColor(color)}
                            className={cn(
                              'w-6 h-6 rounded-full border-2 transition-transform',
                              locColor === color
                                ? 'scale-110 border-foreground shadow-sm'
                                : 'border-transparent hover:scale-105',
                            )}
                            style={{ backgroundColor: color }}
                          />
                        ),
                      )}
                    </div>
                  </div>

                  <Button
                    type="submit"
                    disabled={savingLocations || !locName.trim()}
                    className="rounded-2xl h-9 px-4 font-black bg-[#1CB0F6] hover:bg-[#1899d6] text-white border-b-4 border-[#147eb0] active:border-b-0 active:translate-y-1 transition-all text-xs flex items-center gap-1"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Salvar</span>
                  </Button>
                </div>
              </form>
            )}

            {/* Sugestões Rápidas (Chips clicáveis se a lista estiver vazia ou como atalho rápido) */}
            {locations.length === 0 && !isAddingNew && (
              <div className="p-4 rounded-3xl border-2 border-dashed bg-muted/20 space-y-3 text-center">
                <div className="w-10 h-10 rounded-2xl bg-[#1CB0F6]/10 text-[#1CB0F6] flex items-center justify-center mx-auto">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-black text-foreground">
                    Nenhum local de atendimento cadastrado
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    Clique em uma sugestão rápida abaixo para criar instantaneamente:
                  </p>
                </div>

                <div className="flex flex-wrap justify-center gap-2 pt-1">
                  {QUICK_SUGGESTIONS.map((sug) => (
                    <button
                      key={sug.name}
                      type="button"
                      disabled={savingLocations}
                      onClick={() => handleQuickAdd(sug)}
                      className="px-3 py-1.5 rounded-2xl border-2 border-border bg-card hover:bg-muted text-xs font-bold text-foreground flex items-center gap-1.5 active:scale-95 transition-all shadow-xs cursor-pointer"
                    >
                      <span
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: sug.color }}
                      />
                      <span>+ {sug.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Lista dos locais cadastrados */}
            {locations.length > 0 && (
              <div className="space-y-2">
                <div className="divide-y divide-border rounded-2xl border-2 bg-card overflow-hidden">
                  {locations.map((loc) => (
                    <div
                      key={loc.id}
                      className="p-3 flex items-center justify-between gap-2 hover:bg-muted/30 transition-colors"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span
                          className="w-3.5 h-3.5 rounded-full shrink-0 shadow-xs"
                          style={{ backgroundColor: loc.color || '#1CB0F6' }}
                        />
                        <div className="min-w-0">
                          <div className="font-extrabold text-xs text-foreground truncate">
                            {loc.name}
                          </div>
                          <div className="text-[10px] text-muted-foreground font-semibold">
                            {loc.type || 'Consultório'}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          onClick={() => handleStartEdit(loc)}
                          className="h-8 w-8 rounded-xl text-muted-foreground hover:text-foreground"
                          title="Editar local"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          onClick={() => handleDeleteLocation(loc.id)}
                          className="h-8 w-8 rounded-xl text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950"
                          title="Remover local"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Sugestões rápidas complementares para adicionar outros locais */}
                <div className="pt-2">
                  <p className="text-[11px] font-bold text-muted-foreground mb-1.5 flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-[#FFC800]" /> Sugestões rápidas para
                    adicionar:
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {QUICK_SUGGESTIONS.filter(
                      (sug) =>
                        !locations.some((l) => l.name.toLowerCase() === sug.name.toLowerCase()),
                    ).map((sug) => (
                      <button
                        key={sug.name}
                        type="button"
                        disabled={savingLocations}
                        onClick={() => handleQuickAdd(sug)}
                        className="px-2.5 py-1 rounded-xl border border-dashed text-[11px] font-bold text-muted-foreground hover:text-foreground hover:bg-muted transition-colors flex items-center gap-1"
                      >
                        <Plus className="w-3 h-3" />
                        <span>{sug.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            <DialogFooter className="pt-3 border-t">
              <Button
                type="button"
                onClick={() => onOpenChange(false)}
                className="w-full rounded-2xl h-11 font-black bg-[#1CB0F6] hover:bg-[#1899d6] text-white border-b-4 border-[#147eb0]"
              >
                Concluir
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
