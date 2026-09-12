import { useState, useEffect } from 'react'
import { useAppStore } from '@/stores/useAppStore'
import { EditProfileDialog } from '@/components/profile/edit-profile-dialog'
import { getTodayHabits, calculateStreak } from '@/lib/habit-utils'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/use-auth'
import { useIsMaster } from '@/stores/useMasterStore'
import { useProfessionalStore } from '@/stores/useProfessionalStore'
import { StethoscopeIcon } from '@/components/professional/StethoscopeIcon'
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
import {
  User as UserIcon,
  Instagram,
  Twitter,
  Github,
  Linkedin,
  Youtube,
  Globe,
  Flame,
  ChevronRight,
  LogOut,
} from 'lucide-react'

const PLATFORM_ICONS: Record<string, any> = {
  Instagram,
  Twitter,
  GitHub: Github,
  LinkedIn: Linkedin,
  YouTube: Youtube,
  Website: Globe,
}

export default function Profile() {
  const { user, tasks, habits } = useAppStore()
  const { signOut } = useAuth()
  const navigate = useNavigate()
  const { isMaster, isProfessional } = useIsMaster()
  const {
    incomingInvites,
    myProfessionals,
    loadPatientConsentData,
    respondPatientInvite,
    endPatientLink,
  } = useProfessionalStore()

  useEffect(() => {
    loadPatientConsentData()
  }, [loadPatientConsentData])

  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  const handleLogout = async () => {
    setIsLoggingOut(true)
    try {
      await signOut()
      navigate('/', { replace: true })
    } finally {
      setIsLoggingOut(false)
      setLogoutDialogOpen(false)
    }
  }

  const today = new Date().toISOString().split('T')[0]
  const todayTasks = tasks.filter((t) => t.dueDate === today)
  const completedTasks = todayTasks.filter((t) => t.completed)
  const todayHabits = getTodayHabits(habits)
  const completedHabits = todayHabits.filter((h) => h.completions.includes(today))
  const maxStreak = Math.max(0, ...habits.map((h) => calculateStreak(h.completions)))

  const stats = [
    { label: 'Hábitos e Tarefas Hoje', value: `${completedTasks.length}/${todayTasks.length}` },
    { label: 'Hábitos Hoje', value: `${completedHabits.length}/${todayHabits.length}` },
    { label: 'Sequência', value: `${maxStreak} dias` },
  ]

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in-up pb-10">
      <div className="bg-card rounded-3xl border shadow-sm overflow-hidden">
        <div className="h-28 bg-gradient-to-r from-[#58CC02] via-[#1CB0F6] to-[#FFC800]" />
        <div className="px-6 pb-6">
          <div className="-mt-12 mb-4 flex justify-between items-end">
            <div className="w-24 h-24 rounded-full border-4 border-card bg-muted overflow-hidden shadow-md">
              {user.avatar ? (
                <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-[#58CC02]/15">
                  <UserIcon className="w-10 h-10 text-[#58CC02]" strokeWidth={2} />
                </div>
              )}
            </div>
            <EditProfileDialog />
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight">{user.name}</h1>
          <p className="text-[#1CB0F6] font-bold">{user.handle}</p>
          {user.bio && (
            <p className="text-muted-foreground mt-2 font-semibold leading-relaxed">{user.bio}</p>
          )}
          <div className="flex flex-wrap items-center gap-2 mt-4">
            <div className="flex items-center gap-1 text-[#374151] bg-[#FFC800] px-3 py-1 rounded-full text-sm font-extrabold shadow-sm">
              <Flame className="w-4 h-4" /> {maxStreak} dias
            </div>

            {/* Badges de papel */}
            {isMaster && (
              <Badge className="bg-amber-500 hover:bg-amber-500 text-white font-black text-xs px-3 py-1 rounded-full border-b-2 border-amber-700 flex items-center gap-1">
                <span>👑</span> Master
              </Badge>
            )}

            {isProfessional && (
              <Badge className="bg-[#1CB0F6] hover:bg-[#1CB0F6] text-white font-black text-xs px-3 py-1 rounded-full border-b-2 border-[#1899d6] flex items-center gap-1">
                <StethoscopeIcon size={14} /> Profissional
              </Badge>
            )}
          </div>
          <div className="grid grid-cols-3 gap-3 mt-6">
            {stats.map((s) => (
              <div key={s.label} className="bg-muted/50 rounded-2xl p-4 text-center">
                <div className="text-lg font-extrabold">{s.value}</div>
                <div className="text-[10px] text-muted-foreground font-bold uppercase tracking-wide">
                  {s.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* SEÇÃO: CONVITES DE PROFISSIONAIS (CONSENTIMENTO) */}
      <div className="bg-card rounded-3xl border shadow-sm p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-[#1CB0F6]/15 text-[#1CB0F6] flex items-center justify-center">
              <StethoscopeIcon size={20} />
            </div>
            <div>
              <h2 className="text-base font-black text-foreground">Convites de Profissionais</h2>
              <p className="text-xs text-muted-foreground">
                Profissionais de saúde solicitando acesso de acompanhamento ao seu prontuário
              </p>
            </div>
          </div>

          {incomingInvites.length > 0 && (
            <Badge className="bg-amber-400 text-amber-950 font-black text-xs rounded-full">
              {incomingInvites.length} pendente(s)
            </Badge>
          )}
        </div>

        {incomingInvites.length === 0 ? (
          <p className="text-xs text-muted-foreground italic py-2">
            Nenhum convite pendente no momento.
          </p>
        ) : (
          <div className="space-y-2.5 pt-1">
            {incomingInvites.map((invite) => (
              <div
                key={invite.id}
                className="p-4 rounded-2xl border-2 bg-muted/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
              >
                <div className="space-y-0.5">
                  <div className="font-black text-sm text-foreground">
                    {invite.professional_name}
                  </div>
                  <div className="text-xs font-semibold text-[#1CB0F6]">
                    {invite.professional_profession}
                    {invite.professional_register ? ` • ${invite.professional_register}` : ''}
                  </div>
                  <p className="text-[11px] text-muted-foreground pt-1">
                    Solicitou acesso de leitura às suas medições, exames e metas corporais.
                  </p>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => respondPatientInvite(invite.id, false)}
                    className="rounded-xl h-9 text-xs font-bold text-rose-600 border-rose-300 dark:border-rose-900 hover:bg-rose-50 dark:hover:bg-rose-950"
                  >
                    Recusar
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => respondPatientInvite(invite.id, true)}
                    className="rounded-xl h-9 text-xs font-black bg-[#58CC02] hover:bg-[#46a302] text-white border-b-2 border-[#46a302] active:border-b-0 active:translate-y-0.5"
                  >
                    Aceitar Convite
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* SEÇÃO: MEUS PROFISSIONAIS */}
      <div className="bg-card rounded-3xl border shadow-sm p-5 space-y-3">
        <h2 className="text-base font-black text-foreground">Meus Profissionais Vinculados</h2>
        <p className="text-xs text-muted-foreground">
          Profissionais com autorização ativa para visualizar seu progresso de saúde. Você pode
          encerrar o vínculo a qualquer momento.
        </p>

        {myProfessionals.length === 0 ? (
          <p className="text-xs text-muted-foreground italic py-2">
            Nenhum profissional vinculado atualmente.
          </p>
        ) : (
          <div className="space-y-2 pt-1">
            {myProfessionals.map((link) => (
              <div
                key={link.id}
                className="p-3.5 rounded-2xl border bg-muted/10 flex items-center justify-between gap-3 text-xs"
              >
                <div>
                  <div className="font-bold text-foreground">{link.professional_name}</div>
                  <div className="text-[11px] text-muted-foreground">
                    {link.professional_profession}
                    {link.professional_register ? ` • ${link.professional_register}` : ''}
                  </div>
                </div>

                {link.status === 'active' ? (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => endPatientLink(link.id)}
                    className="h-8 text-xs font-bold text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950 rounded-xl"
                  >
                    Encerrar vínculo
                  </Button>
                ) : (
                  <span className="text-[11px] text-muted-foreground font-semibold">Encerrado</span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {user.socialLinks.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-extrabold px-1">Links</h2>
          {user.socialLinks.map((link) => {
            const Icon = PLATFORM_ICONS[link.platform] || Globe
            return (
              <a
                key={link.id}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 bg-card border rounded-3xl p-4 shadow-sm hover:shadow-md transition-all active:translate-y-0.5 border-b-4"
              >
                <div className="w-11 h-11 rounded-2xl bg-[#1CB0F6]/15 flex items-center justify-center shrink-0">
                  <Icon className="w-5 h-5 text-[#1CB0F6]" strokeWidth={2} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-extrabold">{link.platform}</div>
                  <div className="text-xs text-muted-foreground font-semibold truncate">
                    {link.url}
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground shrink-0" />
              </a>
            )
          })}
        </div>
      )}

      <Link
        to="/settings"
        className="block text-center text-sm font-bold text-[#1CB0F6] hover:underline"
      >
        Ir para Configurações
      </Link>

      {/* Botão Deslogar do Sistema - Duolingo 3D Vermelho (#FF4B4B) com ícone LogOut */}
      <div className="pt-2">
        <button
          type="button"
          onClick={() => setLogoutDialogOpen(true)}
          className="w-full flex items-center justify-center gap-2 py-3.5 px-6 rounded-3xl bg-[#FF4B4B] hover:bg-[#FF4B4B]/90 active:translate-y-1 active:border-b-0 border-b-4 border-[#CC3C3C] text-white font-black text-sm transition-all duration-100 shadow-sm cursor-pointer select-none"
        >
          <LogOut className="w-4 h-4" />
          <span>Deslogar do Sistema</span>
        </button>
      </div>

      <AlertDialog open={logoutDialogOpen} onOpenChange={setLogoutDialogOpen}>
        <AlertDialogContent className="rounded-3xl border-2 max-w-sm">
          <AlertDialogHeader>
            <div className="w-12 h-12 rounded-2xl bg-[#FF4B4B]/15 text-[#FF4B4B] flex items-center justify-center mx-auto mb-2">
              <LogOut className="w-6 h-6" />
            </div>
            <AlertDialogTitle className="text-center font-black text-xl">
              Tem certeza que quer sair?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-center text-xs font-semibold text-muted-foreground">
              Sua sessão atual será encerrada e você retornará à página inicial.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2 mt-2">
            <AlertDialogCancel className="rounded-2xl border-2 font-bold flex-1">
              Continuar no app
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="rounded-2xl font-black bg-[#FF4B4B] hover:bg-[#FF4B4B]/90 border-b-4 border-[#CC3C3C] text-white flex-1"
            >
              {isLoggingOut ? 'Saindo...' : 'Sim, deslogar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
