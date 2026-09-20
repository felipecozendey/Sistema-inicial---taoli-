import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useSocialStore } from '@/stores/useSocialStore'
import { useAuth } from '@/hooks/use-auth'
import {
  ShieldAlert,
  Users,
  MessageSquare,
  TrendingUp,
  UserCheck,
  UserX,
  Tag,
  Loader2,
  Trash2,
} from 'lucide-react'
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip } from 'recharts'
import { AssignTagModal } from './AssignTagModal'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface GroupAdminModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  groupId: string
  groupName: string
}

export function GroupAdminModal({ open, onOpenChange, groupId, groupName }: GroupAdminModalProps) {
  const { user } = useAuth()
  const {
    currentGroupMetrics,
    currentGroupEvents,
    currentGroupTags,
    loadingGroupAdmin,
    loadGroupAdminMetrics,
    loadGroupTags,
    deleteTag,
  } = useSocialStore()

  const [period, setPeriod] = useState<'7d' | '30d' | 'all'>('30d')
  const [tagModalOpen, setTagModalOpen] = useState(false)
  const [selectedUserForTag, setSelectedUserForTag] = useState<{
    id: string
    name: string
  } | null>(null)

  useEffect(() => {
    if (open && groupId) {
      loadGroupAdminMetrics(groupId, period)
      loadGroupTags(groupId, true)
    }
  }, [open, groupId, period, loadGroupAdminMetrics, loadGroupTags])

  const handleOpenTagModal = (targetId: string, targetName: string) => {
    setSelectedUserForTag({ id: targetId, name: targetName })
    setTagModalOpen(true)
  }

  const handleDeleteTag = async (tagId: string) => {
    if (!user) return
    await deleteTag(tagId, user.id, groupId)
  }

  const metrics = currentGroupMetrics

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="rounded-3xl border-2 sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="w-12 h-12 rounded-2xl bg-[#58CC02]/15 text-[#58CC02] flex items-center justify-center mx-auto mb-1">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <DialogTitle className="text-center font-black text-xl">
              Administração do Grupo
            </DialogTitle>
            <p className="text-center text-xs text-muted-foreground font-semibold">
              Métricas exclusivas, atividade dos membros e histórico de moderação de{' '}
              <span className="text-foreground font-black">{groupName}</span>.
            </p>
          </DialogHeader>

          {/* Period Filter Selector */}
          <div className="flex items-center justify-center gap-1.5 p-1 rounded-2xl bg-muted border-2 max-w-xs mx-auto">
            <button
              type="button"
              onClick={() => setPeriod('7d')}
              className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                period === '7d'
                  ? 'bg-card text-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Últimos 7 dias
            </button>
            <button
              type="button"
              onClick={() => setPeriod('30d')}
              className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                period === '30d'
                  ? 'bg-card text-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Últimos 30 dias
            </button>
            <button
              type="button"
              onClick={() => setPeriod('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                period === 'all'
                  ? 'bg-card text-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Todo o período
            </button>
          </div>

          {loadingGroupAdmin ? (
            <div className="py-12 flex flex-col items-center justify-center gap-2">
              <Loader2 className="w-6 h-6 animate-spin text-[#58CC02]" />
              <span className="text-xs font-bold text-muted-foreground">
                Calculando métricas do grupo...
              </span>
            </div>
          ) : !metrics ? (
            <div className="p-8 text-center text-xs text-muted-foreground">
              Não foi possível carregar as métricas do grupo.
            </div>
          ) : (
            <div className="space-y-6 py-2">
              {/* Summary Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div className="p-3.5 rounded-2xl border-2 bg-card">
                  <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                    <UserCheck className="w-3.5 h-3.5 text-[#58CC02]" />
                    Entradas
                  </div>
                  <div className="text-xl font-black text-[#58CC02] mt-1">
                    +{metrics.joined_count}
                  </div>
                  <span className="text-[10px] text-muted-foreground font-semibold">
                    {metrics.active_members} membros ativos
                  </span>
                </div>

                <div className="p-3.5 rounded-2xl border-2 bg-card">
                  <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                    <UserX className="w-3.5 h-3.5 text-destructive" />
                    Saídas / Removidos
                  </div>
                  <div className="text-xl font-black text-destructive mt-1">
                    -{metrics.left_count + metrics.removed_count}
                  </div>
                  <span className="text-[10px] text-muted-foreground font-semibold">
                    {metrics.removed_count} remoções
                  </span>
                </div>

                <div className="p-3.5 rounded-2xl border-2 bg-card">
                  <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                    <MessageSquare className="w-3.5 h-3.5 text-[#1CB0F6]" />
                    Posts
                  </div>
                  <div className="text-xl font-black text-[#1CB0F6] mt-1">
                    {metrics.posts_count}
                  </div>
                  <span className="text-[10px] text-muted-foreground font-semibold">
                    Média de {metrics.posts_per_day}/dia
                  </span>
                </div>

                <div className="p-3.5 rounded-2xl border-2 bg-card">
                  <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                    <TrendingUp className="w-3.5 h-3.5 text-[#FFC800]" />
                    Aprovação
                  </div>
                  <div className="text-xl font-black text-[#FFC800] mt-1">
                    {metrics.approval_rate}%
                  </div>
                  <span className="text-[10px] text-muted-foreground font-semibold">
                    {metrics.pending_members} pendente(s)
                  </span>
                </div>
              </div>

              {/* Activity Timeline Recharts */}
              <div className="p-4 rounded-3xl border-2 bg-card space-y-2">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-black uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <TrendingUp className="w-3.5 h-3.5 text-[#58CC02]" />
                    Atividade no Tempo (Posts, Entradas, Votos)
                  </div>
                  <div className="flex items-center gap-3 text-[10px] font-bold">
                    <span className="flex items-center gap-1 text-[#58CC02]">
                      <span className="w-2 h-2 rounded-full bg-[#58CC02]" /> Posts
                    </span>
                    <span className="flex items-center gap-1 text-[#1CB0F6]">
                      <span className="w-2 h-2 rounded-full bg-[#1CB0F6]" /> Entradas
                    </span>
                    <span className="flex items-center gap-1 text-[#FFC800]">
                      <span className="w-2 h-2 rounded-full bg-[#FFC800]" /> Votos
                    </span>
                  </div>
                </div>

                <div className="h-48 w-full pt-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={metrics.activity_timeline}
                      margin={{ top: 5, right: 10, left: -20, bottom: 5 }}
                    >
                      <XAxis dataKey="date" tick={{ fontSize: 10, fontWeight: 700 }} />
                      <YAxis allowDecimals={false} tick={{ fontSize: 10, fontWeight: 700 }} />
                      <Tooltip
                        content={({ active, payload, label }) => {
                          if (active && payload && payload.length) {
                            return (
                              <div className="p-2.5 rounded-2xl bg-popover border-2 shadow-lg text-xs font-semibold space-y-1">
                                <p className="font-black text-foreground">{label}</p>
                                {payload.map((p, idx) => (
                                  <p key={idx} style={{ color: p.color }} className="font-bold">
                                    {p.name}: {p.value}
                                  </p>
                                ))}
                              </div>
                            )
                          }
                          return null
                        }}
                      />
                      <Line
                        type="monotone"
                        dataKey="posts"
                        name="Posts"
                        stroke="#58CC02"
                        strokeWidth={2.5}
                        dot={{ r: 2 }}
                      />
                      <Line
                        type="monotone"
                        dataKey="joined"
                        name="Entradas"
                        stroke="#1CB0F6"
                        strokeWidth={2}
                        dot={{ r: 2 }}
                      />
                      <Line
                        type="monotone"
                        dataKey="votes"
                        name="Votos"
                        stroke="#FFC800"
                        strokeWidth={2}
                        dot={{ r: 2 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Top 5 Most Active Members with "Conceder Tag" */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-black uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-[#1CB0F6]" />
                    Quem Mais Interage no Período (Top 5)
                  </div>
                  <span className="text-[11px] font-bold text-muted-foreground">
                    Baseado em posts + votos
                  </span>
                </div>

                {metrics.top_active_members.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-4 bg-muted/40 rounded-2xl">
                    Nenhuma interação registrada neste período ainda.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {metrics.top_active_members.map((member, idx) => {
                      const u = member.user
                      const displayName = u.display_name || u.username || 'Usuário'
                      const activeTags = member.tags?.filter((t) => !t.is_expired) || []

                      return (
                        <div
                          key={u.id}
                          className="p-3 rounded-2xl border-2 bg-card flex items-center justify-between gap-3"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <span className="w-5 h-5 rounded-full bg-muted border font-black text-[10px] flex items-center justify-center shrink-0">
                              {idx + 1}
                            </span>
                            <div className="w-9 h-9 rounded-full overflow-hidden bg-muted border shrink-0">
                              {u.avatar_url ? (
                                <img
                                  src={u.avatar_url}
                                  alt={displayName}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center bg-[#58CC02]/20 text-[#58CC02] font-black text-xs">
                                  {displayName.charAt(0).toUpperCase()}
                                </div>
                              )}
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="text-xs font-extrabold text-foreground truncate">
                                  {displayName}
                                </span>
                                {activeTags.map((t) => (
                                  <span
                                    key={t.id}
                                    className="px-1.5 py-0.2 rounded-md text-[9px] font-black text-white"
                                    style={{ backgroundColor: t.color }}
                                  >
                                    {t.label}
                                  </span>
                                ))}
                              </div>
                              <span className="text-[10px] text-muted-foreground font-semibold block">
                                @{u.username} • {member.post_count} posts • {member.vote_count}{' '}
                                votos
                              </span>
                            </div>
                          </div>

                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleOpenTagModal(u.id, u.username || displayName)}
                            className="rounded-xl h-8 px-2.5 font-black text-xs text-[#58CC02] border-[#58CC02]/40 hover:bg-[#58CC02]/10 gap-1 shrink-0 cursor-pointer"
                          >
                            <Tag className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">Conceder Tag</span>
                          </Button>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>

              {/* Tags Management List in Group */}
              <div className="space-y-3 pt-2 border-t">
                <div className="text-xs font-black uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5 text-[#CE82FF]" />
                  Tags Concedidas no Grupo ({currentGroupTags.length})
                </div>

                {currentGroupTags.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-3 bg-muted/40 rounded-2xl">
                    Nenhuma tag concedida a membros ainda.
                  </p>
                ) : (
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {currentGroupTags.map((tag) => (
                      <div
                        key={tag.id}
                        className="p-2.5 rounded-xl border bg-card flex items-center justify-between gap-2 text-xs"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span
                            className="px-2 py-0.5 rounded-full font-black text-[10px] text-white shrink-0"
                            style={{ backgroundColor: tag.color }}
                          >
                            {tag.label}
                          </span>
                          <span className="font-semibold text-foreground truncate">
                            {tag.is_expired ? (
                              <span className="line-through text-muted-foreground">Expirada</span>
                            ) : tag.expires_at ? (
                              <span className="text-muted-foreground text-[11px]">
                                Expira{' '}
                                {formatDistanceToNow(new Date(tag.expires_at), {
                                  addSuffix: true,
                                  locale: ptBR,
                                })}
                              </span>
                            ) : (
                              <span className="text-[#58CC02] text-[11px] font-bold">
                                Permanente
                              </span>
                            )}
                          </span>
                        </div>

                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleDeleteTag(tag.id)}
                          className="w-7 h-7 text-muted-foreground hover:text-destructive cursor-pointer shrink-0"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Recent Member Lifecycle Events */}
              <div className="space-y-3 pt-2 border-t">
                <div className="text-xs font-black uppercase tracking-wider text-muted-foreground">
                  Histórico de Movimentações ({currentGroupEvents.length})
                </div>

                {currentGroupEvents.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-3 bg-muted/40 rounded-2xl">
                    Nenhum evento registrado ainda.
                  </p>
                ) : (
                  <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1 text-xs">
                    {currentGroupEvents.slice(0, 15).map((ev) => (
                      <div
                        key={ev.id}
                        className="p-2 rounded-xl bg-muted/50 flex items-center justify-between text-[11px]"
                      >
                        <span className="font-semibold text-foreground">
                          {ev.event === 'joined' && '🌱 Entrou no grupo'}
                          {ev.event === 'approved' && '✅ Entrada aprovada'}
                          {ev.event === 'left' && '👋 Saiu do grupo'}
                          {ev.event === 'removed' && '🚫 Removido pelo profissional'}
                          {ev.event === 'rejected' && '❌ Solicitação recusada'}
                          {ev.event === 'request_sent' && '⏳ Solicitou entrada'}
                        </span>
                        <span className="text-muted-foreground">
                          {formatDistanceToNow(new Date(ev.created_at), {
                            addSuffix: true,
                            locale: ptBR,
                          })}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Assign Tag Modal */}
      {selectedUserForTag && (
        <AssignTagModal
          open={tagModalOpen}
          onOpenChange={setTagModalOpen}
          groupId={groupId}
          targetUserId={selectedUserForTag.id}
          targetUserName={selectedUserForTag.name}
          onAssigned={() => {
            loadGroupAdminMetrics(groupId, period)
            loadGroupTags(groupId, true)
          }}
        />
      )}
    </>
  )
}
