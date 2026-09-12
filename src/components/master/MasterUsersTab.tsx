import { useState, useMemo } from 'react'
import { useMasterStore, Profile, CreateUserData } from '@/stores/useMasterStore'
import { useAuth } from '@/hooks/use-auth'
import { UserDetailsModal } from './UserDetailsModal'
import { safeFormatDate } from '@/lib/date-utils'
import {
  Search,
  UserPlus,
  ShieldCheck,
  User,
  MoreVertical,
  KeyRound,
  Copy,
  Check,
  AlertTriangle,
  UserX,
  UserCheck,
  Trash2,
  Mail,
  ShieldAlert,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from '@/components/ui/alert-dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { toast } from 'sonner'

export function MasterUsersTab() {
  const {
    profiles,
    createUser,
    setRole,
    setProfessional,
    suspendUser,
    reactivateUser,
    deleteUser,
  } = useMasterStore()
  const { user: currentUser } = useAuth()

  // Filters
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState<'all' | 'master' | 'user' | 'professional'>('all')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'suspended'>('all')

  // Create User Modal
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [email, setEmail] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [passwordMode, setPasswordMode] = useState<'generate' | 'custom'>('generate')
  const [customPassword, setCustomPassword] = useState('')
  const [sendEmail, setSendEmail] = useState(false)
  const [creating, setCreating] = useState(false)

  // Generated Password display modal
  const [passwordModalOpen, setPasswordModalOpen] = useState(false)
  const [generatedPasswordData, setGeneratedPasswordData] = useState<{
    email: string
    password: string
    hasEmailProvider: boolean
  } | null>(null)
  const [copied, setCopied] = useState(false)

  // Confirm Action Dialogs
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean
    type: 'role' | 'professional' | 'suspend' | 'reactivate' | 'delete'
    target: Profile | null
  }>({
    isOpen: false,
    type: 'role',
    target: null,
  })

  // Delete confirmation requires typing user email
  const [deleteEmailConfirm, setDeleteEmailConfirm] = useState('')
  const [actionLoading, setActionLoading] = useState(false)
  const [selectedUserForDetails, setSelectedUserForDetails] = useState<Profile | null>(null)

  const filteredProfiles = useMemo(() => {
    return profiles.filter((p) => {
      const matchSearch =
        p.email.toLowerCase().includes(search.toLowerCase()) ||
        (p.displayName && p.displayName.toLowerCase().includes(search.toLowerCase()))
      let matchRole = true
      if (roleFilter === 'professional') {
        matchRole = Boolean(p.is_professional)
      } else if (roleFilter !== 'all') {
        matchRole = p.role === roleFilter
      }
      const matchStatus = statusFilter === 'all' || p.status === statusFilter
      return matchSearch && matchRole && matchStatus
    })
  }, [profiles, search, roleFilter, statusFilter])

  const handleOpenCreateModal = () => {
    setEmail('')
    setDisplayName('')
    setPasswordMode('generate')
    setCustomPassword('')
    setSendEmail(false)
    setCreateModalOpen(true)
  }

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !email.includes('@')) {
      toast.error('Informe um e-mail válido.')
      return
    }

    if (passwordMode === 'custom' && customPassword.length < 8) {
      toast.error('A senha informada deve ter no mínimo 8 caracteres.')
      return
    }

    setCreating(true)
    const payload: CreateUserData = {
      email,
      displayName: displayName.trim() || undefined,
      password: passwordMode === 'custom' ? customPassword : null,
      sendEmail,
    }

    const result = await createUser(payload)
    setCreating(false)

    if (result) {
      setCreateModalOpen(false)
      // If password was generated or provider missing, show modal with copyable password
      if (result.generatedPassword) {
        setGeneratedPasswordData({
          email: result.user.email,
          password: result.generatedPassword,
          hasEmailProvider: result.hasEmailProvider,
        })
        setPasswordModalOpen(true)
      }
    }
  }

  const copyPasswordToClipboard = () => {
    if (generatedPasswordData?.password) {
      navigator.clipboard.writeText(generatedPasswordData.password)
      setCopied(true)
      toast.success('Senha copiada com sucesso!')
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleActionConfirm = async () => {
    const { type, target } = confirmDialog
    if (!target) return

    setActionLoading(true)

    if (type === 'role') {
      const nextRole = target.role === 'master' ? 'user' : 'master'
      await setRole(target.id, nextRole)
    } else if (type === 'professional') {
      const nextProf = !target.is_professional
      await setProfessional(target.id, nextProf)
    } else if (type === 'suspend') {
      await suspendUser(target.id)
    } else if (type === 'reactivate') {
      await reactivateUser(target.id)
    } else if (type === 'delete') {
      if (deleteEmailConfirm.trim().toLowerCase() !== target.email.toLowerCase()) {
        toast.error('O e-mail digitado não coincide com o do usuário.')
        setActionLoading(false)
        return
      }
      await deleteUser(target.id)
    }

    setActionLoading(false)
    setConfirmDialog({ isOpen: false, type: 'role', target: null })
    setDeleteEmailConfirm('')
  }

  return (
    <div className="space-y-6">
      {/* Header with Search, Filters and Create Button */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="flex-1 flex flex-wrap gap-2 items-center">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por e-mail ou nome..."
              className="pl-9 rounded-2xl border-2 h-11"
            />
          </div>

          {/* Role Filter */}
          <select
            value={roleFilter}
            onChange={(e: any) => setRoleFilter(e.target.value)}
            className="h-11 px-3 rounded-2xl border-2 bg-card text-xs font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="all">Todos os Papéis</option>
            <option value="master">👑 Master</option>
            <option value="professional">🩺 Profissionais</option>
            <option value="user">👤 Usuário Comum</option>
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e: any) => setStatusFilter(e.target.value)}
            className="h-11 px-3 rounded-2xl border-2 bg-card text-xs font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="all">Todos os Status</option>
            <option value="active">🟢 Ativos</option>
            <option value="suspended">🔴 Suspensos</option>
          </select>
        </div>

        <Button
          onClick={handleOpenCreateModal}
          className="rounded-2xl h-11 px-5 font-black bg-[#58CC02] hover:bg-[#46a302] text-white border-b-4 border-[#46a302] active:border-b-0 active:translate-y-1 transition-all shadow-sm flex items-center gap-2"
        >
          <UserPlus className="w-4 h-4" />
          <span>Criar Usuário</span>
        </Button>
      </div>

      {/* Users Table / List */}
      <div className="bg-card border-2 rounded-3xl overflow-hidden shadow-sm">
        {filteredProfiles.length === 0 ? (
          <div className="py-16 text-center space-y-2">
            <User className="w-10 h-10 text-muted-foreground mx-auto opacity-50" />
            <p className="font-extrabold text-foreground">Nenhum usuário encontrado</p>
            <p className="text-xs text-muted-foreground">
              Tente alterar os filtros ou termo de busca.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b bg-muted/40 text-[11px] font-black uppercase tracking-wider text-muted-foreground">
                  <th className="py-3.5 px-4">Usuário</th>
                  <th className="py-3.5 px-4">Papel</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 hidden sm:table-cell">Cadastro</th>
                  <th className="py-3.5 px-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredProfiles.map((p) => {
                  const isCurrent = p.id === currentUser?.id
                  return (
                    <tr
                      key={p.id}
                      onClick={() => setSelectedUserForDetails(p)}
                      className="hover:bg-muted/50 transition-colors cursor-pointer"
                    >
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-9 h-9 rounded-2xl flex items-center justify-center font-black text-sm shrink-0 border-2 ${
                              p.role === 'master'
                                ? 'bg-amber-500/10 text-amber-600 border-amber-500/30'
                                : 'bg-primary/10 text-primary border-primary/30'
                            }`}
                          >
                            {p.displayName
                              ? p.displayName.charAt(0).toUpperCase()
                              : p.email.charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <div className="font-bold text-foreground text-sm flex items-center gap-1.5 truncate">
                              <span>{p.displayName || p.email.split('@')[0]}</span>
                              {isCurrent && (
                                <span className="text-[10px] font-extrabold px-1.5 py-0.2 rounded bg-muted text-muted-foreground">
                                  Você
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-muted-foreground truncate">{p.email}</div>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="flex flex-wrap items-center gap-1.5">
                          {p.role === 'master' ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-black bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                              <ShieldCheck className="w-3.5 h-3.5" /> Master
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-muted text-muted-foreground border">
                              <User className="w-3.5 h-3.5" /> Comum
                            </span>
                          )}
                          {p.is_professional && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-black bg-[#1CB0F6]/15 text-[#1CB0F6] border border-[#1CB0F6]/30">
                              Pro
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        {p.status === 'active' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                            <span className="w-2 h-2 rounded-full bg-emerald-500" /> Ativo
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30">
                            <span className="w-2 h-2 rounded-full bg-rose-500" /> Suspenso
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 hidden sm:table-cell text-xs font-medium text-muted-foreground">
                        {safeFormatDate(p.createdAt)}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="rounded-xl h-8 w-8 hover:bg-muted text-muted-foreground hover:text-foreground"
                            >
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent
                            align="end"
                            className="w-48 rounded-2xl p-1.5 shadow-xl border-2"
                          >
                            {/* Toggle Master */}
                            <DropdownMenuItem
                              disabled={isCurrent && p.role === 'master'}
                              onClick={() =>
                                setConfirmDialog({
                                  isOpen: true,
                                  type: 'role',
                                  target: p,
                                })
                              }
                              className="rounded-xl font-bold text-xs py-2 cursor-pointer"
                            >
                              <ShieldCheck className="w-4 h-4 mr-2 text-amber-500" />
                              {p.role === 'master' ? 'Rebaixar para Comum' : 'Promover a Master'}
                            </DropdownMenuItem>

                            {/* Conceder / Revogar Perfil Profissional (Master pode aplicar em si mesmo) */}
                            <DropdownMenuItem
                              onClick={() =>
                                setConfirmDialog({
                                  isOpen: true,
                                  type: 'professional',
                                  target: p,
                                })
                              }
                              className="rounded-xl font-bold text-xs py-2 cursor-pointer text-[#1CB0F6]"
                            >
                              <User className="w-4 h-4 mr-2 text-[#1CB0F6]" />
                              {p.is_professional
                                ? 'Revogar perfil Profissional'
                                : 'Conceder perfil Profissional'}
                            </DropdownMenuItem>

                            {/* Suspend / Reactivate */}
                            {p.status === 'active' ? (
                              <DropdownMenuItem
                                disabled={isCurrent}
                                onClick={() =>
                                  setConfirmDialog({
                                    isOpen: true,
                                    type: 'suspend',
                                    target: p,
                                  })
                                }
                                className="rounded-xl font-bold text-xs py-2 cursor-pointer text-amber-600 dark:text-amber-400"
                              >
                                <UserX className="w-4 h-4 mr-2 text-amber-500" />
                                Suspender Acesso
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem
                                onClick={() =>
                                  setConfirmDialog({
                                    isOpen: true,
                                    type: 'reactivate',
                                    target: p,
                                  })
                                }
                                className="rounded-xl font-bold text-xs py-2 cursor-pointer text-emerald-600 dark:text-emerald-400"
                              >
                                <UserCheck className="w-4 h-4 mr-2 text-emerald-500" />
                                Reativar Acesso
                              </DropdownMenuItem>
                            )}

                            {/* Manage User (Details / Permissions / Password) */}
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation()
                                setSelectedUserForDetails(p)
                              }}
                              className="rounded-xl font-bold text-xs py-2 cursor-pointer text-foreground"
                            >
                              <User className="w-4 h-4 mr-2 text-[#58CC02]" />
                              Gerenciar Usuário
                            </DropdownMenuItem>

                            <DropdownMenuSeparator />

                            {/* Delete User */}
                            <DropdownMenuItem
                              disabled={isCurrent}
                              onClick={(e) => {
                                e.stopPropagation()
                                setDeleteEmailConfirm('')
                                setConfirmDialog({
                                  isOpen: true,
                                  type: 'delete',
                                  target: p,
                                })
                              }}
                              className="rounded-xl font-bold text-xs py-2 cursor-pointer text-rose-600 dark:text-rose-400"
                            >
                              <Trash2 className="w-4 h-4 mr-2 text-rose-500" />
                              Excluir Usuário
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL: GERENCIAMENTO COMPLETO DO USUÁRIO (Perfil, Senha, Permissões, Auditoria) */}
      <UserDetailsModal
        user={selectedUserForDetails}
        open={Boolean(selectedUserForDetails)}
        onOpenChange={(isOpen) => {
          if (!isOpen) setSelectedUserForDetails(null)
        }}
        currentUserId={currentUser?.id}
      />

      {/* MODAL: CRIAR USUÁRIO */}
      <Dialog open={createModalOpen} onOpenChange={setCreateModalOpen}>
        <DialogContent className="sm:max-w-md rounded-3xl border-2 p-6 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-black text-foreground flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-[#58CC02]" />
              Novo Usuário
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Cadastre um novo usuário com papel comum (user) e status ativo.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateSubmit} className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-foreground">E-mail *</Label>
              <Input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="exemplo@dominio.com"
                className="rounded-2xl border-2 h-11"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-foreground">
                Nome de Exibição (opcional)
              </Label>
              <Input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Ex: João Silva"
                className="rounded-2xl border-2 h-11"
              />
            </div>

            {/* Senha: Gerar ou Definir */}
            <div className="space-y-2 pt-2">
              <Label className="text-xs font-bold text-foreground">Opção de Senha</Label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setPasswordMode('generate')}
                  className={`py-2 px-3 rounded-2xl border-2 text-xs font-black transition-all flex items-center justify-center gap-1.5 ${
                    passwordMode === 'generate'
                      ? 'border-primary bg-primary/10 text-primary border-b-4'
                      : 'border-border bg-card text-muted-foreground'
                  }`}
                >
                  <KeyRound className="w-3.5 h-3.5" />
                  Gerar Aleatória
                </button>
                <button
                  type="button"
                  onClick={() => setPasswordMode('custom')}
                  className={`py-2 px-3 rounded-2xl border-2 text-xs font-black transition-all flex items-center justify-center gap-1.5 ${
                    passwordMode === 'custom'
                      ? 'border-primary bg-primary/10 text-primary border-b-4'
                      : 'border-border bg-card text-muted-foreground'
                  }`}
                >
                  Definir Senha
                </button>
              </div>

              {passwordMode === 'custom' && (
                <div className="space-y-1 pt-1">
                  <Input
                    type="password"
                    placeholder="Mínimo de 8 caracteres"
                    value={customPassword}
                    onChange={(e) => setCustomPassword(e.target.value)}
                    className="rounded-2xl border-2 h-11"
                  />
                  <p className="text-[11px] text-muted-foreground">
                    Recomendamos ao menos 8 caracteres com letras e números.
                  </p>
                </div>
              )}
            </div>

            {/* Toggle Enviar e-mail de confirmação */}
            <div className="flex items-center justify-between p-3 rounded-2xl bg-muted/50 border">
              <div className="space-y-0.5 pr-2">
                <Label className="text-xs font-bold text-foreground flex items-center gap-1.5 cursor-pointer">
                  <Mail className="w-3.5 h-3.5 text-primary" />
                  Enviar e-mail de confirmação
                </Label>
                <p className="text-[11px] text-muted-foreground leading-tight">
                  Se ativado, envia credenciais via provedor se configurado (Resend). Caso
                  contrário, a senha será exibida para cópia.
                </p>
              </div>
              <Switch checked={sendEmail} onCheckedChange={setSendEmail} />
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setCreateModalOpen(false)}
                className="rounded-2xl h-11 font-bold"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={creating}
                className="rounded-2xl h-11 font-black bg-[#58CC02] hover:bg-[#46a302] text-white border-b-4 border-[#46a302] active:border-b-0 active:translate-y-1 transition-all"
              >
                {creating ? 'Criando...' : 'Salvar e Criar'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* MODAL: EXIBIR SENHA GERADA PARA CÓPIA (Fallback quando não há e-mail) */}
      <Dialog open={passwordModalOpen} onOpenChange={setPasswordModalOpen}>
        <DialogContent className="sm:max-w-md rounded-3xl border-2 p-6 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-black text-foreground flex items-center gap-2">
              <KeyRound className="w-5 h-5 text-amber-500" />
              Senha Temporária Criada
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              {generatedPasswordData?.hasEmailProvider
                ? 'Credenciais enviadas e registradas com sucesso.'
                : 'Não há provedor de e-mail (Resend) conectado no momento. Copie a senha abaixo e envie ao usuário agora.'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="bg-amber-500/10 border-2 border-amber-500/30 rounded-2xl p-3 text-xs text-amber-800 dark:text-amber-200 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
              <p className="leading-snug">
                <strong>Atenção:</strong> esta senha só será exibida <strong>uma única vez</strong>{' '}
                por motivos de segurança.
              </p>
            </div>

            <div className="space-y-1">
              <span className="text-[11px] font-bold text-muted-foreground uppercase">E-mail:</span>
              <p className="font-mono text-sm font-bold text-foreground bg-muted p-2 rounded-xl border">
                {generatedPasswordData?.email}
              </p>
            </div>

            <div className="space-y-1">
              <span className="text-[11px] font-bold text-muted-foreground uppercase">
                Senha Gerada:
              </span>
              <div className="flex items-center gap-2">
                <p className="font-mono text-base font-extrabold text-foreground bg-muted p-3 rounded-2xl border flex-1 select-all break-all">
                  {generatedPasswordData?.password}
                </p>
                <Button
                  onClick={copyPasswordToClipboard}
                  className="rounded-2xl h-12 px-4 font-bold bg-[#1CB0F6] hover:bg-[#1899d6] text-white border-b-4 border-[#1899d6] active:border-b-0 active:translate-y-1 transition-all shrink-0"
                >
                  {copied ? (
                    <Check className="w-4 h-4 mr-1 text-white" />
                  ) : (
                    <Copy className="w-4 h-4 mr-1" />
                  )}
                  {copied ? 'Copiado!' : 'Copiar'}
                </Button>
              </div>
            </div>

            {!generatedPasswordData?.hasEmailProvider && (
              <p className="text-[11px] text-muted-foreground italic">
                * O envio automático por e-mail será ativado assim que um provedor (ex:
                RESEND_API_KEY) for adicionado às variáveis de ambiente.
              </p>
            )}
          </div>

          <DialogFooter>
            <Button
              onClick={() => setPasswordModalOpen(false)}
              className="w-full rounded-2xl h-11 font-black bg-[#58CC02] hover:bg-[#46a302] text-white border-b-4 border-[#46a302] active:border-b-0 active:translate-y-1"
            >
              Concluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* CONFIRMATION ALERT DIALOGS (ROLE, SUSPEND, REACTIVATE, DELETE) */}
      <AlertDialog
        open={confirmDialog.isOpen}
        onOpenChange={(open) =>
          !open && setConfirmDialog({ isOpen: false, type: 'role', target: null })
        }
      >
        <AlertDialogContent className="rounded-3xl border-2 p-6 shadow-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-lg font-black text-foreground">
              {confirmDialog.type === 'role' &&
                (confirmDialog.target?.role === 'master'
                  ? 'Rebaixar Master para Comum?'
                  : 'Promover a Usuário Master?')}
              {confirmDialog.type === 'professional' &&
                (confirmDialog.target?.is_professional
                  ? 'Revogar perfil Profissional?'
                  : 'Conceder perfil Profissional?')}
              {confirmDialog.type === 'suspend' && 'Suspender Acesso do Usuário?'}
              {confirmDialog.type === 'reactivate' && 'Reativar Acesso do Usuário?'}
              {confirmDialog.type === 'delete' && 'Excluir Usuário Permanentemente?'}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-muted-foreground space-y-2">
              {confirmDialog.type === 'role' && (
                <p>
                  {confirmDialog.target?.role === 'master'
                    ? `O usuário ${confirmDialog.target?.email} perderá acesso a todas as telas administrativas e de controle.`
                    : `O usuário ${confirmDialog.target?.email} terá controle total do sistema, podendo gerenciar usuários e visualizar dados globais.`}
                </p>
              )}
              {confirmDialog.type === 'professional' && (
                <p>
                  {confirmDialog.target?.is_professional
                    ? `O usuário ${confirmDialog.target?.email} deixará de ter acesso ao Painel Pro (/professional). Todos os vínculos ativos com pacientes serão encerrados.`
                    : `O usuário ${confirmDialog.target?.email} terá acesso ao Painel Pro (/professional) para gerenciar pacientes, consultas e anotações clínicas com consentimento explícito dos pacientes.`}
                </p>
              )}
              {confirmDialog.type === 'suspend' && (
                <p>
                  O usuário <strong>{confirmDialog.target?.email}</strong> será impedido
                  imediatamente de acessar os módulos do sistema. A tela de bloqueio será acionada
                  em todas as suas sessões ativas.
                </p>
              )}
              {confirmDialog.type === 'reactivate' && (
                <p>
                  O acesso de <strong>{confirmDialog.target?.email}</strong> será liberado
                  imediatamente.
                </p>
              )}
              {confirmDialog.type === 'delete' && (
                <div className="space-y-3">
                  <div className="p-3 rounded-2xl bg-rose-500/10 border-2 border-rose-500/20 text-rose-800 dark:text-rose-200 text-xs font-medium">
                    <ShieldAlert className="w-4 h-4 inline mr-1.5 text-rose-500" />
                    Esta ação é irreversível. Todas as tarefas, hábitos, finanças, treinos e notas
                    deste usuário serão excluídos pelo CASCADE do banco de dados.
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-foreground">
                      Para confirmar, digite exatamente o e-mail:{' '}
                      <span className="font-mono text-primary select-all">
                        {confirmDialog.target?.email}
                      </span>
                    </Label>
                    <Input
                      value={deleteEmailConfirm}
                      onChange={(e) => setDeleteEmailConfirm(e.target.value)}
                      placeholder={confirmDialog.target?.email}
                      className="rounded-2xl border-2 h-10"
                    />
                  </div>
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter className="pt-2">
            <AlertDialogCancel className="rounded-2xl h-11 font-bold">Cancelar</AlertDialogCancel>
            <AlertDialogAction
              disabled={
                actionLoading ||
                (confirmDialog.type === 'delete' &&
                  deleteEmailConfirm.trim().toLowerCase() !==
                    (confirmDialog.target?.email || '').toLowerCase())
              }
              onClick={(e) => {
                e.preventDefault()
                handleActionConfirm()
              }}
              className={`rounded-2xl h-11 font-black text-white border-b-4 active:border-b-0 active:translate-y-1 transition-all ${
                confirmDialog.type === 'delete' || confirmDialog.type === 'suspend'
                  ? 'bg-rose-600 hover:bg-rose-700 border-rose-800'
                  : 'bg-primary hover:bg-primary/90 border-primary/60'
              }`}
            >
              {actionLoading ? 'Processando...' : 'Confirmar Ação'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
