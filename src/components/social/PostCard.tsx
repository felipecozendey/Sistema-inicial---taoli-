import { useState } from 'react'
import { Link } from 'react-router-dom'
import { SocialPost } from '@/services/social'
import { useSocialStore } from '@/stores/useSocialStore'
import { useAuth } from '@/hooks/use-auth'
import { MoreVertical, Trash2, Pin, PinOff } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { isProUser } from '@/hooks/use-pro-features'
import { cn } from '@/lib/utils'
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
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface PostCardProps {
  post: any
  isGroupPost?: boolean
  isGroupOwner?: boolean
  groupId?: string
  onDeleteGroupPost?: (postId: string) => Promise<void>
}

export function PostCard({
  post,
  isGroupPost = false,
  isGroupOwner = false,
  groupId,
  onDeleteGroupPost,
}: PostCardProps) {
  const { user } = useAuth()
  const { removePost, pinPost, unpinPost } = useSocialStore()
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)

  const isAuthor = user && user.id === post.author_id
  const canDelete = isAuthor || (isGroupPost && isGroupOwner)
  const isPinned = Boolean(post.pinned_at)
  const canPin = Boolean(isGroupPost && isGroupOwner && isProUser({ is_professional: true }))
  const effectiveGroupId = groupId || post.group_id

  const authorName = post.author?.display_name || post.author?.username || 'Usuário'
  const authorUsername = post.author?.username || 'user'
  const authorAvatar = post.author?.avatar_url

  const handleTogglePin = async () => {
    if (!effectiveGroupId) return
    if (isPinned) {
      await unpinPost(effectiveGroupId, post.id)
    } else {
      await pinPost(effectiveGroupId, post.id)
    }
  }

  const handleDelete = async () => {
    if (!user) return
    if (isGroupPost && onDeleteGroupPost) {
      await onDeleteGroupPost(post.id)
    } else {
      await removePost(post.id, user.id)
    }
    setDeleteConfirmOpen(false)
  }

  return (
    <article
      className={cn(
        'bg-card rounded-3xl border-2 p-4 sm:p-5 shadow-sm space-y-3.5 transition-all relative',
        isPinned && 'border-[#1CB0F6] bg-[#1CB0F6]/5 ring-2 ring-[#1CB0F6]/25',
      )}
    >
      {/* Pinned Ribbon if pinned */}
      {isPinned && (
        <div className="flex items-center justify-between pb-2.5 mb-1 border-b border-[#1CB0F6]/25">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#1CB0F6]/15 text-[#1CB0F6] text-[11px] font-black uppercase tracking-wider">
            {/* SVG illustrated pushpin */}
            <svg
              className="w-3.5 h-3.5 fill-current shrink-0"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path d="M16 3l1 1-2.5 4.5L18 12l-4 1v6l-2 2-2-2v-6l-4-1 3.5-3.5L7 4l1-1h8z" />
            </svg>
            <span>
              Fixado{' '}
              {post.pinned_by_user?.username
                ? `por @${post.pinned_by_user.username}`
                : 'pelo profissional'}
            </span>
          </div>
          <span className="text-[10px] font-bold text-muted-foreground/75 hidden sm:inline">
            Destaque do grupo
          </span>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <Link to={`/u/@${authorUsername}`} className="flex items-center gap-2.5 group min-w-0">
          <div className="w-10 h-10 rounded-full overflow-hidden bg-muted border-2 border-primary/20 shrink-0">
            {authorAvatar ? (
              <img
                src={authorAvatar}
                alt={authorName}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-[#58CC02]/20 text-[#58CC02] font-black text-sm">
                {authorName.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-xs sm:text-sm font-black text-foreground truncate group-hover:text-primary transition-colors">
                {authorName}
              </span>
              {/* Member Tag inside group */}
              {post.author_tag && (
                <span
                  className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black text-white shrink-0 shadow-xs"
                  style={{ backgroundColor: post.author_tag.color || '#58CC02' }}
                >
                  {post.author_tag.label}
                </span>
              )}
            </div>
            <div className="flex items-center gap-1.5 text-[11px] font-semibold text-muted-foreground">
              <span className="text-[#1CB0F6] font-bold">@{authorUsername}</span>
              <span>•</span>
              <span>
                {formatDistanceToNow(new Date(post.created_at), {
                  addSuffix: true,
                  locale: ptBR,
                })}
              </span>
            </div>
          </div>
        </Link>

        {(canDelete || canPin) && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="p-1.5 rounded-xl hover:bg-muted text-muted-foreground transition-colors cursor-pointer"
                aria-label="Ações da publicação"
              >
                <MoreVertical className="w-4 h-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="rounded-2xl border-2 p-1 min-w-[170px]">
              {canPin && (
                <>
                  <DropdownMenuItem
                    onClick={handleTogglePin}
                    className="text-xs font-bold text-[#1CB0F6] rounded-xl cursor-pointer"
                  >
                    {isPinned ? (
                      <>
                        <PinOff className="w-3.5 h-3.5 mr-2" />
                        Desafixar do topo
                      </>
                    ) : (
                      <>
                        <Pin className="w-3.5 h-3.5 mr-2" />
                        Fixar no topo
                      </>
                    )}
                  </DropdownMenuItem>
                  {canDelete && <DropdownMenuSeparator />}
                </>
              )}

              {canDelete && (
                <DropdownMenuItem
                  onClick={() => setDeleteConfirmOpen(true)}
                  className="text-xs font-bold text-destructive rounded-xl cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5 mr-2" />
                  {isAuthor ? 'Excluir post' : 'Excluir post (como Dono)'}
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      {/* Content */}
      {post.content && (
        <p className="text-xs sm:text-sm font-medium whitespace-pre-wrap leading-relaxed text-foreground/90">
          {post.content}
        </p>
      )}

      {/* Image with rounded-3xl */}
      {post.image_url && (
        <div className="rounded-3xl overflow-hidden border-2 max-h-[460px] bg-muted/40">
          <img
            src={post.image_url}
            alt="Publicação"
            className="w-full h-full object-cover"
            loading="lazy"
          />
        </div>
      )}

      {/* Delete Dialog */}
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent className="rounded-3xl border-2 max-w-sm">
          <AlertDialogHeader>
            <div className="w-12 h-12 rounded-2xl bg-destructive/15 text-destructive flex items-center justify-center mx-auto mb-2">
              <Trash2 className="w-6 h-6" />
            </div>
            <AlertDialogTitle className="text-center font-black text-lg">
              Excluir este post?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-center text-xs font-semibold text-muted-foreground">
              Esta ação removerá o post da comunidade ou grupo. Você não poderá recuperá-lo.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2 mt-2">
            <AlertDialogCancel className="rounded-2xl border-2 font-bold flex-1">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="rounded-2xl font-black bg-destructive text-destructive-foreground flex-1"
            >
              Sim, excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </article>
  )
}
