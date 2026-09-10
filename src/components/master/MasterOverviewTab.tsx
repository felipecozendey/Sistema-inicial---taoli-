import { useMemo } from 'react'
import { useMasterStore } from '@/stores/useMasterStore'
import { Card } from '@/components/ui/card'
import { safeFormatDate } from '@/lib/date-utils'
import {
  Users,
  ShieldCheck,
  UserCheck,
  UserX,
  UserPlus,
  Activity,
  CalendarClock,
  Clock,
  ArrowRight,
} from 'lucide-react'

interface MasterOverviewTabProps {
  onGoToUsers: () => void
  onGoToAudit: () => void
}

export function MasterOverviewTab({ onGoToUsers, onGoToAudit }: MasterOverviewTabProps) {
  const { profiles, auditLogs } = useMasterStore()

  const stats = useMemo(() => {
    const totalUsers = profiles.length
    const totalMasters = profiles.filter((p) => p.role === 'master').length
    const totalActive = profiles.filter((p) => p.status === 'active').length
    const totalSuspended = profiles.filter((p) => p.status === 'suspended').length

    const now = new Date()
    const ms7d = 7 * 24 * 60 * 60 * 1000
    const ms30d = 30 * 24 * 60 * 60 * 1000

    const newUsers7d = profiles.filter((p) => {
      const dt = new Date(p.createdAt)
      return !isNaN(dt.getTime()) && now.getTime() - dt.getTime() <= ms7d
    }).length

    const newUsers30d = profiles.filter((p) => {
      const dt = new Date(p.createdAt)
      return !isNaN(dt.getTime()) && now.getTime() - dt.getTime() <= ms30d
    }).length

    return { totalUsers, totalMasters, totalActive, totalSuspended, newUsers7d, newUsers30d }
  }, [profiles])

  const recentLogs = useMemo(() => auditLogs.slice(0, 5), [auditLogs])

  const getActionLabel = (action: string) => {
    switch (action) {
      case 'create_user':
        return {
          label: 'Usuário Criado',
          color: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
        }
      case 'delete_user':
        return {
          label: 'Usuário Excluído',
          color: 'bg-rose-500/10 text-rose-600 dark:text-rose-400',
        }
      case 'suspend':
        return {
          label: 'Conta Suspensa',
          color: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
        }
      case 'reactivate':
        return {
          label: 'Conta Reativada',
          color: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
        }
      case 'set_role':
        return {
          label: 'Alteração de Papel',
          color: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400',
        }
      case 'toggle_feature':
        return { label: 'Feature Flag', color: 'bg-blue-500/10 text-blue-600 dark:text-blue-400' }
      case 'create_billing':
        return {
          label: 'Cobrança Gerada',
          color: 'bg-purple-500/10 text-purple-600 dark:text-purple-400',
        }
      default:
        return { label: action, color: 'bg-muted text-muted-foreground' }
    }
  }

  const formatRelativeTime = (dateStr: string) => {
    const dt = new Date(dateStr)
    if (isNaN(dt.getTime())) return safeFormatDate(dateStr)
    const diffSec = Math.floor((Date.now() - dt.getTime()) / 1000)
    if (diffSec < 60) return 'Agora mesmo'
    const diffMin = Math.floor(diffSec / 60)
    if (diffMin < 60) return `Há ${diffMin} min`
    const diffHours = Math.floor(diffMin / 60)
    if (diffHours < 24) return `Há ${diffHours} h`
    const diffDays = Math.floor(diffHours / 24)
    if (diffDays <= 7) return `Há ${diffDays} d`
    return safeFormatDate(dt)
  }

  return (
    <div className="space-y-6">
      {/* Duolingo Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3 sm:gap-4">
        {/* Total Usuários */}
        <Card className="rounded-3xl border-2 border-b-4 border-b-blue-500/40 p-4 bg-card shadow-sm flex flex-col justify-between hover:translate-y-[-2px] transition-transform">
          <div className="flex items-center justify-between text-blue-500 mb-2">
            <span className="text-xs font-black uppercase tracking-wider text-muted-foreground">
              Total
            </span>
            <div className="p-2 rounded-2xl bg-blue-500/10">
              <Users className="w-5 h-5 text-blue-500" />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-black text-foreground">
              {stats.totalUsers}
            </div>
            <div className="text-[11px] font-bold text-muted-foreground">Usuários na base</div>
          </div>
        </Card>

        {/* Masters */}
        <Card className="rounded-3xl border-2 border-b-4 border-b-amber-500/40 p-4 bg-card shadow-sm flex flex-col justify-between hover:translate-y-[-2px] transition-transform">
          <div className="flex items-center justify-between text-amber-500 mb-2">
            <span className="text-xs font-black uppercase tracking-wider text-muted-foreground">
              Masters
            </span>
            <div className="p-2 rounded-2xl bg-amber-500/10">
              <ShieldCheck className="w-5 h-5 text-amber-500" />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-black text-foreground">
              {stats.totalMasters}
            </div>
            <div className="text-[11px] font-bold text-muted-foreground">Controle total</div>
          </div>
        </Card>

        {/* Ativos */}
        <Card className="rounded-3xl border-2 border-b-4 border-b-[#58CC02]/40 p-4 bg-card shadow-sm flex flex-col justify-between hover:translate-y-[-2px] transition-transform">
          <div className="flex items-center justify-between text-[#58CC02] mb-2">
            <span className="text-xs font-black uppercase tracking-wider text-muted-foreground">
              Ativos
            </span>
            <div className="p-2 rounded-2xl bg-[#58CC02]/10">
              <UserCheck className="w-5 h-5 text-[#58CC02]" />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-black text-foreground">
              {stats.totalActive}
            </div>
            <div className="text-[11px] font-bold text-muted-foreground">Acesso liberado</div>
          </div>
        </Card>

        {/* Suspensos */}
        <Card className="rounded-3xl border-2 border-b-4 border-b-rose-500/40 p-4 bg-card shadow-sm flex flex-col justify-between hover:translate-y-[-2px] transition-transform">
          <div className="flex items-center justify-between text-rose-500 mb-2">
            <span className="text-xs font-black uppercase tracking-wider text-muted-foreground">
              Suspensos
            </span>
            <div className="p-2 rounded-2xl bg-rose-500/10">
              <UserX className="w-5 h-5 text-rose-500" />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-black text-foreground">
              {stats.totalSuspended}
            </div>
            <div className="text-[11px] font-bold text-muted-foreground">Acesso bloqueado</div>
          </div>
        </Card>

        {/* Novos 7d */}
        <Card className="rounded-3xl border-2 border-b-4 border-b-purple-500/40 p-4 bg-card shadow-sm flex flex-col justify-between hover:translate-y-[-2px] transition-transform">
          <div className="flex items-center justify-between text-purple-500 mb-2">
            <span className="text-xs font-black uppercase tracking-wider text-muted-foreground">
              7 Dias
            </span>
            <div className="p-2 rounded-2xl bg-purple-500/10">
              <UserPlus className="w-5 h-5 text-purple-500" />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-black text-foreground">
              {stats.newUsers7d}
            </div>
            <div className="text-[11px] font-bold text-muted-foreground">Novos cadastros</div>
          </div>
        </Card>

        {/* Novos 30d */}
        <Card className="rounded-3xl border-2 border-b-4 border-b-cyan-500/40 p-4 bg-card shadow-sm flex flex-col justify-between hover:translate-y-[-2px] transition-transform">
          <div className="flex items-center justify-between text-cyan-500 mb-2">
            <span className="text-xs font-black uppercase tracking-wider text-muted-foreground">
              30 Dias
            </span>
            <div className="p-2 rounded-2xl bg-cyan-500/10">
              <CalendarClock className="w-5 h-5 text-cyan-500" />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-black text-foreground">
              {stats.newUsers30d}
            </div>
            <div className="text-[11px] font-bold text-muted-foreground">Mês corrente</div>
          </div>
        </Card>
      </div>

      {/* Recentes & Quick links */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 5 Ações Recentes de Auditoria */}
        <div className="lg:col-span-2 bg-card border-2 rounded-3xl p-5 sm:p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-primary" />
              <h3 className="font-extrabold text-base sm:text-lg text-foreground">
                Últimas Ações Administrativas
              </h3>
            </div>
            <button
              onClick={onGoToAudit}
              className="text-xs font-bold text-primary hover:underline flex items-center gap-1"
            >
              Ver todas <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {recentLogs.length === 0 ? (
            <div className="py-10 text-center text-sm font-semibold text-muted-foreground">
              Nenhuma ação administrativa registrada até o momento.
            </div>
          ) : (
            <div className="divide-y divide-border">
              {recentLogs.map((log) => {
                const meta = getActionLabel(log.action)
                return (
                  <div key={log.id} className="py-3 flex items-start justify-between gap-3 text-sm">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[11px] font-extrabold ${meta.color}`}
                        >
                          {meta.label}
                        </span>
                        {log.targetEmail && (
                          <span className="text-xs font-semibold text-foreground truncate max-w-[200px] sm:max-w-[280px]">
                            {log.targetEmail}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Por{' '}
                        <span className="font-medium text-foreground">
                          {log.actorEmail || 'Master'}
                        </span>
                      </p>
                    </div>

                    <div className="flex items-center gap-1 text-[11px] font-medium text-muted-foreground whitespace-nowrap">
                      <Clock className="w-3 h-3" />
                      {formatRelativeTime(log.createdAt)}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Atalhos Rápidos */}
        <div className="bg-card border-2 rounded-3xl p-5 sm:p-6 shadow-sm flex flex-col justify-between space-y-4">
          <div>
            <h3 className="font-extrabold text-base sm:text-lg text-foreground mb-1">
              Painel do Master
            </h3>
            <p className="text-xs text-muted-foreground font-medium leading-relaxed">
              Como usuário Master você possui controle absoluto do sistema, podendo criar
              credenciais, emitir cobranças, ligar/desligar módulos e gerenciar papéis.
            </p>
          </div>

          <div className="space-y-2.5">
            <button
              onClick={onGoToUsers}
              className="w-full text-left p-3 rounded-2xl bg-primary/10 hover:bg-primary/20 transition-colors flex items-center justify-between border-b-2 border-primary/30"
            >
              <div className="flex items-center gap-2.5">
                <Users className="w-4 h-4 text-primary" />
                <span className="text-xs font-bold text-foreground">Gerenciar Usuários</span>
              </div>
              <ArrowRight className="w-4 h-4 text-primary" />
            </button>

            <button
              onClick={onGoToAudit}
              className="w-full text-left p-3 rounded-2xl bg-amber-500/10 hover:bg-amber-500/20 transition-colors flex items-center justify-between border-b-2 border-amber-500/30"
            >
              <div className="flex items-center gap-2.5">
                <ShieldCheck className="w-4 h-4 text-amber-500" />
                <span className="text-xs font-bold text-foreground">Trilha de Auditoria</span>
              </div>
              <ArrowRight className="w-4 h-4 text-amber-500" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
