import { useEffect, useState, useMemo } from 'react'
import {
  SocialGroup,
  GroupPost,
  getMasterGroupsModeration,
  masterDeleteGroupPost,
  masterRestoreGroupPost,
  masterDeleteGroup,
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
  Users,
  MessageSquare,
  Camera,
  Trash2,
  RotateCcw,
  Search,
  CheckCircle,
  AlertTriangle,
  Loader2,
  Lock,
  Globe,
  Layers,
  Calendar,
  Clock,
} from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { toast } from 'sonner'
import { Link } from 'react-router-dom'

export function MasterGroupsSubTab() {
  const [groups, setGroups] = useState<SocialGroup[]>([])
  const [groupPosts, setGroupPosts] = useState<GroupPost[]>([])
  const [totalPending, setTotalPending] = useState(0)
  const [loading, setLoading] = useState(false)

  // Filters
  const [searchQuery, setSearchQuery] = useState('')
  const [postTypeFilter, setPostTypeFilter] = useState<'all' | 'photo' | 'reminder'>('all')
  const [includeDeleted, setIncludeDeleted] = useState(true)

  // Modals
  const [confirmPostAction, setConfirmPostAction] = useState<{
    post: GroupPost
    action: 'delete' | 'restore'
  } | null>(null)

  const [confirmGroupDelete, setConfirmGroupDelete] = useState<SocialGroup | null>(null)
  const [actionReason, setActionReason] = useState('')
  const [processing, setProcessing] = useState(false)

  const loadData = async () => {
    setLoading(true)
    try {
      const data = await getMasterGroupsModeration(includeDeleted, searchQuery, postTypeFilter)
      setGroups(data.groups)
      setGroupPosts(data.groupPosts)
      setTotalPending(data.totalPendingMembers)
    } catch (err) {
      console.error('Erro ao carregar moderação de grupos:', err)
      toast.error('Erro ao carregar dados de moderação de grupos.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [includeDeleted, searchQuery, postTypeFilter])

  // Summary counters
  const summary = useMemo(() => {
    const totalGroups = groups.length
    const today = new Date().toISOString().split('T')[0]
    const postsToday = groupPosts.filter(
      (p) => p.created_at && p.created_at.startsWith(today),
    ).length
    const deletedGroups = groups.filter((g) => g.is_deleted).length

    return { totalGroups, postsToday, deletedGroups, totalPending }
  }, [groups, groupPosts, totalPending])

  // Post moderate action
  const handleExecutePostAction = async () => {
    if (!confirmPostAction) return
    setProcessing(true)
    try {
      const isDelete = confirmPostAction.action === 'delete'
      if (isDelete) {
        await masterDeleteGroupPost(confirmPostAction.post.id, actionReason.trim() || undefined)
        toast.success('Post de grupo apagado pela moderação!')
      } else {
        await masterRestoreGroupPost(confirmPostAction.post.id, actionReason.trim() || undefined)
        toast.success('Post de grupo restaurado!')
      }

      setConfirmPostAction(null)
      setActionReason('')
      await loadData()
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Falha ao moderar post de grupo'
      toast.error(msg)
    } finally {
      setProcessing(false)
    }
  }

  // Delete group action
  const handleExecuteGroupDelete = async () => {
    if (!confirmGroupDelete) return
    setProcessing(true)
    try {
      await masterDeleteGroup(confirmGroupDelete.id, actionReason.trim() || undefined)
      toast.success(`Grupo "${confirmGroupDelete.name}" excluído pela moderação!`)
      setConfirmGroupDelete(null)
      setActionReason('')
      await loadData()
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Falha ao excluir grupo'
      toast.error(msg)
    } finally {
      setProcessing(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* 4 Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-card rounded-3xl border-2 p-4 shadow-sm flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-[#58CC02]/15 text-[#58CC02] flex items-center justify-center shrink-0">
            <Users className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="text-xl sm:text-2xl font-black">{summary.totalGroups}</div>
            <div className="text-[11px] font-bold text-muted-foreground uppercase">
              Total de Grupos
            </div>
          </div>
        </div>

        <div className="bg-card rounded-3xl border-2 p-4 shadow-sm flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-[#1CB0F6]/15 text-[#1CB0F6] flex items-center justify-center shrink-0">
            <MessageSquare className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="text-xl sm:text-2xl font-black">{summary.postsToday}</div>
            <div className="text-[11px] font-bold text-muted-foreground uppercase">
              Posts Grupo Hoje
            </div>
          </div>
        </div>

        <div className="bg-card rounded-3xl border-2 p-4 shadow-sm flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-amber-500/15 text-amber-500 flex items-center justify-center shrink-0">
            <Trash2 className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="text-xl sm:text-2xl font-black">{summary.deletedGroups}</div>
            <div className="text-[11px] font-bold text-muted-foreground uppercase">
              Grupos Excluídos
            </div>
          </div>
        </div>

        <div className="bg-card rounded-3xl border-2 p-4 shadow-sm flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-[#CE82FF]/15 text-[#CE82FF] flex items-center justify-center shrink-0">
            <Clock className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="text-xl sm:text-2xl font-black">{summary.totalPending}</div>
            <div className="text-[11px] font-bold text-muted-foreground uppercase">
              Membros Pendentes
            </div>
          </div>
        </div>
      </div>

      {/* Control bar: Filters & Search */}
      <div className="bg-card rounded-3xl border-2 p-4 sm:p-5 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
          {/* Search by group name / author */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por nome do grupo ou @ do autor..."
              className="rounded-2xl h-11 pl-9 font-semibold border-2 bg-muted/40 text-xs"
            />
          </div>

          {/* Post Type Filter Buttons */}
          <div className="flex items-center gap-1 bg-muted p-1 rounded-2xl border">
            <button
              onClick={() => setPostTypeFilter('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                postTypeFilter === 'all'
                  ? 'bg-foreground text-background shadow-sm font-black'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Todos Posts
            </button>
            <button
              onClick={() => setPostTypeFilter('photo')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 ${
                postTypeFilter === 'photo'
                  ? 'bg-[#1CB0F6] text-white shadow-sm font-black'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Camera className="w-3.5 h-3.5" /> Fotos
            </button>
            <button
              onClick={() => setPostTypeFilter('reminder')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 ${
                postTypeFilter === 'reminder'
                  ? 'bg-[#58CC02] text-white shadow-sm font-black'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" /> Lembretes
            </button>
          </div>

          {/* Include deleted switch */}
          <div className="flex items-center gap-2 px-3 py-1 bg-muted/50 rounded-2xl border shrink-0">
            <Switch
              id="include-deleted-groups"
              checked={includeDeleted}
              onCheckedChange={setIncludeDeleted}
            />
            <Label
              htmlFor="include-deleted-groups"
              className="text-xs font-bold cursor-pointer select-none"
            >
              Incluir excluídos
            </Label>
          </div>
        </div>
      </div>

      {/* Section 1: Fila de Moderação de Posts de Grupo */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-base sm:text-lg font-black tracking-tight flex items-center gap-2">
            <Layers className="w-5 h-5 text-[#58CC02]" />
            Fila de Moderação de Posts de Grupo ({groupPosts.length})
          </h2>
          {loading && (
            <span className="text-xs text-muted-foreground font-semibold flex items-center gap-1">
              <Loader2 className="w-3.5 h-3.5 animate-spin" /> Atualizando...
            </span>
          )}
        </div>

        {groupPosts.length === 0 && !loading ? (
          <div className="bg-card rounded-3xl border-2 p-8 text-center space-y-2">
            <CheckCircle className="w-8 h-8 text-[#58CC02] mx-auto" />
            <h3 className="font-extrabold text-sm">Nenhum post de grupo encontrado</h3>
            <p className="text-xs text-muted-foreground font-medium">
              A fila está limpa para os filtros selecionados.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {groupPosts.map((post) => {
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
                    {/* Author & Group info */}
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

                          {/* Group origin badge */}
                          <Badge className="bg-[#58CC02]/15 text-[#58CC02] border border-[#58CC02]/40 font-black text-[10px] px-2 py-0.5 rounded-full flex items-center gap-1">
                            <Users className="w-2.5 h-2.5" />
                            <span>Grupo: {post.group?.name || 'Comunidade'}</span>
                          </Badge>

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

                    {/* Action buttons */}
                    <div className="flex items-center gap-2 shrink-0">
                      {post.is_deleted ? (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setConfirmPostAction({ post, action: 'restore' })}
                          className="rounded-xl h-8 px-2.5 font-bold text-xs border-2 gap-1 cursor-pointer"
                        >
                          <RotateCcw className="w-3.5 h-3.5 text-[#58CC02]" />
                          <span className="hidden sm:inline">Restaurar</span>
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setConfirmPostAction({ post, action: 'delete' })}
                          className="rounded-xl h-8 px-2.5 font-bold text-xs text-destructive hover:text-destructive border-2 gap-1 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">Apagar Post</span>
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Content */}
                  {post.content && (
                    <p className="text-xs sm:text-sm font-medium whitespace-pre-wrap leading-relaxed">
                      {post.content}
                    </p>
                  )}

                  {/* Image */}
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

      {/* Section 2: Lista de Grupos para Auditoria / Exclusão */}
      <div className="space-y-4 pt-4 border-t">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-base sm:text-lg font-black tracking-tight flex items-center gap-2">
            <Users className="w-5 h-5 text-[#58CC02]" />
            Lista Geral de Grupos ({groups.length})
          </h2>
        </div>

        {groups.length === 0 && !loading ? (
          <div className="bg-card rounded-3xl border-2 p-8 text-center space-y-1">
            <p className="text-xs text-muted-foreground font-semibold">
              Nenhum grupo cadastrado ou compatível com a busca.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {groups.map((group) => {
              const isDeleted = group.is_deleted
              return (
                <div
                  key={group.id}
                  className={`bg-card rounded-3xl border-2 p-4 sm:p-5 shadow-sm space-y-3 transition-all ${
                    isDeleted ? 'opacity-70 bg-muted/30 border-dashed border-destructive/50' : ''
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-black text-sm sm:text-base text-foreground truncate">
                          {group.name}
                        </h3>
                        {group.is_closed ? (
                          <Badge
                            variant="outline"
                            className="text-amber-500 border-amber-500 text-[10px] font-black px-2 py-0.5 rounded-full flex items-center gap-1"
                          >
                            <Lock className="w-3 h-3" /> Fechado
                          </Badge>
                        ) : (
                          <Badge
                            variant="outline"
                            className="text-[#1CB0F6] border-[#1CB0F6] text-[10px] font-black px-2 py-0.5 rounded-full flex items-center gap-1"
                          >
                            <Globe className="w-3 h-3" /> Aberto
                          </Badge>
                        )}
                        {isDeleted && (
                          <Badge className="bg-destructive text-white text-[10px] font-black px-2 py-0.5 rounded-full">
                            EXCLUÍDO
                          </Badge>
                        )}
                      </div>

                      {group.description && (
                        <p className="text-xs text-muted-foreground line-clamp-2 font-medium">
                          {group.description}
                        </p>
                      )}

                      <div className="flex items-center gap-3 text-xs text-muted-foreground font-bold pt-1 flex-wrap">
                        <span>
                          Dono:{' '}
                          <span className="text-[#1CB0F6]">@{group.owner?.username || 'user'}</span>
                        </span>
                        <span>•</span>
                        <span>{group.members_count || 1} membros</span>
                        <span>•</span>
                        <span>
                          {format(new Date(group.created_at), 'dd/MM/yyyy', { locale: ptBR })}
                        </span>
                      </div>
                    </div>

                    {/* Master Group Action */}
                    {!isDeleted && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setConfirmGroupDelete(group)}
                        className="rounded-xl h-8 px-2.5 font-bold text-xs text-destructive hover:text-destructive border-2 gap-1 cursor-pointer shrink-0"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Excluir Grupo</span>
                      </Button>
                    )}
                  </div>
                </div>
              )
            })}
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
                ? 'Apagar post de grupo como Master?'
                : 'Restaurar post de grupo?'}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-center text-xs font-semibold text-muted-foreground">
              Esta ação será gravada em moderation_actions para rastreabilidade e auditoria.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="space-y-2 py-2">
            <Label className="text-xs font-bold">Motivo da ação (opcional):</Label>
            <Input
              value={actionReason}
              onChange={(e) => setActionReason(e.target.value)}
              placeholder="Ex: Violação das diretrizes da comunidade..."
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

      {/* Delete Group Confirm Dialog */}
      <AlertDialog
        open={Boolean(confirmGroupDelete)}
        onOpenChange={() => setConfirmGroupDelete(null)}
      >
        <AlertDialogContent className="rounded-3xl border-2 max-w-sm">
          <AlertDialogHeader>
            <div className="w-12 h-12 rounded-2xl bg-destructive/15 text-destructive flex items-center justify-center mx-auto mb-2">
              <Trash2 className="w-6 h-6" />
            </div>
            <AlertDialogTitle className="text-center font-black text-lg">
              Excluir grupo &quot;{confirmGroupDelete?.name}&quot;?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-center text-xs font-semibold text-muted-foreground leading-relaxed">
              Posts e vínculos de membros serão preservados para fins de auditoria (soft delete). O
              grupo não ficará mais visível aos usuários.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="space-y-2 py-2">
            <Label className="text-xs font-bold">Motivo da exclusão (opcional):</Label>
            <Input
              value={actionReason}
              onChange={(e) => setActionReason(e.target.value)}
              placeholder="Ex: Conteúdo impróprio recorrente..."
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
              onClick={handleExecuteGroupDelete}
              disabled={processing}
              className="rounded-2xl font-black bg-destructive text-destructive-foreground flex-1"
            >
              {processing ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Sim, excluir grupo'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
