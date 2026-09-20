import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { GroupMember } from '@/services/social'
import { useSocialStore } from '@/stores/useSocialStore'
import { Link } from 'react-router-dom'
import { Users, Check, X, UserX, Clock, Shield, Loader2, Crown } from 'lucide-react'

interface ManageGroupModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  groupId: string
  groupName: string
}

export function ManageGroupModal({
  open,
  onOpenChange,
  groupId,
  groupName,
}: ManageGroupModalProps) {
  const { currentGroupMembers, respondMembershipRequest, removeMemberFromGroup } = useSocialStore()

  const [activeTab, setActiveTab] = useState<'pending' | 'members'>('pending')
  const [processingId, setProcessingId] = useState<string | null>(null)

  const pendingMembers = currentGroupMembers.filter((m) => m.status === 'pending')
  const activeMembers = currentGroupMembers.filter((m) => m.status === 'member')

  const handleRespond = async (targetUserId: string, action: 'member' | 'reject') => {
    setProcessingId(targetUserId)
    try {
      await respondMembershipRequest(groupId, targetUserId, action)
    } finally {
      setProcessingId(null)
    }
  }

  const handleRemove = async (targetUserId: string) => {
    setProcessingId(targetUserId)
    try {
      await removeMemberFromGroup(groupId, targetUserId)
    } finally {
      setProcessingId(null)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-3xl border-2 sm:max-w-md max-h-[85vh] flex flex-col p-5">
        <DialogHeader className="text-left space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-2xl bg-[#58CC02]/15 text-[#58CC02] border-2 border-[#58CC02]/30">
              <Users className="w-5 h-5" />
            </span>
            <div>
              <DialogTitle className="text-lg font-black text-foreground truncate">
                Gerenciar {groupName}
              </DialogTitle>
              <DialogDescription className="text-xs font-semibold text-muted-foreground">
                Aprove solicitações e gerencie quem faz parte do seu grupo.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <Tabs
          value={activeTab}
          onValueChange={(val) => setActiveTab(val as 'pending' | 'members')}
          className="flex-1 flex flex-col min-h-0 pt-2"
        >
          <TabsList className="grid grid-cols-2 p-1 rounded-2xl bg-muted/60 border-2">
            <TabsTrigger
              value="pending"
              className="rounded-xl text-xs font-black transition-all data-[state=active]:bg-[#FFC800] data-[state=active]:text-neutral-900 gap-1.5"
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Pendentes ({pendingMembers.length})</span>
            </TabsTrigger>
            <TabsTrigger
              value="members"
              className="rounded-xl text-xs font-black transition-all data-[state=active]:bg-[#58CC02] data-[state=active]:text-white gap-1.5"
            >
              <Users className="w-3.5 h-3.5" />
              <span>Membros ({activeMembers.length})</span>
            </TabsTrigger>
          </TabsList>

          {/* Tab Pendentes */}
          <TabsContent value="pending" className="flex-1 overflow-y-auto mt-3 pr-1 space-y-2">
            {pendingMembers.length === 0 ? (
              <div className="py-8 text-center space-y-1">
                <Check className="w-8 h-8 text-[#58CC02] mx-auto mb-2" />
                <p className="text-xs font-extrabold text-foreground">
                  Nenhuma solicitação pendente
                </p>
                <p className="text-[11px] text-muted-foreground font-medium">
                  Novos pedidos para entrar no grupo aparecerão aqui.
                </p>
              </div>
            ) : (
              pendingMembers.map((member) => {
                const user = member.user
                const displayName = user?.display_name || user?.username || 'Usuário'
                const isProcessing = processingId === member.user_id

                return (
                  <div
                    key={member.user_id}
                    className="p-3 rounded-2xl border-2 bg-card flex items-center justify-between gap-2"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-9 h-9 rounded-full overflow-hidden bg-muted border shrink-0">
                        {user?.avatar_url ? (
                          <img
                            src={user.avatar_url}
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
                        <Link
                          to={`/u/@${user?.username || 'user'}`}
                          className="text-xs font-black hover:underline truncate block text-foreground"
                        >
                          {displayName}
                        </Link>
                        <span className="text-[11px] text-[#1CB0F6] font-bold block">
                          @{user?.username || 'user'}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <Button
                        size="sm"
                        onClick={() => handleRespond(member.user_id, 'member')}
                        disabled={isProcessing}
                        className="rounded-xl h-8 px-2.5 font-bold text-xs bg-[#58CC02] hover:bg-[#58CC02]/90 border-b-2 border-[#46A302] text-white cursor-pointer"
                      >
                        {isProcessing ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <>
                            <Check className="w-3.5 h-3.5 mr-1" /> Aprovar
                          </>
                        )}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleRespond(member.user_id, 'reject')}
                        disabled={isProcessing}
                        className="rounded-xl h-8 px-2 font-bold text-xs text-destructive hover:text-destructive border-2 cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                )
              })
            )}
          </TabsContent>

          {/* Tab Membros Ativos */}
          <TabsContent value="members" className="flex-1 overflow-y-auto mt-3 pr-1 space-y-2">
            {activeMembers.map((member) => {
              const user = member.user
              const displayName = user?.display_name || user?.username || 'Usuário'
              const isOwner = member.role === 'owner'
              const isProcessing = processingId === member.user_id

              return (
                <div
                  key={member.user_id}
                  className="p-3 rounded-2xl border-2 bg-card flex items-center justify-between gap-2"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-9 h-9 rounded-full overflow-hidden bg-muted border shrink-0">
                      {user?.avatar_url ? (
                        <img
                          src={user.avatar_url}
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
                        <Link
                          to={`/u/@${user?.username || 'user'}`}
                          className="text-xs font-black hover:underline truncate text-foreground"
                        >
                          {displayName}
                        </Link>
                        {isOwner && (
                          <Badge className="bg-[#CE82FF] text-white text-[9px] font-black uppercase px-1.5 py-0.2 rounded-md flex items-center gap-0.5">
                            <Crown className="w-2.5 h-2.5" /> Dono
                          </Badge>
                        )}
                      </div>
                      <span className="text-[11px] text-[#1CB0F6] font-bold block">
                        @{user?.username || 'user'}
                      </span>
                    </div>
                  </div>

                  {!isOwner && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleRemove(member.user_id)}
                      disabled={isProcessing}
                      title="Remover membro do grupo"
                      className="rounded-xl h-8 px-2.5 font-bold text-xs text-destructive hover:text-destructive border-2 gap-1 cursor-pointer shrink-0"
                    >
                      {isProcessing ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <>
                          <UserX className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">Remover</span>
                        </>
                      )}
                    </Button>
                  )}
                </div>
              )
            })}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
