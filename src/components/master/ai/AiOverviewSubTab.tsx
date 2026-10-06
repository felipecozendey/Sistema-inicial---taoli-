import { useMemo } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { safeFormatDate } from '@/lib/date-utils'
import { AiUsageLogItem, USD_TO_BRL_RATE } from '@/stores/useAiStore'
import {
  Zap,
  Cpu,
  DollarSign,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertCircle,
  Users,
  Layers,
} from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'

interface AiOverviewSubTabProps {
  logs: AiUsageLogItem[]
  loading: boolean
}

export function AiOverviewSubTab({ logs, loading }: AiOverviewSubTabProps) {
  // 1. Métricas do Mês Corrente
  const monthlyMetrics = useMemo(() => {
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

    const thisMonthLogs = logs.filter((l) => {
      const dt = new Date(l.createdAt)
      return !isNaN(dt.getTime()) && dt >= startOfMonth
    })

    const totalRequests = thisMonthLogs.length
    const successfulRequests = thisMonthLogs.filter((l) => l.status === 'success').length
    const totalTokens = thisMonthLogs.reduce((acc, curr) => acc + (curr.totalTokens || 0), 0)
    const costUsd = thisMonthLogs.reduce((acc, curr) => acc + (curr.costUsd || 0), 0)
    const costBrl = costUsd * USD_TO_BRL_RATE

    return {
      totalRequests,
      successfulRequests,
      totalTokens,
      costUsd,
      costBrl,
    }
  }, [logs])

  // 2. Breakdown por Provedor (para o gráfico Recharts)
  const providerData = useMemo(() => {
    const providerMap: Record<string, { requests: number; tokens: number; cost: number }> = {
      openai: { requests: 0, tokens: 0, cost: 0 },
      gemini: { requests: 0, tokens: 0, cost: 0 },
      anthropic: { requests: 0, tokens: 0, cost: 0 },
    }

    logs.forEach((log) => {
      const prov = log.provider || 'openai'
      if (!providerMap[prov]) {
        providerMap[prov] = { requests: 0, tokens: 0, cost: 0 }
      }
      providerMap[prov].requests += 1
      providerMap[prov].tokens += log.totalTokens || 0
      providerMap[prov].cost += log.costUsd || 0
    })

    const colors: Record<string, string> = {
      openai: '#10A37F', // Verde OpenAI
      gemini: '#1CB0F6', // Azul Gemini
      anthropic: '#FF9600', // Âmbar Anthropic
    }

    const labels: Record<string, string> = {
      openai: 'ChatGPT (OpenAI)',
      gemini: 'Gemini (Google)',
      anthropic: 'Claude (Anthropic)',
    }

    return Object.entries(providerMap).map(([key, val]) => ({
      provider: key,
      name: labels[key] || key,
      requests: val.requests,
      tokens: val.tokens,
      costUsd: Number(val.cost.toFixed(4)),
      color: colors[key] || '#58CC02',
    }))
  }, [logs])

  // 3. Top 5 Usuários por Consumo
  const topUsers = useMemo(() => {
    const userMap = new Map<
      string,
      { id: string; name: string; email: string; requests: number; tokens: number; cost: number }
    >()

    logs.forEach((log) => {
      const uId = log.userId || 'anonymous'
      const existing = userMap.get(uId) || {
        id: uId,
        name: log.userName || (log.userId ? 'Usuário' : 'Anônimo / Teste'),
        email: log.userEmail || '',
        requests: 0,
        tokens: 0,
        cost: 0,
      }
      existing.requests += 1
      existing.tokens += log.totalTokens || 0
      existing.cost += log.costUsd || 0
      userMap.set(uId, existing)
    })

    return Array.from(userMap.values())
      .sort((a, b) => b.tokens - a.tokens)
      .slice(0, 5)
  }, [logs])

  // 4. Top Features mais utilizadas
  const topFeatures = useMemo(() => {
    const featMap = new Map<string, { feature: string; requests: number; tokens: number }>()

    logs.forEach((log) => {
      const feat = log.feature || 'desconhecido'
      const existing = featMap.get(feat) || { feature: feat, requests: 0, tokens: 0 }
      existing.requests += 1
      existing.tokens += log.totalTokens || 0
      featMap.set(feat, existing)
    })

    return Array.from(featMap.values())
      .sort((a, b) => b.requests - a.requests)
      .slice(0, 5)
  }, [logs])

  return (
    <div className="space-y-6">
      {/* 4 Cards Duolingo Style (border-b-4, rounded-3xl) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Total de Requests */}
        <Card className="rounded-3xl border-2 border-b-4 border-b-[#1CB0F6]/40 p-4 bg-card shadow-sm flex flex-col justify-between hover:translate-y-[-2px] transition-transform">
          <div className="flex items-center justify-between text-[#1CB0F6] mb-2">
            <span className="text-xs font-black uppercase tracking-wider text-muted-foreground">
              Requisições
            </span>
            <div className="p-2 rounded-2xl bg-[#1CB0F6]/10">
              <Zap className="w-5 h-5 text-[#1CB0F6]" />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-black text-foreground">
              {monthlyMetrics.totalRequests.toLocaleString('pt-BR')}
            </div>
            <div className="text-[11px] font-bold text-muted-foreground">
              {monthlyMetrics.successfulRequests} com sucesso no mês
            </div>
          </div>
        </Card>

        {/* Total de Tokens */}
        <Card className="rounded-3xl border-2 border-b-4 border-b-[#58CC02]/40 p-4 bg-card shadow-sm flex flex-col justify-between hover:translate-y-[-2px] transition-transform">
          <div className="flex items-center justify-between text-[#58CC02] mb-2">
            <span className="text-xs font-black uppercase tracking-wider text-muted-foreground">
              Tokens
            </span>
            <div className="p-2 rounded-2xl bg-[#58CC02]/10">
              <Cpu className="w-5 h-5 text-[#58CC02]" />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-black text-foreground">
              {monthlyMetrics.totalTokens > 1000000
                ? `${(monthlyMetrics.totalTokens / 1000000).toFixed(2)}M`
                : monthlyMetrics.totalTokens > 1000
                  ? `${(monthlyMetrics.totalTokens / 1000).toFixed(1)}k`
                  : monthlyMetrics.totalTokens}
            </div>
            <div className="text-[11px] font-bold text-muted-foreground">Consumo acumulado</div>
          </div>
        </Card>

        {/* Custo Estimado USD */}
        <Card className="rounded-3xl border-2 border-b-4 border-b-[#FFC800]/50 p-4 bg-card shadow-sm flex flex-col justify-between hover:translate-y-[-2px] transition-transform">
          <div className="flex items-center justify-between text-amber-500 mb-2">
            <span className="text-xs font-black uppercase tracking-wider text-muted-foreground">
              Custo (USD)
            </span>
            <div className="p-2 rounded-2xl bg-[#FFC800]/10">
              <DollarSign className="w-5 h-5 text-amber-500" />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-black text-foreground">
              ${monthlyMetrics.costUsd.toFixed(3)}
            </div>
            <div className="text-[11px] font-bold text-muted-foreground">
              Estimativa por ai_pricing
            </div>
          </div>
        </Card>

        {/* Custo BRL Aproximado */}
        <Card className="rounded-3xl border-2 border-b-4 border-b-[#CE82FF]/40 p-4 bg-card shadow-sm flex flex-col justify-between hover:translate-y-[-2px] transition-transform">
          <div className="flex items-center justify-between text-purple-500 mb-2">
            <span className="text-xs font-black uppercase tracking-wider text-muted-foreground">
              Estimativa (BRL)
            </span>
            <div className="p-2 rounded-2xl bg-purple-500/10">
              <TrendingUp className="w-5 h-5 text-purple-500" />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-black text-foreground">
              R$ {monthlyMetrics.costBrl.toFixed(2)}
            </div>
            <div className="text-[11px] font-bold text-muted-foreground">
              Câmbio fixo ~R$ {USD_TO_BRL_RATE.toFixed(2)}
            </div>
          </div>
        </Card>
      </div>

      {/* Grid de Gráfico por Provedor e Top Features */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Breakdown de Provedores com Gráfico Recharts */}
        <div className="lg:col-span-2 bg-card border-2 rounded-3xl p-5 sm:p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-2xl bg-primary/10 text-primary">
                  <Cpu className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="font-extrabold text-base sm:text-lg text-foreground">
                    Consumo por Provedor
                  </h3>
                  <p className="text-xs text-muted-foreground font-semibold">
                    Volume de requisições distribuídas entre OpenAI, Gemini e Claude
                  </p>
                </div>
              </div>
            </div>

            <div className="h-48 sm:h-56 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={providerData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <XAxis
                    dataKey="name"
                    stroke="#888888"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    stroke="#888888"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                    allowDecimals={false}
                  />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload
                        return (
                          <div className="bg-popover border-2 border-border p-3 rounded-2xl shadow-lg text-xs space-y-1">
                            <p className="font-black text-foreground">{data.name}</p>
                            <p className="text-muted-foreground">
                              Requisições:{' '}
                              <strong className="text-foreground">{data.requests}</strong>
                            </p>
                            <p className="text-muted-foreground">
                              Tokens:{' '}
                              <strong className="text-foreground">
                                {data.tokens.toLocaleString('pt-BR')}
                              </strong>
                            </p>
                            <p className="text-muted-foreground">
                              Custo Est.:{' '}
                              <strong className="text-emerald-500">${data.costUsd}</strong>
                            </p>
                          </div>
                        )
                      }
                      return null
                    }}
                  />
                  <Bar dataKey="requests" radius={[8, 8, 0, 0]}>
                    {providerData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 pt-4 border-t border-border mt-4">
            {providerData.map((p) => (
              <div key={p.provider} className="text-center p-2 rounded-2xl bg-muted/40">
                <div className="text-[11px] font-bold text-muted-foreground truncate">{p.name}</div>
                <div className="text-sm font-black text-foreground mt-0.5">{p.requests} reqs</div>
                <div className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                  ${p.costUsd}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top 5 Features & Top Usuários */}
        <div className="space-y-6">
          {/* Top Features */}
          <div className="bg-card border-2 rounded-3xl p-5 shadow-sm space-y-3">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-primary" />
              <h4 className="font-extrabold text-sm text-foreground">Recursos Mais Acionados</h4>
            </div>

            {topFeatures.length === 0 ? (
              <p className="text-xs text-muted-foreground font-semibold py-4 text-center">
                Nenhum uso registrado ainda.
              </p>
            ) : (
              <div className="space-y-2">
                {topFeatures.map((f, i) => (
                  <div
                    key={f.feature}
                    className="flex items-center justify-between p-2 rounded-xl bg-muted/30 text-xs"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="w-5 h-5 rounded-full bg-primary/10 text-primary font-black text-[10px] flex items-center justify-center shrink-0">
                        {i + 1}
                      </span>
                      <span className="font-bold text-foreground truncate">{f.feature}</span>
                    </div>
                    <Badge variant="outline" className="text-[10px] font-bold shrink-0">
                      {f.requests} calls
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Top Usuários */}
          <div className="bg-card border-2 rounded-3xl p-5 shadow-sm space-y-3">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-[#1CB0F6]" />
              <h4 className="font-extrabold text-sm text-foreground">Top Usuários por Tokens</h4>
            </div>

            {topUsers.length === 0 ? (
              <p className="text-xs text-muted-foreground font-semibold py-4 text-center">
                Nenhum usuário registrado com consumo.
              </p>
            ) : (
              <div className="space-y-2">
                {topUsers.map((u, i) => (
                  <div
                    key={u.id}
                    className="flex items-center justify-between p-2 rounded-xl bg-muted/30 text-xs"
                  >
                    <div className="min-w-0 pr-2">
                      <div className="font-bold text-foreground truncate">{u.name}</div>
                      <div className="text-[10px] text-muted-foreground truncate">
                        {u.requests} chamadas · ${u.cost.toFixed(3)}
                      </div>
                    </div>
                    <span className="font-black text-[11px] text-[#58CC02] shrink-0">
                      {u.tokens.toLocaleString('pt-BR')} tok
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tabela / Lista Recente de Logs */}
      <div className="bg-card border-2 rounded-3xl p-5 sm:p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-primary" />
            <div>
              <h3 className="font-extrabold text-base sm:text-lg text-foreground">
                Logs Recentes de Execução
              </h3>
              <p className="text-xs text-muted-foreground font-semibold">
                Auditoria em tempo real de cada chamada realizada pelo ai-proxy
              </p>
            </div>
          </div>
          <Badge variant="outline" className="font-bold text-xs">
            {logs.length} registros
          </Badge>
        </div>

        {logs.length === 0 ? (
          <div className="py-12 text-center text-sm font-semibold text-muted-foreground">
            {loading ? 'Carregando registros...' : 'Nenhum log de uso registrado até o momento.'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-border text-muted-foreground font-black uppercase text-[10px]">
                  <th className="pb-3 pr-4">Data/Hora</th>
                  <th className="pb-3 pr-4">Usuário</th>
                  <th className="pb-3 pr-4">Provedor / Modelo</th>
                  <th className="pb-3 pr-4">Feature</th>
                  <th className="pb-3 pr-4 text-right">Tokens</th>
                  <th className="pb-3 pr-4 text-right">Custo Est.</th>
                  <th className="pb-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {logs.slice(0, 30).map((log) => {
                  return (
                    <tr key={log.id} className="hover:bg-muted/40 transition-colors">
                      <td className="py-3 pr-4 font-medium text-muted-foreground whitespace-nowrap">
                        {safeFormatDate(log.createdAt)}
                      </td>
                      <td className="py-3 pr-4 font-bold text-foreground">
                        <div
                          className="truncate max-w-[140px] sm:max-w-[200px]"
                          title={log.userEmail || log.userName}
                        >
                          {log.userName}
                        </div>
                      </td>
                      <td className="py-3 pr-4">
                        <div className="font-bold text-foreground capitalize">{log.provider}</div>
                        <div className="text-[10px] text-muted-foreground font-mono truncate max-w-[140px]">
                          {log.model || 'default'}
                        </div>
                      </td>
                      <td className="py-3 pr-4 font-semibold text-foreground">
                        <Badge variant="secondary" className="text-[10px] font-bold">
                          {log.feature}
                        </Badge>
                      </td>
                      <td className="py-3 pr-4 text-right font-mono font-bold text-foreground">
                        {log.totalTokens.toLocaleString('pt-BR')}
                      </td>
                      <td className="py-3 pr-4 text-right font-mono font-semibold text-emerald-600 dark:text-emerald-400">
                        ${log.costUsd > 0 ? log.costUsd.toFixed(5) : '0.000'}
                      </td>
                      <td className="py-3 text-center">
                        {log.status === 'success' ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                            <CheckCircle2 className="w-3 h-3" /> Sucesso
                          </span>
                        ) : (
                          <span
                            className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-600 dark:text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded-full cursor-help"
                            title={log.errorMessage || 'Erro desconhecido'}
                          >
                            <AlertCircle className="w-3 h-3" /> Falha
                          </span>
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
    </div>
  )
}
