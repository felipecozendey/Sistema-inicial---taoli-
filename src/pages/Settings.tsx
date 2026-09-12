import { useState, useEffect } from 'react'
import { useTheme } from 'next-themes'
import { useColorTheme } from '@/components/ThemeProvider'
import {
  Moon,
  Sun,
  Monitor,
  Check,
  UserCircle,
  AlertTriangle,
  Sliders,
  ExternalLink,
  ShieldCheck,
  Inbox,
  UserCheck2,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Link } from 'react-router-dom'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { useAppStore } from '@/stores/useAppStore'
import { useProfessionalStore, PatientLink } from '@/stores/useProfessionalStore'
import { useIsMaster } from '@/stores/useMasterStore'
import { StethoscopeIcon } from '@/components/professional/StethoscopeIcon'
import { ConsentScopeModal } from '@/components/professional/ConsentScopeModal'
import { SCOPE_LABELS, SCOPE_BADGE_STYLES } from '@/components/professional/consent-scopes.tsx'
import { safeFormatDate } from '@/lib/date-utils'

export default function Settings() {
  const { theme, setTheme } = useTheme()
  const { colorTheme, setColorTheme } = useColorTheme()
  const { hardReset } = useAppStore()
  const { isProfessional } = useIsMaster()
  const {
    incomingInvites,
    myProfessionals,
    loadPatientConsentData,
    respondPatientInvite,
    updateGrantedPages,
    endPatientLink,
  } = useProfessionalStore()

  const [activeTab, setActiveTab] = useState('general')
  const [resetOpen, setResetOpen] = useState(false)
  const [disconnectLinkId, setDisconnectLinkId] = useState<string | null>(null)
  const [isEnding, setIsEnding] = useState(false)

  // Modais de consentimento granular
  const [acceptingInvite, setAcceptingInvite] = useState<PatientLink | null>(null)
  const [managingLink, setManagingLink] = useState<PatientLink | null>(null)
  const [isSubmittingConsent, setIsSubmittingConsent] = useState(false)

  useEffect(() => {
    loadPatientConsentData()
  }, [loadPatientConsentData])

  const pendingInvitesCount = incomingInvites.length

  const handleEndLinkConfirm = async () => {
    if (!disconnectLinkId) return
    setIsEnding(true)
    try {
      await endPatientLink(disconnectLinkId)
    } finally {
      setIsEnding(false)
      setDisconnectLinkId(null)
    }
  }

  const selectedDisconnectLink = myProfessionals.find((l) => l.id === disconnectLinkId)

  const handleOpenAcceptModal = (invite: PatientLink) => {
    setAcceptingInvite(invite)
  }

  const handleConfirmAccept = async (grantedPages: string[]) => {
    if (!acceptingInvite) return
    setIsSubmittingConsent(true)
    try {
      const ok = await respondPatientInvite(acceptingInvite.id, true, grantedPages)
      if (ok) {
        setAcceptingInvite(null)
      }
    } finally {
      setIsSubmittingConsent(false)
    }
  }

  const handleRejectInvite = async (linkId: string) => {
    setIsSubmittingConsent(true)
    try {
      const ok = await respondPatientInvite(linkId, false)
      if (ok && acceptingInvite?.id === linkId) {
        setAcceptingInvite(null)
      }
    } finally {
      setIsSubmittingConsent(false)
    }
  }

  const handleConfirmManage = async (grantedPages: string[]) => {
    if (!managingLink) return
    setIsSubmittingConsent(true)
    try {
      const ok = await updateGrantedPages(managingLink.id, grantedPages)
      if (ok) {
        setManagingLink(null)
      }
    } finally {
      setIsSubmittingConsent(false)
    }
  }

  const themeOptions = [
    { value: 'light' as const, label: 'Claro', icon: Sun },
    { value: 'dark' as const, label: 'Escuro', icon: Moon },
    { value: 'system' as const, label: 'Auto', icon: Monitor },
  ]

  const colorThemes = [
    { value: 'default' as const, label: 'Zenith Bloom', colors: ['#58CC02', '#FFC800', '#1CB0F6'] },
    { value: 'ocean' as const, label: 'Oceano', colors: ['#0284c7', '#06b6d4', '#38bdf8'] },
    { value: 'forest' as const, label: 'Floresta', colors: ['#4d7c0f', '#059669', '#84cc16'] },
    { value: 'sunset' as const, label: 'Sunset', colors: ['#FF6B35', '#F72585', '#FFB627'] },
    { value: 'midnight' as const, label: 'Midnight', colors: ['#00E5FF', '#0288D1', '#26C6DA'] },
    { value: 'cyberpunk' as const, label: 'Cyberpunk', colors: ['#FF00FF', '#FFFF00', '#00E5FF'] },
  ]

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in-up pb-12">
      <header>
        <h2 className="text-3xl font-extrabold tracking-tight">Ajustes</h2>
        <p className="text-muted-foreground mt-1 font-semibold text-sm">
          Personalize sua experiência e gerencie preferências da sua conta.
        </p>
      </header>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        {/* Chips roláveis no mobile sem quebra ou corte em 360px */}
        <div className="overflow-x-auto pb-1 -mx-1 px-1">
          <TabsList className="inline-flex w-auto min-w-full sm:min-w-0 p-1.5 rounded-2xl bg-muted/60 border-2 gap-1.5">
            <TabsTrigger
              value="general"
              className="rounded-xl px-4 py-2 text-xs sm:text-sm font-black transition-all data-[state=active]:bg-[#58CC02] data-[state=active]:text-white data-[state=active]:shadow-sm flex items-center gap-2"
            >
              <Sliders className="w-4 h-4" />
              <span>Geral</span>
            </TabsTrigger>

            <TabsTrigger
              value="professionals"
              className="rounded-xl px-4 py-2 text-xs sm:text-sm font-black transition-all data-[state=active]:bg-[#1CB0F6] data-[state=active]:text-white data-[state=active]:shadow-sm flex items-center gap-2"
            >
              <StethoscopeIcon size={16} />
              <span>Profissionais</span>
              {pendingInvitesCount > 0 && (
                <span
                  className={cn(
                    'px-1.5 py-0.5 rounded-full text-[10px] font-black border leading-none transition-colors',
                    activeTab === 'professionals'
                      ? 'bg-white text-[#1CB0F6] border-white'
                      : 'bg-[#1CB0F6] text-white border-[#1CB0F6]',
                  )}
                >
                  {pendingInvitesCount}
                </span>
              )}
            </TabsTrigger>
          </TabsList>
        </div>

        {/* ABA: GERAL */}
        <TabsContent value="general" className="mt-6 space-y-8">
          <section className="bg-card rounded-3xl p-6 md:p-8 shadow-sm border space-y-6">
            <h3 className="text-xl font-extrabold">Aparência</h3>
            <div className="grid grid-cols-3 gap-3 sm:gap-4">
              {themeOptions.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setTheme(opt.value)}
                  className={cn(
                    'flex flex-col items-center justify-center p-3.5 sm:p-4 rounded-2xl border-2 border-b-4 font-bold transition-all active:translate-y-1 active:border-b-0 cursor-pointer',
                    theme === opt.value
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-[#E5E5E5] dark:border-[#3B4A55] bg-muted/50 text-muted-foreground hover:bg-muted',
                  )}
                >
                  <opt.icon className="w-6 h-6 mb-2" strokeWidth={2.5} />
                  <span className="text-xs sm:text-sm font-bold">{opt.label}</span>
                </button>
              ))}
            </div>
          </section>

          <section className="bg-card rounded-3xl p-6 md:p-8 shadow-sm border space-y-6">
            <h3 className="text-xl font-extrabold">Tema de Cores</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              {colorThemes.map((ct) => (
                <button
                  key={ct.value}
                  onClick={() => setColorTheme(ct.value)}
                  className={cn(
                    'relative flex flex-col items-center gap-3 p-4 sm:p-5 rounded-2xl border-2 border-b-4 transition-all active:translate-y-1 active:border-b-0 cursor-pointer',
                    colorTheme === ct.value
                      ? 'border-primary bg-primary/10'
                      : 'border-[#E5E5E5] dark:border-[#3B4A55] hover:bg-muted/50',
                  )}
                >
                  {colorTheme === ct.value && (
                    <span className="absolute top-2 right-2 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                      <Check className="w-3 h-3 text-primary-foreground" strokeWidth={3} />
                    </span>
                  )}
                  <div className="flex gap-2">
                    {ct.colors.map((c) => (
                      <span
                        key={c}
                        className="w-7 h-7 rounded-full border-2 border-white dark:border-[#3B4A55] shadow-sm"
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
                  <span className="text-xs sm:text-sm font-bold">{ct.label}</span>
                </button>
              ))}
            </div>
          </section>

          <Link
            to="/profile"
            className="flex items-center gap-3 bg-card rounded-3xl p-5 sm:p-6 shadow-sm border border-b-4 hover:shadow-md transition-all active:translate-y-1"
          >
            <div className="w-12 h-12 rounded-2xl bg-[#1CB0F6]/15 flex items-center justify-center shrink-0">
              <UserCircle className="w-6 h-6 text-[#1CB0F6]" strokeWidth={2} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-extrabold text-foreground">Gerenciar Perfil</div>
              <div className="text-xs sm:text-sm text-muted-foreground font-semibold truncate">
                Edite seu perfil, bio e links sociais
              </div>
            </div>
          </Link>

          <section className="bg-card rounded-3xl p-6 md:p-8 shadow-sm border-2 border-[#FF4B4B]/30 space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[#FF4B4B]/15 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-6 h-6 text-[#FF4B4B]" strokeWidth={2.5} />
              </div>
              <h3 className="text-xl font-extrabold text-[#FF4B4B]">Zona de Perigo</h3>
            </div>

            <AlertDialog open={resetOpen} onOpenChange={setResetOpen}>
              <AlertDialogTrigger asChild>
                <button className="w-full flex items-center justify-center gap-2 px-6 py-4 rounded-2xl bg-[#FF4B4B] text-white font-extrabold border-2 border-b-4 border-[#DC2626] active:translate-y-1 active:border-b-0 transition-all cursor-pointer">
                  <AlertTriangle className="w-5 h-5" strokeWidth={2.5} />
                  Apagar Todos os Meus Dados
                </button>
              </AlertDialogTrigger>
              <AlertDialogContent className="rounded-3xl border-2">
                <AlertDialogHeader>
                  <AlertDialogTitle className="text-2xl font-extrabold">
                    Tem certeza?
                  </AlertDialogTitle>
                  <AlertDialogDescription className="text-sm sm:text-base font-semibold text-muted-foreground">
                    Tem certeza? Isso apagará permanentemente todas as suas tarefas, hábitos, notas,
                    flashcards e registros de saúde do Supabase e do cache local.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel className="rounded-2xl font-bold border-2">
                    Cancelar
                  </AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => hardReset()}
                    className="rounded-2xl bg-[#FF4B4B] text-white font-extrabold hover:bg-[#DC2626] border-b-4 border-[#CC3C3C]"
                  >
                    Sim, apagar tudo
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </section>
        </TabsContent>

        {/* ABA: PROFISSIONAIS */}
        <TabsContent value="professionals" className="mt-6 space-y-6">
          {/* Card Principal Unificado */}
          <div className="bg-card rounded-3xl border-2 shadow-sm p-5 sm:p-7 space-y-6">
            {/* Cabeçalho */}
            <div className="flex items-start sm:items-center justify-between gap-3 border-b pb-5">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-[#1CB0F6]/15 text-[#1CB0F6] flex items-center justify-center shrink-0 border border-[#1CB0F6]/30">
                  <StethoscopeIcon size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-black text-foreground">Profissionais de Saúde</h3>
                  <p className="text-xs text-muted-foreground font-semibold mt-0.5">
                    Controle de consentimento e compartilhamento de leitura do seu prontuário
                    clínico.
                  </p>
                </div>
              </div>

              {pendingInvitesCount > 0 && (
                <Badge className="bg-[#1CB0F6] hover:bg-[#1CB0F6] text-white font-black text-xs rounded-full px-2.5 py-1 shrink-0 border-b-2 border-[#1899d6]">
                  {pendingInvitesCount} pendente(s)
                </Badge>
              )}
            </div>

            {/* Banner Discreto para Usuário Profissional */}
            {isProfessional && (
              <div className="p-4 rounded-2xl bg-[#1CB0F6]/10 border-2 border-[#1CB0F6]/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-[#1CB0F6] text-white flex items-center justify-center shrink-0">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs sm:text-sm font-black text-foreground">
                      Você possui perfil profissional ativo
                    </div>
                    <p className="text-[11px] text-muted-foreground font-semibold">
                      Acesse a gestão de consultas, prontuários e pacientes pelo painel dedicado.
                    </p>
                  </div>
                </div>

                <Link
                  to="/professional"
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#1CB0F6] hover:bg-[#1899d6] text-white text-xs font-black border-b-2 border-[#147eb0] active:border-b-0 active:translate-y-0.5 transition-all shrink-0"
                >
                  <span>Abrir Painel Pro</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </Link>
              </div>
            )}

            {/* Bloco 1: Convites Recebidos (Pendentes) */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Inbox className="w-4 h-4 text-[#1CB0F6]" />
                  <h4 className="text-sm font-black uppercase tracking-wider text-foreground">
                    Convites Recebidos
                  </h4>
                </div>
                <span className="text-[11px] font-bold text-muted-foreground">
                  {incomingInvites.length} pendente(s)
                </span>
              </div>

              {incomingInvites.length === 0 ? (
                <div className="py-8 px-4 text-center rounded-2xl border-2 border-dashed bg-muted/20 space-y-1.5">
                  <p className="text-xs font-extrabold text-foreground">Nenhum convite pendente</p>
                  <p className="text-[11px] text-muted-foreground font-semibold max-w-xs mx-auto">
                    Quando um nutricionista, médico ou treinador convidar você para acompanhamento,
                    o pedido aparecerá aqui.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {incomingInvites.map((invite) => {
                    const initials = (invite.professional_name || invite.professional_email || 'P')
                      .slice(0, 2)
                      .toUpperCase()
                    return (
                      <div
                        key={invite.id}
                        className="p-4 rounded-2xl border-2 bg-card hover:bg-muted/10 transition-colors flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs"
                      >
                        <div className="flex items-start gap-3 min-w-0 flex-1">
                          <div className="w-11 h-11 rounded-2xl bg-[#1CB0F6] text-white flex items-center justify-center font-black text-sm shrink-0 shadow-xs mt-0.5">
                            {initials}
                          </div>
                          <div className="space-y-1 min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-black text-sm text-foreground">
                                {invite.professional_name}
                              </span>
                              <Badge
                                variant="outline"
                                className="text-[10px] font-bold text-[#1CB0F6] border-[#1CB0F6]/40 bg-[#1CB0F6]/5"
                              >
                                {invite.professional_profession || 'Profissional da Saúde'}
                              </Badge>
                            </div>
                            {invite.professional_email && (
                              <div className="text-xs text-muted-foreground font-medium">
                                {invite.professional_email}
                              </div>
                            )}
                            <div className="flex items-center gap-2 flex-wrap text-xs text-muted-foreground font-semibold">
                              {invite.professional_register && (
                                <span>Reg: {invite.professional_register}</span>
                              )}
                              {invite.professional_specialty && (
                                <span>• {invite.professional_specialty}</span>
                              )}
                              {invite.professional_clinic && (
                                <span>• {invite.professional_clinic}</span>
                              )}
                              <span className="text-[11px] text-muted-foreground/80">
                                • {safeFormatDate(invite.created_at)}
                              </span>
                            </div>
                            <p className="text-[11px] text-muted-foreground font-medium pt-0.5">
                              Solicitou permissão para acompanhar sua evolução no app. Você decide
                              quais áreas liberar ao aceitar.
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 self-stretch sm:self-center justify-end shrink-0 pt-2 sm:pt-0">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleRejectInvite(invite.id)}
                            disabled={isSubmittingConsent}
                            className="rounded-xl h-9 px-3 text-xs font-bold text-rose-600 border-rose-300 dark:border-rose-900 hover:bg-rose-50 dark:hover:bg-rose-950 flex-1 sm:flex-initial"
                          >
                            Recusar
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => handleOpenAcceptModal(invite)}
                            disabled={isSubmittingConsent}
                            className="rounded-xl h-9 px-4 text-xs font-black bg-[#58CC02] hover:bg-[#46a302] text-white border-b-2 border-[#46a302] active:border-b-0 active:translate-y-0.5 flex-1 sm:flex-initial"
                          >
                            Aceitar Convite
                          </Button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Bloco 2: Profissionais Vinculados */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <UserCheck2 className="w-4 h-4 text-[#58CC02]" />
                  <h4 className="text-sm font-black uppercase tracking-wider text-foreground">
                    Profissionais Vinculados
                  </h4>
                </div>
                <span className="text-[11px] font-bold text-muted-foreground">
                  {myProfessionals.filter((p) => p.status === 'active').length} ativo(s)
                </span>
              </div>

              {myProfessionals.length === 0 ? (
                <div className="py-8 px-4 text-center rounded-2xl border-2 border-dashed bg-muted/20 space-y-1.5">
                  <p className="text-xs font-extrabold text-foreground">
                    Nenhum profissional vinculado
                  </p>
                  <p className="text-[11px] text-muted-foreground font-semibold max-w-xs mx-auto">
                    Você ainda não possui vínculos ativos com profissionais de saúde.
                  </p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {myProfessionals.map((link) => {
                    const initials = (link.professional_name || link.professional_email || 'P')
                      .slice(0, 2)
                      .toUpperCase()
                    const granted = Array.isArray(link.granted_pages) ? link.granted_pages : []

                    return (
                      <div
                        key={link.id}
                        className="p-4 rounded-2xl border-2 bg-card flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-xs"
                      >
                        <div className="flex items-start gap-3 min-w-0 flex-1">
                          <div className="w-10 h-10 rounded-2xl bg-[#1CB0F6] text-white flex items-center justify-center font-black text-xs shrink-0 shadow-xs mt-0.5">
                            {initials}
                          </div>
                          <div className="space-y-1.5 min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-extrabold text-sm text-foreground">
                                {link.professional_name}
                              </span>
                              <span
                                className={cn(
                                  'text-[10px] font-bold px-2 py-0.5 rounded-full',
                                  link.status === 'active'
                                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                                    : 'bg-muted text-muted-foreground',
                                )}
                              >
                                {link.status === 'active' ? 'Ativo' : 'Encerrado'}
                              </span>
                            </div>

                            <div className="text-[11px] text-muted-foreground font-semibold flex items-center gap-2 flex-wrap">
                              <span>{link.professional_profession}</span>
                              {link.professional_register && (
                                <span>• Reg. {link.professional_register}</span>
                              )}
                              {link.professional_email && (
                                <span className="font-normal">• {link.professional_email}</span>
                              )}
                            </div>

                            {/* Badges com as permissões concedidas */}
                            {link.status === 'active' && (
                              <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                                <span className="text-[10px] font-bold text-muted-foreground mr-1">
                                  Áreas liberadas:
                                </span>
                                {granted.length === 0 ? (
                                  <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 rounded-full">
                                    Nenhuma área
                                  </span>
                                ) : (
                                  granted.map((scope) => {
                                    const label = SCOPE_LABELS[scope] || scope
                                    const style = SCOPE_BADGE_STYLES[scope] || {
                                      bg: 'bg-muted',
                                      text: 'text-foreground',
                                      border: 'border-border',
                                    }
                                    return (
                                      <span
                                        key={scope}
                                        className={cn(
                                          'text-[10px] font-black px-2 py-0.5 rounded-full border',
                                          style.bg,
                                          style.text,
                                          style.border,
                                        )}
                                      >
                                        {label}
                                      </span>
                                    )
                                  })
                                )}
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 self-stretch sm:self-center justify-end shrink-0 pt-2 sm:pt-0">
                          {link.status === 'active' ? (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setManagingLink(link)}
                                className="h-9 text-xs font-bold border-2 rounded-xl border-[#1CB0F6]/40 text-[#1CB0F6] hover:bg-[#1CB0F6]/10"
                              >
                                Gerenciar Acesso
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => setDisconnectLinkId(link.id)}
                                className="h-9 text-xs font-bold text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950 rounded-xl"
                              >
                                Encerrar vínculo
                              </Button>
                            </>
                          ) : (
                            <span className="text-[11px] text-muted-foreground font-bold">
                              Encerrado
                            </span>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Dialog de Aceite com Escolha de Permissões */}
      <ConsentScopeModal
        open={Boolean(acceptingInvite)}
        onOpenChange={(open) => {
          if (!open) setAcceptingInvite(null)
        }}
        link={acceptingInvite}
        mode="accept"
        onConfirm={handleConfirmAccept}
        onReject={acceptingInvite ? () => handleRejectInvite(acceptingInvite.id) : undefined}
        isSubmitting={isSubmittingConsent}
      />

      {/* Dialog de Gestão/Edição de Permissões para Vínculo Ativo */}
      <ConsentScopeModal
        open={Boolean(managingLink)}
        onOpenChange={(open) => {
          if (!open) setManagingLink(null)
        }}
        link={managingLink}
        mode="manage"
        onConfirm={handleConfirmManage}
        isSubmitting={isSubmittingConsent}
      />

      {/* AlertDialog de Confirmação para Encerrar Vínculo */}
      <AlertDialog
        open={Boolean(disconnectLinkId)}
        onOpenChange={(open) => {
          if (!open) setDisconnectLinkId(null)
        }}
      >
        <AlertDialogContent className="rounded-3xl border-2 max-w-md">
          <AlertDialogHeader>
            <div className="w-12 h-12 rounded-2xl bg-rose-500/15 text-rose-600 flex items-center justify-center mx-auto mb-2">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <AlertDialogTitle className="text-center font-black text-xl">
              Encerrar vínculo profissional?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-center text-xs font-semibold text-muted-foreground">
              {selectedDisconnectLink?.professional_name
                ? `${selectedDisconnectLink.professional_name} perderá imediatamente o acesso de leitura ao seu prontuário clínico e histórico de evolução.`
                : 'O profissional perderá imediatamente o acesso ao seu histórico.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2 mt-2">
            <AlertDialogCancel className="rounded-2xl border-2 font-bold flex-1">
              Manter vínculo
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleEndLinkConfirm}
              disabled={isEnding}
              className="rounded-2xl font-black bg-[#FF4B4B] hover:bg-[#FF4B4B]/90 border-b-4 border-[#CC3C3C] text-white flex-1"
            >
              {isEnding ? 'Encerrando...' : 'Sim, encerrar vínculo'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
