import { useState } from 'react'
import { useAppStore, BowelType } from '@/stores/useAppStore'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Droplet, Droplets, Check } from 'lucide-react'
import { BristolIcon } from '@/components/health/bristol-icon'
import { cn } from '@/lib/utils'

// Escala de Bristol para Digestão
const BRISTOL_TYPES: {
  type: BowelType
  label: string
  color: string
  description: string
  status:
    | 'Constipação Severa'
    | 'Constipação'
    | 'Normal'
    | 'Ideal'
    | 'Pouca Fibra'
    | 'Diarreia Leve'
    | 'Diarreia Severa'
}[] = [
  {
    type: 1,
    label: 'Tipo 1',
    color: '#FF4B4B',
    description: 'Pélotas duras separadas (como nozes). Difícil de evacuar.',
    status: 'Constipação Severa',
  },
  {
    type: 2,
    label: 'Tipo 2',
    color: '#FF9600',
    description: 'Formato de salsicha, mas com superfície granulada e firme.',
    status: 'Constipação',
  },
  {
    type: 3,
    label: 'Tipo 3',
    color: '#58CC02',
    description: 'Formato de salsicha, mas com rachaduras na superfície.',
    status: 'Normal',
  },
  {
    type: 4,
    label: 'Tipo 4',
    color: '#58CC02',
    description: 'Formato de salsicha ou cobra, superfície lisa e macia.',
    status: 'Ideal',
  },
  {
    type: 5,
    label: 'Tipo 5',
    color: '#FFC800',
    description: 'Pedaços macios com bordas nítidas. Evacuado facilmente.',
    status: 'Pouca Fibra',
  },
  {
    type: 6,
    label: 'Tipo 6',
    color: '#FF9600',
    description: 'Pedaços esfarrapados, fofos e com bordas irregulares.',
    status: 'Diarreia Leve',
  },
  {
    type: 7,
    label: 'Tipo 7',
    color: '#FF4B4B',
    description: 'Totalmente líquido, aquoso e sem pedaços sólidos.',
    status: 'Diarreia Severa',
  },
]

// Escala de Cor para Hidratação / Urina
const URINE_COLORS: {
  type: number
  label: string
  color: string
  borderColor: string
  description: string
  status: string
}[] = [
  {
    type: 1,
    label: 'Transparente',
    color: '#FFFDE7',
    borderColor: '#FFF59D',
    description: 'Excelente nível de hidratação. Urina muito clara ou límpida.',
    status: 'Excelente Hidratação',
  },
  {
    type: 2,
    label: 'Amarelo Claro',
    color: '#FFF59D',
    borderColor: '#FFEE58',
    description: 'Boa hidratação e equilíbrio hídrico no organismo.',
    status: 'Hidratação Adequada',
  },
  {
    type: 3,
    label: 'Amarelo Padrão',
    color: '#FFEE58',
    borderColor: '#FDD835',
    description: 'Nível moderado de hidratação. Beba um pouco de água.',
    status: 'Hidratação Moderada',
  },
  {
    type: 4,
    label: 'Amarelo Escuro',
    color: '#FBC02D',
    borderColor: '#F57F17',
    description: 'Sinal inicial de desidratação. Recomenda-se beber água.',
    status: 'Beba Mais Água',
  },
  {
    type: 5,
    label: 'Âmbar / Alaranjado',
    color: '#EF6C00',
    borderColor: '#E65100',
    description: 'Desidratação moderada a alta. Aumente o consumo de líquidos.',
    status: 'Desidratação Moderada',
  },
  {
    type: 6,
    label: 'Castanho / Marrom',
    color: '#6D4C41',
    borderColor: '#4E342E',
    description: 'Alerta: possível desidratação severa ou alteração hepática.',
    status: 'Alerta / Desidratação',
  },
]

