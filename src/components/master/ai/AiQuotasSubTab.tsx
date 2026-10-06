import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { AiGeneralConfig, useAiStore } from '@/stores/useAiStore'
import { ShieldAlert, Gauge, Crown, User, Info, CheckCircle, RotateCw } from 'lucide-react'

interface AiQuotasSubTabProps {
  config: AiGeneralConfig | null
}

export function AiQuotasSubTab({ config }: AiQuotasSubTabProps) {
  const { updateQuotas } = useAiStore()

  const [proDaily, setProDaily] = useState<number>(config?.quotaProDaily ?? 50)
  const [proMonthly, setProMonthly] = useState<number>(config?.quotaProMonthly ?? 1000)
  const [commonDaily, setCommonDaily] = useState<number>(config?.quotaCommonDaily ?? 5)
  const [commonMonthly, setCommonMonthly] = useState<number>(config?.quotaCommonMonthly ?? 50)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (config) {
      setProDaily(config.quotaProDaily)
      setProMonthly(config.quotaProMonthly)
      setCommonDaily(config.quotaCommonDaily)
      setCommonMonthly(config.quotaCommonMonthly)
    }
  }, [config])

  const hasChanges =
    config &&
    (proDaily !== config.quotaProDaily ||
      proMonthly !== config.quotaProMonthly ||
      commonDaily !== config.quotaCommonDaily ||
      commonMonthly !== config.quotaCommonMonthly)

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    await updateQuotas({
      quotaProDaily: Number(proDaily) || 0,
      quotaProMonthly: Number(proMonthly) || 0,
      quotaCommonDaily: Number(commonDaily) || 0,
      quotaCommonMonthly: Number(commonMonthly) || 0,
    })
    setIsSaving(false)
  }

  return (
    <div className="space-y-6">
      {/* Banner Informativo Duolingo Style */}
      <div className="p-4 rounded-3xl bg-[#1CB0F6]/10 border-2 border-[#1CB0F6]/30 flex items-start gap-3">
        <Info className="w-5 h-5 text-[#1CB0F6] shrink-0 mt-0.5" />
        <div className="text-xs space-y-1">
          <p className="font-extrabold text-foreground">
            Como funcionam as Quotas de Requisições de IA
          </p>
          <p className="text-muted-foreground font-medium leading-relaxed">
            Antes de encaminhar cada chamada ao provedor de IA, a Edge Function{' '}
            <code className="bg-muted px-1.5 py-0.5 rounded text-foreground font-mono">
              ai-proxy
            </code>{' '}
            calcula o consumo do usuário no dia e no mês corrente. Caso o limite seja atingido, a
            requisição é interrompida imediatamente com erro <strong>HTTP 429</strong> e uma
            mensagem amigável, impedindo custos inesperados com as APIs.
          </p>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Card Usuários Comuns */}
          <Card className="rounded-3xl border-2 border-b-4 border-b-[#1CB0F6]/40 p-5 sm:p-6 bg-card shadow-sm space-y-4">
            <div className="flex items-center gap-2.5 pb-2 border-b border-border">
              <span className="p-2 rounded-2xl bg-[#1CB0F6]/10 text-[#1CB0F6]">
                <User className="w-5 h-5" />
              </span>
              <div>
                <h4 className="font-black text-base text-foreground">
                  Usuários Comuns (Gratuitos)
                </h4>
                <p className="text-xs text-muted-foreground font-semibold">
                  Limites econômicos para proteção de custos
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-black text-foreground flex items-center justify-between">
                  <span>Limite Diário de Requests</span>
                  <span className="text-[10px] text-muted-foreground font-normal">
                    por usuário / dia
                  </span>
                </label>
                <div className="relative">
                  <Input
                    type="number"
                    min="0"
                    max="10000"
                    value={commonDaily}
                    onChange={(e) => setCommonDaily(Math.max(0, parseInt(e.target.value) || 0))}
                    className="rounded-2xl h-11 text-sm font-bold bg-muted/40 border-2"
                  />
                  <span className="absolute right-3 top-3 text-xs font-bold text-muted-foreground">
                    req / dia
                  </span>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-black text-foreground flex items-center justify-between">
                  <span>Limite Mensal de Requests</span>
                  <span className="text-[10px] text-muted-foreground font-normal">
                    por usuário / mês
                  </span>
                </label>
                <div className="relative">
                  <Input
                    type="number"
                    min="0"
                    max="50000"
                    value={commonMonthly}
                    onChange={(e) => setCommonMonthly(Math.max(0, parseInt(e.target.value) || 0))}
                    className="rounded-2xl h-11 text-sm font-bold bg-muted/40 border-2"
                  />
                  <span className="absolute right-3 top-3 text-xs font-bold text-muted-foreground">
                    req / mês
                  </span>
                </div>
              </div>
            </div>
          </Card>

          {/* Card Usuários Pro / Profissionais */}
          <Card className="rounded-3xl border-2 border-b-4 border-b-[#FFC800]/50 p-5 sm:p-6 bg-card shadow-sm space-y-4">
            <div className="flex items-center gap-2.5 pb-2 border-b border-border">
              <span className="p-2 rounded-2xl bg-[#FFC800]/10 text-amber-500">
                <Crown className="w-5 h-5" />
              </span>
              <div>
                <h4 className="font-black text-base text-foreground">
                  Usuários Pro & Profissionais
                </h4>
                <p className="text-xs text-muted-foreground font-semibold">
                  Limites ampliados para trabalho diário intenso
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-black text-foreground flex items-center justify-between">
                  <span>Limite Diário de Requests</span>
                  <span className="text-[10px] text-muted-foreground font-normal">
                    por profissional / dia
                  </span>
                </label>
                <div className="relative">
                  <Input
                    type="number"
                    min="0"
                    max="50000"
                    value={proDaily}
                    onChange={(e) => setProDaily(Math.max(0, parseInt(e.target.value) || 0))}
                    className="rounded-2xl h-11 text-sm font-bold bg-muted/40 border-2"
                  />
                  <span className="absolute right-3 top-3 text-xs font-bold text-muted-foreground">
                    req / dia
                  </span>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-black text-foreground flex items-center justify-between">
                  <span>Limite Mensal de Requests</span>
                  <span className="text-[10px] text-muted-foreground font-normal">
                    por profissional / mês
                  </span>
                </label>
                <div className="relative">
                  <Input
                    type="number"
                    min="0"
                    max="500000"
                    value={proMonthly}
                    onChange={(e) => setProMonthly(Math.max(0, parseInt(e.target.value) || 0))}
                    className="rounded-2xl h-11 text-sm font-bold bg-muted/40 border-2"
                  />
                  <span className="absolute right-3 top-3 text-xs font-bold text-muted-foreground">
                    req / mês
                  </span>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Botão de Salvar Quotas Duolingo Style */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
          <div className="flex items-center gap-2 text-xs text-muted-foreground font-semibold">
            <Gauge className="w-4 h-4 text-primary" />
            <span>
              As novas quotas passam a valer imediatamente para todas as próximas chamadas.
            </span>
          </div>

          <Button
            type="submit"
            disabled={isSaving || !hasChanges}
            className="w-full sm:w-auto rounded-2xl h-11 px-8 font-black bg-[#58CC02] hover:bg-[#46a302] text-white border-b-4 border-[#3d8c02] active:scale-95 transition-all shadow-sm flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isSaving ? (
              <>
                <RotateCw className="w-4 h-4 animate-spin" />
                <span>Salvando...</span>
              </>
            ) : (
              <>
                <CheckCircle className="w-4 h-4" />
                <span>Salvar Quotas</span>
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}
