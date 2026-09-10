import { useState, useEffect } from 'react'
import { Profile, AdminAuditLog, useMasterStore } from '@/stores/useMasterStore'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Card } from '@/components/ui/card'
import {
  User,
  KeyRound,
  ShieldCheck,
  History,
  Copy,
  Check,
  Mail,
  Send,
  RefreshCw,
  AlertTriangle,
  Lock,
  Save,
  CheckCircle2,
  ExternalLink,
} from 'lucide-react'
import { toast } from 'sonner'

interface UserDetailsModalProps {
  user: Profile | null
  open: boolean
  onOpenChange: (open: boolean) => void
  currentUserId?: string
}

const AVAILABLE_PERMISSIONS = [
  { key: 'tasks', label: 'Tarefas', description: 'Gestão de tarefas, listas e prazos' },
  { key: 'habits', label: 'Hábitos', description: 'Rastreamento de hábitos diários e sequências' },
  {
    key: 'health',
    label: 'Saúde & Nutrição',
    description: 'Refeições, treinos, hidratação e medidas',
  },
  { key: 'studies', label: 'Estudos', description: 'Cadernos, notas, flashcards e repetição' },
  {
    key: 'finance',
    label: 'Finanças',
    description: 'Lançamentos, contas bancárias e investimentos',
  },
  {
    key: 'analytics',
    label: 'Analytics & Relatórios',
    description: 'Métricas e gráficos consolidados',
  },
]

