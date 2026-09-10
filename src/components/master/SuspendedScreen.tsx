import { ShieldAlert, LogOut } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/hooks/use-auth'
import { Link } from 'react-router-dom'

export function SuspendedScreen() {
  const { signOut, user } = useAuth()

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/95 backdrop-blur-sm p-4">
      <div className="max-w-md w-full bg-card border-2 border-red-500/30 rounded-3xl p-6 sm:p-8 text-center shadow-2xl relative overflow-hidden">
        <div className="w-20 h-20 rounded-full bg-red-100 dark:bg-red-950/60 text-red-500 mx-auto flex items-center justify-center mb-6 shadow-inner">
          <ShieldAlert className="w-10 h-10 animate-pulse" />
        </div>

        <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight mb-2">
          Conta Suspensa
        </h1>

        <p className="text-muted-foreground text-sm sm:text-base leading-relaxed mb-4">
          O seu acesso ao <span className="font-semibold text-foreground">VibeCoding Tarefas</span>{' '}
          foi temporariamente bloqueado por um administrador.
        </p>

        <div className="bg-muted/60 rounded-2xl p-4 text-xs text-muted-foreground mb-6 text-left border">
          <p className="font-semibold text-foreground mb-1">Motivo do bloqueio:</p>
          <p>
            Medida de segurança ou pendência cadastral. Para restaurar o acesso, entre em contato
            diretamente com o administrador Master responsável pela organização.
          </p>
          <p className="mt-2 text-[11px] opacity-75">Usuário: {user?.email}</p>
        </div>

        <div className="space-y-3">
          <Button
            onClick={() => signOut()}
            variant="destructive"
            className="w-full rounded-2xl h-12 font-bold border-b-4 border-red-700 active:border-b-0 active:translate-y-1 transition-all"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Encerrar Sessão
          </Button>

          <Link
            to="/settings"
            className="block text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors underline underline-offset-4"
          >
            Acessar Configurações e Perfil
          </Link>
        </div>
      </div>
    </div>
  )
}
