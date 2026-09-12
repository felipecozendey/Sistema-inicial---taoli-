import { useState, useEffect, useMemo, useCallback } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useMasterStore } from '@/stores/useMasterStore'
import { toast } from 'sonner'
import {
  Users,
  Calendar,
  Clock,
  ShieldCheck,
  Search,
  Filter,
  RefreshCw,
  AlertTriangle,
  UserCheck2,
  UserX,
  Trash2,
  FileText,
  Activity,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Building,
  Phone,
} from 'lucide-react'
import { StethoscopeIcon } from '@/components/professional/StethoscopeIcon'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { cn } from '@/lib/utils'

export interface MasterProfessionalProfileItem {
  user_id: string
  display_name: string
  email: string
  is_professional: boolean
  role: string
  profession: string
  register_code: string | null
  specialty: string | null
  phone: string | null
  bio: string | null
  clinic_name: string | null
  created_at: string
  updated_at: string | null
  active_patients_count: number
  total_patients_count: number
  scheduled_appointments_count: number
  done_appointments_count: number
  notes_count: number
}

export interface MasterProfessionalLinkItem {
  id: string
  professional_id: string
  professional_name: string
  professional_profession: string
  professional_register: string | null
  patient_id: string
  patient_name: string
  patient_email: string
  status: 'pending' | 'active' | 'rejected' | 'ended'
  requested_by: string
  created_at: string
  responded_at: string | null
  granted_pages?: string[]
}

