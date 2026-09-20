import { SocialGroup } from '@/services/social'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Lock, Globe, Users, Check, Clock, UserPlus, LogOut, Loader2 } from 'lucide-react'
import { useState } from 'react'

interface GroupCardProps {
  group: SocialGroup
  onOpenGroup: (group: SocialGroup) => void
  onToggleJoin: (group: SocialGroup) => Promise<boolean>
}

export function GroupCard({ group, onOpenGroup, onToggleJoin }: GroupCardProps) {
  const [loadingAction, setLoadingAction] = useState(false)

  const isMember = group.current_user_status === 'member'
  const isPending = group.current_user_status === 'pending'
  const isOwner = group.current_user_role === 'owner'

  const handleActionClick = async (e: React.MouseEvent) => {
    e.stopPropagation()
    setLoadingAction(true)
    try {
      await onToggleJoin(group)
    } finally {
      setLoadingAction(false)
    }
  }

  return (
    <div
      onClick={() => onOpenGroup(group)}
      className="bg-card rounded-3xl border-2 p-4 sm:p-5 shadow-sm space-y-3.5 transition-all hover:border-[#58CC02]/50 hover:shadow-md cursor-pointer group flex flex-col justify-between"
    >
      <div className="space-y-3">
        {/* Cover / Header Gradient */}
        <div className="relative h-28 sm:h-32 rounded-2xl overflow-hidden border-2 bg-gradient-to-br from-[#58CC02]/20 via-[#1CB0F6]/15 to-[#CE82FF]/20 flex items-center justify-center">
          {group.cover_url ? (
            <img
              src={group.cover_url}
              alt={group.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              loading="lazy"
            />
          ) : (
            <div className="w-14 h-14 rounded-2xl bg-white/80 dark:bg-card/80 shadow-sm border flex items-center justify-center text-[#58CC02]">
              <Users className="w-7 h-7" />
            </div>
          )}

          {/* Privacy Badge */}
          <div className="absolute top-2.5 right-2.5">
            {group.is_closed ? (
              <Badge
                variant="outline"
                className="bg-background/90 backdrop-blur-sm border-amber-500/50 text-amber-500 font-black text-[10px] px-2.5 py-0.5 rounded-full flex items-center gap-1 shadow-sm"
              >
                <Lock className="w-3 h-3" />
                <span>Fechado</span>
              </Badge>
            ) : (
              <Badge
                variant="outline"
                className="bg-background/90 backdrop-blur-sm border-[#1CB0F6]/50 text-[#1CB0F6] font-black text-[10px] px-2.5 py-0.5 rounded-full flex items-center gap-1 shadow-sm"
              >
                <Globe className="w-3 h-3" />
                <span>Aberto</span>
              </Badge>
            )}
          </div>
        </div>

        {/* Group Info */}
        <div className="space-y-1.5 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <h3 className="font-black text-sm sm:text-base text-foreground truncate group-hover:text-[#58CC02] transition-colors">
              {group.name}
            </h3>
            {isOwner && (
              <Badge className="bg-[#CE82FF] text-white text-[9px] font-black uppercase px-1.5 py-0.5 shrink-0 rounded-lg">
                Dono
              </Badge>
            )}
          </div>

          {group.description ? (
            <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed font-medium">
              {group.description}
            </p>
          ) : (
            <p className="text-xs text-muted-foreground/60 italic font-medium">
              Sem descrição definida.
            </p>
          )}
        </div>
      </div>

      {/* Footer: members count + action CTA */}
      <div className="pt-2 border-t flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground">
          <Users className="w-3.5 h-3.5 text-[#58CC02]" />
          <span>
            {group.members_count || 1} {group.members_count === 1 ? 'membro' : 'membros'}
          </span>
        </div>

        <div>
          {isMember ? (
            <Button
              size="sm"
              variant="outline"
              onClick={handleActionClick}
              disabled={loadingAction || isOwner}
              title={isOwner ? 'O dono não pode sair diretamente do grupo' : 'Sair do grupo'}
              className="rounded-xl h-8 px-3 font-bold text-xs border-2 border-[#58CC02]/40 text-[#58CC02] hover:bg-[#58CC02]/10 gap-1.5 cursor-pointer active:scale-95"
            >
              {loadingAction ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : isOwner ? (
                <>
                  <Check className="w-3.5 h-3.5 text-[#58CC02]" />
                  <span>Dono</span>
                </>
              ) : (
                <>
                  <Check className="w-3.5 h-3.5 text-[#58CC02]" />
                  <span>Membro</span>
                </>
              )}
            </Button>
          ) : isPending ? (
            <Button
              size="sm"
              variant="outline"
              onClick={handleActionClick}
              disabled={loadingAction}
              className="rounded-xl h-8 px-3 font-bold text-xs border-2 border-amber-500/50 text-amber-500 hover:bg-amber-500/10 gap-1.5 cursor-pointer active:scale-95"
            >
              {loadingAction ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <>
                  <Clock className="w-3.5 h-3.5" />
                  <span>Pendente</span>
                </>
              )}
            </Button>
          ) : (
            <Button
              size="sm"
              onClick={handleActionClick}
              disabled={loadingAction}
              className="rounded-xl h-8 px-3.5 font-black text-xs bg-[#58CC02] hover:bg-[#58CC02]/90 border-b-2 border-[#46A302] text-white gap-1.5 cursor-pointer active:scale-95"
            >
              {loadingAction ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : group.is_closed ? (
                <>
                  <Lock className="w-3.5 h-3.5" />
                  <span>Solicitar</span>
                </>
              ) : (
                <>
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Participar</span>
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
