import { useState } from 'react'
import { useAppStore } from '@/stores/useAppStore'
import { EditProfileDialog } from '@/components/profile/edit-profile-dialog'
import { getTodayHabits, calculateStreak } from '@/lib/habit-utils'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/use-auth'
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
          <div className="flex gap-3 mt-4">
            <div className="flex items-center gap-1 text-[#374151] bg-[#FFC800] px-3 py-1 rounded-full text-sm font-extrabold shadow-sm">
              <Flame className="w-4 h-4" /> {maxStreak} dias
            </div>
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