export function MasterProfessionalTab() {
  const { setProfessional, loadMasterData } = useMasterStore()

  const [loading, setLoading] = useState(true)
  const [profiles, setProfiles] = useState<MasterProfessionalProfileItem[]>([])
  const [links, setLinks] = useState<MasterProfessionalLinkItem[]>([])

  // Filters for links
  const [linkSearch, setLinkSearch] = useState('')
  const [linkStatusFilter, setLinkStatusFilter] = useState<string>('all')

  // Filters for profiles
  const [profileSearch, setProfileSearch] = useState('')

  // Support TI search
  const [supportQuery, setSupportQuery] = useState('')

  // Dialog states
  const [targetActionLink, setTargetActionLink] = useState<{
    link: MasterProfessionalLinkItem
    action: 'end' | 'delete'
  } | null>(null)
  const [isManagingLink, setIsManagingLink] = useState(false)

  const [targetToggleProf, setTargetToggleProf] = useState<{
    userId: string
    userName: string
    isProf: boolean
  } | null>(null)
  const [isTogglingProf, setIsTogglingProf] = useState(false)

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const [profilesRes, linksRes] = await Promise.all([
        (supabase.rpc as any)('master_list_professional_profiles'),
        (supabase.rpc as any)('master_list_professional_links'),
      ])

      if (profilesRes.error) throw profilesRes.error
      if (linksRes.error) throw linksRes.error

      setProfiles((profilesRes.data as unknown as MasterProfessionalProfileItem[]) || [])
      setLinks((linksRes.data as unknown as MasterProfessionalLinkItem[]) || [])
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : 'Falha ao carregar dados do Painel Profissional'
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  // Global totals (Block 1)
  const totals = useMemo(() => {
    const activeProfessionals = profiles.filter((p) => p.is_professional).length
    const activeLinks = links.filter((l) => l.status === 'active').length
    const pendingInvites = links.filter((l) => l.status === 'pending').length
    const scheduledAppointments = profiles.reduce(
      (acc, p) => acc + Number(p.scheduled_appointments_count || 0),
      0,
    )
    return {
      activeProfessionals,
      activeLinks,
      pendingInvites,
      scheduledAppointments,
    }
  }, [profiles, links])

  // Filtered profiles (Block 2)
  const filteredProfiles = useMemo(() => {
    const q = profileSearch.trim().toLowerCase()
    if (!q) return profiles
    return profiles.filter((p) => {
      return (
        p.display_name.toLowerCase().includes(q) ||
        p.email.toLowerCase().includes(q) ||
        p.profession.toLowerCase().includes(q) ||
        (p.register_code && p.register_code.toLowerCase().includes(q)) ||
        (p.clinic_name && p.clinic_name.toLowerCase().includes(q))
      )
    })
  }, [profiles, profileSearch])

  // Filtered links (Block 3)
  const filteredLinks = useMemo(() => {
    return links.filter((l) => {
      const matchesStatus = linkStatusFilter === 'all' || l.status === linkStatusFilter
      const q = linkSearch.trim().toLowerCase()
      const matchesSearch =
        !q ||
        l.professional_name.toLowerCase().includes(q) ||
        l.patient_name.toLowerCase().includes(q) ||
        l.patient_email.toLowerCase().includes(q) ||
        l.professional_profession.toLowerCase().includes(q)

      return matchesStatus && matchesSearch
    })
  }, [links, linkStatusFilter, linkSearch])

  // Support TI consolidation (Block 4)
  const supportResults = useMemo(() => {
    const q = supportQuery.trim().toLowerCase()
    if (!q || q.length < 2) return null

    // Search matched profiles (either from the master profiles or links)
    const matchingProfiles = profiles.filter(
      (p) => p.email.toLowerCase().includes(q) || p.display_name.toLowerCase().includes(q),
    )

    // Find links where the queried user is either professional or patient
    const matchingLinks = links.filter(
      (l) =>
        l.patient_email.toLowerCase().includes(q) ||
        l.patient_name.toLowerCase().includes(q) ||
        l.professional_name.toLowerCase().includes(q),
    )

    return {
      profiles: matchingProfiles,
      links: matchingLinks,
    }
  }, [supportQuery, profiles, links])

  // Action: Force End or Delete Link via RPC
  const handleManageLinkConfirm = async () => {
    if (!targetActionLink) return
    const { link, action } = targetActionLink
    setIsManagingLink(true)
    try {
      const { error } = await (supabase.rpc as any)('master_manage_professional_link', {
        link_id: link.id,
        action,
      })
      if (error) throw error

      toast.success(
        action === 'end'
          ? 'Vínculo encerrado forçadamente com sucesso!'
          : 'Vínculo excluído permanentemente do sistema.',
      )

      // Reload both local state and master logs
      await Promise.all([loadData(), loadMasterData()])
      setTargetActionLink(null)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro ao gerenciar vínculo'
      toast.error(msg)
    } finally {
      setIsManagingLink(false)
    }
  }

  // Action: Toggle Professional Status (Grant/Revoke)
  const handleToggleProfConfirm = async () => {
    if (!targetToggleProf) return
    const { userId, isProf } = targetToggleProf
    setIsTogglingProf(true)
    try {
      const ok = await setProfessional(userId, isProf)
      if (ok) {
        await Promise.all([loadData(), loadMasterData()])
        setTargetToggleProf(null)
      }
    } finally {
      setIsTogglingProf(false)
    }
  }

  const formatShortDate = (iso: string | null) => {
    if (!iso) return '—'
    const d = new Date(iso)
    if (isNaN(d.getTime())) return '—'
    return d.toLocaleDateString('pt-BR')
  }

  return (
    <div className="space-y-8 animate-fade-in-up">
      {/* Top Header Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-2xl bg-amber-500/10 text-amber-500 border-2 border-amber-500/30">
              <StethoscopeIcon size={22} />
            </span>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-foreground">
              Gestão Administrativa de Profissionais
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground font-semibold mt-1">
            Supervisão de consultórios, auditoria de consentimentos e intervenções de gestor
          </p>
        </div>

        <Button
          onClick={() => loadData()}
          disabled={loading}
          variant="outline"
          className="rounded-2xl h-10 px-4 font-bold border-2 hover:bg-muted active:scale-95 transition-all text-xs flex items-center gap-2"
        >
          <RefreshCw className={cn('w-4 h-4 text-amber-500', loading && 'animate-spin')} />
          <span>Atualizar</span>
        </Button>
      </div>

      {/* BLOCO 1: VISÃO ADMINISTRATIVA (CARDS COM TOTAIS GLOBAIS) */}
      <section className="space-y-3">
        <h3 className="text-xs font-black uppercase tracking-wider text-muted-foreground">
          1. Visão Administrativa Global
        </h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {/* Card 1: Profissionais Ativos */}
          <div className="p-5 rounded-3xl bg-card border-2 shadow-sm space-y-2 border-b-4 border-amber-500/40">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-muted-foreground">Profissionais Ativos</span>
              <div className="w-9 h-9 rounded-xl bg-[#1CB0F6]/15 text-[#1CB0F6] flex items-center justify-center">
                <StethoscopeIcon size={18} />
              </div>
            </div>
            <div className="text-3xl font-black text-foreground">{totals.activeProfessionals}</div>
            <p className="text-[11px] text-muted-foreground font-semibold">
              Usuários com flag `is_professional`
            </p>
          </div>

          {/* Card 2: Vínculos Ativos */}
          <div className="p-5 rounded-3xl bg-card border-2 shadow-sm space-y-2 border-b-4 border-[#58CC02]/40">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-muted-foreground">Vínculos Ativos</span>
              <div className="w-9 h-9 rounded-xl bg-[#58CC02]/15 text-[#58CC02] flex items-center justify-center">
                <UserCheck2 className="w-4 h-4" />
              </div>
            </div>
            <div className="text-3xl font-black text-foreground">{totals.activeLinks}</div>
            <p className="text-[11px] text-muted-foreground font-semibold">
              Pacientes com consentimento liberado
            </p>
          </div>

          {/* Card 3: Convites Pendentes */}
          <div className="p-5 rounded-3xl bg-card border-2 shadow-sm space-y-2 border-b-4 border-amber-500/40">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-muted-foreground">Convites Pendentes</span>
              <div className="w-9 h-9 rounded-xl bg-amber-500/15 text-amber-500 flex items-center justify-center">
                <Clock className="w-4 h-4" />
              </div>
            </div>
            <div className="text-3xl font-black text-foreground">{totals.pendingInvites}</div>
            <p className="text-[11px] text-muted-foreground font-semibold">
              Aguardando resposta do paciente
            </p>
          </div>

          {/* Card 4: Consultas Agendadas */}
          <div className="p-5 rounded-3xl bg-card border-2 shadow-sm space-y-2 border-b-4 border-[#1CB0F6]/40">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-muted-foreground">Consultas Agendadas</span>
              <div className="w-9 h-9 rounded-xl bg-[#1CB0F6]/15 text-[#1CB0F6] flex items-center justify-center">
                <Calendar className="w-4 h-4" />
              </div>
            </div>
            <div className="text-3xl font-black text-foreground">
              {totals.scheduledAppointments}
            </div>
            <p className="text-[11px] text-muted-foreground font-semibold">
              Em agenda ativa no sistema
            </p>
          </div>
        </div>
      </section>

      {/* BLOCO 2: PROFISSIONAIS CADASTRADOS */}
      <section className="bg-card border-2 rounded-3xl p-5 sm:p-6 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="space-y-0.5">
            <h3 className="text-base font-black text-foreground flex items-center gap-2">
              <span>2. Profissionais Cadastrados</span>
              <Badge className="bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30 text-[11px] font-black rounded-full">
                {profiles.length} total
              </Badge>
            </h3>
            <p className="text-xs text-muted-foreground font-semibold">
              Perfis com consultório configurado ou status profissional ativo.
            </p>
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
            <Input
              value={profileSearch}
              onChange={(e) => setProfileSearch(e.target.value)}
              placeholder="Buscar por nome, e-mail, registro..."
              className="pl-9 rounded-2xl border-2 h-10 text-xs"
            />
          </div>
        </div>

        {filteredProfiles.length === 0 ? (
          <div className="py-12 text-center rounded-2xl border-2 border-dashed bg-muted/20 space-y-1">
            <StethoscopeIcon size={32} className="mx-auto text-muted-foreground opacity-40 mb-2" />
            <p className="font-extrabold text-foreground text-sm">Nenhum profissional encontrado</p>
            <p className="text-xs text-muted-foreground">
              Nenhum registro coincide com o filtro atual.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredProfiles.map((p) => (
              <div
                key={p.user_id}
                className={cn(
                  'p-4 sm:p-5 rounded-2xl border-2 space-y-3.5 transition-all bg-card shadow-xs',
                  p.is_professional
                    ? 'border-border hover:border-[#1CB0F6]/50'
                    : 'border-dashed border-muted-foreground/30 opacity-75',
                )}
              >
                {/* Header do Card */}
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-black text-sm text-foreground truncate">
                        {p.display_name}
                      </span>
                      {p.is_professional ? (
                        <Badge className="bg-[#1CB0F6] text-white font-black text-[10px] rounded-full border-b border-[#147eb0]">
                          Ativo
                        </Badge>
                      ) : (
                        <Badge
                          variant="outline"
                          className="text-[10px] font-bold text-muted-foreground border-muted-foreground/40"
                        >
                          Revogado
                        </Badge>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground font-semibold truncate">
                      {p.email}
                    </div>
                  </div>

                  <span className="text-[10px] font-bold text-[#1CB0F6] bg-[#1CB0F6]/10 px-2 py-0.5 rounded-full shrink-0 border border-[#1CB0F6]/30">
                    {p.profession}
                  </span>
                </div>

                {/* Dados de consultório */}
                <div className="grid grid-cols-2 gap-2 text-[11px] bg-muted/30 p-2.5 rounded-xl border">
                  <div>
                    <span className="text-muted-foreground block text-[10px] font-bold uppercase">
                      Registro
                    </span>
                    <span className="font-semibold text-foreground">
                      {p.register_code || 'Não informado'}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[10px] font-bold uppercase">
                      Consultório
                    </span>
                    <span className="font-semibold text-foreground truncate block">
                      {p.clinic_name || 'Particular'}
                    </span>
                  </div>
                </div>

                {/* Métricas agregadas */}
                <div className="grid grid-cols-4 gap-1 text-center bg-card p-2 rounded-xl border">
                  <div>
                    <div className="text-sm font-black text-foreground">
                      {p.active_patients_count}
                    </div>
                    <div className="text-[9px] text-muted-foreground font-bold uppercase">
                      Pacientes
                    </div>
                  </div>
                  <div>
                    <div className="text-sm font-black text-foreground">
                      {p.scheduled_appointments_count}
                    </div>
                    <div className="text-[9px] text-muted-foreground font-bold uppercase">
                      Agendadas
                    </div>
                  </div>
                  <div>
                    <div className="text-sm font-black text-foreground">
                      {p.done_appointments_count}
                    </div>
                    <div className="text-[9px] text-muted-foreground font-bold uppercase">
                      Realizadas
                    </div>
                  </div>
                  <div>
                    <div className="text-sm font-black text-foreground">{p.notes_count}</div>
                    <div className="text-[9px] text-muted-foreground font-bold uppercase">
                      Notas
                    </div>
                  </div>
                </div>

                {/* Ações rápidas de Master */}
                <div className="pt-1 flex items-center justify-end gap-2">
                  {p.is_professional ? (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        setTargetToggleProf({
                          userId: p.user_id,
                          userName: p.display_name,
                          isProf: false,
                        })
                      }
                      className="rounded-xl h-8 text-xs font-bold text-amber-600 border-amber-300 dark:border-amber-900 hover:bg-amber-50 dark:hover:bg-amber-950"
                    >
                      <UserX className="w-3.5 h-3.5 mr-1" />
                      Revogar Perfil Pro
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      onClick={() =>
                        setTargetToggleProf({
                          userId: p.user_id,
                          userName: p.display_name,
                          isProf: true,
                        })
                      }
                      className="rounded-xl h-8 text-xs font-black bg-[#1CB0F6] hover:bg-[#1899d6] text-white border-b-2 border-[#147eb0]"
                    >
                      <UserCheck2 className="w-3.5 h-3.5 mr-1" />
                      Conceder Perfil Pro
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* BLOCO 3: VÍNCULOS E CONSENTIMENTOS */}
      <section className="bg-card border-2 rounded-3xl p-5 sm:p-6 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="space-y-0.5">
            <h3 className="text-base font-black text-foreground flex items-center gap-2">
              <span>3. Vínculos e Consentimentos</span>
              <Badge className="bg-[#58CC02]/15 text-[#58CC02] border border-[#58CC02]/30 text-[11px] font-black rounded-full">
                {links.length} no sistema
              </Badge>
            </h3>
            <p className="text-xs text-muted-foreground font-semibold">
              Gestão de autorização de leitura e intervenção administrativa de gestor.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
            <div className="relative min-w-[200px]">
              <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
              <Input
                value={linkSearch}
                onChange={(e) => setLinkSearch(e.target.value)}
                placeholder="Buscar profissional ou paciente..."
                className="pl-9 rounded-2xl border-2 h-10 text-xs"
              />
            </div>

            <select
              value={linkStatusFilter}
              onChange={(e) => setLinkStatusFilter(e.target.value)}
              className="h-10 px-3 rounded-2xl border-2 bg-card text-xs font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="all">Todos os Status</option>
              <option value="active">Ativos</option>
              <option value="pending">Pendentes</option>
              <option value="ended">Encerrados</option>
              <option value="rejected">Recusados</option>
            </select>
          </div>
        </div>

        {filteredLinks.length === 0 ? (
          <div className="py-12 text-center rounded-2xl border-2 border-dashed bg-muted/20 space-y-1">
            <Users className="w-8 h-8 mx-auto text-muted-foreground opacity-40 mb-2" />
            <p className="font-extrabold text-foreground text-sm">Nenhum vínculo encontrado</p>
            <p className="text-xs text-muted-foreground">
              Nenhum consentimento coincide com os filtros informados.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto -mx-5 sm:mx-0">
            <table className="w-full text-left text-xs border-collapse min-w-[640px]">
              <thead>
                <tr className="border-b bg-muted/40 text-[11px] font-black uppercase tracking-wider text-muted-foreground">
                  <th className="py-3 px-4">Profissional</th>
                  <th className="py-3 px-4">Paciente</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Criação / Resposta</th>
                  <th className="py-3 px-4 text-right">Ações de Gestor</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredLinks.map((link) => {
                  const statusStyles: Record<string, { label: string; badge: string }> = {
                    active: {
                      label: 'Ativo',
                      badge: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30',
                    },
                    pending: {
                      label: 'Pendente',
                      badge: 'bg-amber-500/10 text-amber-600 border-amber-500/30',
                    },
                    ended: {
                      label: 'Encerrado',
                      badge: 'bg-muted text-muted-foreground border-border',
                    },
                    rejected: {
                      label: 'Recusado',
                      badge: 'bg-rose-500/10 text-rose-600 border-rose-500/30',
                    },
                  }
                  const st = statusStyles[link.status] || {
                    label: link.status,
                    badge: 'bg-muted text-muted-foreground',
                  }

                  return (
                    <tr key={link.id} className="hover:bg-muted/30 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-extrabold text-foreground">
                          {link.professional_name}
                        </div>
                        <div className="text-[11px] text-muted-foreground">
                          {link.professional_profession}
                          {link.professional_register
                            ? ` • Reg. ${link.professional_register}`
                            : ''}
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <div className="font-extrabold text-foreground">{link.patient_name}</div>
                        <div className="text-[11px] text-muted-foreground">
                          {link.patient_email}
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <div className="space-y-1">
                          <span
                            className={cn(
                              'inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black border',
                              st.badge,
                            )}
                          >
                            {st.label}
                          </span>
                          {Array.isArray(link.granted_pages) && link.granted_pages.length > 0 && (
                            <div className="flex items-center gap-1 flex-wrap pt-0.5">
                              {link.granted_pages.map((scope) => (
                                <span
                                  key={scope}
                                  className="text-[9px] font-black px-1.5 py-0.2 rounded bg-muted/60 text-muted-foreground border border-border"
                                >
                                  {scope}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </td>

                      <td className="py-3 px-4 text-muted-foreground font-mono text-[11px]">
                        <div>Criado: {formatShortDate(link.created_at)}</div>
                        {link.responded_at && (
                          <div className="text-[10px]">
                            Resp: {formatShortDate(link.responded_at)}
                          </div>
                        )}
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="inline-flex items-center gap-1.5 justify-end">
                          {link.status === 'active' || link.status === 'pending' ? (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() =>
                                setTargetActionLink({
                                  link,
                                  action: 'end',
                                })
                              }
                              className="h-8 px-2.5 text-xs font-bold rounded-xl text-amber-600 border-amber-300 dark:border-amber-900 hover:bg-amber-50 dark:hover:bg-amber-950"
                              title="Forçar encerramento imediato"
                            >
                              <UserX className="w-3.5 h-3.5 mr-1" />
                              Encerrar
                            </Button>
                          ) : null}

                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() =>
                              setTargetActionLink({
                                link,
                                action: 'delete',
                              })
                            }
                            className="h-8 px-2.5 text-xs font-bold rounded-xl text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950 hover:text-rose-600"
                            title="Excluir registro permanentemente"
                          >
                            <Trash2 className="w-3.5 h-3.5 mr-1" />
                            Excluir
                          </Button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* BLOCO 4: SUPORTE TI (DIAGNÓSTICO CONSOLIDADO) */}
      <section className="bg-card border-2 rounded-3xl p-5 sm:p-6 shadow-sm space-y-4 border-l-4 border-l-amber-500">
        <div className="flex items-center gap-2">
          <HelpCircle className="w-5 h-5 text-amber-500" />
          <div>
            <h3 className="text-base font-black text-foreground">
              4. Suporte TI & Diagnóstico de Vínculos
            </h3>
            <p className="text-xs text-muted-foreground font-semibold">
              Consulte chamados de suporte: "por que o profissional não vê meu paciente?"
            </p>
          </div>
        </div>

        <div className="relative max-w-md">
          <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
          <Input
            value={supportQuery}
            onChange={(e) => setSupportQuery(e.target.value)}
            placeholder="Digite e-mail ou nome para diagnóstico..."
            className="pl-9 rounded-2xl border-2 h-11 text-xs"
          />
        </div>

        {!supportResults ? (
          <p className="text-xs text-muted-foreground italic">
            Digite pelo menos 2 caracteres para analisar a situação do usuário.
          </p>
        ) : supportResults.profiles.length === 0 && supportResults.links.length === 0 ? (
          <div className="p-4 rounded-2xl bg-muted/30 border text-xs text-muted-foreground">
            Nenhum vínculo ou perfil profissional localizado para{' '}
            <span className="font-bold text-foreground">"{supportQuery}"</span>.
          </div>
        ) : (
          <div className="space-y-4 pt-2">
            {/* Status do usuário como Profissional */}
            {supportResults.profiles.length > 0 && (
              <div className="space-y-2">
                <span className="text-[11px] font-black uppercase text-muted-foreground">
                  Status de Consultório / Profissional
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {supportResults.profiles.map((p) => (
                    <div
                      key={p.user_id}
                      className="p-3.5 rounded-2xl border bg-muted/10 text-xs space-y-1"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-black text-foreground">{p.display_name}</span>
                        {p.is_professional ? (
                          <span className="text-[10px] font-black text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/30">
                            É Profissional
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                            Usuário Comum
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-muted-foreground">{p.email}</div>
                      <div className="text-[11px] text-[#1CB0F6] font-semibold pt-1">
                        Profissão: {p.profession} {p.register_code ? `(${p.register_code})` : ''}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Vínculos Encontrados */}
            <div className="space-y-2">
              <span className="text-[11px] font-black uppercase text-muted-foreground">
                Vínculos Envolvidos ({supportResults.links.length})
              </span>
              {supportResults.links.length === 0 ? (
                <p className="text-xs text-muted-foreground italic">
                  Nenhum vínculo ativo, pendente ou encerrado para este usuário.
                </p>
              ) : (
                <div className="space-y-2">
                  {supportResults.links.map((link) => (
                    <div
                      key={link.id}
                      className="p-3.5 rounded-2xl border bg-card flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                    >
                      <div>
                        <div className="font-extrabold text-foreground">
                          {link.professional_name}{' '}
                          <span className="text-muted-foreground font-normal">→</span>{' '}
                          {link.patient_name} ({link.patient_email})
                        </div>
                        <div className="text-[11px] text-muted-foreground">
                          Criado em {formatShortDate(link.created_at)}
                          {link.responded_at
                            ? ` • Respondido em ${formatShortDate(link.responded_at)}`
                            : ''}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Badge
                          variant="outline"
                          className={cn(
                            'text-[10px] font-black',
                            link.status === 'active'
                              ? 'border-emerald-500 text-emerald-600 bg-emerald-500/10'
                              : link.status === 'pending'
                                ? 'border-amber-500 text-amber-600 bg-amber-500/10'
                                : 'border-border text-muted-foreground',
                          )}
                        >
                          Status: {link.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </section>

      {/* AlertDialog: Forçar Encerramento ou Excluir Vínculo */}
      <AlertDialog
        open={Boolean(targetActionLink)}
        onOpenChange={(open) => {
          if (!open) setTargetActionLink(null)
        }}
      >
        <AlertDialogContent className="rounded-3xl border-2 max-w-md">
          <AlertDialogHeader>
            <div className="w-12 h-12 rounded-2xl bg-amber-500/15 text-amber-600 flex items-center justify-center mx-auto mb-2">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <AlertDialogTitle className="text-center font-black text-xl">
              {targetActionLink?.action === 'end'
                ? 'Forçar encerramento de vínculo?'
                : 'Excluir vínculo definitivamente?'}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-center text-xs font-semibold text-muted-foreground space-y-2">
              <p>
                {targetActionLink?.action === 'end'
                  ? `O acesso de leitura de ${targetActionLink.link.professional_name} sobre o paciente ${targetActionLink.link.patient_name} será revogado imediatamente.`
                  : `O vínculo entre ${targetActionLink?.link.professional_name} e ${targetActionLink?.link.patient_name} será apagado permanentemente do banco.`}
              </p>
              <p className="text-[11px] text-amber-600 dark:text-amber-400 font-bold">
                Esta ação será auditada e gravada em admin_audit_logs.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2 mt-2">
            <AlertDialogCancel className="rounded-2xl border-2 font-bold flex-1">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleManageLinkConfirm}
              disabled={isManagingLink}
              className={cn(
                'rounded-2xl font-black text-white flex-1 border-b-4',
                targetActionLink?.action === 'end'
                  ? 'bg-amber-600 hover:bg-amber-700 border-amber-800'
                  : 'bg-[#FF4B4B] hover:bg-[#FF4B4B]/90 border-[#CC3C3C]',
              )}
            >
              {isManagingLink
                ? 'Processando...'
                : targetActionLink?.action === 'end'
                  ? 'Sim, forçar encerramento'
                  : 'Sim, excluir vínculo'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* AlertDialog: Conceder/Revogar Perfil Pro */}
      <AlertDialog
        open={Boolean(targetToggleProf)}
        onOpenChange={(open) => {
          if (!open) setTargetToggleProf(null)
        }}
      >
        <AlertDialogContent className="rounded-3xl border-2 max-w-md">
          <AlertDialogHeader>
            <div
              className={cn(
                'w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-2',
                targetToggleProf?.isProf
                  ? 'bg-[#1CB0F6]/15 text-[#1CB0F6]'
                  : 'bg-amber-500/15 text-amber-600',
              )}
            >
              <StethoscopeIcon size={24} />
            </div>
            <AlertDialogTitle className="text-center font-black text-xl">
              {targetToggleProf?.isProf
                ? 'Conceder perfil Profissional?'
                : 'Revogar perfil Profissional?'}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-center text-xs font-semibold text-muted-foreground space-y-2">
              <p>
                {targetToggleProf?.isProf
                  ? `Conceder acesso profissional para ${targetToggleProf.userName}. O usuário poderá acessar o painel /professional e enviar convites para pacientes.`
                  : `Revogar o acesso de ${targetToggleProf?.userName}. ATENÇÃO: todos os vínculos ativos e pendentes deste profissional serão encerrados automaticamente.`}
              </p>
              <p className="text-[11px] text-amber-600 dark:text-amber-400 font-bold">
                Ação auditada em admin_audit_logs via RPC set_user_professional.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2 mt-2">
            <AlertDialogCancel className="rounded-2xl border-2 font-bold flex-1">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleToggleProfConfirm}
              disabled={isTogglingProf}
              className={cn(
                'rounded-2xl font-black text-white flex-1 border-b-4',
                targetToggleProf?.isProf
                  ? 'bg-[#1CB0F6] hover:bg-[#1899d6] border-[#147eb0]'
                  : 'bg-amber-600 hover:bg-amber-700 border-amber-800',
              )}
            >
              {isTogglingProf
                ? 'Salvando...'
                : targetToggleProf?.isProf
                  ? 'Sim, conceder perfil'
                  : 'Sim, revogar perfil'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
