import { useState } from 'react'
import { GroupPoll } from '@/services/social'
import { useSocialStore } from '@/stores/useSocialStore'
import { useAuth } from '@/hooks/use-auth'
import { isProUser } from '@/hooks/use-pro-features'
import { Button } from '@/components/ui/button'
import { PollReportModal } from './PollReportModal'
import { BarChart2, CheckCircle2, Clock, Lock, MoreVertical, Trash2, Loader2 } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { cn } from '@/lib/utils'

interface PollCardProps {
  poll: GroupPoll
  groupId: string
  isOwner: boolean
}

export function PollCard({ poll, groupId, isOwner }: PollCardProps) {
  const { user } = useAuth()
  const { votePoll, endPoll, removePoll } = useSocialStore()
  const [reportOpen, setReportOpen] = useState(false)
  const [votingOptId, setVotingOptId] = useState<string | null>(null)

  const isPro = isProUser({ is_professional: true })
  const hasVoted = Boolean(poll.user_voted_option_id)
  const isClosed = poll.is_closed

  const handleVote = async (optId: string) => {
    if (!user || isClosed) return
    setVotingOptId(optId)
    try {
      await votePoll(poll.id, optId, user.id, groupId)
    } finally {
      setVotingOptId(null)
    }
  }

  const handleEndPoll = async () => {
    await endPoll(poll.id, groupId)
  }

  const handleDeletePoll = async () => {
    if (!user) return
    await removePoll(poll.id, user.id, groupId)
  }

  return (
    <article className="p-4 sm:p-5 rounded-3xl border-2 bg-card space-y-3.5 shadow-sm hover:border-[#1CB0F6]/40 transition-colors">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-[#1CB0F6]/15 text-[#1CB0F6] flex items-center justify-center shrink-0">
            <BarChart2 className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[11px] font-black uppercase tracking-wider text-[#1CB0F6]">
                Pesquisa do Grupo
              </span>
              {isClosed ? (
                <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                  <Lock className="w-3 h-3" /> Encerrada
                </span>
              ) : (
                <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-[#58CC02] bg-[#58CC02]/15 px-2 py-0.5 rounded-full">
                  <Clock className="w-3 h-3" /> Aberta para votos
                </span>
              )}
            </div>
            <div className="text-[10px] text-muted-foreground font-semibold">
              Criada{' '}
              {formatDistanceToNow(new Date(poll.created_at), {
                addSuffix: true,
                locale: ptBR,
              })}
            </div>
          </div>
        </div>

        {/* Pro Owner actions menu */}
        {isOwner && isPro && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="p-1.5 rounded-xl hover:bg-muted text-muted-foreground transition-colors cursor-pointer"
                aria-label="Opções da pesquisa"
              >
                <MoreVertical className="w-4 h-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="rounded-2xl border-2 p-1 min-w-[170px]">
              <DropdownMenuItem
                onClick={() => setReportOpen(true)}
                className="text-xs font-bold text-[#58CC02] rounded-xl cursor-pointer"
              >
                <BarChart2 className="w-3.5 h-3.5 mr-2" />
                Ver Relatório Completo
              </DropdownMenuItem>

              {!isClosed && (
                <DropdownMenuItem
                  onClick={handleEndPoll}
                  className="text-xs font-bold text-amber-500 rounded-xl cursor-pointer"
                >
                  <Lock className="w-3.5 h-3.5 mr-2" />
                  Encerrar Pesquisa
                </DropdownMenuItem>
              )}

              <DropdownMenuItem
                onClick={handleDeletePoll}
                className="text-xs font-bold text-destructive rounded-xl cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5 mr-2" />
                Excluir Pesquisa
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      {/* Question */}
      <h3 className="text-sm sm:text-base font-black text-foreground leading-snug">
        {poll.question}
      </h3>

      {/* Options List */}
      <div className="space-y-2 pt-1">
        {poll.options.map((option) => {
          const isSelected = poll.user_voted_option_id === option.id
          const pct = option.percentage || 0
          const isVoting = votingOptId === option.id

          // Show percentages if user voted, poll closed, or owner
          const showResults = hasVoted || isClosed || isOwner

          return (
            <button
              key={option.id}
              type="button"
              disabled={isClosed || isVoting}
              onClick={() => handleVote(option.id)}
              className={cn(
                'w-full text-left p-3 rounded-2xl border-2 transition-all relative overflow-hidden group cursor-pointer active:scale-[0.99]',
                isSelected
                  ? 'border-[#58CC02] bg-[#58CC02]/10 font-black'
                  : 'border-border bg-card hover:border-[#1CB0F6]/60',
                isClosed && 'cursor-default opacity-90',
              )}
            >
              {/* Progress background fill when results visible */}
              {showResults && (
                <div
                  className={cn(
                    'absolute top-0 left-0 bottom-0 transition-all duration-500 opacity-20 pointer-events-none',
                    isSelected ? 'bg-[#58CC02]' : 'bg-[#1CB0F6]',
                  )}
                  style={{ width: `${pct}%` }}
                />
              )}

              <div className="relative z-10 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <div
                    className={cn(
                      'w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors',
                      isSelected
                        ? 'border-[#58CC02] bg-[#58CC02] text-white'
                        : 'border-muted-foreground/40 group-hover:border-[#1CB0F6]',
                    )}
                  >
                    {isSelected && <CheckCircle2 className="w-3 h-3 stroke-white" />}
                  </div>
                  <span className="text-xs sm:text-sm font-bold text-foreground truncate">
                    {option.option_text}
                  </span>
                </div>

                {isVoting ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-muted-foreground" />
                ) : showResults ? (
                  <span className="text-xs font-black text-muted-foreground shrink-0">{pct}%</span>
                ) : null}
              </div>
            </button>
          )
        })}
      </div>

      {/* Footer / Status */}
      <div className="flex items-center justify-between pt-1 border-t text-[11px] font-semibold text-muted-foreground">
        <div>
          <span>{poll.total_votes || 0} voto(s) no total</span>
          {hasVoted && !isClosed && (
            <span className="text-[#58CC02] ml-2 font-bold">• Clique para trocar o voto</span>
          )}
        </div>

        {/* View report button for Pro Owner */}
        {isOwner && isPro && (
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setReportOpen(true)}
            className="h-7 px-2 text-xs font-black text-[#58CC02] hover:text-[#58CC02]/80 hover:bg-[#58CC02]/10 rounded-xl cursor-pointer"
          >
            <BarChart2 className="w-3.5 h-3.5 mr-1" />
            Relatório
          </Button>
        )}
      </div>

      {/* Report Modal */}
      {isOwner && isPro && (
        <PollReportModal open={reportOpen} onOpenChange={setReportOpen} poll={poll} />
      )}
    </article>
  )
}