export function ExcretionsWidget() {
  const { addDigestionLog, addUrineLog } = useAppStore()

  // Estados dos modais de registro
  const [urineModalOpen, setUrineModalOpen] = useState(false)
  const [bristolModalOpen, setBristolModalOpen] = useState(false)

  // Feedback de seleção breve nos modais (zero lag)
  const [selectedUrineType, setSelectedUrineType] = useState<number | null>(null)
  const [selectedBristolType, setSelectedBristolType] = useState<BowelType | null>(null)

  const handleSelectUrine = (type: number) => {
    setSelectedUrineType(type)
    const today = new Date().toISOString().split('T')[0]
    addUrineLog(today, type, '')
    setTimeout(() => {
      setSelectedUrineType(null)
      setUrineModalOpen(false)
    }, 200)
  }

  const handleSelectBristol = (type: BowelType) => {
    setSelectedBristolType(type)
    const today = new Date().toISOString().split('T')[0]
    addDigestionLog(today, type, '')
    setTimeout(() => {
      setSelectedBristolType(null)
      setBristolModalOpen(false)
    }, 200)
  }

  return (
    <div className="bg-card border-2 border-b-4 border-[#E5E5E5] dark:border-[#3B4A55] rounded-3xl p-6 shadow-sm flex flex-col justify-between gap-5">
      {/* 1. Cabeçalho remodelado de forma limpa com ícone representativo, título e subtítulo */}
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-2xl bg-[#FFC800]/15 dark:bg-[#FFC800]/20 flex items-center justify-center shrink-0 border border-[#FFC800]/30 shadow-xs">
          <Droplets className="w-6 h-6 text-[#FF9600] dark:text-[#FFC800]" strokeWidth={2.5} />
        </div>
        <div className="min-w-0">
          <h3 className="text-xl font-black tracking-tight text-foreground leading-tight">
            Urina & Digestão
          </h3>
          <p className="text-xs font-bold text-muted-foreground mt-0.5">
            Registro diário de excreções e hidratação
          </p>
        </div>
      </div>

      {/* 2. Área de escolha de registro: Urina e Digestão lado a lado (Estilo Duolingo 3D) */}
      <div className="grid grid-cols-2 gap-3">
        {/* Botão Registrar Urina */}
        <button
          type="button"
          onClick={() => setUrineModalOpen(true)}
          className={cn(
            'flex flex-col items-center justify-center gap-2 p-4 rounded-3xl',
            'bg-[#FFFDF0] dark:bg-[#1E293B]/70 hover:bg-[#FFF9C4]/40 dark:hover:bg-[#334155]/60',
            'border-2 border-[#FFC800] border-b-4 border-b-[#E5A800]',
            'active:translate-y-1 active:border-b-2 transition-all duration-150',
            'select-none cursor-pointer group text-center',
          )}
        >
          <div className="w-11 h-11 rounded-2xl bg-[#FFC800]/20 flex items-center justify-center group-hover:scale-105 transition-transform">
            <Droplet className="w-6 h-6 text-[#E5A800] dark:text-[#FFC800] fill-current" />
          </div>
          <div>
            <span className="block text-sm font-black text-foreground tracking-tight">Urina</span>
            <span className="block text-[11px] font-bold text-muted-foreground mt-0.5">
              Registrar cor
            </span>
          </div>
        </button>

        {/* Botão Registrar Digestão */}
        <button
          type="button"
          onClick={() => setBristolModalOpen(true)}
          className={cn(
            'flex flex-col items-center justify-center gap-2 p-4 rounded-3xl',
            'bg-[#FFFBF5] dark:bg-[#1E293B]/70 hover:bg-[#FFE0B2]/30 dark:hover:bg-[#334155]/60',
            'border-2 border-[#FF9600] border-b-4 border-b-[#CC6E00]',
            'active:translate-y-1 active:border-b-2 transition-all duration-150',
            'select-none cursor-pointer group text-center',
          )}
        >
          <div className="w-11 h-11 rounded-2xl bg-[#FF9600]/20 flex items-center justify-center group-hover:scale-105 transition-transform">
            <span className="text-2xl leading-none">🚽</span>
          </div>
          <div>
            <span className="block text-sm font-black text-foreground tracking-tight">
              Digestão
            </span>
            <span className="block text-[11px] font-bold text-muted-foreground mt-0.5">
              Escala de Bristol
            </span>
          </div>
        </button>
      </div>

      {/* 3. Frase de encerramento do card (conforme especificação estrita do usuário) */}
      <p className="text-xs font-semibold text-muted-foreground text-center pt-1">
        Histórico detalhado na aba ao lado.
      </p>

      {/* ================= MODAL DE REGISTRO: URINA ================= */}
      <Dialog open={urineModalOpen} onOpenChange={setUrineModalOpen}>
        <DialogContent className="sm:max-w-[480px] rounded-3xl p-6 bg-card border-2 border-b-4 border-[#E5E5E5] dark:border-[#3B4A55]">
          <DialogHeader className="space-y-1">
            <DialogTitle className="text-xl font-black flex items-center gap-2 text-foreground">
              <div className="w-8 h-8 rounded-xl bg-[#FFC800]/20 flex items-center justify-center">
                <Droplet className="w-4 h-4 text-[#FFC800] fill-current" />
              </div>
              Registrar Tonalidade da Urina
            </DialogTitle>
            <p className="text-xs font-bold text-muted-foreground">
              Selecione a tonalidade observada na escala de hidratação:
            </p>
          </DialogHeader>

          {/* Grid reorganizada, uniforme, legível e no padrão Duolingo */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 mt-3 max-h-[65vh] overflow-y-auto pr-1">
            {URINE_COLORS.map((item) => {
              const isSelected = selectedUrineType === item.type
              return (
                <button
                  key={item.type}
                  type="button"
                  onClick={() => handleSelectUrine(item.type)}
                  className={cn(
                    'flex flex-col items-center justify-center gap-2 p-3 rounded-2xl border-2 border-b-4 transition-all duration-150',
                    'active:translate-y-1 active:border-b-2 hover:brightness-95 text-center select-none cursor-pointer relative',
                    isSelected && 'ring-2 ring-[#FFC800] ring-offset-2 scale-95',
                  )}
                  style={{
                    backgroundColor: item.color,
                    borderColor: item.borderColor,
                    borderBottomColor: item.borderColor,
                  }}
                >
                  {/* Ícone de gota com a cor da amostra */}
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center shadow-xs border border-black/10 shrink-0"
                    style={{ backgroundColor: item.color }}
                  >
                    <Droplet
                      className={cn(
                        'w-5 h-5',
                        item.type <= 2 ? 'text-[#F57F17]' : 'text-white drop-shadow-xs',
                      )}
                      fill="currentColor"
                    />
                  </div>

                  <div className="min-w-0 w-full px-0.5">
                    <span
                      className={cn(
                        'block text-xs font-black leading-tight',
                        item.type <= 2 ? 'text-[#3E2723]' : 'text-white drop-shadow-xs',
                      )}
                    >
                      {item.label}
                    </span>
                    <span
                      className={cn(
                        'block text-[10px] font-bold mt-0.5 truncate',
                        item.type <= 2 ? 'text-[#5D4037]/80' : 'text-white/90',
                      )}
                      title={item.status}
                    >
                      {item.status}
                    </span>
                  </div>

                  {isSelected && (
                    <div className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-foreground text-background flex items-center justify-center">
                      <Check className="w-3 h-3 stroke-[3]" />
                    </div>
                  )}
                </button>
              )
            })}
          </div>

          {/* Dica informativa no rodapé do modal */}
          <div className="mt-3 p-3 rounded-2xl bg-muted/40 border border-[#E5E5E5] dark:border-[#3B4A55] text-[11px] font-semibold text-muted-foreground flex items-center gap-2">
            <span className="text-base">💡</span>
            <span>Tons transparentes e amarelo-claro indicam boa hidratação.</span>
          </div>
        </DialogContent>
      </Dialog>

      {/* ================= MODAL DE REGISTRO: DIGESTÃO (ESCALA DE BRISTOL) ================= */}
      <Dialog open={bristolModalOpen} onOpenChange={setBristolModalOpen}>
        <DialogContent className="sm:max-w-[500px] rounded-3xl p-6 bg-card border-2 border-b-4 border-[#E5E5E5] dark:border-[#3B4A55]">
          <DialogHeader className="space-y-1">
            <DialogTitle className="text-xl font-black flex items-center gap-2 text-foreground">
              <div className="w-8 h-8 rounded-xl bg-[#FF9600]/20 flex items-center justify-center">
                <span className="text-base leading-none">🚽</span>
              </div>
              Registrar Digestão (Escala de Bristol)
            </DialogTitle>
            <p className="text-xs font-bold text-muted-foreground">
              Selecione o formato mais próximo da sua evacuação:
            </p>
          </DialogHeader>

          {/* Lista vertical de cartões no padrão Duolingo (uniforme, legível e informativa) */}
          <div className="space-y-2 mt-3 max-h-[65vh] overflow-y-auto pr-1">
            {BRISTOL_TYPES.map((item) => {
              const isSelected = selectedBristolType === item.type
              return (
                <button
                  key={item.type}
                  type="button"
                  aria-label={`${item.label} — ${item.description}`}
                  onClick={() => handleSelectBristol(item.type)}
                  className={cn(
                    'w-full flex items-center gap-3 p-3 rounded-2xl border-2 border-b-4 text-left transition-all duration-150',
                    'active:translate-y-0.5 active:border-b-2 hover:bg-muted/40 select-none cursor-pointer relative group',
                    isSelected
                      ? 'border-primary bg-primary/10 ring-2 ring-primary/30'
                      : 'border-[#E5E5E5] dark:border-[#3B4A55] bg-card',
                  )}
                >
                  {/* Contêiner do Ícone Ilustrado + Indicador discreto do número */}
                  <div className="relative flex flex-col items-center justify-center shrink-0">
                    <div
                      className={cn(
                        'w-14 h-14 rounded-2xl flex items-center justify-center p-1.5 transition-transform group-hover:scale-105',
                        'bg-amber-100/40 dark:bg-amber-950/20 border border-amber-900/10 dark:border-amber-500/10 shadow-xs',
                      )}
                    >
                      <BristolIcon type={item.type} size={44} />
                    </div>
                    {/* Badge discreto com a cor e número da escala */}
                    <span
                      className="inline-flex items-center justify-center px-1.5 py-0.2 min-w-[20px] rounded-full text-[10px] font-black text-white shadow-xs -mt-2 z-10 border border-white dark:border-slate-800"
                      style={{ backgroundColor: item.color }}
                    >
                      {item.type}
                    </span>
                  </div>

                  {/* Descrição e Classificação */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-black text-foreground">{item.label}</span>
                      <span
                        className="text-[10px] font-extrabold px-2 py-0.5 rounded-lg text-white shrink-0"
                        style={{ backgroundColor: item.color }}
                      >
                        {item.status}
                      </span>
                    </div>
                    <p className="text-xs font-semibold text-muted-foreground mt-0.5 line-clamp-2">
                      {item.description}
                    </p>
                  </div>

                  {/* Indicador de Seleção */}
                  {isSelected && (
                    <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center shrink-0">
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    </div>
                  )}
                </button>
              )
            })}
          </div>

          {/* Dica informativa no rodapé do modal */}
          <div className="mt-3 p-3 rounded-2xl bg-muted/40 border border-[#E5E5E5] dark:border-[#3B4A55] text-[11px] font-semibold text-muted-foreground flex items-center gap-2">
            <span className="text-base">💡</span>
            <span>Os Tipos 3 e 4 são considerados os formatos normais e ideais.</span>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
