import React, { useState, useMemo } from 'react'
import { PatientMenteData, PatientMenteEvaluation } from '@/stores/useProfessionalStore'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
  CartesianGrid,
} from 'recharts'
import { ChartContainer } from '@/components/ui/chart'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { safeFormatDate } from '@/lib/date-utils'
import { cn } from '@/lib/utils'
import {
  Brain,
  TrendingUp,
  BookOpen,
  Zap,
  Calendar,
  Lock,
  Sparkles,
  FileText,
  Activity,
  Smile,
  Moon,
  AlertCircle,
} from 'lucide-react'

interface PatientMenteViewProps {
  data: PatientMenteData | null
  loading: boolean
}

const SCORE_METRICS = [
  { key: 'mood', label: 'Humor', color: '#58CC02' },
  { key: 'stress', label: 'Estresse', color: '#FF9600' },
  { key: 'anxiety', label: 'Ansiedade', color: '#FF4B4B' },
  { key: 'sleep', label: 'Sono', color: '#1CB0F6' },
  { key: 'sadness', label: 'Tristeza', color: '#CE82FF' },
] as const

const MOOD_EMOJIS: Record<number, string> = {
  1: '😩',
  2: '😕',
  3: '😐',
  4: '🙂',
  5: '😄',
}

const MOOD_TEXTS: Record<number, string> = {
  1: 'Péssimo',
  2: 'Ruim',
  3: 'Neutro',
  4: 'Bom',
  5: 'Excelente',
}

