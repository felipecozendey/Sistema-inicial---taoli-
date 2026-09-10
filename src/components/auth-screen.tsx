import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { GameButton } from '@/components/ui/game-button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Sparkles, ArrowLeft, CheckCircle2 } from 'lucide-react'
import { useSiteSettingsStore } from '@/stores/useSiteSettingsStore'

export function AuthScreen() {
  const { signIn, signUp, user } = useAuth()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const redirectPath = searchParams.get('redirect') || '/dashboard'

  const { settings, flags, loadSiteData } = useSiteSettingsStore()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSignUp, setIsSignUp] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadSiteData()
  }, [loadSiteData])

  // Se o usuário já estiver logado (ou acabou de logar), redireciona
  useEffect(() => {
    if (user) {
      navigate(redirectPath, { replace: true })
    }
  }, [user, navigate, redirectPath])

  // Se public_signup estiver desativado pela Master, forçar isSignUp para false
  const allowSignup = flags.public_signup !== false
  useEffect(() => {
    if (!allowSignup && isSignUp) {
      setIsSignUp(false)
    }
  }, [allowSignup, isSignUp])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccessMsg(null)
    setLoading(true)

    if (isSignUp) {
      const result = await signUp(email, password)
      if (result.error) {
        setError(result.error.message)
      } else {
        setSuccessMsg(
          'Conta criada com sucesso! Se a confirmação de email estiver ativa, verifique sua caixa de entrada.',
        )
      }
    } else {
      const result = await signIn(email, password)
      if (result.error) {
        setError(result.error.message)
      } else {
        // useAuth atualizará a sessão, disparando o useEffect acima para redirect
        navigate(redirectPath, { replace: true })
      }
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4 relative">
      {/* Botão Voltar para a Landing Page */}
      <div className="absolute top-6 left-6">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-xs font-bold text-muted-foreground hover:text-foreground bg-card border-2 px-3 py-2 rounded-2xl transition-all shadow-sm active:translate-y-0.5"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Voltar para o site</span>
        </Link>
      </div>

      <div className="w-full max-w-sm space-y-6 animate-fade-in-up my-auto">
        <div className="text-center space-y-2">
          <div className="w-16 h-16 rounded-3xl bg-[#58CC02]/15 border-2 border-[#58CC02]/30 flex items-center justify-center mx-auto shadow-sm">
            <Sparkles className="w-8 h-8 text-[#58CC02]" />
          </div>
          <h1 className="text-2xl font-black tracking-tight text-foreground">
            {isSignUp ? 'Criar nova conta' : settings.login_title || 'Bem-vindo de volta!'}
          </h1>
          <p className="text-muted-foreground font-semibold text-xs leading-relaxed max-w-xs mx-auto">
            {isSignUp
              ? 'Comece hoje mesmo sua jornada de produtividade e consistência.'
              : settings.login_subtitle || 'Acesse sua conta para continuar evoluindo suas metas.'}
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-4 bg-card rounded-3xl p-6 border-2 shadow-sm"
        >
          <div className="space-y-2">
            <Label className="font-bold text-xs uppercase tracking-wider text-muted-foreground">
              Email
            </Label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="rounded-2xl font-semibold border-2 h-11"
              placeholder="seu@email.com"
              required
            />
          </div>
          <div className="space-y-2">
            <Label className="font-bold text-xs uppercase tracking-wider text-muted-foreground">
              Senha
            </Label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="rounded-2xl font-semibold border-2 h-11"
              placeholder="••••••••"
              required
            />
          </div>

          {error && (
            <div className="p-3 rounded-2xl bg-red-500/10 border border-red-500/20 text-xs text-red-500 font-bold leading-relaxed">
              {error}
            </div>
          )}

          {successMsg && (
            <div className="p-3 rounded-2xl bg-[#58CC02]/10 border border-[#58CC02]/20 text-xs text-[#58CC02] font-bold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          <GameButton
            type="submit"
            variant="primary"
            size="lg"
            className="w-full text-base font-black shadow-md"
            disabled={loading}
          >
            {loading
              ? 'Carregando...'
              : isSignUp
                ? 'Criar Conta'
                : settings.login_button_label || 'Entrar'}
          </GameButton>
        </form>

        {allowSignup && (
          <p className="text-center text-xs text-muted-foreground font-semibold">
            {isSignUp ? 'Já tem conta?' : 'Não tem conta?'}{' '}
            <button
              type="button"
              onClick={() => {
                setIsSignUp(!isSignUp)
                setError(null)
                setSuccessMsg(null)
              }}
              className="text-[#1CB0F6] font-black hover:underline cursor-pointer"
            >
              {isSignUp ? 'Entrar' : 'Criar conta'}
            </button>
          </p>
        )}

        {settings.login_footer_text && (
          <p className="text-center text-[11px] text-muted-foreground/80 font-medium px-4 leading-relaxed">
            {settings.login_footer_text}
          </p>
        )}
      </div>
    </div>
  )
}
