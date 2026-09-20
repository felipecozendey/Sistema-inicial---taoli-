import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { GroupPoll } from '@/services/social'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { BarChart3, Users, CheckCircle2, Lock } from 'lucide-react'
import { Link } from 'react-router-dom'

interface PollReportModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  poll: GroupPoll | null
}

const DUOLINGO_COLORS = ['#58CC02', '#1CB0F6', '#FFC800', '#CE82FF', '#FF4B4B', '#2B70C9']

export function PollReportModal({ open, onOpenChange, poll }: PollReportModalProps) {
  if (!poll) return null

  const chartData = poll.options.map((opt, idx) => ({
    name: opt.option_text.length > 20 ? opt.option_text.slice(0, 18) + '...' : opt.option_text,
    fullName: opt.option_text,
    votos: opt.vote_count || 0,
    pct: opt.percentage || 0,
    color: DUOLINGO_COLORS[idx % DUOLINGO_COLORS.length],
  }))

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-3xl border-2 sm:max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="w-12 h-12 rounded-2xl bg-[#58CC02]/15 text-[#58CC02] flex items-center justify-center mx-auto mb-1">
            <BarChart3 className="w-6 h-6" />
          </div>
          <DialogTitle className="text-center font-black text-lg">
            Relatório da Pesquisa
          </DialogTitle>
          <p className="text-center text-xs text-muted-foreground font-semibold px-2">
            "{poll.question}"
          </p>
        </DialogHeader>

        <div className="space-y-5 py-2">
          {/* Summary Cards */}
          <div className="grid grid-cols-3 gap-2">
            <div className="p-3 rounded-2xl border-2 bg-card text-center">
              <div className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                Total Votos
              </div>
              <div className="text-xl font-black text-[#58CC02] mt-0.5">
                {poll.total_votes || 0}
              </div>
            </div>

            <div className="p-3 rounded-2xl border-2 bg-card text-center">
              <div className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                Participação
              </div>
              <div className="text-xl font-black text-[#1CB0F6] mt-0.5">
                {poll.participation_rate || 0}%
              </div>
            </div>

            <div className="p-3 rounded-2xl border-2 bg-card text-center">
              <div className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                Status
              </div>
              <div className="text-xs font-black mt-1.5 flex items-center justify-center gap-1">
                {poll.is_closed ? (
                  <span className="text-muted-foreground flex items-center gap-1">
                    <Lock className="w-3.5 h-3.5" /> Encerrada
                  </span>
                ) : (
                  <span className="text-[#58CC02] flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Aberta
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Bar Chart */}
          <div className="p-4 rounded-3xl border-2 bg-card space-y-2">
            <div className="text-xs font-black uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <BarChart3 className="w-3.5 h-3.5 text-primary" />
              Distribuição dos Votos (Recharts)
            </div>

            <div className="h-52 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={chartData}
                  layout="vertical"
                  margin={{ top: 5, right: 30, left: 10, bottom: 5 }}
                >
                  <XAxis type="number" allowDecimals={false} hide />
                  <YAxis
                    dataKey="name"
                    type="category"
                    width={110}
                    tick={{ fontSize: 11, fontWeight: 700 }}
                  />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload
                        return (
                          <div className="p-2.5 rounded-2xl bg-popover border-2 shadow-lg text-xs font-semibold">
                            <p className="font-black text-foreground">{data.fullName}</p>
                            <p className="text-[#58CC02] font-black">
                              {data.votos} voto(s) ({data.pct}%)
                            </p>
                          </div>
                        )
                      }
                      return null
                    }}
                  />
                  <Bar dataKey="votos" radius={[0, 8, 8, 0]}>
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Detailed Voter Breakdown ("Quem respondeu") */}
          <div className="space-y-3">
            <div className="text-xs font-black uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-[#1CB0F6]" />
              Quem respondeu (Visão do Profissional)
            </div>

            <div className="space-y-3">
              {poll.options.map((opt, idx) => {
                const color = DUOLINGO_COLORS[idx % DUOLINGO_COLORS.length]
                const voters = opt.voters || []

                return (
                  <div key={opt.id} className="p-3 rounded-2xl border-2 bg-card space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span
                          className="w-3 h-3 rounded-full shrink-0"
                          style={{ backgroundColor: color }}
                        />
                        <span className="font-extrabold text-foreground">{opt.option_text}</span>
                      </div>
                      <span className="font-black text-muted-foreground">
                        {opt.vote_count || 0} voto(s) ({opt.percentage || 0}%)
                      </span>
                    </div>

                    {voters.length === 0 ? (
                      <p className="text-[11px] text-muted-foreground/70 italic pl-5">
                        Nenhum voto nesta opção.
                      </p>
                    ) : (
                      <div className="flex flex-wrap gap-1.5 pl-5 pt-1">
                        {voters.map((voter) => (
                          <Link
                            key={voter.id}
                            to={`/u/@${voter.username}`}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-muted/70 hover:bg-muted border text-xs font-bold text-foreground transition-colors"
                          >
                            <div className="w-4 h-4 rounded-full overflow-hidden bg-background shrink-0">
                              {voter.avatar_url ? (
                                <img
                                  src={voter.avatar_url}
                                  alt={voter.username}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center bg-[#1CB0F6]/20 text-[#1CB0F6] text-[9px] font-black">
                                  {voter.username.charAt(0).toUpperCase()}
                                </div>
                              )}
                            </div>
                            <span>@{voter.username}</span>
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
