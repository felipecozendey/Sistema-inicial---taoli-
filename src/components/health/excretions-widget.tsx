import { useState, useMemo } from 'react'
import { useAppStore, BowelType } from '@/stores/useAppStore'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Droplet, Trash2, HelpCircle, Activity, Info, Calendar } from 'lucide-react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { subDays, format, isValid } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { cn } from '@/lib/utils'

// Escala de Bristol para Digestão
const BRISTOL_TYPES: { type: BowelType; label: string; color: string; description: string }[] = [
  {
    type: 1,
    label: 'Tipo 1',
    color: '#FF4B4B',
    description: 'Pélotas duras separadas (como nozes). Constipação severa.',
  },
  {
    type: 2,
    label: 'Tipo 2',
    color: '#FF9600',
    description: 'Formato de salsicha, mas granulado. Constipação.',
  },
  {
    type: 3,
    label: 'Tipo 3',
    color: '#58CC02',
    description: 'Como salsicha mas com rachaduras. Normal.',
  },
  {
    type: 4,
    label: 'Tipo 4',
    color: '#58CC02',
    description: 'Salsicha ou cobra, lisa e macia. Ideal!',
  },
  {
    type: 5,
    label: 'Tipo 5',
    color: '#FFC800',
    description: 'Blobes macios com bordas claras. Falta de fibras.',
  },
  {
    type: 6,
    label: 'Tipo 6',
    color: '#FF9600',
    description: 'Pedaços fofos com bordas irregulares. Diarreia leve.',
  },
  {
    type: 7,
    label: 'Tipo 7',
    color: '#FF4B4B',
    description: 'Aquoso, sem pedaços sólidos. Diarreia severa.',
  },
]

// Escala de Cor para Hidratação / Urina
const URINE_COLORS: { type: number; label: string; color: string; description: string }[] = [
  {
    type: 1,
    label: 'Transparente',
    color: '#FFF9C4',
    description: 'Excelente hidratação. Urina ideal.',
  },
  { type: 2, label: 'Am. Claro', color: '#FFF176', description: 'Hidratação adequada.' },
  { type: 3, label: 'Amarelo', color: '#FFEE58', description: 'Hidratação moderada.' },
  { type: 4, label: 'Am. Escuro', color: '#FBC02D', description: 'Beba mais água.' },
  { type: 5, label: 'Âmbar', color: '#EF6C00', description: 'Desidratação moderada.' },
  {
    type: 6,
    label: 'Marrom',
    color: '#6D4C41',
    description: 'Alerta: possível desidratação severa.',
  },
]

