import { useEffect, useState } from 'react'
import { SocialGroup, SocialPost } from '@/services/social'
import { useSocialStore } from '@/stores/useSocialStore'
import { useAuth } from '@/hooks/use-auth'
import { PostComposer } from '@/components/social/PostComposer'
import { PostCard } from '@/components/social/PostCard'
import { ManageGroupModal } from '@/components/social/ManageGroupModal'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  ArrowLeft,
  Users,
  Lock,
  Globe,
  Settings,
  UserPlus,
  Check,
  Clock,
  Sparkles,
  Loader2,
  Crown,
  Share2,
} from 'lucide-react'
import { toast } from 'sonner'

interface GroupDetailViewProps {
  groupId: string
  onBack: () => void
}

export function GroupDetailView({ groupId, onBack }: GroupDetailViewProps) {
  const { user } = useAuth()
  const {
    currentGroup,
    currentGroupPosts,
    loadingGroupDetails,
    loadingGroupPosts,
    loadGroupDetails,
    loadGroupPosts,
    loadGroupMembers,
    toggleGroupMembership,
    removeGroupPost,
  } = useSocialStore()

  const [manageOpen, setManageOpen] = useState(false)
  const [membershipLoading, setMembershipLoading] = useState(false)

  useEffect(() => {
    if (groupId) {
      loadGroupDetails(groupId, user?.id)
      loadGroupPosts(groupId)
      loadGroupMembers(groupId)
    }
  }, [groupId, user?.id, loadGroupDetails, loadGroupPosts, loadGroupMembers])

  if (loadingGroupDetails) {
    return (
      <div className="bg-card rounded-3xl border-2 p-12 text-center space-y-3">
        <Loader2 className="w-8 h-8 text-[#58CC02] animate-spin mx-auto" />
        <p className="text-xs font-bold text-muted-foreground">Carregando grupo...</p>
      </div>
    )
  }

  if (!currentGroup || currentGroup.is_deleted) {
    return (
      <div className="bg-card rounded-3xl border-2 p-8 sm:p-12 text-center space-y-4">
        <div className="w-16 h-16 rounded-3xl bg-muted text-muted-foreground flex items-center justify-center mx-auto text-2xl">
          🔍
        </div>
        <div className="space-y-1">
          <h3 className="text-lg font-black text-foreground">Grupo não encontrado ou removido</h3>
          <p className="text-xs text-muted-foreground font-medium max-w-sm mx-auto">
            Este grupo pode ter sido excluído pela moderação ou não está mais acessível.
          </p>
        </div>
        <Button
          onClick={onBack}
          variant="outline"
          className="rounded-2xl h-11 px-6 font-bold border-2 text-xs"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar para Grupos
        </Button>
      </div>
    )
  }

  const isOwner = currentGroup.current_user_role === 'owner' || currentGroup.created_by === user?.id
  const isMember = currentGroup.current_user_status === 'member'
  const isPending = currentGroup.current_user_status === 'pending'
  const isClosed = currentGroup.is_closed

  const handleToggleMembership = async () => {
    if (!user) return
    setMembershipLoading(true)
    try {
      await toggleGroupMembership(currentGroup, user.id)
      await loadGroupDetails(groupId, user.id)
      if (isMember || !currentGroup.is_closed) {
        await loadGroupPosts(groupId)
      }
    } finally {
      setMembershipLoading(false)
    }
  }

  const handleDeletePost = async (postId: string) => {
    if (!user) return
    await removeGroupPost(postId, user.id)
  }

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Back button & Group actions bar */}
      <div className="flex items-center justify-between gap-3">
        <Button
          onClick={onBack}
          variant="outline"
          size="sm"
          className="rounded-2xl h-10 px-3.5 font-bold border-2 text-xs gap-1.5 cursor-pointer hover:bg-muted"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Voltar</span>
        </Button>

        {isOwner && (
          <Button
            onClick={() => setManageOpen(true)}
            className="rounded-2xl h-10 px-4 font-black text-xs bg-[#58CC02] hover:bg-[#58CC02]/90 border-b-4 border-[#46A302] text-white shadow-sm flex items-center gap-1.5 cursor-pointer active:translate-y-0.5"
          >
            <Settings className="w-4 h-4" />
            <span>Gerenciar Grupo</span>
          </Button>
        )}
      </div>

      {/* Group Header Card */}
      <div className="bg-card rounded-3xl border-2 overflow-hidden shadow-sm">
        {/* Cover */}
        <div className="relative h-36 sm:h-48 w-full bg-gradient-to-r from-[#58CC02]/25 via-[#1CB0F6]/20 to-[#CE82FF]/25 flex items-center justify-center">
          {currentGroup.cover_url ? (
            <img
              src={currentGroup.cover_url}
              alt={currentGroup.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-16 h-16 rounded-3xl bg-white/80 dark:bg-card/80 shadow-sm border-2 flex items-center justify-center text-[#58CC02]">
              <Users className="w-8 h-8" />
            </div>
          )}

          {/* Privacy badge */}
          <div className="absolute top-3 right-3">
            {isClosed ? (
              <Badge
                variant="outline"
                className="bg-background/90 backdrop-blur-sm border-amber-500/50 text-amber-500 font-black text-[11px] px-3 py-1 rounded-full flex items-center gap-1.5 shadow-sm"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Fechado</span>
              </Badge>
            ) : (
              <Badge
                variant="outline"
                className="bg-background/90 backdrop-blur-sm border-[#1CB0F6]/50 text-[#1CB0F6] font-black text-[11px] px-3 py-1 rounded-full flex items-center gap-1.5 shadow-sm"
              >
                <Globe className="w-3.5 h-3.5" />
                <span>Aberto</span>
              </Badge>
            )}
          </div>
        </div>

        {/* Group Meta & Action CTA */}
        <div className="p-4 sm:p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div className="space-y-1.5 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-black text-foreground tracking-tight">
                  {currentGroup.name}
                </h1>
                {isOwner && (
                  <Badge className="bg-[#CE82FF] text-white text-[10px] font-black uppercase px-2 py-0.5 rounded-lg flex items-center gap-1">
                    <Crown className="w-3 h-3" /> Você é o dono
                  </Badge>
                )}
              </div>

              {currentGroup.description && (
                <p className="text-xs sm:text-sm text-muted-foreground font-medium leading-relaxed whitespace-pre-wrap">
                  {currentGroup.description}
                </p>
              )}

              <div className="flex items-center gap-3 text-xs font-bold text-muted-foreground pt-1 flex-wrap">
                <span className="flex items-center gap-1.5 text-foreground">
                  <Users className="w-4 h-4 text-[#58CC02]" />
                  {currentGroup.members_count || 1}{' '}
                  {currentGroup.members_count === 1 ? 'membro' : 'membros'}
                </span>
                {currentGroup.owner && (
                  <span className="text-[11px] text-muted-foreground">
                    Criado por{' '}
                    <span className="font-bold text-[#1CB0F6]">@{currentGroup.owner.username}</span>
                  </span>
                )}
              </div>
            </div>

            {/* Action Button */}
            <div className="shrink-0 flex items-center gap-2">
              {isOwner ? (
                <Button
                  onClick={() => setManageOpen(true)}
                  variant="outline"
                  className="rounded-2xl h-11 px-5 font-bold border-2 text-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Settings className="w-4 h-4 text-[#58CC02]" />
                  <span>Gerenciar</span>
                </Button>
              ) : isMember ? (
                <Button
                  onClick={handleToggleMembership}
                  disabled={membershipLoading}
                  variant="outline"
                  className="rounded-2xl h-11 px-5 font-bold border-2 border-destructive/40 text-destructive hover:bg-destructive/10 text-xs flex items-center gap-1.5 cursor-pointer"
                >
                  {membershipLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <Check className="w-4 h-4 text-[#58CC02]" />
                      <span>Sair do Grupo</span>
                    </>
                  )}
                </Button>
              ) : isPending ? (
                <Button
                  onClick={handleToggleMembership}
                  disabled={membershipLoading}
                  variant="outline"
                  className="rounded-2xl h-11 px-5 font-bold border-2 border-amber-500/50 text-amber-500 hover:bg-amber-500/10 text-xs flex items-center gap-1.5 cursor-pointer"
                >
                  {membershipLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <Clock className="w-4 h-4" />
                      <span>Cancelar Solicitação</span>
                    </>
                  )}
                </Button>
              ) : (
                <Button
                  onClick={handleToggleMembership}
                  disabled={membershipLoading}
                  className="rounded-2xl h-11 px-6 font-black text-xs bg-[#58CC02] hover:bg-[#58CC02]/90 border-b-4 border-[#46A302] text-white shadow-sm flex items-center gap-2 cursor-pointer active:translate-y-0.5"
                >
                  {membershipLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : isClosed ? (
                    <>
                      <Lock className="w-4 h-4" />
                      <span>Solicitar Participação</span>
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-4 h-4" />
                      <span>Entrar no Grupo</span>
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area based on membership */}
      {isMember || isOwner ? (
        <div className="space-y-6">
          {/* Group Composer */}
          <PostComposer
            groupId={groupId}
            placeholderReminder="Escreva um lembrete para o grupo 💚"
            placeholderPhoto="Compartilhe uma foto com o grupo..."
            onPublished={() => loadGroupPosts(groupId)}
          />

          {/* Group Posts List */}
          <div className="space-y-4">
            <div className="flex items-center justify-between px-1">
              <h2 className="text-sm sm:text-base font-black tracking-tight text-foreground flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#58CC02]" />
                Publicações do Grupo ({currentGroupPosts.length})
              </h2>
              {loadingGroupPosts && (
                <span className="text-[11px] text-muted-foreground font-semibold flex items-center gap-1">
                  <Loader2 className="w-3 h-3 animate-spin" /> Atualizando...
                </span>
              )}
            </div>

            {currentGroupPosts.length === 0 && !loadingGroupPosts ? (
              <div className="bg-card rounded-3xl border-2 p-8 text-center space-y-2">
                <div className="text-3xl">🌱</div>
                <h3 className="font-extrabold text-sm sm:text-base">
                  Nenhuma publicação no grupo ainda
                </h3>
                <p className="text-xs text-muted-foreground font-medium max-w-xs mx-auto">
                  Seja o primeiro a publicar um lembrete ou foto nesta comunidade!
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {currentGroupPosts.map((post) => (
                  <PostCard
                    key={post.id}
                    post={post as any}
                    isGroupPost={true}
                    isGroupOwner={isOwner}
                    onDeleteGroupPost={handleDeletePost}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      ) : isPending ? (
        <div className="bg-card rounded-3xl border-2 p-8 sm:p-10 text-center space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/15 text-amber-500 border-2 border-amber-500/30 flex items-center justify-center mx-auto">
            <Clock className="w-7 h-7" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base sm:text-lg font-black text-foreground">
              Solicitação enviada — aguardando aprovação
            </h3>
            <p className="text-xs text-muted-foreground font-medium max-w-sm mx-auto">
              O dono do grupo foi notificado e precisa aprovar sua entrada para você ver e criar
              publicações.
            </p>
          </div>
        </div>
      ) : isClosed ? (
        <div className="bg-card rounded-3xl border-2 p-8 sm:p-10 text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-muted text-muted-foreground border-2 flex items-center justify-center mx-auto">
            <Lock className="w-7 h-7 text-amber-500" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base sm:text-lg font-black text-foreground">
              Este é um grupo fechado 🔒
            </h3>
            <p className="text-xs text-muted-foreground font-medium max-w-sm mx-auto">
              As publicações são exclusivas para membros aprovados. Envie sua solicitação para
              participar da comunidade.
            </p>
          </div>
          <Button
            onClick={handleToggleMembership}
            disabled={membershipLoading}
            className="rounded-2xl h-11 px-6 font-black text-xs bg-[#58CC02] hover:bg-[#58CC02]/90 border-b-4 border-[#46A302] text-white shadow-sm flex items-center gap-2 cursor-pointer active:translate-y-0.5 mx-auto"
          >
            {membershipLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <UserPlus className="w-4 h-4" />
                <span>Solicitar Participação</span>
              </>
            )}
          </Button>
        </div>
      ) : (
        <div className="bg-card rounded-3xl border-2 p-8 sm:p-10 text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-[#58CC02]/15 text-[#58CC02] border-2 border-[#58CC02]/30 flex items-center justify-center mx-auto">
            <Globe className="w-7 h-7" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base sm:text-lg font-black text-foreground">Grupo Aberto</h3>
            <p className="text-xs text-muted-foreground font-medium max-w-sm mx-auto">
              Entre no grupo para publicar fotos, lembretes e interagir com outros membros.
            </p>
          </div>
          <Button
            onClick={handleToggleMembership}
            disabled={membershipLoading}
            className="rounded-2xl h-11 px-6 font-black text-xs bg-[#58CC02] hover:bg-[#58CC02]/90 border-b-4 border-[#46A302] text-white shadow-sm flex items-center gap-2 cursor-pointer active:translate-y-0.5 mx-auto"
          >
            {membershipLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <UserPlus className="w-4 h-4" />
                <span>Entrar no Grupo</span>
              </>
            )}
          </Button>
        </div>
      )}

      {/* Owner Management Modal */}
      {isOwner && (
        <ManageGroupModal
          open={manageOpen}
          onOpenChange={setManageOpen}
          groupId={groupId}
          groupName={currentGroup.name}
        />
      )}
    </div>
  )
}
