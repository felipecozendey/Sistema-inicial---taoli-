import { useAppStore } from '@/stores/useAppStore'
import { useTheme } from 'next-themes'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Moon, Sun, Monitor } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'

export default function Settings() {
  const { user, updateUser } = useAppStore()
  const { theme, setTheme } = useTheme()
  const { toast } = useToast()

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    toast({
      title: 'Ajustes salvos!',
      description: 'Seu perfil no Zenith Bloom foi atualizado.',
    })
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8 animate-fade-in-up">
      <header>
        <h2 className="text-3xl font-bold">Ajustes</h2>
        <p className="text-muted-foreground mt-1">Personalize sua experiência zen.</p>
      </header>

      <section className="bg-card rounded-[2rem] p-6 md:p-8 shadow-sm border space-y-6">
        <h3 className="text-xl font-bold">Aparência</h3>
        <div className="grid grid-cols-3 gap-4">
          <button
            onClick={() => setTheme('light')}
            className={cn(
              'flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all active:scale-95',
              theme === 'light'
                ? 'border-primary bg-primary/10 text-primary'
                : 'border-transparent bg-muted/50 text-muted-foreground hover:bg-muted',
            )}
          >
            <Sun className="w-6 h-6 mb-2" /> <span className="text-sm font-semibold">Claro</span>
          </button>
          <button
            onClick={() => setTheme('dark')}
            className={cn(
              'flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all active:scale-95',
              theme === 'dark'
                ? 'border-primary bg-primary/10 text-primary'
                : 'border-transparent bg-muted/50 text-muted-foreground hover:bg-muted',
            )}
          >
            <Moon className="w-6 h-6 mb-2" /> <span className="text-sm font-semibold">Escuro</span>
          </button>
          <button
            onClick={() => setTheme('system')}
            className={cn(
              'flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all active:scale-95',
              theme === 'system'
                ? 'border-primary bg-primary/10 text-primary'
                : 'border-transparent bg-muted/50 text-muted-foreground hover:bg-muted',
            )}
          >
            <Monitor className="w-6 h-6 mb-2" /> <span className="text-sm font-semibold">Auto</span>
          </button>
        </div>
      </section>

      <section className="bg-card rounded-[2rem] p-6 md:p-8 shadow-sm border">
        <h3 className="text-xl font-bold mb-6">Seu Perfil</h3>
        <form onSubmit={handleSave} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="name">Como prefere ser chamado?</Label>
            <Input
              id="name"
              value={user.name}
              onChange={(e) => updateUser({ name: e.target.value })}
              className="rounded-xl h-12 bg-muted/50 border-transparent focus:bg-background"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="goal">Meta de Tarefas Diárias</Label>
            <Input
              id="goal"
              type="number"
              min="1"
              max="50"
              value={user.dailyGoal}
              onChange={(e) => updateUser({ dailyGoal: parseInt(e.target.value) || 1 })}
              className="rounded-xl h-12 bg-muted/50 border-transparent focus:bg-background"
            />
          </div>
          <Button
            type="submit"
            className="w-full h-14 rounded-xl text-md font-semibold active:scale-95 transition-transform mt-4"
          >
            Salvar Alterações
          </Button>
        </form>
      </section>
    </div>
  )
}