export function ExcretionsWidget() {
  const {
    digestionLogs,
    addDigestionLog,
    deleteDigestionLog,
    urineLogs,
    addUrineLog,
    deleteUrineLog,
  } = useAppStore()

  const [activeTab, setActiveTab] = useState<'urina' | 'digestao'>('urina')
  const [bristolHelpOpen, setBristolHelpOpen] = useState(false)
  const [urineHelpOpen, setUrineHelpOpen] = useState(false)

  const today = useMemo(() => new Date().toISOString().split('T')[0], [])

  // Logs do dia para Digestão
  const todayDigestionLogs = useMemo(
    () =>
      digestionLogs
        .filter((l) => l.date === today)
        .sort((a, b) => b.timestamp.localeCompare(a.timestamp)),
    [digestionLogs, today],
  )
  const latestDigestion = todayDigestionLogs[0]
  const latestBristolItem = BRISTOL_TYPES.find((b) => b.type === latestDigestion?.bristolType)

  // Logs do dia para Urina
  const todayUrineLogs = useMemo(
    () =>
      urineLogs
        .filter((l) => l.date === today)
        .sort((a, b) => b.timestamp.localeCompare(a.timestamp)),
    [urineLogs, today],
  )
  const latestUrine = todayUrineLogs[0]
  const latestUrineItem = URINE_COLORS.find((u) => u.type === latestUrine?.colorType)

  // Handlers independentes com Zero Lag (atualização otimista síncrona no Zustand)
  const handleSelectBristol = (type: BowelType) => {
    addDigestionLog(today, type, '')
  }

  const handleSelectUrine = (type: number) => {
    addUrineLog(today, type, '')
  }

  const [daysRange, setDaysRange] = useState<7 | 14>(14)
  const [visibleSeries, setVisibleSeries] = useState<{ urina: boolean; digestao: boolean }>({
    urina: true,
    digestao: true,
  })

  // Gráfico Urina & Digestão - Linhas suaves e pontos claros com eixos independentes
  const chartData = useMemo(() => {
    const todayObj = new Date()
    if (isNaN(todayObj.getTime())) return []
    todayObj.setHours(0, 0, 0, 0)

    const totalDays = daysRange
    const result = []

    for (let i = totalDays - 1; i >= 0; i--) {
      const dayDate = subDays(todayObj, i)
      if (!isValid(dayDate) || isNaN(dayDate.getTime())) continue

      const dayStr = format(dayDate, 'yyyy-MM-dd')
      const label = format(dayDate, 'dd/MM', { locale: ptBR })

      // Buscar registros do dia
      const dayUrineLogs = (urineLogs || [])
        .filter((l) => l.date === dayStr)
        .sort((a, b) => b.timestamp.localeCompare(a.timestamp))
      const latestDayUrine = dayUrineLogs[0]

      const dayDigestionLogs = (digestionLogs || [])
        .filter((l) => l.date === dayStr)
        .sort((a, b) => b.timestamp.localeCompare(a.timestamp))
      const latestDayDig = dayDigestionLogs[0]

      const urineScale = latestDayUrine
        ? URINE_COLORS.find((u) => u.type === latestDayUrine.colorType)
        : null
      const bristolScale = latestDayDig
        ? BRISTOL_TYPES.find((b) => b.type === latestDayDig.bristolType)
        : null

      result.push({
        day: label,
        rawDate: dayStr,
        urina: latestDayUrine ? latestDayUrine.colorType : null,
        urinaLabel: urineScale?.label || null,
        urinaColor: urineScale?.color || '#1CB0F6',
        urinaCount: dayUrineLogs.length,
        digestao: latestDayDig ? Number(latestDayDig.bristolType) : null,
        digestaoLabel: bristolScale?.label || null,
        digestaoColor: bristolScale?.color || '#FF9600',
        digestaoCount: dayDigestionLogs.length,
      })
    }

    return result
  }, [urineLogs, digestionLogs, daysRange])

  const hasExcretionData = useMemo(() => {
    return chartData.some((d) => d.urina !== null || d.digestao !== null)
  }, [chartData])

  const toggleSeries = (key: 'urina' | 'digestao') => {
    setVisibleSeries((prev) => {
      // Evitar desmarcar ambos
      if (prev[key] && !prev[key === 'urina' ? 'digestao' : 'urina']) {
        return prev
      }
      return { ...prev, [key]: !prev[key] }
    })
  }

  return (
    <div className="bg-card border-2 border-b-4 border-[#E5E5E5] dark:border-[#3B4A55] rounded-3xl p-5 shadow-sm flex flex-col gap-4">
      {/* Top Header com Resumo do Dia Lado a Lado */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-[#E5E5E5] dark:border-[#3B4A55]/60">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#FFC800]/20 to-[#FF9600]/20 flex items-center justify-center text-xl shrink-0">
            💧🚽
          </div>
          <div>
            <h3 className="text-lg font-black tracking-tight leading-none">Urina & Digestão</h3>
            <p className="text-xs font-bold text-muted-foreground mt-1">
              Registro diário de excreções e hidratação
            </p>
          </div>
        </div>

        {/* Resumo compacto do dia com status de ambos */}
        <div className="flex items-center gap-2">
          {/* Status Urina */}
          <button
            type="button"
            onClick={() => setActiveTab('urina')}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-2xl border-2 text-xs font-black transition-all select-none',
              activeTab === 'urina'
                ? 'border-[#FFC800] bg-[#FFC800]/15 text-[#B28200] dark:text-[#FFC800]'
                : 'border-transparent bg-muted/40 hover:bg-muted/70 text-muted-foreground',
            )}
          >
            <Droplet className="w-3.5 h-3.5 text-[#FFC800]" strokeWidth={2.5} />
            <span>Urina:</span>
            <span className="font-extrabold text-foreground">
              {latestUrineItem ? latestUrineItem.label : '-'}
            </span>
          </button>

          {/* Status Digestão */}
          <button
            type="button"
            onClick={() => setActiveTab('digestao')}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-2xl border-2 text-xs font-black transition-all select-none',
              activeTab === 'digestao'
                ? 'border-[#FF9600] bg-[#FF9600]/15 text-[#CC6E00] dark:text-[#FF9600]'
                : 'border-transparent bg-muted/40 hover:bg-muted/70 text-muted-foreground',
            )}
          >
            <span className="text-xs">🚽</span>
            <span>Digestão:</span>
            <span className="font-extrabold text-foreground">
              {latestBristolItem ? latestBristolItem.label : '-'}
            </span>
          </button>
        </div>
      </div>

      {/* Tabs Internas para controle de registro isolado */}
      <Tabs
        value={activeTab}
        onValueChange={(v) => setActiveTab(v as 'urina' | 'digestao')}
        className="w-full"
      >
        <div className="flex items-center justify-between mb-3">
          <TabsList className="bg-muted/50 p-1 rounded-2xl h-10">
            <TabsTrigger
              value="urina"
              className="rounded-xl font-black text-xs data-[state=active]:bg-card data-[state=active]:shadow-xs px-4 flex items-center gap-1.5"
            >
              <Droplet className="w-3.5 h-3.5 text-[#FFC800]" />
              Urina ({todayUrineLogs.length})
            </TabsTrigger>
            <TabsTrigger
              value="digestao"
              className="rounded-xl font-black text-xs data-[state=active]:bg-card data-[state=active]:shadow-xs px-4 flex items-center gap-1.5"
            >
              <span>🚽</span>
              Digestão ({todayDigestionLogs.length})
            </TabsTrigger>
          </TabsList>

          {/* Botão de ajuda de acordo com a aba ativa */}
          {activeTab === 'urina' ? (
            <Dialog open={urineHelpOpen} onOpenChange={setUrineHelpOpen}>
              <DialogTrigger asChild>
                <button
                  type="button"
                  aria-label="Escala de Hidratação"
                  className="w-8 h-8 rounded-full bg-muted/50 flex items-center justify-center hover:bg-muted transition-colors"
                >
                  <HelpCircle className="w-4 h-4 text-muted-foreground" strokeWidth={2.5} />
                </button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[420px] rounded-3xl">
                <DialogHeader>
                  <DialogTitle className="text-xl font-extrabold flex items-center gap-2">
                    <Droplet className="w-5 h-5 text-[#FFC800]" /> Escala de Hidratação
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-3 mt-2 max-h-[60vh] overflow-y-auto">
                  {URINE_COLORS.map((item) => (
                    <div
                      key={item.type}
                      className="flex items-start gap-3 p-3 rounded-2xl bg-muted/40"
                    >
                      <span
                        className="w-8 h-8 rounded-full shrink-0 mt-0.5 border border-black/10"
                        style={{ backgroundColor: item.color }}
                      />
                      <div>
                        <p className="text-sm font-extrabold">{item.label}</p>
                        <p className="text-xs text-muted-foreground font-semibold">
                          {item.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </DialogContent>
            </Dialog>
          ) : (
            <Dialog open={bristolHelpOpen} onOpenChange={setBristolHelpOpen}>
              <DialogTrigger asChild>
                <button
                  type="button"
                  aria-label="Escala de Bristol"
                  className="w-8 h-8 rounded-full bg-muted/50 flex items-center justify-center hover:bg-muted transition-colors"
                >
                  <HelpCircle className="w-4 h-4 text-muted-foreground" strokeWidth={2.5} />
                </button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[420px] rounded-3xl">
                <DialogHeader>
                  <DialogTitle className="text-xl font-extrabold flex items-center gap-2">
                    <span>🚽</span> Escala de Bristol
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-3 mt-2 max-h-[60vh] overflow-y-auto">
                  {BRISTOL_TYPES.map((item) => (
                    <div
                      key={item.type}
                      className="flex items-start gap-3 p-3 rounded-2xl bg-muted/40"
                    >
                      <span
                        className="w-8 h-8 rounded-full shrink-0 mt-0.5"
                        style={{ backgroundColor: item.color }}
                      />
                      <div>
                        <p className="text-sm font-extrabold">{item.label}</p>
                        <p className="text-xs text-muted-foreground font-semibold">
                          {item.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>

        {/* ================= ABA URINA ================= */}
        <TabsContent value="urina" className="mt-0 space-y-3">
          <p className="text-xs font-bold text-muted-foreground">
            Toque na tonalidade observada para registrar:
          </p>

          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
            {URINE_COLORS.map((item) => {
              const isSelected = latestUrine?.colorType === item.type
              return (
                <button
                  key={item.type}
                  type="button"
                  onClick={() => handleSelectUrine(item.type)}
                  className={cn(
                    'flex flex-col items-center gap-1.5 px-3 py-3 rounded-3xl border-2 border-b-4 transition-all duration-150 active:translate-y-1 active:border-b-0 min-w-[70px] hover:bg-muted/30 select-none shrink-0',
                    isSelected && 'ring-2 ring-primary ring-offset-2',
                  )}
                  style={{ borderColor: item.color, borderBottomColor: item.color }}
                >
                  <span
                    className="w-7 h-7 rounded-full border border-black/10 shadow-xs"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-[10px] font-extrabold text-muted-foreground whitespace-nowrap">
                    {item.label}
                  </span>
                </button>
              )
            })}
          </div>

          {/* Último registro de Urina */}
          {latestUrine ? (
            <div className="space-y-2 mt-1">
              <div className="flex items-center justify-between bg-muted/40 rounded-2xl px-3.5 py-2.5">
                <div className="flex items-center gap-2">
                  <span
                    className="w-4 h-4 rounded-full border border-black/10 shrink-0"
                    style={{
                      backgroundColor: latestUrineItem?.color,
                    }}
                  />
                  <span className="text-xs font-black">Último: {latestUrineItem?.label}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-muted-foreground">
                    {new Date(latestUrine.timestamp).toLocaleTimeString('pt-BR', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                  <button
                    type="button"
                    onClick={() => deleteUrineLog(latestUrine.id)}
                    className="p-1 hover:bg-[#FF4B4B]/10 hover:text-[#FF4B4B] rounded-full transition-colors"
                    title="Excluir último registro de urina"
                  >
                    <Trash2 className="w-3.5 h-3.5" strokeWidth={2.5} />
                  </button>
                </div>
              </div>
              {todayUrineLogs.length > 1 && (
                <p className="text-[11px] font-bold text-muted-foreground text-center">
                  {todayUrineLogs.length} registros hoje. Histórico detalhado na aba ao lado.
                </p>
              )}
            </div>
          ) : (
            <p className="text-xs font-semibold text-muted-foreground italic text-center py-2">
              Nenhuma urina registrada hoje.
            </p>
          )}
        </TabsContent>

        {/* ================= ABA DIGESTÃO ================= */}
        <TabsContent value="digestao" className="mt-0 space-y-3">
          <p className="text-xs font-bold text-muted-foreground">
            Selecione o tipo da escala de Bristol para registrar:
          </p>

          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
            {BRISTOL_TYPES.map((item) => {
              const isSelected = latestDigestion?.bristolType === item.type
              return (
                <button
                  key={item.type}
                  type="button"
                  onClick={() => handleSelectBristol(item.type)}
                  className={cn(
                    'flex flex-col items-center gap-1.5 px-3 py-3 rounded-3xl border-2 border-b-4 transition-all duration-150 active:translate-y-1 active:border-b-0 min-w-[70px] hover:bg-muted/30 select-none shrink-0',
                    isSelected && 'ring-2 ring-primary ring-offset-2',
                  )}
                  style={{ borderColor: item.color, borderBottomColor: item.color }}
                >
                  <span
                    className="w-7 h-7 rounded-full shadow-xs"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-[10px] font-extrabold text-muted-foreground whitespace-nowrap">
                    {item.label}
                  </span>
                </button>
              )
            })}
          </div>

          {/* Último registro de Digestão */}
          {latestDigestion ? (
            <div className="space-y-2 mt-1">
              <div className="flex items-center justify-between bg-muted/40 rounded-2xl px-3.5 py-2.5">
                <div className="flex items-center gap-2">
                  <span
                    className="w-4 h-4 rounded-full shrink-0"
                    style={{ backgroundColor: latestBristolItem?.color }}
                  />
                  <span className="text-xs font-black">Último: {latestBristolItem?.label}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-muted-foreground">
                    {new Date(latestDigestion.timestamp).toLocaleTimeString('pt-BR', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                  <button
                    type="button"
                    onClick={() => deleteDigestionLog(latestDigestion.id)}
                    className="p-1 hover:bg-[#FF4B4B]/10 hover:text-[#FF4B4B] rounded-full transition-colors"
                    title="Excluir último registro de digestão"
                  >
                    <Trash2 className="w-3.5 h-3.5" strokeWidth={2.5} />
                  </button>
                </div>
              </div>
              {todayDigestionLogs.length > 1 && (
                <p className="text-[11px] font-bold text-muted-foreground text-center">
                  {todayDigestionLogs.length} registros hoje. Histórico detalhado na aba ao lado.
                </p>
              )}
            </div>
          ) : (
            <p className="text-xs font-semibold text-muted-foreground italic text-center py-2">
              Nenhuma digestão registrada hoje.
            </p>
          )}
        </TabsContent>
      </Tabs>

      {/* Novo Design de Evolução de Excreções */}
      <div className="mt-1 pt-4 border-t border-[#E5E5E5] dark:border-[#3B4A55]/60 space-y-3">
        {/* Cabeçalho do Gráfico com Seletor de Período e Título */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
              <Activity className="w-3.5 h-3.5" />
            </div>
            <div>
              <h4 className="text-xs font-black uppercase tracking-wider text-foreground">
                Evolução Temporal
              </h4>
              <p className="text-[10px] font-bold text-muted-foreground">
                Leitura separada por escalas independentes
              </p>
            </div>
          </div>

          {/* Filtro 7D / 14D */}
          <div className="flex items-center bg-muted/50 p-0.5 rounded-xl border border-[#E5E5E5] dark:border-[#3B4A55]">
            <button
              type="button"
              onClick={() => setDaysRange(7)}
              className={cn(
                'px-2.5 py-1 text-[11px] font-extrabold rounded-lg transition-all',
                daysRange === 7
                  ? 'bg-card text-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              7 dias
            </button>
            <button
              type="button"
              onClick={() => setDaysRange(14)}
              className={cn(
                'px-2.5 py-1 text-[11px] font-extrabold rounded-lg transition-all',
                daysRange === 14
                  ? 'bg-card text-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              14 dias
            </button>
          </div>
        </div>

        {/* Legenda Interativa / Filtro de Métricas */}
        <div className="flex flex-wrap items-center justify-between gap-2 px-1 pt-1">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => toggleSeries('urina')}
              className={cn(
                'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-extrabold border-2 border-b-3 transition-all select-none',
                visibleSeries.urina
                  ? 'border-[#1CB0F6] bg-[#1CB0F6]/10 text-[#0E8FCC] dark:text-[#1CB0F6]'
                  : 'border-transparent bg-muted/40 text-muted-foreground/60 opacity-60 line-through',
              )}
              title="Clique para ligar/desligar Urina"
            >
              <span className="w-2.5 h-2.5 rounded-full bg-[#1CB0F6] shrink-0" />
              <span>Urina (1–6)</span>
            </button>

            <button
              type="button"
              onClick={() => toggleSeries('digestao')}
              className={cn(
                'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-extrabold border-2 border-b-3 transition-all select-none',
                visibleSeries.digestao
                  ? 'border-[#FF9600] bg-[#FF9600]/10 text-[#CC6E00] dark:text-[#FF9600]'
                  : 'border-transparent bg-muted/40 text-muted-foreground/60 opacity-60 line-through',
              )}
              title="Clique para ligar/desligar Digestão"
            >
              <span className="w-2.5 h-2.5 rounded-full bg-[#FF9600] shrink-0" />
              <span>Bristol (1–7)</span>
            </button>
          </div>

          <div className="hidden sm:flex items-center gap-1 text-[10px] font-bold text-muted-foreground">
            <Info className="w-3 h-3 text-muted-foreground/70" />
            <span>Passe o mouse ou toque nos pontos para detalhes</span>
          </div>
        </div>

        {/* Área do Gráfico */}
        {hasExcretionData ? (
          <div className="h-60 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 12, right: 12, left: -16, bottom: 4 }}>
                <CartesianGrid strokeDasharray="4 4" className="stroke-muted/30" vertical={false} />
                <XAxis
                  dataKey="day"
                  tick={{ fontSize: 10, fontWeight: 700 }}
                  axisLine={false}
                  tickLine={false}
                  dy={4}
                />
                {/* Eixo Y da Esquerda: Urina (1 a 6) */}
                <YAxis
                  yAxisId="left"
                  domain={[1, 6]}
                  ticks={[1, 2, 3, 4, 5, 6]}
                  tick={{ fontSize: 10, fontWeight: 700, fill: '#1CB0F6' }}
                  axisLine={false}
                  tickLine={false}
                  width={30}
                  hide={!visibleSeries.urina}
                />
                {/* Eixo Y da Direita: Digestão / Bristol (1 a 7) */}
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  domain={[1, 7]}
                  ticks={[1, 2, 3, 4, 5, 6, 7]}
                  tick={{ fontSize: 10, fontWeight: 700, fill: '#FF9600' }}
                  axisLine={false}
                  tickLine={false}
                  width={24}
                  hide={!visibleSeries.digestao}
                />
                <Tooltip
                  content={<ExcretionsChartTooltip />}
                  cursor={{ stroke: 'rgba(128,128,128,0.2)', strokeWidth: 1.5 }}
                />
                {visibleSeries.urina && (
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="urina"
                    name="Urina"
                    stroke="#1CB0F6"
                    strokeWidth={3}
                    dot={{
                      r: 4,
                      strokeWidth: 2,
                      fill: '#FFFFFF',
                      stroke: '#1CB0F6',
                    }}
                    activeDot={{
                      r: 7,
                      strokeWidth: 3,
                      fill: '#1CB0F6',
                      stroke: '#FFFFFF',
                    }}
                    connectNulls
                  />
                )}
                {visibleSeries.digestao && (
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="digestao"
                    name="Digestão"
                    stroke="#FF9600"
                    strokeWidth={3}
                    dot={{
                      r: 4,
                      strokeWidth: 2,
                      fill: '#FFFFFF',
                      stroke: '#FF9600',
                    }}
                    activeDot={{
                      r: 7,
                      strokeWidth: 3,
                      fill: '#FF9600',
                      stroke: '#FFFFFF',
                    }}
                    connectNulls
                  />
                )}
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-44 flex flex-col items-center justify-center text-center bg-muted/20 rounded-3xl border-2 border-dashed border-[#E5E5E5] dark:border-[#3B4A55] p-5">
            <div className="w-10 h-10 rounded-2xl bg-muted/50 flex items-center justify-center text-muted-foreground mb-2">
              <Calendar className="w-5 h-5" />
            </div>
            <p className="text-sm font-extrabold text-foreground">
              Nenhum registro nos últimos {daysRange} dias
            </p>
            <p className="text-xs text-muted-foreground font-semibold mt-1 max-w-xs">
              Toque nos botões de coloração de urina ou escala de Bristol acima para fazer seu
              primeiro registro de hoje.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

function ExcretionsChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean
  payload?: Array<{ payload?: any }>
  label?: string
}) {
  if (!active || !payload || !payload.length) return null

  const itemData = payload[0]?.payload
  if (!itemData) return null

  return (
    <div className="bg-card border-2 border-b-4 border-[#E5E5E5] dark:border-[#3B4A55] rounded-2xl p-3 shadow-xl text-xs space-y-2 min-w-[210px]">
      <div className="flex items-center justify-between border-b border-muted pb-1.5">
        <span className="font-black text-foreground">{label}</span>
        <span className="text-[10px] font-bold text-muted-foreground">{itemData.rawDate}</span>
      </div>

      {itemData.urina !== null && itemData.urina !== undefined ? (
        <div className="flex items-start justify-between gap-3 bg-[#1CB0F6]/10 p-2 rounded-xl">
          <div className="flex items-center gap-1.5 font-extrabold text-[#0E8FCC] dark:text-[#1CB0F6]">
            <Droplet className="w-3.5 h-3.5 fill-current" />
            <span>Urina:</span>
          </div>
          <div className="text-right">
            <div className="font-black text-foreground">
              {itemData.urinaLabel} (Nível {itemData.urina})
            </div>
            <div className="text-[10px] text-muted-foreground font-semibold">
              {itemData.urina <= 2
                ? 'Hidratação ideal'
                : itemData.urina <= 4
                  ? 'Beba mais água'
                  : 'Alerta desidratação'}
            </div>
          </div>
        </div>
      ) : (
        <div className="text-[11px] text-muted-foreground/70 italic px-1">
          Sem registro de urina neste dia
        </div>
      )}

      {itemData.digestao !== null && itemData.digestao !== undefined ? (
        <div className="flex items-start justify-between gap-3 bg-[#FF9600]/10 p-2 rounded-xl">
          <div className="flex items-center gap-1.5 font-extrabold text-[#CC6E00] dark:text-[#FF9600]">
            <span className="text-xs">🚽</span>
            <span>Bristol:</span>
          </div>
          <div className="text-right">
            <div className="font-black text-foreground">
              {itemData.digestaoLabel} (Tipo {itemData.digestao})
            </div>
            <div className="text-[10px] text-muted-foreground font-semibold">
              {itemData.digestao >= 3 && itemData.digestao <= 4
                ? 'Consistência ideal'
                : itemData.digestao < 3
                  ? 'Constipação'
                  : 'Diarreia/Aceleração'}
            </div>
          </div>
        </div>
      ) : (
        <div className="text-[11px] text-muted-foreground/70 italic px-1">
          Sem registro de Bristol neste dia
        </div>
      )}

      {(itemData.urinaCount > 1 || itemData.digestaoCount > 1) && (
        <div className="pt-1 border-t border-muted text-[10px] text-muted-foreground font-bold">
          {itemData.urinaCount > 1 && `${itemData.urinaCount} registros de urina. `}
          {itemData.digestaoCount > 1 && `${itemData.digestaoCount} de digestão.`}
        </div>
      )}
    </div>
  )
}
