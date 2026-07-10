import { useState } from 'react'
import { useTheme } from 'next-themes'
import { useColorTheme } from '@/components/ThemeProvider'
import { TagManager } from '@/components/tags/tag-manager'
import { Moon, Sun, Monitor, Check, UserCircle, AlertTriangle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Link } from 'react-router-dom'
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

export default function Settings() {
  const { theme, setTheme } = useTheme()
  const { colorTheme, setColorTheme } = useColorTheme()
  const { hardReset } = useAppStore()
  const [resetOpen, setResetOpen] = useState(false)

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
    <div className="max-w-2xl mx-auto space-y-8 animate-fade-in-up">
      <header>
        <h2 className="text-3xl font-extrabold">Ajustes</h2>
        <p className="text-muted-foreground mt-1 font-semibold">Personalize sua experiência.</p>
      </header>

      <section className="bg-card rounded-3xl p-6 md:p-8 shadow-sm border space-y-6">
        <h3 className="text-xl font-extrabold">Aparência</h3>
        <div className="grid grid-cols-3 gap-4">
          {themeOptions.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setTheme(opt.value)}
              className={cn(
                'flex flex-col items-center justify-center p-4 rounded-2xl border-2 border-b-4 font-bold transition-all active:translate-y-1 active:border-b-0',
                theme === opt.value
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-[#E5E5E5] dark:border-[#3B4A55] bg-muted/50 text-muted-foreground hover:bg-muted',
              )}
            >
              <opt.icon className="w-6 h-6 mb-2" strokeWidth={2.5} />
              <span className="text-sm font-bold">{opt.label}</span>
            </button>
          ))}
        </div>
      </section>

      <section className="bg-card rounded-3xl p-6 md:p-8 shadow-sm border space-y-6">
        <h3 className="text-xl font-extrabold">Tema de Cores</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {colorThemes.map((ct) => (
            <button
              key={ct.value}
              onClick={() => setColorTheme(ct.value)}
              className={cn(
                'relative flex flex-col items-center gap-3 p-5 rounded-2xl border-2 border-b-4 transition-all active:translate-y-1 active:border-b-0',
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
              <span className="text-sm font-bold">{ct.label}</span>
            </button>
          ))}
        </div>
      </section>

      <Link
        to="/profile"
        className="flex items-center gap-3 bg-card rounded-3xl p-6 shadow-sm border border-b-4 hover:shadow-md transition-all active:translate-y-1"
      >
        <div className="w-12 h-12 rounded-2xl bg-[#1CB0F6]/15 flex items-center justify-center">
          <UserCircle className="w-6 h-6 text-[#1CB0F6]" strokeWidth={2} />
        </div>
        <div>
          <div className="font-extrabold">Gerenciar Perfil</div>
          <div className="text-sm text-muted-foreground font-semibold">
            Edite seu perfil, bio e links sociais
          </div>
        </div>
      </Link>

      <TagManager />

      <section className="bg-card rounded-3xl p-6 md:p-8 shadow-sm border-2 border-[#FF4B4B]/30 space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#FF4B4B]/15 flex items-center justify-center">
            <AlertTriangle className="w-6 h-6 text-[#FF4B4B]" strokeWidth={2.5} />
          </div>
          <h3 className="text-xl font-extrabold text-[#FF4B4B]">Zona de Perigo</h3>
        </div>

        <AlertDialog open={resetOpen} onOpenChange={setResetOpen}>
          <AlertDialogTrigger asChild>
            <button className="w-full flex items-center justify-center gap-2 px-6 py-4 rounded-2xl bg-[#FF4B4B] text-white font-extrabold border-2 border-b-4 border-[#DC2626] active:translate-y-1 active:border-b-0 transition-all">
              <AlertTriangle className="w-5 h-5" strokeWidth={2.5} />
              Apagar Todos os Meus Dados
            </button>
          </AlertDialogTrigger>
          <AlertDialogContent className="rounded-3xl">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-2xl font-extrabold">Tem certeza?</AlertDialogTitle>
              <AlertDialogDescription className="text-base font-semibold">
                Tem certeza? Isso apagará permanentemente todas as suas tarefas, hábitos, notas,
                flashcards e registros de saúde do Supabase e do cache local.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="rounded-2xl font-bold">Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => hardReset()}
                className="rounded-2xl bg-[#FF4B4B] text-white font-extrabold hover:bg-[#DC2626]"
              >
                Sim, apagar tudo
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </section>
    </div>
  )
}
