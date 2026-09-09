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
import { Droplet, Trash2, HelpCircle, BarChart3 } from 'lucide-react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
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

  // Gráfico Urina & Digestão - 7 últimos dias em BarChart com barras agrupadas (não empilhadas)
  const last7DaysChartData = useMemo(() => {
    const todayObj = new Date()
    todayObj.setHours(0, 0, 0, 0)
    const result = []

    for (let i = 6; i >= 0; i--) {
      const dayDate = subDays(todayObj, i)
      const dayStr = isValid(dayDate) ? format(dayDate, 'yyyy-MM-dd') : ''
      const label = isValid(dayDate) ? format(dayDate, 'dd/MM', { locale: ptBR }) : ''

      // Buscar último registro de urina do dia
      const dayUrineLogs = (urineLogs || [])
        .filter((l) => l.date === dayStr)
        .sort((a, b) => b.timestamp.localeCompare(a.timestamp))
      const latestDayUrine = dayUrineLogs[0]

      // Buscar último registro de digestão do dia
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
        urinaCount: dayUrineLogs.length,
        digestao: latestDayDig ? Number(latestDayDig.bristolType) : null,
        digestaoLabel: bristolScale?.label || null,
        digestaoCount: dayDigestionLogs.length,
      })
    }

    return result
  }, [urineLogs, digestionLogs])

  const hasExcretionData = useMemo(() => {
    return last7DaysChartData.some((d) => d.urina !== null || d.digestao !== null)
  }, [last7DaysChartData])

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

      {/* Redesign do Gráfico "Urina & Digestão" com BarChart agrupado (não empilhado) */}
      <div className="mt-1 pt-4 border-t border-[#E5E5E5] dark:border-[#3B4A55]/60 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <BarChart3 className="w-4 h-4 text-[#FF9600]" />
            <span className="text-xs font-black uppercase tracking-wider text-muted-foreground">
              Comparativo dos Últimos 7 Dias
            </span>
          </div>
          <span className="text-[10px] font-extrabold text-muted-foreground bg-muted/60 px-2 py-0.5 rounded-full">
            Barras agrupadas
          </span>
        </div>

        {hasExcretionData ? (
          <div className="h-56 w-full pt-1">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={last7DaysChartData}
                margin={{ top: 12, right: 12, left: -15, bottom: 4 }}
                barCategoryGap="25%"
                barGap={4}
              >
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted/40" vertical={false} />
                <XAxis
                  dataKey="day"
                  tick={{ fontSize: 11, fontWeight: 700 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  domain={[0, 7]}
                  ticks={[1, 2, 3, 4, 5, 6, 7]}
                  tick={{ fontSize: 10, fontWeight: 600 }}
                  axisLine={false}
                  tickLine={false}
                  width={28}
                />
                <Tooltip content={<ExcretionsChartTooltip />} />
                <Legend
                  wrapperStyle={{ fontSize: '11px', fontWeight: 800, paddingTop: '8px' }}
                  iconType="circle"
                />
                <Bar
                  dataKey="urina"
                  name="Urina (Escala 1-6)"
                  fill="#FFC800"
                  radius={[6, 6, 0, 0]}
                  maxBarSize={22}
                />
                <Bar
                  dataKey="digestao"
                  name="Digestão (Bristol 1-7)"
                  fill="#FF9600"
                  radius={[6, 6, 0, 0]}
                  maxBarSize={22}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-32 flex flex-col items-center justify-center text-center bg-muted/20 rounded-2xl border border-dashed border-[#E5E5E5] dark:border-[#3B4A55] p-3">
            <p className="text-xs font-extrabold text-muted-foreground">
              Sem excreções registradas nos últimos 7 dias.
            </p>
            <p className="text-[11px] text-muted-foreground/80 mt-0.5">
              Toque nos botões acima para registrar urina ou digestão hoje.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

function ExcretionsChartTooltip({ active, payload, label }: any) {
  if (!active || !payload || !payload.length) return null

  const itemData = payload[0]?.payload

  return (
    <div className="bg-card border-2 border-b-4 border-[#E5E5E5] dark:border-[#3B4A55] rounded-2xl p-3 shadow-xl text-xs space-y-1.5 min-w-[190px]">
      <p className="font-black text-foreground border-b border-muted pb-1">{label}</p>
      {itemData?.urina !== null && itemData?.urina !== undefined && (
        <div className="flex items-center justify-between gap-3">
          <span className="flex items-center gap-1.5 font-bold text-[#B28200] dark:text-[#FFC800]">
            <span className="w-2.5 h-2.5 rounded-full inline-block bg-[#FFC800]" />
            Urina:
          </span>
          <span className="font-black text-foreground">
            Tipo {itemData.urina}
            {itemData.urinaLabel ? ` (${itemData.urinaLabel})` : ''}
          </span>
        </div>
      )}
      {itemData?.digestao !== null && itemData?.digestao !== undefined && (
        <div className="flex items-center justify-between gap-3">
          <span className="flex items-center gap-1.5 font-bold text-[#CC6E00] dark:text-[#FF9600]">
            <span className="w-2.5 h-2.5 rounded-full inline-block bg-[#FF9600]" />
            Digestão:
          </span>
          <span className="font-black text-foreground">
            Tipo {itemData.digestao}
            {itemData.digestaoLabel ? ` (${itemData.digestaoLabel})` : ''}
          </span>
        </div>
      )}
      {itemData?.urinaCount > 1 && (
        <p className="text-[10px] text-muted-foreground font-semibold pt-0.5">
          {itemData.urinaCount} registros de urina no dia (exibindo último).
        </p>
      )}
      {itemData?.digestaoCount > 1 && (
        <p className="text-[10px] text-muted-foreground font-semibold pt-0.5">
          {itemData.digestaoCount} registros de digestão no dia (exibindo último).
        </p>
      )}
    </div>
  )
}
