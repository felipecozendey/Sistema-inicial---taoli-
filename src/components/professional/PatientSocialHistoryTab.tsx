import { useState } from 'react'
import { PatientSocialHistoryData } from '@/services/social'
import {
  Users,
  Tag,
  MessageSquare,
  ShieldAlert,
  Calendar,
  Lock,
  Globe,
  Trash2,
  Clock,
  Sparkles,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { safeFormatDate } from '@/lib/date-utils'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface PatientSocialHistoryTabProps {
  data: PatientSocialHistoryData | null
  loading: boolean
}

export function PatientSocialHistoryTab({ data, loading }: PatientSocialHistoryTabProps) {
  const [section, setSection] = useState<'all' | 'groups' | 'tags' | 'posts' | 'moderation'>('all')

  if (loading) {
    return (
      <div className="py-12 text-center space-y-2">
        <div className="w-8 h-8 rounded-full border-2 border-[#58CC02] border-t-transparent animate-spin mx-auto" />
        <p className="text-xs font-bold text-muted-foreground">
          Carregando histórico do paciente nos seus grupos...
        </p>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="py-8 text-center text-xs text-muted-foreground">
        Nenhum dado social disponível para este paciente nos seus grupos.
      </div>
    )
  }

  const { groups, tags, posts, moderation_timeline } = data

  const hasAnyActivity =
    groups.length > 0 || tags.length > 0 || posts.length > 0 || moderation_timeline.length > 0

  if (!hasAnyActivity) {
    return (
      <div className="p-8 rounded-3xl border-2 bg-card text-center space-y-2">
        <div className="w-12 h-12 rounded-2xl bg-[#58CC02]/15 text-[#58CC02] flex items-center justify-center mx-auto text-xl">
          🌱
        </div>
        <h4 className="text-sm font-black text-foreground">Sem histórico nos seus grupos</h4>
        <p className="text-xs text-muted-foreground max-w-sm mx-auto leading-relaxed">
          Este paciente ainda não participou nem publicou em nenhum grupo criado por você.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Resumo compacto de métricas do paciente nos grupos deste profissional */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <div className="p-3 rounded-2xl border-2 bg-card">
          <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-muted-foreground">
            <Users className="w-3.5 h-3.5 text-[#58CC02]" />
            Seus Grupos
          </div>
          <div className="text-lg font-black text-[#58CC02] mt-0.5">{groups.length}</div>
          <span className="text-[10px] text-muted-foreground font-semibold">
            {groups.filter((g) => g.membership_status === 'member').length} ativo(s)
          </span>
        </div>

        <div className="p-3 rounded-2xl border-2 bg-card">
          <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-muted-foreground">
            <Tag className="w-3.5 h-3.5 text-[#CE82FF]" />
            Tags Recebidas
          </div>
          <div className="text-lg font-black text-[#CE82FF] mt-0.5">{tags.length}</div>
          <span className="text-[10px] text-muted-foreground font-semibold">
            {tags.filter((t) => !t.is_expired).length} vigente(s)
          </span>
        </div>

        <div className="p-3 rounded-2xl border-2 bg-card">
          <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-muted-foreground">
            <MessageSquare className="w-3.5 h-3.5 text-[#1CB0F6]" />
            Posts Realizados
          </div>
          <div className="text-lg font-black text-[#1CB0F6] mt-0.5">{posts.length}</div>
          <span className="text-[10px] text-muted-foreground font-semibold">
            {posts.filter((p) => p.is_deleted).length} apagado(s)
          </span>
        </div>

        <div className="p-3 rounded-2xl border-2 bg-card">
          <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-muted-foreground">
            <ShieldAlert className="w-3.5 h-3.5 text-amber-500" />
            Moderações
          </div>
          <div className="text-lg font-black text-amber-500 mt-0.5">
            {moderation_timeline.length}
          </div>
          <span className="text-[10px] text-muted-foreground font-semibold">ações registradas</span>
        </div>
      </div>

      {/* Sub-chips de navegação da aba Histórico Social */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs font-bold">
        <button
          type="button"
          onClick={() => setSection('all')}
          className={`px-3 py-1.5 rounded-xl border transition-all cursor-pointer ${
            section === 'all'
              ? 'bg-[#58CC02] text-white border-[#58CC02] font-black'
              : 'bg-card text-muted-foreground hover:bg-muted'
          }`}
        >
          Visão Completa
        </button>
        <button
          type="button"
          onClick={() => setSection('groups')}
          className={`px-3 py-1.5 rounded-xl border transition-all cursor-pointer ${
            section === 'groups'
              ? 'bg-[#58CC02] text-white border-[#58CC02] font-black'
              : 'bg-card text-muted-foreground hover:bg-muted'
          }`}
        >
          Grupos ({groups.length})
        </button>
        <button
          type="button"
          onClick={() => setSection('tags')}
          className={`px-3 py-1.5 rounded-xl border transition-all cursor-pointer ${
            section === 'tags'
              ? 'bg-[#58CC02] text-white border-[#58CC02] font-black'
              : 'bg-card text-muted-foreground hover:bg-muted'
          }`}
        >
          Tags ({tags.length})
        </button>
        <button
          type="button"
          onClick={() => setSection('posts')}
          className={`px-3 py-1.5 rounded-xl border transition-all cursor-pointer ${
            section === 'posts'
              ? 'bg-[#58CC02] text-white border-[#58CC02] font-black'
              : 'bg-card text-muted-foreground hover:bg-muted'
          }`}
        >
          Posts ({posts.length})
        </button>
        <button
          type="button"
          onClick={() => setSection('moderation')}
          className={`px-3 py-1.5 rounded-xl border transition-all cursor-pointer ${
            section === 'moderation'
              ? 'bg-[#58CC02] text-white border-[#58CC02] font-black'
              : 'bg-card text-muted-foreground hover:bg-muted'
          }`}
        >
          Moderação ({moderation_timeline.length})
        </button>
      </div>

      {/* SEÇÃO 1: GRUPOS */}
      {(section === 'all' || section === 'groups') && (
        <div className="space-y-3">
          <h4 className="text-xs font-black uppercase text-muted-foreground flex items-center gap-1.5 tracking-wider">
            <Users className="w-4 h-4 text-[#58CC02]" />
            Grupos do Profissional ({groups.length})
          </h4>

          {groups.length === 0 ? (
            <p className="text-xs text-muted-foreground italic py-3 bg-muted/30 rounded-2xl text-center">
              O paciente não faz nem fez parte dos seus grupos.
            </p>
          ) : (
            <div className="space-y-2">
              {groups.map(({ group, membership_status, joined_at, exit_event }) => (
                <div
                  key={group.id}
                  className="p-3.5 rounded-2xl border-2 bg-card flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h5 className="font-extrabold text-sm text-foreground truncate">
                        {group.name}
                      </h5>
                      {membership_status === 'member' && (
                        <Badge className="bg-[#58CC02] text-white text-[10px] font-black uppercase px-2 py-0.2 rounded-full">
                          Ativo
                        </Badge>
                      )}
                      {membership_status === 'pending' && (
                        <Badge className="bg-[#FFC800] text-black text-[10px] font-black uppercase px-2 py-0.2 rounded-full">
                          Pendente
                        </Badge>
                      )}
                      {membership_status === 'former' && (
                        <Badge
                          variant="outline"
                          className="text-muted-foreground text-[10px] font-bold uppercase px-2 py-0.2 rounded-full"
                        >
                          Passado
                        </Badge>
                      )}
                    </div>

                    <div className="text-[11px] text-muted-foreground mt-1 flex items-center gap-2 flex-wrap">
                      {joined_at && <span>Entrou em {safeFormatDate(joined_at)}</span>}
                      {exit_event && (
                        <span className="text-destructive font-semibold">
                          •{' '}
                          {exit_event.event === 'removed'
                            ? 'Removido pelo profissional'
                            : 'Saiu por conta própria'}{' '}
                          ({safeFormatDate(exit_event.created_at)})
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 text-[11px] font-bold text-muted-foreground shrink-0">
                    {group.is_closed ? (
                      <span className="flex items-center gap-1 text-amber-500">
                        <Lock className="w-3 h-3" /> Grupo Fechado
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-[#1CB0F6]">
                        <Globe className="w-3 h-3" /> Grupo Aberto
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* SEÇÃO 2: TAGS CONCEDIDAS */}
      {(section === 'all' || section === 'tags') && (
        <div className="space-y-3">
          <h4 className="text-xs font-black uppercase text-muted-foreground flex items-center gap-1.5 tracking-wider">
            <Tag className="w-4 h-4 text-[#CE82FF]" />
            Tags Concedidas ao Paciente ({tags.length})
          </h4>

          {tags.length === 0 ? (
            <p className="text-xs text-muted-foreground italic py-3 bg-muted/30 rounded-2xl text-center">
              Nenhuma tag atribuída a este paciente em seus grupos.
            </p>
          ) : (
            <div className="space-y-2">
              {tags.map((tag) => (
                <div
                  key={tag.id}
                  className="p-3 rounded-2xl border-2 bg-card flex items-center justify-between gap-3 text-xs"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span
                      className="px-2.5 py-0.5 rounded-full font-black text-[11px] text-white shrink-0 shadow-xs"
                      style={{ backgroundColor: tag.color }}
                    >
                      {tag.label}
                    </span>
                    <div className="min-w-0">
                      <span className="font-extrabold text-foreground truncate block">
                        Grupo: {tag.group?.name || 'Seu grupo'}
                      </span>
                      <span className="text-[10px] text-muted-foreground font-semibold">
                        Concedida em {safeFormatDate(tag.created_at)}
                      </span>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    {tag.is_expired ? (
                      <Badge
                        variant="outline"
                        className="text-muted-foreground line-through text-[10px]"
                      >
                        Expirada
                      </Badge>
                    ) : tag.expires_at ? (
                      <span className="text-[10px] font-bold text-amber-500">
                        Expira em {safeFormatDate(tag.expires_at)}
                      </span>
                    ) : (
                      <span className="text-[10px] font-black text-[#58CC02]">
                        Vigente permanente
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* SEÇÃO 3: POSTS NOS SEUS GRUPOS */}
      {(section === 'all' || section === 'posts') && (
        <div className="space-y-3">
          <h4 className="text-xs font-black uppercase text-muted-foreground flex items-center gap-1.5 tracking-wider">
            <MessageSquare className="w-4 h-4 text-[#1CB0F6]" />
            Publicações do Paciente nos Seus Grupos ({posts.length})
          </h4>

          {posts.length === 0 ? (
            <p className="text-xs text-muted-foreground italic py-3 bg-muted/30 rounded-2xl text-center">
              Nenhuma publicação deste paciente em seus grupos.
            </p>
          ) : (
            <div className="space-y-2.5 max-h-[360px] overflow-y-auto pr-1">
              {posts.map((post) => (
                <div
                  key={post.id}
                  className={`p-3.5 rounded-2xl border-2 bg-card space-y-2 ${
                    post.is_deleted ? 'border-dashed border-destructive/40 bg-destructive/5' : ''
                  }`}
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-extrabold text-[#1CB0F6]">
                      {post.group?.name || 'Seu grupo'}
                    </span>
                    <div className="flex items-center gap-1.5">
                      {post.is_deleted && (
                        <Badge variant="destructive" className="text-[9px] font-black uppercase">
                          Apagado {post.was_moderated ? '(Moderação)' : ''}
                        </Badge>
                      )}
                      <span className="text-[10px] text-muted-foreground">
                        {safeFormatDate(post.created_at)}
                      </span>
                    </div>
                  </div>

                  {post.content && (
                    <p
                      className={`text-xs text-foreground font-medium ${post.is_deleted ? 'italic opacity-80' : ''}`}
                    >
                      {post.content}
                    </p>
                  )}

                  {post.image_url && (
                    <div className="w-20 h-20 rounded-xl overflow-hidden border">
                      <img
                        src={post.image_url}
                        alt="Anexo do post"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* SEÇÃO 4: HISTÓRICO DE MODERAÇÃO E REMOÇÕES */}
      {(section === 'all' || section === 'moderation') && (
        <div className="space-y-3">
          <h4 className="text-xs font-black uppercase text-muted-foreground flex items-center gap-1.5 tracking-wider">
            <ShieldAlert className="w-4 h-4 text-amber-500" />
            Linha do Tempo de Moderação e Movimentações ({moderation_timeline.length})
          </h4>

          {moderation_timeline.length === 0 ? (
            <p className="text-xs text-muted-foreground italic py-3 bg-muted/30 rounded-2xl text-center">
              Nenhum evento de moderação registrado para este paciente.
            </p>
          ) : (
            <div className="space-y-2 max-h-[280px] overflow-y-auto pr-1">
              {moderation_timeline.map((ev) => (
                <div
                  key={ev.id}
                  className="p-3 rounded-2xl border bg-card flex items-center justify-between text-xs gap-3"
                >
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
                    <div>
                      <span className="font-extrabold text-foreground">{ev.label}</span>
                      <span className="block text-[10px] text-muted-foreground">
                        {formatDistanceToNow(new Date(ev.created_at), {
                          addSuffix: true,
                          locale: ptBR,
                        })}
                      </span>
                    </div>
                  </div>

                  <span className="text-[10px] text-muted-foreground font-bold shrink-0">
                    {safeFormatDate(ev.created_at)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
