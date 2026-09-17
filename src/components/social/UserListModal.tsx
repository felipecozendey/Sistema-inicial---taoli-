import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { PublicProfile } from '@/services/social'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Link } from 'react-router-dom'
import { Users } from 'lucide-react'

interface UserListModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  users: PublicProfile[]
  emptyText: string
}

export function UserListModal({ open, onOpenChange, title, users, emptyText }: UserListModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px] rounded-3xl p-5 border-2 max-h-[80vh] flex flex-col">
        <DialogHeader className="pb-3 border-b">
          <DialogTitle className="text-lg font-black tracking-tight flex items-center gap-2">
            <Users className="w-5 h-5 text-[#1CB0F6]" />
            {title} ({users.length})
          </DialogTitle>
        </DialogHeader>

        <div className="overflow-y-auto flex-1 divide-y divide-border/60 py-2">
          {users.length === 0 ? (
            <div className="text-center py-8 text-sm font-semibold text-muted-foreground">
              {emptyText}
            </div>
          ) : (
            users.map((u) => (
              <Link
                key={u.id}
                to={`/u/@${u.username}`}
                onClick={() => onOpenChange(false)}
                className="flex items-center gap-3 py-3 px-2 rounded-2xl hover:bg-muted/50 transition-colors"
              >
                <Avatar className="w-10 h-10 border-2 border-primary/20">
                  <AvatarImage src={u.avatar_url || ''} />
                  <AvatarFallback className="font-black bg-[#58CC02]/20 text-[#58CC02]">
                    {(u.display_name || u.username).charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="font-extrabold text-sm truncate">
                    {u.display_name || u.username}
                  </div>
                  <div className="text-xs font-bold text-[#1CB0F6] truncate">@{u.username}</div>
                </div>
              </Link>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