export function UserDetailsModal({
  user,
  open,
  onOpenChange,
  currentUserId,
}: UserDetailsModalProps) {
  const {
    updateUserProfile,
    resetUserPassword,
    sendPasswordEmail,
    resendConfirmationEmail,
    getUserDetails,
    setUserOverride,
  } = useMasterStore()

  const [activeTab, setActiveTab] = useState<'profile' | 'password' | 'permissions' | 'audit'>(
    'profile',
  )

  // Profile form state
  const [displayName, setDisplayName] = useState('')
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<'master' | 'user'>('user')
  const [status, setStatus] = useState<'active' | 'suspended'>('active')
  const [savingProfile, setSavingProfile] = useState(false)

  // Password state
  const [customPassword, setCustomPassword] = useState('')
  const [generatedPassword, setGeneratedPassword] = useState<string | null>(null)
  const [copiedPassword, setCopiedPassword] = useState(false)
  const [resettingPassword, setResettingPassword] = useState(false)
  const [sendingEmail, setSendingEmail] = useState(false)
  const [resendingConfirm, setResendingConfirm] = useState(false)
  const [lastActionLink, setLastActionLink] = useState<string | null>(null)
  const [copiedLink, setCopiedLink] = useState(false)

  // Overrides & Audit Logs state
  const [overrides, setOverrides] = useState<Record<string, boolean>>({})
  const [auditLogs, setAuditLogs] = useState<AdminAuditLog[]>([])
  const [hasEmailProvider, setHasEmailProvider] = useState<boolean>(false)
  const [loadingDetails, setLoadingDetails] = useState(false)

  const isSelf = Boolean(user && currentUserId && user.id === currentUserId)

  useEffect(() => {
    if (user && open) {
      setDisplayName(user.displayName || '')
      setEmail(user.email)
      setRole(user.role)
      setStatus(user.status)
      setGeneratedPassword(null)
      setCustomPassword('')
      setLastActionLink(null)

      // Fetch user details (overrides + audit)
      setLoadingDetails(true)
      getUserDetails(user.id).then((res) => {
        if (res.ok) {
          setOverrides(res.overrides || {})
          setAuditLogs(res.audit_logs || [])
          setHasEmailProvider(Boolean(res.has_email_provider))
        }
        setLoadingDetails(false)
      })
    }
  }, [user, open, getUserDetails])

  if (!user) return null

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setSavingProfile(true)
    try {
      await updateUserProfile(user.id, {
        display_name: displayName,
        email,
        role,
        status,
      })
    } finally {
      setSavingProfile(false)
    }
  }

  const handleResetPassword = async (generateStrong = false) => {
    setResettingPassword(true)
    try {
      const pwdToSet = generateStrong ? undefined : customPassword.trim()
      const res = await resetUserPassword(user.id, pwdToSet)
      if (res.ok && res.password) {
        setGeneratedPassword(res.password)
        setCustomPassword('')
        setHasEmailProvider(Boolean(res.has_email_provider))
      }
    } finally {
      setResettingPassword(false)
    }
  }

  const handleSendPasswordByEmail = async () => {
    if (!generatedPassword) return
    setSendingEmail(true)
    try {
      const res = await sendPasswordEmail(user.id, generatedPassword)
      if (!res.ok && res.has_email_provider === false) {
        toast.info('Envio de e-mail não configurado — copie a senha e envie manualmente.')
      }
    } finally {
      setSendingEmail(false)
    }
  }

  const handleResendConfirmation = async () => {
    setResendingConfirm(true)
    try {
      const res = await resendConfirmationEmail(user.id)
      if (res.ok && res.action_link) {
        setLastActionLink(res.action_link)
      }
    } finally {
      setResendingConfirm(false)
    }
  }

  const handleCopyPassword = () => {
    if (!generatedPassword) return
    navigator.clipboard.writeText(generatedPassword)
    setCopiedPassword(true)
    setTimeout(() => setCopiedPassword(false), 2000)
    toast.success('Senha copiada para a área de transferência!')
  }

  const handleCopyActionLink = () => {
    if (!lastActionLink) return
    navigator.clipboard.writeText(lastActionLink)
    setCopiedLink(true)
    setTimeout(() => setCopiedLink(false), 2000)
    toast.success('Link copiado para a área de transferência!')
  }

  const handleToggleOverride = async (key: string, currentVal: boolean | undefined) => {
    const nextVal = currentVal === undefined ? false : !currentVal
    // Optimistic
    setOverrides((prev) => ({ ...prev, [key]: nextVal }))
    const res = await setUserOverride(user.id, key, nextVal)
    if (!res.ok) {
      // Rollback
      setOverrides((prev) => ({ ...prev, [key]: Boolean(currentVal) }))
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl border-2 p-0 gap-0">
        <DialogHeader className="p-6 pb-4 border-b bg-muted/20">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/15 border-2 border-amber-500/30 flex items-center justify-center text-amber-500 font-black text-lg">
                {(user.displayName || user.email)[0].toUpperCase()}
              </div>
              <div>
                <DialogTitle className="text-xl font-black text-foreground flex items-center gap-2">
                  <span>{user.displayName || 'Usuário sem nome'}</span>
                  {user.role === 'master' && (
                    <Badge className="bg-amber-500 hover:bg-amber-500 text-white font-extrabold text-[10px] px-2 py-0.5 rounded-full border-b-2 border-amber-700">
                      MASTER
                    </Badge>
                  )}
                  {user.status === 'suspended' && (
                    <Badge
                      variant="destructive"
                      className="font-extrabold text-[10px] px-2 py-0.5 rounded-full"
                    >
                      SUSPENSO
                    </Badge>
                  )}
                </DialogTitle>
                <DialogDescription className="text-xs font-semibold text-muted-foreground mt-0.5">
                  {user.email} • ID: <code className="text-[10px]">{user.id.slice(0, 8)}...</code>
                </DialogDescription>
              </div>
            </div>
          </div>
        </DialogHeader>

        {/* Modal Internal Tabs */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full">
          <div className="px-6 pt-3 border-b bg-background">
            <TabsList className="bg-muted/50 p-1 rounded-2xl border w-full sm:w-auto grid grid-cols-4 sm:flex gap-1 h-auto">
              <TabsTrigger
                value="profile"
                className="rounded-xl font-black text-xs py-2 data-[state=active]:bg-[#58CC02] data-[state=active]:text-white transition-all flex items-center gap-1.5"
              >
                <User className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Perfil</span>
              </TabsTrigger>

              <TabsTrigger
                value="password"
                className="rounded-xl font-black text-xs py-2 data-[state=active]:bg-[#58CC02] data-[state=active]:text-white transition-all flex items-center gap-1.5"
              >
                <KeyRound className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Senha</span>
              </TabsTrigger>

              <TabsTrigger
                value="permissions"
                className="rounded-xl font-black text-xs py-2 data-[state=active]:bg-[#58CC02] data-[state=active]:text-white transition-all flex items-center gap-1.5"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Permissões</span>
              </TabsTrigger>

              <TabsTrigger
                value="audit"
                className="rounded-xl font-black text-xs py-2 data-[state=active]:bg-[#58CC02] data-[state=active]:text-white transition-all flex items-center gap-1.5"
              >
                <History className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Auditoria</span>
              </TabsTrigger>
            </TabsList>
          </div>

          <div className="p-6">
            {/* ABA 1: DADOS DO PERFIL */}
            <TabsContent value="profile" className="m-0 space-y-4">
              <form onSubmit={handleSaveProfile} className="space-y-4">
                <div className="space-y-3">
                  <div>
                    <Label className="text-xs font-bold text-muted-foreground">
                      Nome de Exibição
                    </Label>
                    <Input
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="Ex: Carlos Silva"
                      className="rounded-2xl font-semibold border-2 mt-1"
                    />
                  </div>

                  <div>
                    <Label className="text-xs font-bold text-muted-foreground">E-mail</Label>
                    <Input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="email@dominio.com"
                      className="rounded-2xl font-semibold border-2 mt-1"
                      required
                    />
                    <p className="text-[11px] text-muted-foreground mt-1">
                      A alteração de e-mail atualiza o perfil e as credenciais de autenticação no
                      Supabase Auth.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <div>
                      <Label className="text-xs font-bold text-muted-foreground">
                        Papel (Role)
                      </Label>
                      <select
                        value={role}
                        onChange={(e) => setRole(e.target.value as any)}
                        disabled={isSelf}
                        className="w-full rounded-2xl font-semibold border-2 bg-background text-sm h-10 mt-1 px-3"
                      >
                        <option value="user">Usuário Comum</option>
                        <option value="master">Master (Administrador)</option>
                      </select>
                      {isSelf && (
                        <p className="text-[11px] text-amber-500 mt-1 font-semibold">
                          Auto-rebaixamento bloqueado.
                        </p>
                      )}
                    </div>

                    <div>
                      <Label className="text-xs font-bold text-muted-foreground">
                        Status da Conta
                      </Label>
                      <select
                        value={status}
                        onChange={(e) => setStatus(e.target.value as any)}
                        disabled={isSelf}
                        className="w-full rounded-2xl font-semibold border-2 bg-background text-sm h-10 mt-1 px-3"
                      >
                        <option value="active">Ativo</option>
                        <option value="suspended">Suspenso</option>
                      </select>
                      {isSelf && (
                        <p className="text-[11px] text-amber-500 mt-1 font-semibold">
                          Auto-suspensão bloqueada.
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex justify-end pt-3 border-t">
                  <Button
                    type="submit"
                    disabled={savingProfile}
                    className="rounded-2xl bg-[#58CC02] hover:bg-[#58CC02]/90 border-b-4 border-[#46A302] text-white font-black text-xs h-10 px-5 flex items-center gap-1.5 active:translate-y-0.5 active:border-b-0"
                  >
                    <Save className="w-4 h-4" />
                    <span>{savingProfile ? 'Salvando...' : 'Salvar dados do perfil'}</span>
                  </Button>
                </div>
              </form>
            </TabsContent>

            {/* ABA 2: SENHA & E-MAILS */}
            <TabsContent value="password" className="m-0 space-y-5">
              {/* Box de redefinição */}
              <Card className="p-4 rounded-2xl border-2 space-y-3 bg-muted/10">
                <div className="flex items-center gap-2">
                  <KeyRound className="w-4 h-4 text-amber-500" />
                  <h4 className="font-black text-sm text-foreground">Redefinir Senha</h4>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Defina uma nova senha manualmente ou gere uma senha forte e segura
                  automaticamente. A senha será exibida com segurança uma única vez para cópia.
                </p>

                <div className="space-y-2">
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Input
                      type="text"
                      value={customPassword}
                      onChange={(e) => setCustomPassword(e.target.value)}
                      placeholder="Digitar nova senha (mínimo 8 caracteres)"
                      className="rounded-2xl font-mono text-xs border-2 flex-1"
                    />
                    <Button
                      type="button"
                      disabled={resettingPassword || customPassword.length < 8}
                      onClick={() => handleResetPassword(false)}
                      className="rounded-2xl border-2 font-black text-xs h-10 px-4"
                      variant="outline"
                    >
                      Definir digitada
                    </Button>
                  </div>

                  <Button
                    type="button"
                    disabled={resettingPassword}
                    onClick={() => handleResetPassword(true)}
                    className="w-full rounded-2xl bg-amber-500 hover:bg-amber-600 border-b-4 border-amber-700 text-white font-black text-xs h-10 flex items-center justify-center gap-2"
                  >
                    <RefreshCw
                      className={`w-3.5 h-3.5 ${resettingPassword ? 'animate-spin' : ''}`}
                    />
                    <span>Gerar Senha Forte Aleatória</span>
                  </Button>
                </div>

                {/* Exibição da senha gerada/redefinida */}
                {generatedPassword && (
                  <div className="p-3.5 rounded-2xl bg-amber-500/10 border-2 border-amber-500/30 space-y-2 mt-3 animate-in fade-in">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-black text-amber-600 flex items-center gap-1.5">
                        <Lock className="w-3.5 h-3.5" /> Senha Definida (Exibida uma única vez)
                      </span>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={handleCopyPassword}
                        className="h-7 text-xs font-bold gap-1 rounded-lg"
                      >
                        {copiedPassword ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-[#58CC02]" /> Copiado
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" /> Copiar
                          </>
                        )}
                      </Button>
                    </div>

                    <div className="p-2.5 rounded-xl bg-background border font-mono text-xs text-foreground select-all break-all font-bold">
                      {generatedPassword}
                    </div>

                    <div className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-1">
                      <p className="text-[10px] text-muted-foreground">
                        Copie e envie ao usuário com segurança.
                      </p>
                      <Button
                        type="button"
                        size="sm"
                        disabled={sendingEmail}
                        onClick={handleSendPasswordByEmail}
                        className="rounded-xl bg-[#58CC02] hover:bg-[#58CC02]/90 border-b-2 border-[#46A302] text-white font-bold text-xs h-8 px-3 flex items-center gap-1.5 w-full sm:w-auto"
                      >
                        <Mail className="w-3.5 h-3.5" />
                        <span>{sendingEmail ? 'Enviando...' : 'Enviar por E-mail'}</span>
                      </Button>
                    </div>
                  </div>
                )}
              </Card>

              {/* Box de Confirmação de Acesso */}
              <Card className="p-4 rounded-2xl border-2 space-y-3 bg-muted/10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Send className="w-4 h-4 text-[#1CB0F6]" />
                    <h4 className="font-black text-sm text-foreground">
                      E-mail de Confirmação & Convite
                    </h4>
                  </div>
                  <Badge variant="outline" className="text-[10px] font-bold">
                    {hasEmailProvider ? 'Provedor Ativo' : 'Manual / Fallback'}
                  </Badge>
                </div>

                <p className="text-xs text-muted-foreground leading-relaxed">
                  Gera ou reenvia o link de acesso direto para a conta do usuário. Se o serviço de
                  e-mail não estiver configurado, o link é exibido diretamente para cópia imediata.
                </p>

                <Button
                  type="button"
                  disabled={resendingConfirm}
                  onClick={handleResendConfirmation}
                  className="rounded-2xl border-2 font-bold text-xs h-10 px-4 w-full sm:w-auto flex items-center gap-2"
                  variant="outline"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${resendingConfirm ? 'animate-spin' : ''}`} />
                  <span>Reenviar link de confirmação / convite</span>
                </Button>

                {lastActionLink && (
                  <div className="p-3.5 rounded-2xl bg-[#1CB0F6]/10 border-2 border-[#1CB0F6]/30 space-y-2 mt-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-black text-[#1CB0F6]">
                        Link de confirmação gerado
                      </span>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={handleCopyActionLink}
                        className="h-7 text-xs font-bold gap-1 rounded-lg"
                      >
                        {copiedLink ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-[#58CC02]" /> Copiado
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" /> Copiar Link
                          </>
                        )}
                      </Button>
                    </div>
                    <div className="p-2 rounded-xl bg-background border font-mono text-[11px] text-muted-foreground select-all break-all">
                      {lastActionLink}
                    </div>
                  </div>
                )}
              </Card>
            </TabsContent>

            {/* ABA 3: PERMISSÕES POR PÁGINA (OVERRIDES) */}
            <TabsContent value="permissions" className="m-0 space-y-4">
              <div className="p-3.5 rounded-2xl bg-muted/40 border-2">
                <h4 className="font-black text-xs text-foreground uppercase tracking-wider">
                  Matriz de Acesso do Usuário
                </h4>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Controle individual de quais módulos este usuário pode visualizar no sistema. Por
                  padrão, herda a configuração global (ON).
                </p>
              </div>

              <div className="grid grid-cols-1 gap-2.5">
                {AVAILABLE_PERMISSIONS.map((perm) => {
                  const isOverridden = perm.key in overrides
                  const isEnabled = isOverridden ? overrides[perm.key] : true

                  return (
                    <div
                      key={perm.key}
                      className="p-3.5 rounded-2xl border-2 bg-card flex items-center justify-between gap-3 hover:bg-muted/10 transition-colors"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-black text-xs text-foreground">{perm.label}</span>
                          {isOverridden && (
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-amber-500/15 text-amber-600 border border-amber-500/30">
                              Override Ativo
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-muted-foreground">{perm.description}</p>
                      </div>

                      <Switch
                        checked={isEnabled}
                        onCheckedChange={() => handleToggleOverride(perm.key, overrides[perm.key])}
                        className="data-[state=checked]:bg-[#58CC02]"
                      />
                    </div>
                  )
                })}
              </div>
            </TabsContent>

            {/* ABA 4: AUDITORIA DO USUÁRIO (PRIVACIDADE ABSOLUTA) */}
            <TabsContent value="audit" className="m-0 space-y-3">
              <div className="p-3.5 rounded-2xl bg-amber-500/10 border-2 border-amber-500/20 flex items-start gap-2.5">
                <ShieldCheck className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-black text-xs text-foreground">Privacidade Absoluta</h4>
                  <p className="text-[11px] text-muted-foreground leading-relaxed mt-0.5">
                    Esta aba lista <strong>somente ações administrativas</strong> realizadas para
                    esta conta (quem fez, o quê e quando). O Master nunca tem acesso a dados
                    privados ou conteúdo inserido pelo usuário (tarefas, finanças, saúde, etc.).
                  </p>
                </div>
              </div>

              {loadingDetails ? (
                <div className="py-8 text-center text-xs text-muted-foreground">
                  Carregando registros de auditoria...
                </div>
              ) : auditLogs.length === 0 ? (
                <div className="py-8 text-center text-xs text-muted-foreground font-semibold">
                  Nenhuma ação administrativa registrada para este usuário até o momento.
                </div>
              ) : (
                <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                  {auditLogs.map((log) => (
                    <div
                      key={log.id}
                      className="p-3 rounded-2xl border bg-muted/20 text-xs space-y-1"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-black text-foreground">{log.action}</span>
                        <span className="text-[10px] text-muted-foreground font-semibold">
                          {new Date(log.createdAt).toLocaleString('pt-BR')}
                        </span>
                      </div>
                      <p className="text-[11px] text-muted-foreground">
                        Por:{' '}
                        <span className="font-semibold text-foreground">
                          {log.actorEmail || log.actorId}
                        </span>
                      </p>
                      {log.details && Object.keys(log.details).length > 0 && (
                        <div className="text-[10px] bg-background/80 p-2 rounded-xl border font-mono text-muted-foreground break-all">
                          {JSON.stringify(log.details)}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
