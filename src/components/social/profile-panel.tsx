import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useAuth } from '@/hooks/use-auth'
import { useSocialStore } from '@/stores/useSocialStore'
import { useIsMaster } from '@/stores/useMasterStore'
import { PublicProfile } from '@/services/social'
import { EditSocialProfileDialog } from '@/components/social/EditSocialProfileDialog'
import { UserListModal } from '@/components/social/UserListModal'
import { supabase } from '@/lib/supabase/client'
import {
  MoreVertical,
  ShieldAlert,
  Trash2,
  Sparkles,
  Camera,
  MessageSquare,
  LogOut,
  ChevronLeft,
  Loader2,
  Ban,
  UserX,
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
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
import { Badge } from '@/components/ui/badge'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface ProfilePanelProps {
  username?: string
  showBackButton?: boolean
  onNavigateToFeed?: () => void
}

export function ProfilePanel({
  username: usernameProp,
  showBackButton = false,
  onNavigateToFeed,
}: ProfilePanelProps) {
  const { usernameParam } = useParams<{ usernameParam?: string }>()
  const effectiveUsername = usernameProp !== undefined ? usernameProp : usernameParam
  const { user: authUser, signOut } = useAuth()
  const { isMaster, isProfessional } = useIsMaster()
  const navigate = useNavigate()

  const {
    myProfile,
    currentViewProfile,
    profilePosts,
    loadMyProfile,
    loadUserProfile,
    toggleFollow,
    blockTargetUser,
    unblockTargetUser,
    removePost,
  } = useSocialStore()

  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [blockDialogOpen, setBlockDialogOpen] = useState(false)
  const [deletePostId, setDeletePostId] = useState<string | null>(null)
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  const [listModalOpen, setListModalOpen] = useState(false)
  const [listTitle, setListTitle] = useState('')
  const [listUsers, setListUsers] = useState<PublicProfile[]>([])
  const [listEmptyText, setListEmptyText] = useState('')

  const cleanParam = effectiveUsername?.replace(/^@/, '').toLowerCase()
  const isOwnProfile = !cleanParam || (myProfile && myProfile.username.toLowerCase() === cleanParam)

  useEffect(() => {
    if (authUser?.id) {
      loadMyProfile(authUser.id)
    }
  }, [authUser?.id, loadMyProfile])

  useEffect(() => {
    if (cleanParam) {
      loadUserProfile({ username: cleanParam }, authUser?.id)
    } else if (authUser?.id) {
      loadUserProfile({ id: authUser.id }, authUser.id)
    }
  }, [cleanParam, authUser?.id, loadUserProfile])

  const profile = isOwnProfile ? myProfile : currentViewProfile

  const handleLogout = async () => {
    setIsLoggingOut(true)
    try {
      await signOut()
      navigate('/', { replace: true })
    } finally {
      setIsLoggingOut(false)
      setLogoutDialogOpen(false)
    }
  }

  const handleOpenFollowers = async () => {
    if (!profile) return
    setListTitle('Seguidores')
    setListEmptyText('Nenhum seguidor ainda.')
    setListUsers([])
    setListModalOpen(true)

    const { data } = await (supabase.from as any)('follows')
      .select('follower_id')
      .eq('following_id', profile.id)

    if (data && data.length > 0) {
      const ids = data.map((d: any) => d.follower_id)
      const { data: usersData } = await (supabase.from as any)('public_profiles')
        .select('*')
        .in('id', ids)
      if (usersData) setListUsers(usersData as PublicProfile[])
    }
  }

  const handleOpenFollowing = async () => {
    if (!profile) return
    setListTitle('Seguindo')
    setListEmptyText('Não está seguindo ninguém ainda.')
    setListUsers([])
    setListModalOpen(true)

    const { data } = await (supabase.from as any)('follows')
      .select('following_id')
      .eq('follower_id', profile.id)

    if (data && data.length > 0) {
      const ids = data.map((d: any) => d.following_id)
      const { data: usersData } = await (supabase.from as any)('public_profiles')
        .select('*')
        .in('id', ids)
      if (usersData) setListUsers(usersData as PublicProfile[])
    }
  }

  const handleConfirmBlock = async () => {
    if (!profile || !authUser) return
    await blockTargetUser(profile.id, authUser.id)
    setBlockDialogOpen(false)
  }

  const handleConfirmDeletePost = async () => {
    if (!deletePostId || !authUser) return
    await removePost(deletePostId, authUser.id)
    setDeletePostId(null)
  }

  if (!profile) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="text-sm font-bold text-muted-foreground">Carregando perfil...</p>
      </div>
    )
  }

  if (profile.is_banned && !isMaster) {
    return (
      <div className="max-w-xl mx-auto text-center py-16 px-4 space-y-4">
        <div className="w-16 h-16 rounded-3xl bg-red-500/10 text-red-500 border-2 border-red-500/30 flex items-center justify-center mx-auto">
          <Ban className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-black">Este perfil foi suspenso</h2>
        <p className="text-sm text-muted-foreground font-semibold">
          A conta @{profile.username} violou as diretrizes da comunidade e está suspensa.
        </p>
        <Link
          to="/social"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-[#58CC02] text-white font-bold border-b-4 border-[#46A302]"
        >
          Voltar ao Social
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {(!isOwnProfile || showBackButton) && (
        <div className="flex items-center justify-between px-1">
          <button
            type="button"
            onClick={() => {
              if (onNavigateToFeed) {
                onNavigateToFeed()
              } else {
                navigate(-1)
              }
            }}
            className="flex items-center gap-1 text-sm font-bold text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
          >
            <ChevronLeft className="w-5 h-5" /> Voltar
          </button>
          {!isOwnProfile && (
            <div className="flex items-center gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    className="p-2 rounded-2xl hover:bg-muted border-2 transition-all cursor-pointer"
                  >
                    <MoreVertical className="w-4 h-4 text-muted-foreground" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="rounded-2xl p-1.5 border-2">
                  {profile.is_blocked ? (
                    <DropdownMenuItem
                      onClick={() => unblockTargetUser(profile.id, authUser!.id)}
                      className="font-bold text-xs rounded-xl cursor-pointer"
                    >
                      <UserX className="w-4 h-4 mr-2" /> Desbloquear usuário
                    </DropdownMenuItem>
                  ) : (
                    <DropdownMenuItem
                      onClick={() => setBlockDialogOpen(true)}
                      className="font-bold text-xs text-destructive rounded-xl cursor-pointer focus:text-destructive"
                    >
                      <ShieldAlert className="w-4 h-4 mr-2" /> Bloquear @{profile.username}
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}
        </div>
      )}

      <div className="bg-card rounded-3xl border-2 shadow-sm overflow-hidden">
        <div
          onClick={() => isOwnProfile && setEditDialogOpen(true)}
          className={`h-36 sm:h-44 w-full relative group overflow-hidden ${
            isOwnProfile ? 'cursor-pointer' : ''
          }`}
        >
          {profile.banner_url ? (
            <img
              src={profile.banner_url}
              alt="Capa do perfil"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-r from-[#58CC02] via-[#1CB0F6] to-[#CE82FF] flex items-center justify-center">
              <svg
                className="w-full h-full opacity-15"
                viewBox="0 0 400 120"
                preserveAspectRatio="none"
              >
                <circle cx="50" cy="60" r="30" fill="white" />
                <circle cx="200" cy="40" r="45" fill="white" />
                <circle cx="340" cy="70" r="25" fill="white" />
              </svg>
            </div>
          )}
          {isOwnProfile && (
            <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white font-bold text-xs gap-1.5 backdrop-blur-[1px]">
              <Camera className="w-4 h-4" /> Alterar Capa
            </div>
          )}
        </div>

        <div className="px-5 sm:px-6 pb-6">
          <div className="-mt-14 mb-4 flex justify-between items-end gap-2">
            <div
              onClick={() => isOwnProfile && setEditDialogOpen(true)}
              className={`w-24 h-24 sm:w-28 sm:h-28 rounded-full border-4 border-card bg-card overflow-hidden shadow-lg relative group shrink-0 ${
                isOwnProfile ? 'cursor-pointer' : ''
              }`}
            >
              {profile.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt={profile.display_name || profile.username}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-[#58CC02]/20 text-[#58CC02] font-black text-3xl">
                  {(profile.display_name || profile.username).charAt(0).toUpperCase()}
                </div>
              )}
              {isOwnProfile && (
                <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                  <Camera className="w-5 h-5" />
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              {isOwnProfile ? (
                <button
                  type="button"
                  onClick={() => setEditDialogOpen(true)}
                  className="px-4 py-2 rounded-2xl bg-muted hover:bg-muted/80 border-2 font-black text-xs transition-all active:translate-y-0.5 cursor-pointer"
                >
                  Editar Perfil
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => authUser && toggleFollow(profile.id, authUser.id)}
                  disabled={profile.is_blocked}
                  className={`px-5 py-2.5 rounded-2xl font-black text-xs transition-all active:translate-y-0.5 cursor-pointer ${
                    profile.is_following
                      ? 'bg-transparent text-foreground border-2 hover:bg-muted'
                      : 'bg-[#58CC02] hover:bg-[#58CC02]/90 border-b-4 border-[#46A302] text-white'
                  }`}
                >
                  {profile.is_following ? 'Seguindo' : 'Seguir'}
                </button>
              )}
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-foreground">
                {profile.display_name || profile.username}
              </h1>
              {isOwnProfile && isMaster && (
                <Badge className="bg-amber-500 text-white font-black text-[10px] px-2.5 py-0.5 rounded-full border-b-2 border-amber-700">
                  👑 Master
                </Badge>
              )}
              {isOwnProfile && isProfessional && (
                <Badge className="bg-[#1CB0F6] text-white font-black text-[10px] px-2.5 py-0.5 rounded-full border-b-2 border-[#1899d6]">
                  🩺 Pro
                </Badge>
              )}
              {profile.is_banned && (
                <Badge className="bg-destructive text-white font-black text-[10px] px-2 py-0.5 rounded-full">
                  Banido
                </Badge>
              )}
            </div>

            <p className="text-[#1CB0F6] font-extrabold text-sm">@{profile.username}</p>

            <p className="text-xs sm:text-sm font-semibold italic text-muted-foreground pt-0.5">
              {profile.motivational_phrase ||
                (isOwnProfile ? 'Adicione sua frase motivadora ✨' : '')}
            </p>

            {profile.bio && (
              <p className="text-xs sm:text-sm text-foreground/90 font-medium leading-relaxed pt-2">
                {profile.bio}
              </p>
            )}
          </div>

          <div className="grid grid-cols-3 gap-2 sm:gap-3 mt-6">
            <button
              type="button"
              onClick={handleOpenFollowers}
              className="bg-muted/50 hover:bg-muted border-2 rounded-2xl p-3 text-center transition-all active:translate-y-0.5 cursor-pointer"
            >
              <div className="text-lg font-black text-foreground">
                {profile.followers_count || 0}
              </div>
              <div className="text-[10px] sm:text-xs text-muted-foreground font-bold uppercase tracking-wide">
                Seguidores
              </div>
            </button>

            <button
              type="button"
              onClick={handleOpenFollowing}
              className="bg-muted/50 hover:bg-muted border-2 rounded-2xl p-3 text-center transition-all active:translate-y-0.5 cursor-pointer"
            >
              <div className="text-lg font-black text-foreground">
                {profile.following_count || 0}
              </div>
              <div className="text-[10px] sm:text-xs text-muted-foreground font-bold uppercase tracking-wide">
                Seguindo
              </div>
            </button>

            <div className="bg-muted/50 border-2 rounded-2xl p-3 text-center select-none">
              <div className="text-lg font-black text-foreground">
                {profile.posts_count || profilePosts.length || 0}
              </div>
              <div className="text-[10px] sm:text-xs text-muted-foreground font-bold uppercase tracking-wide">
                Posts
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-base sm:text-lg font-black tracking-tight flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-[#58CC02]" />
            Publicações
          </h2>
          <span className="text-xs font-bold text-muted-foreground">
            {profilePosts.length} post{profilePosts.length === 1 ? '' : 's'}
          </span>
        </div>

        {profilePosts.length === 0 ? (
          <div className="bg-card rounded-3xl border-2 p-8 text-center space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center mx-auto text-muted-foreground">
              <MessageSquare className="w-7 h-7" />
            </div>
            <h3 className="font-extrabold text-base">Nenhum post publicado</h3>
            <p className="text-xs text-muted-foreground font-medium max-w-xs mx-auto">
              {isOwnProfile
                ? 'Compartilhe uma foto ou deixe um lembrete positivo para quem te segue!'
                : `@${profile.username} ainda não publicou nada no feed.`}
            </p>
            {isOwnProfile && (
              <button
                type="button"
                onClick={() => {
                  if (onNavigateToFeed) {
                    onNavigateToFeed()
                  } else {
                    navigate('/social')
                  }
                }}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-[#58CC02] hover:bg-[#58CC02]/90 border-b-4 border-[#46A302] text-white font-black text-xs active:translate-y-0.5 cursor-pointer"
              >
                Ir para o Feed
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {profilePosts.map((post) => (
              <div
                key={post.id}
                className="bg-card rounded-3xl border-2 p-4 sm:p-5 shadow-sm space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-full overflow-hidden bg-muted border shrink-0">
                      {profile.avatar_url ? (
                        <img
                          src={profile.avatar_url}
                          alt={profile.display_name || profile.username}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-[#58CC02]/20 text-[#58CC02] font-black text-xs">
                          {(profile.display_name || profile.username).charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div>
                      <div className="text-xs font-black">
                        {profile.display_name || profile.username}
                      </div>
                      <div className="text-[11px] font-semibold text-muted-foreground">
                        {formatDistanceToNow(new Date(post.created_at), {
                          addSuffix: true,
                          locale: ptBR,
                        })}
                      </div>
                    </div>
                  </div>

                  {isOwnProfile && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button
                          type="button"
                          className="p-1.5 rounded-xl hover:bg-muted text-muted-foreground cursor-pointer"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="rounded-2xl border-2 p-1">
                        <DropdownMenuItem
                          onClick={() => setDeletePostId(post.id)}
                          className="text-xs font-bold text-destructive rounded-xl cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5 mr-2" /> Excluir post
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>

                {post.content && (
                  <p className="text-sm font-medium whitespace-pre-wrap leading-relaxed">
                    {post.content}
                  </p>
                )}

                {post.image_url && (
                  <div className="rounded-2xl overflow-hidden border max-h-[420px] bg-muted/40">
                    <img src={post.image_url} alt="Post" className="w-full h-full object-cover" />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {isOwnProfile && (
        <div className="pt-4">
          <button
            type="button"
            onClick={() => setLogoutDialogOpen(true)}
            className="w-full flex items-center justify-center gap-2 py-3 px-6 rounded-2xl bg-[#FF4B4B] hover:bg-[#FF4B4B]/90 active:translate-y-1 active:border-b-0 border-b-4 border-[#CC3C3C] text-white font-black text-xs transition-all shadow-sm cursor-pointer select-none"
          >
            <LogOut className="w-4 h-4" />
            <span>Deslogar do Sistema</span>
          </button>
        </div>
      )}

      {isOwnProfile && myProfile && (
        <EditSocialProfileDialog
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          profile={myProfile}
        />
      )}

      <UserListModal
        open={listModalOpen}
        onOpenChange={setListModalOpen}
        title={listTitle}
        users={listUsers}
        emptyText={listEmptyText}
      />

      <AlertDialog open={blockDialogOpen} onOpenChange={setBlockDialogOpen}>
        <AlertDialogContent className="rounded-3xl border-2 max-w-sm">
          <AlertDialogHeader>
            <div className="w-12 h-12 rounded-2xl bg-destructive/15 text-destructive flex items-center justify-center mx-auto mb-2">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <AlertDialogTitle className="text-center font-black text-lg">
              Bloquear @{profile.username}?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-center text-xs font-semibold text-muted-foreground">
              Esta pessoa não poderá ver seu perfil, te encontrar na busca, te seguir ou interagir
              com você. Posts de vocês não aparecerão um para o outro.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2 mt-2">
            <AlertDialogCancel className="rounded-2xl border-2 font-bold flex-1">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmBlock}
              className="rounded-2xl font-black bg-destructive text-destructive-foreground flex-1"
            >
              Bloquear
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={Boolean(deletePostId)} onOpenChange={() => setDeletePostId(null)}>
        <AlertDialogContent className="rounded-3xl border-2 max-w-sm">
          <AlertDialogHeader>
            <div className="w-12 h-12 rounded-2xl bg-destructive/15 text-destructive flex items-center justify-center mx-auto mb-2">
              <Trash2 className="w-6 h-6" />
            </div>
            <AlertDialogTitle className="text-center font-black text-lg">
              Excluir publicação?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-center text-xs font-semibold text-muted-foreground">
              Esta ação removerá o post do seu perfil e do feed dos seus seguidores.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2 mt-2">
            <AlertDialogCancel className="rounded-2xl border-2 font-bold flex-1">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDeletePost}
              className="rounded-2xl font-black bg-destructive text-destructive-foreground flex-1"
            >
              Sim, excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={logoutDialogOpen} onOpenChange={setLogoutDialogOpen}>
        <AlertDialogContent className="rounded-3xl border-2 max-w-sm">
          <AlertDialogHeader>
            <div className="w-12 h-12 rounded-2xl bg-[#FF4B4B]/15 text-[#FF4B4B] flex items-center justify-center mx-auto mb-2">
              <LogOut className="w-6 h-6" />
            </div>
            <AlertDialogTitle className="text-center font-black text-xl">
              Tem certeza que quer sair?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-center text-xs font-semibold text-muted-foreground">
              Sua sessão atual será encerrada e você retornará à tela inicial.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2 mt-2">
            <AlertDialogCancel className="rounded-2xl border-2 font-bold flex-1">
              Continuar no app
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="rounded-2xl font-black bg-[#FF4B4B] hover:bg-[#FF4B4B]/90 border-b-4 border-[#CC3C3C] text-white flex-1"
            >
              {isLoggingOut ? 'Saindo...' : 'Sim, deslogar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
