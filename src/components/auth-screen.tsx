import { useState } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { GameButton } from '@/components/ui/game-button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { GraduationCap } from 'lucide-react'

export function AuthScreen() {
  const { signIn, signUp } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSignUp, setIsSignUp] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    const result = isSignUp ? await signUp(email, password) : await signIn(email, password)
    if (result.error) setError(result.error.message)
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm space-y-6 animate-fade-in-up">
        <div className="text-center space-y-2">
          <div className="w-16 h-16 rounded-3xl bg-primary/15 flex items-center justify-center mx-auto">
            <GraduationCap className="w-9 h-9 text-primary" />
          </div>
          <h1 className="text-2xl font-extrabold">VibeCoding Tarefas</h1>
          <p className="text-muted-foreground font-semibold text-sm">
            {isSignUp ? 'Crie sua conta' : 'Entre na sua conta'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 bg-card rounded-3xl p-6 border">
          <div className="space-y-2">
            <Label className="font-bold">Email</Label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="rounded-2xl font-semibold"
              placeholder="seu@email.com"
              required
            />
          </div>
          <div className="space-y-2">
            <Label className="font-bold">Senha</Label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="rounded-2xl font-semibold"
              placeholder="••••••••"
              required
            />
          </div>
          {error && <p className="text-sm text-red-500 font-semibold">{error}</p>}
          <GameButton type="submit" variant="primary" size="lg" className="w-full">
            {loading ? 'Carregando...' : isSignUp ? 'Criar Conta' : 'Entrar'}
          </GameButton>
        </form>

        <p className="text-center text-sm text-muted-foreground font-semibold">
          {isSignUp ? 'Já tem conta?' : 'Não tem conta?'}{' '}
          <button
            onClick={() => {
              setIsSignUp(!isSignUp)
              setError(null)
            }}
            className="text-primary font-bold hover:underline"
          >
            {isSignUp ? 'Entrar' : 'Criar conta'}
          </button>
        </p>
      </div>
    </div>
  )
}
