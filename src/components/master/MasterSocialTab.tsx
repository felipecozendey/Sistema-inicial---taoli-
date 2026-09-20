import { useEffect, useState, useMemo } from 'react'
import {
  getMasterModerationFeed,
  masterModeratePost,
  masterSetUserBan,
  SocialPost,
  ModerationAction,
} from '@/services/social'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  MessageSquare,
  Camera,
  Trash2,
  Ban,
  RotateCcw,
  CheckCircle,
  Search,
  Filter,
  MoreVertical,
  History,
  AlertTriangle,
  Loader2,
  Calendar,
  Layers,
  Sparkles,
} from 'lucide-react'
import { formatDistanceToNow, format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { toast } from 'sonner'
import { Link } from 'react-router-dom'

import { MasterGroupsSubTab } from '@/components/master/MasterGroupsSubTab'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Users } from 'lucide-react'

export function MasterSocialTab() {
  const [subTab, setSubTab] = useState<'feed' | 'groups'>('feed')

  const [posts, setPosts] = useState<SocialPost[]>([])
  const [actions, setActions] = useState<ModerationAction[]>([])
  const [loading, setLoading] = useState(false)

  // Filters
  const [authorSearch, setAuthorSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState<'all' | 'photo' | 'reminder'>('all')
  const [includeDeleted, setIncludeDeleted] = useState(true)

  // Modal actions
  const [confirmPostAction, setConfirmPostAction] = useState<{
    post: SocialPost
    action: 'delete' | 'restore'
  } | null>(null)

  const [confirmUserBan, setConfirmUserBan] = useState<{
    authorId: string
    authorUsername: string
    ban: boolean
  } | null>(null)

  const [actionReason, setActionReason] = useState('')
  const [processing, setProcessing] = useState(false)

  const loadData = async () => {
    setLoading(true)
    try {
      const data = await getMasterModerationFeed(includeDeleted, typeFilter, authorSearch)
      setPosts(data.posts)
      setActions(data.actions)
    } catch (err) {
      console.error('Erro ao carregar moderação social:', err)
      toast.error('Erro ao carregar dados de moderação social.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [includeDeleted, typeFilter, authorSearch])

  // Summary counters
  const summary = useMemo(() => {
    const totalPosts = posts.length
    const today = new Date().toISOString().split('T')[0]
    const postsToday = posts.filter((p) => p.created_at && p.created_at.startsWith(today)).length
    const deletedPosts = posts.filter((p) => p.is_deleted).length
    const bannedAuthors = new Set(posts.filter((p) => p.author?.is_banned).map((p) => p.author_id))
      .size

    return { totalPosts, postsToday, deletedPosts, bannedAuthors }
  }, [posts])

  // Moderate post execution
  const handleExecutePostAction = async () => {
    if (!confirmPostAction) return
    setProcessing(true)
    try {
      const isDelete = confirmPostAction.action === 'delete'
      await masterModeratePost(
        confirmPostAction.post.id,
        isDelete,
        actionReason.trim() || undefined,
      )

      toast.success(isDelete ? 'Post removido com sucesso pela moderação!' : 'Post restaurado!')

      setConfirmPostAction(null)
      setActionReason('')
      await loadData()
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Falha ao moderar post'
      toast.error(msg)
    } finally {
      setProcessing(false)
    }
  }

  // Ban/unban execution
  const handleExecuteBanAction = async () => {
    if (!confirmUserBan) return
    setProcessing(true)
    try {
      await masterSetUserBan(
        confirmUserBan.authorId,
        confirmUserBan.ban,
        actionReason.trim() || undefined,
      )

      toast.success(
        confirmUserBan.ban
          ? `Usuário @${confirmUserBan.authorUsername} banido do Social.`
          : `Usuário @${confirmUserBan.authorUsername} desbanido.`,
      )

      setConfirmUserBan(null)
      setActionReason('')
      await loadData()
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Falha ao alterar status de banimento'
      toast.error(msg)
    } finally {
      setProcessing(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Sub-tabs: Feed | Grupos */}
      <div className="flex justify-start">
        <Tabs
          value={subTab}
          onValueChange={(val) => setSubTab(val as 'feed' | 'groups')}
          className="w-full"
        >
          <TabsList className="p-1 rounded-2xl bg-muted/60 border-2 gap-1">
            <TabsTrigger
              value="feed"
              className="rounded-xl px-4 py-2 text-xs font-black transition-all data-[state=active]:bg-[#1CB0F6] data-[state=active]:text-white data-[state=active]:shadow-sm flex items-center gap-1.5 cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              Feed
            </TabsTrigger>
            <TabsTrigger
              value="groups"
              className="rounded-xl px-4 py-2 text-xs font-black transition-all data-[state=active]:bg-[#58CC02] data-[state=active]:text-white data-[state=active]:shadow-sm flex items-center gap-1.5 cursor-pointer"
            >
              <Users className="w-4 h-4" />
              Grupos
            </TabsTrigger>
          </TabsList>

          <TabsContent value="feed" className="mt-6 space-y-6 focus-visible:outline-none">
            {renderFeedTabContent()}
          </TabsContent>

          <TabsContent value="groups" className="mt-6 focus-visible:outline-none">
            <MasterGroupsSubTab />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )

  function renderFeedTabContent() {
    return (
      <>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="bg-card rounded-3xl border-2 p-4 shadow-sm flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-[#58CC02]/15 text-[#58CC02] flex items-center justify-center shrink-0">
              <Layers className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="text-xl sm:text-2xl font-black">{summary.totalPosts}</div>
              <div className="text-[11px] font-bold text-muted-foreground uppercase">
                Total de Posts
              </div>
            </div>
          </div>

          <div className="bg-card rounded-3xl border-2 p-4 shadow-sm flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-[#1CB0F6]/15 text-[#1CB0F6] flex items-center justify-center shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="text-xl sm:text-2xl font-black">{summary.postsToday}</div>
              <div className="text-[11px] font-bold text-muted-foreground uppercase">
                Posts Hoje
              </div>
            </div>
          </div>

          <div className="bg-card rounded-3xl border-2 p-4 shadow-sm flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-destructive/15 text-destructive flex items-center justify-center shrink-0">
              <Ban className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="text-xl sm:text-2xl font-black">{summary.bannedAuthors}</div>
              <div className="text-[11px] font-bold text-muted-foreground uppercase">
                Usuários Banidos
              </div>
            </div>
          </div>

          <div className="bg-card rounded-3xl border-2 p-4 shadow-sm flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-amber-500/15 text-amber-500 flex items-center justify-center shrink-0">
              <Trash2 className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="text-xl sm:text-2xl font-black">{summary.deletedPosts}</div>
              <div className="text-[11px] font-bold text-muted-foreground uppercase">
                Posts Apagados
              </div>
            </div>
          </div>
        </div>

        {/* Control bar: Filters & Search */}
        <div className="bg-card rounded-3xl border-2 p-4 sm:p-5 shadow-sm space-y-4">
          <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
            {/* Search by username / display name */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={authorSearch}
                onChange={(e) => setAuthorSearch(e.target.value)}
                placeholder="Filtrar por @username ou nome do autor..."
                className="rounded-2xl h-11 pl-9 font-semibold border-2 bg-muted/40"
              />
            </div>

            {/* Type Filter Buttons */}
            <div className="flex items-center gap-1 bg-muted p-1 rounded-2xl border">
              <button
                onClick={() => setTypeFilter('all')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  typeFilter === 'all'
                    ? 'bg-foreground text-background shadow-sm font-black'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Todos
              </button>
              <button
                onClick={() => setTypeFilter('photo')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 ${
                  typeFilter === 'photo'
                    ? 'bg-[#1CB0F6] text-white shadow-sm font-black'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Camera className="w-3.5 h-3.5" /> Fotos
              </button>
              <button
                onClick={() => setTypeFilter('reminder')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 ${
                  typeFilter === 'reminder'
                    ? 'bg-[#58CC02] text-white shadow-sm font-black'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <MessageSquare className="w-3.5 h-3.5" /> Lembretes
              </button>
            </div>

            {/* Include deleted switch */}
            <div className="flex items-center gap-2 px-2 py-1 bg-muted/50 rounded-2xl border">
              <Switch
                id="include-deleted"
                checked={includeDeleted}
                onCheckedChange={setIncludeDeleted}
              />
              <Label
                htmlFor="include-deleted"
                className="text-xs font-bold cursor-pointer select-none"
              >
                Incluir apagados
              </Label>
            </div>
          </div>
        </div>

        {/* Main Moderation Posts List */}
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-base sm:text-lg font-black tracking-tight flex items-center gap-2">
              <Layers className="w-5 h-5 text-[#58CC02]" />
              Fila de Moderação de Posts ({posts.length})
            </h2>
            {loading && (
              <span className="text-xs text-muted-foreground font-semibold flex items-center gap-1">
                <Loader2 className="w-3.5 h-3.5 animate-spin" /> Atualizando fila...
              </span>
            )}
          </div>

          {posts.length === 0 && !loading ? (
            <div className="bg-card rounded-3xl border-2 p-12 text-center space-y-2">
              <CheckCircle className="w-10 h-10 text-[#58CC02] mx-auto" />
              <h3 className="font-extrabold text-base">Fila limpa!</h3>
              <p className="text-xs text-muted-foreground font-medium">
                Nenhuma publicação corresponde aos filtros atuais.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {posts.map((post) => {
                const author = post.author
                const isBanned = Boolean(author?.is_banned)
                return (
                  <div
                    key={post.id}
                    className={`bg-card rounded-3xl border-2 p-4 sm:p-5 shadow-sm space-y-3 transition-all ${
                      post.is_deleted ? 'opacity-70 bg-muted/30 border-dashed' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      {/* Author info */}
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-full overflow-hidden bg-muted border-2 shrink-0">
                          {author?.avatar_url ? (
                            <img
                              src={author.avatar_url}
                              alt={author.display_name || author.username}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-[#58CC02]/20 text-[#58CC02] font-black text-sm">
                              {(author?.display_name || author?.username || 'U')
                                .charAt(0)
                                .toUpperCase()}
                            </div>
                          )}
                        </div>

                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Link
                              to={`/u/@${author?.username || 'user'}`}
                              className="font-black text-sm text-foreground hover:underline truncate"
                            >
                              {author?.display_name || author?.username || 'Usuário'}
                            </Link>
                            <span className="text-xs font-bold text-[#1CB0F6]">
                              @{author?.username || 'user'}
                            </span>
                            {isBanned && (
                              <Badge className="bg-destructive text-white font-black text-[10px] px-2 py-0.5 rounded-full">
                                BANIDO
                              </Badge>
                            )}
                            {post.is_deleted && (
                              <Badge
                                variant="outline"
                                className="text-amber-500 border-amber-500 font-black text-[10px] px-2 py-0.5 rounded-full"
                              >
                                APAGADO
                              </Badge>
                            )}
                            <Badge variant="secondary" className="text-[10px] font-bold">
                              {post.kind === 'photo' ? 'Foto' : 'Lembrete'}
                            </Badge>
                          </div>
                          <div className="text-[11px] font-semibold text-muted-foreground mt-0.5">
                            Publicado em{' '}
                            {format(new Date(post.created_at), "dd/MM/yyyy 'às' HH:mm", {
                              locale: ptBR,
                            })}
                          </div>
                        </div>
                      </div>

                      {/* Master Action Buttons */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        {/* Moderate Post Toggle */}
                        {post.is_deleted ? (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setConfirmPostAction({ post, action: 'restore' })}
                            className="rounded-xl h-8 px-2.5 font-bold text-xs border-2 gap-1"
                          >
                            <RotateCcw className="w-3.5 h-3.5 text-[#58CC02]" />
                            <span className="hidden sm:inline">Restaurar</span>
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setConfirmPostAction({ post, action: 'delete' })}
                            className="rounded-xl h-8 px-2.5 font-bold text-xs text-destructive hover:text-destructive border-2 gap-1"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">Apagar Post</span>
                          </Button>
                        )}

                        {/* Ban/Unban Menu */}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button className="p-1.5 rounded-xl hover:bg-muted border transition-all text-muted-foreground">
                              <MoreVertical className="w-4 h-4" />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="rounded-2xl border-2 p-1">
                            {isBanned ? (
                              <DropdownMenuItem
                                onClick={() =>
                                  setConfirmUserBan({
                                    authorId: post.author_id,
                                    authorUsername: author?.username || 'user',
                                    ban: false,
                                  })
                                }
                                className="font-bold text-xs rounded-xl cursor-pointer"
                              >
                                <CheckCircle className="w-3.5 h-3.5 mr-2 text-[#58CC02]" />
                                Desbanir Usuário
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem
                                onClick={() =>
                                  setConfirmUserBan({
                                    authorId: post.author_id,
                                    authorUsername: author?.username || 'user',
                                    ban: true,
                                  })
                                }
                                className="font-bold text-xs text-destructive rounded-xl cursor-pointer focus:text-destructive"
                              >
                                <Ban className="w-3.5 h-3.5 mr-2" />
                                Bloquear / Banir Usuário
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>

                    {/* Post Content */}
                    {post.content && (
                      <p className="text-xs sm:text-sm font-medium whitespace-pre-wrap leading-relaxed">
                        {post.content}
                      </p>
                    )}

                    {/* Post Image */}
                    {post.image_url && (
                      <div className="rounded-2xl overflow-hidden border max-h-72 bg-muted/40">
                        <img
                          src={post.image_url}
                          alt="Conteúdo moderado"
                          className="w-full h-full object-cover max-h-72"
                        />
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Moderation Audit Log Stream */}
        <div className="bg-card rounded-3xl border-2 p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm sm:text-base font-black tracking-tight flex items-center gap-2">
              <History className="w-5 h-5 text-amber-500" />
              Histórico Recente de Ações de Moderação
            </h2>
            <span className="text-xs font-bold text-muted-foreground">
              {actions.length} ações registradas
            </span>
          </div>

          {actions.length === 0 ? (
            <p className="text-xs text-muted-foreground font-semibold py-4 text-center">
              Nenhuma ação de moderação registrada ainda.
            </p>
          ) : (
            <div className="divide-y divide-border/60 max-h-64 overflow-y-auto pr-1">
              {actions.map((act) => (
                <div
                  key={act.id}
                  className="py-2.5 flex items-center justify-between gap-3 text-xs"
                >
                  <div>
                    <div className="font-extrabold flex items-center gap-2">
                      <Badge
                        variant="outline"
                        className={`text-[10px] font-black uppercase ${
                          act.action.includes('ban')
                            ? 'text-destructive border-destructive'
                            : 'text-amber-600 border-amber-600'
                        }`}
                      >
                        {act.action}
                      </Badge>
                      <span className="text-foreground">
                        {act.details?.reason || 'Moderação manual'}
                      </span>
                    </div>
                    <div className="text-[11px] text-muted-foreground font-medium mt-0.5">
                      Alvo:{' '}
                      {act.target_user_id ? `Usuário ${act.target_user_id.slice(0, 8)}...` : ''}{' '}
                      {act.target_post_id ? `• Post ${act.target_post_id.slice(0, 8)}...` : ''}
                    </div>
                  </div>

                  <div className="text-[10px] text-muted-foreground font-semibold shrink-0">
                    {formatDistanceToNow(new Date(act.created_at), {
                      addSuffix: true,
                      locale: ptBR,
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Post Action Confirm Dialog */}
        <AlertDialog
          open={Boolean(confirmPostAction)}
          onOpenChange={() => setConfirmPostAction(null)}
        >
          <AlertDialogContent className="rounded-3xl border-2 max-w-sm">
            <AlertDialogHeader>
              <div className="w-12 h-12 rounded-2xl bg-destructive/15 text-destructive flex items-center justify-center mx-auto mb-2">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <AlertDialogTitle className="text-center font-black text-lg">
                {confirmPostAction?.action === 'delete'
                  ? 'Apagar publicação como Master?'
                  : 'Restaurar publicação?'}
              </AlertDialogTitle>
              <AlertDialogDescription className="text-center text-xs font-semibold text-muted-foreground">
                Esta ação será auditada e gravada em moderation_actions para rastreabilidade.
              </AlertDialogDescription>
            </AlertDialogHeader>

            <div className="space-y-2 py-2">
              <Label className="text-xs font-bold">Motivo da ação (opcional):</Label>
              <Input
                value={actionReason}
                onChange={(e) => setActionReason(e.target.value)}
                placeholder="Ex: Violação das diretrizes..."
                className="rounded-2xl h-10 text-xs font-semibold border-2"
              />
            </div>

            <AlertDialogFooter className="flex-col sm:flex-row gap-2 mt-2">
              <AlertDialogCancel
                disabled={processing}
                className="rounded-2xl border-2 font-bold flex-1"
              >
                Cancelar
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleExecutePostAction}
                disabled={processing}
                className={`rounded-2xl font-black flex-1 ${
                  confirmPostAction?.action === 'delete'
                    ? 'bg-destructive text-destructive-foreground'
                    : 'bg-[#58CC02] text-white'
                }`}
              >
                {processing ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : confirmPostAction?.action === 'delete' ? (
                  'Sim, apagar'
                ) : (
                  'Sim, restaurar'
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* User Ban Confirm Dialog */}
        <AlertDialog open={Boolean(confirmUserBan)} onOpenChange={() => setConfirmUserBan(null)}>
          <AlertDialogContent className="rounded-3xl border-2 max-w-sm">
            <AlertDialogHeader>
              <div className="w-12 h-12 rounded-2xl bg-destructive/15 text-destructive flex items-center justify-center mx-auto mb-2">
                <Ban className="w-6 h-6" />
              </div>
              <AlertDialogTitle className="text-center font-black text-lg">
                {confirmUserBan?.ban
                  ? `Bloquear @${confirmUserBan?.authorUsername}?`
                  : `Desbanir @${confirmUserBan?.authorUsername}?`}
              </AlertDialogTitle>
              <AlertDialogDescription className="text-center text-xs font-semibold text-muted-foreground">
                {confirmUserBan?.ban
                  ? 'O usuário terá suas publicações ocultadas do feed social e não poderá interagir ou publicar.'
                  : 'O usuário recuperará o acesso para publicar e ver o feed social.'}
              </AlertDialogDescription>
            </AlertDialogHeader>

            <div className="space-y-2 py-2">
              <Label className="text-xs font-bold">Motivo (opcional):</Label>
              <Input
                value={actionReason}
                onChange={(e) => setActionReason(e.target.value)}
                placeholder="Ex: Comportamento abusivo..."
                className="rounded-2xl h-10 text-xs font-semibold border-2"
              />
            </div>

            <AlertDialogFooter className="flex-col sm:flex-row gap-2 mt-2">
              <AlertDialogCancel
                disabled={processing}
                className="rounded-2xl border-2 font-bold flex-1"
              >
                Cancelar
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleExecuteBanAction}
                disabled={processing}
                className={`rounded-2xl font-black flex-1 ${
                  confirmUserBan?.ban
                    ? 'bg-destructive text-destructive-foreground'
                    : 'bg-[#58CC02] text-white'
                }`}
              >
                {processing ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : confirmUserBan?.ban ? (
                  'Sim, banir'
                ) : (
                  'Sim, desbanir'
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </>
    )
  }
}
