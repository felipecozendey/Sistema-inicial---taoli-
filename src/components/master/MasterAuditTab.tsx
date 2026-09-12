import { useState, useMemo } from 'react'
import { useMasterStore } from '@/stores/useMasterStore'
import { safeFormatDateLong } from '@/lib/date-utils'
import {
  ShieldAlert,
  Search,
  Clock,
  UserPlus,
  Trash2,
  UserX,
  UserCheck,
  ShieldCheck,
  Sliders,
  CreditCard,
  ChevronLeft,
  ChevronRight,
  Filter,
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

const PAGE_SIZE = 20

export function MasterAuditTab() {
  const { auditLogs } = useMasterStore()

  const [search, setSearch] = useState('')
  const [actionFilter, setActionFilter] = useState('all')
  const [currentPage, setCurrentPage] = useState(1)

  const filteredLogs = useMemo(() => {
    return auditLogs.filter((log) => {
      const matchAction = actionFilter === 'all' || log.action === actionFilter
      const matchSearch =
        (log.actorEmail && log.actorEmail.toLowerCase().includes(search.toLowerCase())) ||
        (log.targetEmail && log.targetEmail.toLowerCase().includes(search.toLowerCase())) ||
        log.action.toLowerCase().includes(search.toLowerCase())
      return matchAction && matchSearch
    })
  }, [auditLogs, actionFilter, search])

  const totalPages = Math.max(1, Math.ceil(filteredLogs.length / PAGE_SIZE))
  const paginatedLogs = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE
    return filteredLogs.slice(start, start + PAGE_SIZE)
  }, [filteredLogs, currentPage])

  const getActionConfig = (action: string) => {
    switch (action) {
      case 'create_user':
        return {
          label: 'Criou Usuário',
          icon: UserPlus,
          color: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30',
        }
      case 'delete_user':
        return {
          label: 'Excluiu Usuário',
          icon: Trash2,
          color: 'bg-rose-500/10 text-rose-600 border-rose-500/30',
        }
      case 'suspend':
        return {
          label: 'Suspendeu Conta',
          icon: UserX,
          color: 'bg-amber-500/10 text-amber-600 border-amber-500/30',
        }
      case 'reactivate':
        return {
          label: 'Reativou Conta',
          icon: UserCheck,
          color: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30',
        }
      case 'set_role':
        return {
          label: 'Alterou Papel',
          icon: ShieldCheck,
          color: 'bg-indigo-500/10 text-indigo-600 border-indigo-500/30',
        }
      case 'toggle_feature':
        return {
          label: 'Alternou Módulo',
          icon: Sliders,
          color: 'bg-blue-500/10 text-blue-600 border-blue-500/30',
        }
      case 'create_billing':
        return {
          label: 'Gerou Cobrança',
          icon: CreditCard,
          color: 'bg-purple-500/10 text-purple-600 border-purple-500/30',
        }
      case 'professional_granted':
        return {
          label: 'Perfil Pro Concedido',
          icon: ShieldCheck,
          color: 'bg-blue-500/10 text-[#1CB0F6] border-blue-500/30',
        }
      case 'professional_revoked':
        return {
          label: 'Perfil Pro Revogado',
          icon: UserX,
          color: 'bg-amber-500/10 text-amber-600 border-amber-500/30',
        }
      case 'professional_link_forced_end':
        return {
          label: 'Vínculo Forçado Fim',
          icon: UserX,
          color: 'bg-amber-500/10 text-amber-600 border-amber-500/30',
        }
      case 'professional_link_deleted':
        return {
          label: 'Vínculo Excluído',
          icon: Trash2,
          color: 'bg-rose-500/10 text-rose-600 border-rose-500/30',
        }
      case 'create_food':
        return {
          label: 'Criou Alimento',
          icon: Sliders,
          color: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30',
        }
      case 'update_food':
        return {
          label: 'Atualizou Alimento',
          icon: Sliders,
          color: 'bg-blue-500/10 text-blue-600 border-blue-500/30',
        }
      case 'delete_food':
        return {
          label: 'Excluiu Alimento',
          icon: Trash2,
          color: 'bg-rose-500/10 text-rose-600 border-rose-500/30',
        }
      case 'import_foods':
        return {
          label: 'Importou TACO',
          icon: Sliders,
          color: 'bg-purple-500/10 text-purple-600 border-purple-500/30',
        }
      case 'create_exercise':
        return {
          label: 'Criou Exercício',
          icon: Sliders,
          color: 'bg-amber-500/10 text-amber-600 border-amber-500/30',
        }
      case 'update_exercise':
        return {
          label: 'Atualizou Exercício',
          icon: Sliders,
          color: 'bg-blue-500/10 text-blue-600 border-blue-500/30',
        }
      case 'delete_exercise':
        return {
          label: 'Excluiu Exercício',
          icon: Trash2,
          color: 'bg-rose-500/10 text-rose-600 border-rose-500/30',
        }
      default:
        return {
          label: action,
          icon: ShieldAlert,
          color: 'bg-muted text-muted-foreground border-border',
        }
    }
  }

  const formatLogDate = (dateStr: string) => {
    const d = new Date(dateStr)
    if (isNaN(d.getTime())) return 'Data Indisponível'
    return `${d.toLocaleDateString('pt-BR')} às ${d.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })}`
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
          <Input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setCurrentPage(1)
            }}
            placeholder="Buscar por e-mail do autor ou alvo..."
            className="pl-9 rounded-2xl border-2 h-11"
          />
        </div>

        <select
          value={actionFilter}
          onChange={(e) => {
            setActionFilter(e.target.value)
            setCurrentPage(1)
          }}
          className="h-11 px-3 rounded-2xl border-2 bg-card text-xs font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="all">Todas as Ações</option>
          <option value="create_user">Criar Usuário</option>
          <option value="delete_user">Excluir Usuário</option>
          <option value="suspend">Suspender Conta</option>
          <option value="reactivate">Reativar Conta</option>
          <option value="set_role">Alterar Papel</option>
          <option value="toggle_feature">Alternar Feature Flag</option>
          <option value="create_billing">Cobrança</option>
          <option value="professional_granted">Perfil Pro Concedido</option>
          <option value="professional_revoked">Perfil Pro Revogado</option>
          <option value="professional_link_forced_end">Vínculo Pro Forçado Fim</option>
          <option value="professional_link_deleted">Vínculo Pro Excluído</option>
          <option value="create_food">Criar Alimento Oficial</option>
          <option value="update_food">Atualizar Alimento Oficial</option>
          <option value="delete_food">Excluir Alimento Oficial</option>
          <option value="import_foods">Importação em Lote (TACO)</option>
          <option value="create_exercise">Criar Exercício Global</option>
          <option value="update_exercise">Atualizar Exercício Global</option>
          <option value="delete_exercise">Excluir Exercício Global</option>
        </select>
      </div>

      {/* Logs Table */}
      <div className="bg-card border-2 rounded-3xl overflow-hidden shadow-sm">
        {paginatedLogs.length === 0 ? (
          <div className="py-16 text-center space-y-2">
            <Clock className="w-10 h-10 text-muted-foreground mx-auto opacity-50" />
            <p className="font-extrabold text-foreground">Nenhum evento registrado</p>
            <p className="text-xs text-muted-foreground">
              Não foram encontrados logs com os critérios informados.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b bg-muted/40 text-[11px] font-black uppercase tracking-wider text-muted-foreground">
                  <th className="py-3.5 px-4">Data / Hora</th>
                  <th className="py-3.5 px-4">Ação</th>
                  <th className="py-3.5 px-4">Executor (Master)</th>
                  <th className="py-3.5 px-4">Usuário Alvo</th>
                  <th className="py-3.5 px-4">Detalhes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {paginatedLogs.map((log) => {
                  const conf = getActionConfig(log.action)
                  const Icon = conf.icon
                  return (
                    <tr key={log.id} className="hover:bg-muted/30 transition-colors">
                      <td className="py-3.5 px-4 whitespace-nowrap text-xs font-mono text-muted-foreground">
                        {formatLogDate(log.createdAt)}
                      </td>

                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-black border ${conf.color}`}
                        >
                          <Icon className="w-3.5 h-3.5" />
                          {conf.label}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-xs font-bold text-foreground">
                        {log.actorEmail || 'Sistema / Master'}
                      </td>

                      <td className="py-3.5 px-4 text-xs font-semibold text-muted-foreground">
                        {log.targetEmail || '—'}
                      </td>

                      <td className="py-3.5 px-4 text-xs">
                        {log.details && Object.keys(log.details).length > 0 ? (
                          <code className="text-[11px] font-mono bg-muted px-2 py-1 rounded-md text-foreground max-w-[260px] truncate block">
                            {JSON.stringify(log.details)}
                          </code>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination Footer */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-2 pt-2">
          <p className="text-xs font-bold text-muted-foreground">
            Página {currentPage} de {totalPages} ({filteredLogs.length} eventos)
          </p>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="rounded-xl h-9 font-bold"
            >
              <ChevronLeft className="w-4 h-4 mr-1" /> Anterior
            </Button>

            <Button
              variant="outline"
              size="sm"
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="rounded-xl h-9 font-bold"
            >
              Próxima <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