export function PatientMenteView({ data, loading }: PatientMenteViewProps) {
  const [subTab, setSubTab] = useState<'evolution' | 'journal' | 'events'>('evolution')
  const [activeMetrics, setActiveMetrics] = useState<Record<string, boolean>>({
    mood: true,
    stress: true,
    anxiety: false,
    sleep: false,
    sadness: false,
  })
  const [detailDialog, setDetailDialog] = useState<{
    title: string
    content: string
    isHtml?: boolean
  } | null>(null)

  const toggleMetric = (key: string) => {
    setActiveMetrics((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  const chartData = useMemo(() => {
    if (!data?.evaluations || data.evaluations.length === 0) return []
    // reverse so chart is chronological left to right
    return [...data.evaluations]
      .sort((a, b) => a.date.localeCompare(b.date))
      .map((e) => {
        const parts = e.date.split('-')
        const shortDate = parts.length === 3 ? `${parts[2]}/${parts[1]}` : e.date
        return {
          date: shortDate,
          fullDate: e.date,
          mood: e.mood,
          stress: e.stress_level,
          anxiety: e.anxiety_level,
          sleep: e.sleep_quality,
          sadness: e.sadness_level,
        }
      })
  }, [data?.evaluations])

  const chartConfig = useMemo(
    () => Object.fromEntries(SCORE_METRICS.map((m) => [m.key, { label: m.label, color: m.color }])),
    [],
  )

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-10 w-full max-w-xs bg-muted rounded-2xl" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <div className="h-20 bg-muted rounded-2xl" />
          <div className="h-20 bg-muted rounded-2xl" />
          <div className="h-20 bg-muted rounded-2xl" />
          <div className="h-20 bg-muted rounded-2xl" />
        </div>
        <div className="h-64 bg-muted rounded-3xl" />
      </div>
    )
  }

  if (!data) {
    return (
      <div className="p-8 rounded-3xl border-2 border-dashed bg-muted/20 text-center space-y-2">
        <Brain className="w-10 h-10 text-muted-foreground mx-auto" />
        <p className="text-xs font-bold text-foreground">Nenhuma avaliação registrada ainda</p>
        <p className="text-[11px] text-muted-foreground max-w-xs mx-auto">
          Assim que o paciente registrar avaliações diárias, diário ou acontecimentos, você poderá
          acompanhar a evolução aqui.
        </p>
      </div>
    )
  }

  const { evaluations, journals, events, latest_evaluation, averages_7d, averages_30d } = data

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Sub-chips roláveis (Evolução / Diário / Acontecimentos) */}
      <div className="overflow-x-auto pb-1 -mx-2 px-2 scrollbar-none">
        <div className="inline-flex items-center gap-1.5 p-1 rounded-2xl bg-muted/40 border">
          <button
            type="button"
            onClick={() => setSubTab('evolution')}
            className={cn(
              'px-3.5 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 shrink-0 whitespace-nowrap cursor-pointer border-b-2',
              subTab === 'evolution'
                ? 'bg-[#CE82FF] text-white border-[#a552dc] shadow-xs'
                : 'text-muted-foreground hover:bg-muted/80 border-transparent',
            )}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Evolução ({evaluations.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setSubTab('journal')}
            className={cn(
              'px-3.5 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 shrink-0 whitespace-nowrap cursor-pointer border-b-2',
              subTab === 'journal'
                ? 'bg-[#CE82FF] text-white border-[#a552dc] shadow-xs'
                : 'text-muted-foreground hover:bg-muted/80 border-transparent',
            )}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Diário ({journals.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setSubTab('events')}
            className={cn(
              'px-3.5 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 shrink-0 whitespace-nowrap cursor-pointer border-b-2',
              subTab === 'events'
                ? 'bg-[#CE82FF] text-white border-[#a552dc] shadow-xs'
                : 'text-muted-foreground hover:bg-muted/80 border-transparent',
            )}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Acontecimentos ({events.length})</span>
          </button>
        </div>
      </div>

      {/* 1. SUB-ABA: EVOLUÇÃO */}
      {subTab === 'evolution' && (
        <div className="space-y-4 animate-fade-in">
          {/* Card da Última Avaliação em Destaque */}
          {latest_evaluation ? (
            <div className="p-4 rounded-3xl border-2 border-b-4 bg-card border-[#CE82FF]/30 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-2xl bg-[#CE82FF]/15 text-[#CE82FF] flex items-center justify-center shrink-0 text-lg">
                    {MOOD_EMOJIS[latest_evaluation.mood] || '🧠'}
                  </div>
                  <div>
                    <div className="text-[10px] font-black uppercase text-[#CE82FF] tracking-wider">
                      Última Avaliação Registrada
                    </div>
                    <div className="text-xs font-extrabold text-foreground">
                      {safeFormatDate(latest_evaluation.date)} • Humor{' '}
                      {MOOD_TEXTS[latest_evaluation.mood] || latest_evaluation.mood}
                    </div>
                  </div>
                </div>
                <span className="text-[10px] font-bold text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                  {latest_evaluation.date}
                </span>
              </div>

              {/* Grid 5 métricas da última avaliação */}
              <div className="grid grid-cols-5 gap-1.5 text-center">
                <div className="p-2 rounded-xl bg-[#58CC02]/10 border border-[#58CC02]/20">
                  <div className="text-[9px] font-bold text-[#58CC02]">Humor</div>
                  <div className="text-xs font-black text-foreground">
                    {latest_evaluation.mood}/5
                  </div>
                </div>
                <div className="p-2 rounded-xl bg-[#FF9600]/10 border border-[#FF9600]/20">
                  <div className="text-[9px] font-bold text-[#FF9600]">Estresse</div>
                  <div className="text-xs font-black text-foreground">
                    {latest_evaluation.stress_level}/5
                  </div>
                </div>
                <div className="p-2 rounded-xl bg-[#FF4B4B]/10 border border-[#FF4B4B]/20">
                  <div className="text-[9px] font-bold text-[#FF4B4B]">Ansiedade</div>
                  <div className="text-xs font-black text-foreground">
                    {latest_evaluation.anxiety_level}/5
                  </div>
                </div>
                <div className="p-2 rounded-xl bg-[#1CB0F6]/10 border border-[#1CB0F6]/20">
                  <div className="text-[9px] font-bold text-[#1CB0F6]">Sono</div>
                  <div className="text-xs font-black text-foreground">
                    {latest_evaluation.sleep_quality}/5
                  </div>
                </div>
                <div className="p-2 rounded-xl bg-[#CE82FF]/10 border border-[#CE82FF]/20">
                  <div className="text-[9px] font-bold text-[#CE82FF]">Tristeza</div>
                  <div className="text-xs font-black text-foreground">
                    {latest_evaluation.sadness_level}/5
                  </div>
                </div>
              </div>

              {latest_evaluation.mental_triggers && (
                <div className="p-2.5 rounded-xl bg-muted/40 border text-xs">
                  <div className="text-[10px] font-extrabold text-muted-foreground uppercase mb-0.5">
                    Gatilhos / Observações:
                  </div>
                  <p className="text-foreground text-xs leading-relaxed">
                    {latest_evaluation.mental_triggers}
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="p-6 rounded-3xl border-2 border-dashed bg-muted/20 text-center space-y-1">
              <Brain className="w-8 h-8 text-muted-foreground mx-auto" />
              <p className="text-xs font-bold text-foreground">
                Nenhuma avaliação registrada ainda
              </p>
              <p className="text-[11px] text-muted-foreground">
                O paciente ainda não preencheu nenhuma autoavaliação de humor.
              </p>
            </div>
          )}

          {/* Cards-resumo: Médias dos últimos 7 e 30 dias */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Médias 7 dias */}
            <div className="p-3.5 rounded-3xl border-2 bg-card space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-[#CE82FF]" />
                  Médias (Últimos 7 dias)
                </span>
                <span className="text-[10px] font-bold text-[#CE82FF] bg-[#CE82FF]/10 px-2 py-0.5 rounded-full">
                  7d
                </span>
              </div>
              {averages_7d ? (
                <div className="grid grid-cols-5 gap-1 text-center">
                  <div className="p-1.5 rounded-lg bg-muted/40">
                    <div className="text-[9px] font-bold text-muted-foreground">Humor</div>
                    <div className="text-xs font-black text-[#58CC02]">{averages_7d.mood}</div>
                  </div>
                  <div className="p-1.5 rounded-lg bg-muted/40">
                    <div className="text-[9px] font-bold text-muted-foreground">Estresse</div>
                    <div className="text-xs font-black text-[#FF9600]">{averages_7d.stress}</div>
                  </div>
                  <div className="p-1.5 rounded-lg bg-muted/40">
                    <div className="text-[9px] font-bold text-muted-foreground">Ansiedade</div>
                    <div className="text-xs font-black text-[#FF4B4B]">{averages_7d.anxiety}</div>
                  </div>
                  <div className="p-1.5 rounded-lg bg-muted/40">
                    <div className="text-[9px] font-bold text-muted-foreground">Sono</div>
                    <div className="text-xs font-black text-[#1CB0F6]">{averages_7d.sleep}</div>
                  </div>
                  <div className="p-1.5 rounded-lg bg-muted/40">
                    <div className="text-[9px] font-bold text-muted-foreground">Tristeza</div>
                    <div className="text-xs font-black text-[#CE82FF]">{averages_7d.sadness}</div>
                  </div>
                </div>
              ) : (
                <p className="text-[11px] text-muted-foreground italic py-1">
                  Sem registros nos últimos 7 dias.
                </p>
              )}
            </div>

            {/* Médias 30 dias */}
            <div className="p-3.5 rounded-3xl border-2 bg-card space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-[#1CB0F6]" />
                  Médias (Últimos 30 dias)
                </span>
                <span className="text-[10px] font-bold text-[#1CB0F6] bg-[#1CB0F6]/10 px-2 py-0.5 rounded-full">
                  30d
                </span>
              </div>
              {averages_30d ? (
                <div className="grid grid-cols-5 gap-1 text-center">
                  <div className="p-1.5 rounded-lg bg-muted/40">
                    <div className="text-[9px] font-bold text-muted-foreground">Humor</div>
                    <div className="text-xs font-black text-[#58CC02]">{averages_30d.mood}</div>
                  </div>
                  <div className="p-1.5 rounded-lg bg-muted/40">
                    <div className="text-[9px] font-bold text-muted-foreground">Estresse</div>
                    <div className="text-xs font-black text-[#FF9600]">{averages_30d.stress}</div>
                  </div>
                  <div className="p-1.5 rounded-lg bg-muted/40">
                    <div className="text-[9px] font-bold text-muted-foreground">Ansiedade</div>
                    <div className="text-xs font-black text-[#FF4B4B]">{averages_30d.anxiety}</div>
                  </div>
                  <div className="p-1.5 rounded-lg bg-muted/40">
                    <div className="text-[9px] font-bold text-muted-foreground">Sono</div>
                    <div className="text-xs font-black text-[#1CB0F6]">{averages_30d.sleep}</div>
                  </div>
                  <div className="p-1.5 rounded-lg bg-muted/40">
                    <div className="text-[9px] font-bold text-muted-foreground">Tristeza</div>
                    <div className="text-xs font-black text-[#CE82FF]">{averages_30d.sadness}</div>
                  </div>
                </div>
              ) : (
                <p className="text-[11px] text-muted-foreground italic py-1">
                  Sem registros nos últimos 30 dias.
                </p>
              )}
            </div>
          </div>

          {/* Gráfico de Linhas Recharts */}
          <div className="p-4 sm:p-5 rounded-3xl border-2 border-b-4 bg-card space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h4 className="text-xs font-black uppercase text-muted-foreground tracking-wider flex items-center gap-1.5">
                  <TrendingUp className="w-4 h-4 text-[#CE82FF]" />
                  Gráfico de Linha ao Longo do Tempo
                </h4>
                <p className="text-[11px] text-muted-foreground">
                  Escala de 1 (mínimo) a 5 (máximo). Clique nas métricas para filtrar:
                </p>
              </div>

              {/* Botões seletores de métricas para o gráfico */}
              <div className="flex flex-wrap gap-1.5">
                {SCORE_METRICS.map((m) => {
                  const active = activeMetrics[m.key]
                  return (
                    <button
                      key={m.key}
                      type="button"
                      onClick={() => toggleMetric(m.key)}
                      className={cn(
                        'px-2.5 py-1 rounded-xl text-[10px] font-black transition-all cursor-pointer border',
                        active
                          ? 'text-white border-transparent'
                          : 'bg-muted/40 text-muted-foreground hover:bg-muted border-border',
                      )}
                      style={active ? { backgroundColor: m.color } : undefined}
                    >
                      {m.label}
                    </button>
                  )
                })}
              </div>
            </div>

            {chartData.length > 0 ? (
              <div className="h-60 w-full pt-2">
                <ChartContainer config={chartConfig} className="h-full w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={chartData}
                      margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="hsl(var(--border))"
                        opacity={0.3}
                      />
                      <XAxis
                        dataKey="date"
                        tick={{ fontSize: 10 }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis
                        domain={[1, 5]}
                        ticks={[1, 2, 3, 4, 5]}
                        tick={{ fontSize: 10 }}
                        axisLine={false}
                        tickLine={false}
                        width={30}
                      />
                      <Tooltip
                        contentStyle={{
                          borderRadius: '16px',
                          border: '2px solid hsl(var(--border))',
                          fontSize: '11px',
                          fontWeight: 'bold',
                        }}
                      />
                      {SCORE_METRICS.filter((m) => activeMetrics[m.key]).map((m) => (
                        <Line
                          key={m.key}
                          type="monotone"
                          dataKey={m.key}
                          name={m.label}
                          stroke={m.color}
                          strokeWidth={2.5}
                          dot={{ fill: m.color, r: 3 }}
                          activeDot={{ r: 5 }}
                        />
                      ))}
                    </LineChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </div>
            ) : (
              <div className="text-center py-10 text-xs text-muted-foreground italic">
                Nenhum ponto registrado no gráfico.
              </div>
            )}
          </div>

          {/* Histórico completo em lista */}
          {evaluations.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-xs font-black uppercase text-muted-foreground tracking-wider">
                Histórico Detalhado ({evaluations.length})
              </h4>
              <div className="space-y-2 max-h-[260px] overflow-y-auto pr-1">
                {evaluations.map((ev) => (
                  <div
                    key={ev.id}
                    className="p-3 rounded-2xl border bg-card flex items-center justify-between text-xs gap-2 hover:border-[#CE82FF]/40 transition-colors"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-foreground">
                          {safeFormatDate(ev.date)}
                        </span>
                        <span className="text-base">{MOOD_EMOJIS[ev.mood] || '😐'}</span>
                        <span className="text-[10px] text-muted-foreground font-semibold">
                          Humor: {ev.mood}/5
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-1.5 text-[10px] text-muted-foreground mt-1">
                        <span>Estresse: {ev.stress_level}/5</span>
                        <span>• Ansiedade: {ev.anxiety_level}/5</span>
                        <span>• Sono: {ev.sleep_quality}/5</span>
                        <span>• Tristeza: {ev.sadness_level}/5</span>
                      </div>
                    </div>

                    {ev.mental_triggers && (
                      <button
                        type="button"
                        onClick={() =>
                          setDetailDialog({
                            title: `Gatilhos & Notas (${safeFormatDate(ev.date)})`,
                            content: ev.mental_triggers,
                          })
                        }
                        className="px-2.5 py-1 rounded-xl text-[11px] font-bold bg-[#CE82FF]/10 text-[#CE82FF] hover:bg-[#CE82FF]/20 transition-colors shrink-0"
                      >
                        Ver Notas
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 2. SUB-ABA: DIÁRIO */}
      {subTab === 'journal' && (
        <div className="space-y-3 animate-fade-in">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-xs font-black uppercase text-muted-foreground tracking-wider flex items-center gap-1.5">
                <BookOpen className="w-4 h-4 text-[#58CC02]" />
                Entradas do Diário Emocional ({journals.length})
              </h4>
              <p className="text-[11px] text-muted-foreground">
                Registros reflexivos e anotações pessoais do paciente (somente leitura).
              </p>
            </div>
          </div>

          {journals.length === 0 ? (
            <div className="p-8 rounded-3xl border-2 border-dashed bg-muted/20 text-center space-y-2">
              <BookOpen className="w-8 h-8 text-muted-foreground mx-auto" />
              <p className="text-xs font-bold text-foreground">
                Nenhuma entrada no diário registrada
              </p>
              <p className="text-[11px] text-muted-foreground max-w-xs mx-auto">
                Quando o paciente escrever em seu diário emocional, as entradas aparecerão aqui em
                ordem cronológica.
              </p>
            </div>
          ) : (
            <div className="space-y-2.5 max-h-[420px] overflow-y-auto pr-1">
              {journals.map((j) => (
                <div
                  key={j.id}
                  className="p-4 rounded-3xl border-2 bg-card space-y-2 hover:border-[#58CC02]/40 transition-colors"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#58CC02]/10 text-[#58CC02] text-[10px] font-black">
                      <BookOpen className="w-3 h-3" /> Diário
                    </span>
                    <span className="text-xs font-extrabold text-muted-foreground">
                      {safeFormatDate(j.date || j.created_at)}
                    </span>
                  </div>

                  <div
                    className="text-xs text-foreground font-semibold leading-relaxed line-clamp-4 prose prose-sm max-w-none"
                    dangerouslySetInnerHTML={{ __html: j.content }}
                  />

                  {j.content && j.content.length > 200 && (
                    <button
                      type="button"
                      onClick={() =>
                        setDetailDialog({
                          title: `Entrada do Diário (${safeFormatDate(j.date || j.created_at)})`,
                          content: j.content,
                          isHtml: true,
                        })
                      }
                      className="text-[11px] font-bold text-[#1CB0F6] hover:underline"
                    >
                      Ler entrada completa →
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 3. SUB-ABA: ACONTECIMENTOS */}
      {subTab === 'events' && (
        <div className="space-y-3 animate-fade-in">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-xs font-black uppercase text-muted-foreground tracking-wider flex items-center gap-1.5">
                <Zap className="w-4 h-4 text-[#1CB0F6]" />
                Linha do Tempo de Acontecimentos ({events.length})
              </h4>
              <p className="text-[11px] text-muted-foreground">
                Fatos, marcos e situações relevantes anotados pelo paciente.
              </p>
            </div>
          </div>

          {events.length === 0 ? (
            <div className="p-8 rounded-3xl border-2 border-dashed bg-muted/20 text-center space-y-2">
              <Zap className="w-8 h-8 text-muted-foreground mx-auto" />
              <p className="text-xs font-bold text-foreground">Nenhum acontecimento registrado</p>
              <p className="text-[11px] text-muted-foreground max-w-xs mx-auto">
                Fatos e gatilhos cadastrados pelo paciente na sua linha do tempo de vivências
                aparecerão aqui.
              </p>
            </div>
          ) : (
            <div className="space-y-2.5 max-h-[420px] overflow-y-auto pr-1">
              {events.map((e) => (
                <div
                  key={e.id}
                  className="p-3.5 rounded-2xl border bg-card flex items-start gap-3 hover:border-[#1CB0F6]/40 transition-colors"
                >
                  <div className="w-8 h-8 rounded-xl bg-[#1CB0F6]/15 text-[#1CB0F6] flex items-center justify-center shrink-0 mt-0.5">
                    <Zap className="w-4 h-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[11px] font-extrabold text-muted-foreground">
                        {safeFormatDate(e.date || e.created_at)}
                      </span>
                    </div>
                    <p className="text-xs font-semibold text-foreground mt-1 whitespace-pre-wrap leading-relaxed">
                      {e.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Nota de rodapé da Mente (conforme especificação da regra 2) */}
      <div className="p-3 rounded-2xl bg-[#CE82FF]/10 border border-[#CE82FF]/30 text-[11px] text-[#8e3ec2] dark:text-[#CE82FF] font-semibold flex items-center gap-2">
        <Lock className="w-4 h-4 shrink-0 text-[#CE82FF]" />
        <span>Somente leitura — o paciente pode revogar este acesso a qualquer momento.</span>
      </div>

      {/* Modal de Detalhes (Diário completo ou Gatilhos) */}
      <Dialog open={!!detailDialog} onOpenChange={(v) => !v && setDetailDialog(null)}>
        <DialogContent className="sm:max-w-md rounded-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base font-black text-foreground">
              {detailDialog?.title}
            </DialogTitle>
          </DialogHeader>
          <div className="mt-3">
            {detailDialog?.isHtml ? (
              <div
                className="text-xs font-semibold leading-relaxed prose prose-sm max-w-none"
                dangerouslySetInnerHTML={{ __html: detailDialog.content }}
              />
            ) : (
              <p className="text-xs font-semibold whitespace-pre-wrap leading-relaxed text-foreground">
                {detailDialog?.content}
              </p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
