import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { AiPricingItem, useAiStore } from '@/stores/useAiStore'
import { DollarSign, Info, Check, RotateCw, Coins } from 'lucide-react'

interface AiPricingSubTabProps {
  pricing: AiPricingItem[]
}

export function AiPricingSubTab({ pricing }: AiPricingSubTabProps) {
  const { updatePricing } = useAiStore()

  // State local para edição dos valores da tabela
  const [editingRows, setEditingRows] = useState<
    Record<string, { inputUsdPer1k: string; outputUsdPer1k: string }>
  >({})
  const [savingKey, setSavingKey] = useState<string | null>(null)

  const getKey = (provider: string, model: string) => `${provider}:${model}`

  const handleInputChange = (
    provider: string,
    model: string,
    field: 'inputUsdPer1k' | 'outputUsdPer1k',
    val: string,
  ) => {
    const key = getKey(provider, model)
    const existing = editingRows[key] || {
      inputUsdPer1k: String(
        pricing.find((p) => p.provider === provider && p.model === model)?.inputUsdPer1k ?? 0,
      ),
      outputUsdPer1k: String(
        pricing.find((p) => p.provider === provider && p.model === model)?.outputUsdPer1k ?? 0,
      ),
    }

    setEditingRows((prev) => ({
      ...prev,
      [key]: {
        ...existing,
        [field]: val,
      },
    }))
  }

  const handleSaveRow = async (item: AiPricingItem) => {
    const key = getKey(item.provider, item.model)
    const edits = editingRows[key]
    if (!edits) return

    setSavingKey(key)

    const inVal = parseFloat(edits.inputUsdPer1k) || 0
    const outVal = parseFloat(edits.outputUsdPer1k) || 0

    await updatePricing(item.provider, item.model, inVal, outVal)

    setSavingKey(null)
    setEditingRows((prev) => {
      const copy = { ...prev }
      delete copy[key]
      return copy
    })
  }

  return (
    <div className="space-y-6">
      {/* Banner Informativo */}
      <div className="p-4 rounded-3xl bg-amber-500/10 border-2 border-amber-500/30 flex items-start gap-3">
        <DollarSign className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
        <div className="text-xs space-y-1">
          <p className="font-extrabold text-foreground">
            Tabela de Preços por Mil Tokens (USD por 1k Tokens)
          </p>
          <p className="text-muted-foreground font-medium leading-relaxed">
            Os valores abaixo são utilizados pelo sistema para calcular e auditar o custo estimado
            de cada prompt e resposta gerada. Quando os provedores atualizarem seus preços oficiais,
            edite os campos correspondentes para manter o dashboard de gastos perfeitamente
            alinhado.
          </p>
        </div>
      </div>

      {/* Tabela de Preços */}
      <div className="bg-card border-2 rounded-3xl p-5 sm:p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div className="flex items-center gap-2">
            <Coins className="w-5 h-5 text-primary" />
            <div>
              <h3 className="font-extrabold text-base text-foreground">
                Tabela de Custo por Modelo
              </h3>
              <p className="text-xs text-muted-foreground font-semibold">
                Valores em USD por 1.000 tokens de entrada (prompt) e saída (completion)
              </p>
            </div>
          </div>
          <Badge variant="outline" className="font-bold text-xs">
            {pricing.length} modelos cadastrados
          </Badge>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-border text-muted-foreground font-black uppercase text-[10px]">
                <th className="pb-3 pr-4">Provedor</th>
                <th className="pb-3 pr-4">Modelo</th>
                <th className="pb-3 pr-4">Input (USD / 1k tok)</th>
                <th className="pb-3 pr-4">Output (USD / 1k tok)</th>
                <th className="pb-3 pr-4 text-muted-foreground">Equivalente / 1M</th>
                <th className="pb-3 text-right">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {pricing.map((item) => {
                const key = getKey(item.provider, item.model)
                const isEditing = editingRows[key] !== undefined
                const isSaving = savingKey === key

                const currentIn = isEditing
                  ? editingRows[key].inputUsdPer1k
                  : String(item.inputUsdPer1k)
                const currentOut = isEditing
                  ? editingRows[key].outputUsdPer1k
                  : String(item.outputUsdPer1k)

                const inFloat = parseFloat(currentIn) || 0
                const outFloat = parseFloat(currentOut) || 0

                return (
                  <tr key={key} className="hover:bg-muted/40 transition-colors">
                    {/* Provedor */}
                    <td className="py-3 pr-4 font-bold text-foreground capitalize">
                      <span className="flex items-center gap-1.5">
                        <span
                          className={`w-2 h-2 rounded-full ${
                            item.provider === 'openai'
                              ? 'bg-[#10A37F]'
                              : item.provider === 'gemini'
                                ? 'bg-[#1CB0F6]'
                                : 'bg-[#FF9600]'
                          }`}
                        />
                        {item.provider}
                      </span>
                    </td>

                    {/* Modelo */}
                    <td className="py-3 pr-4 font-mono font-bold text-foreground">{item.model}</td>

                    {/* Input USD/1k */}
                    <td className="py-3 pr-4">
                      <div className="relative w-28 sm:w-32">
                        <Input
                          type="number"
                          step="0.00001"
                          min="0"
                          value={currentIn}
                          onChange={(e) =>
                            handleInputChange(
                              item.provider,
                              item.model,
                              'inputUsdPer1k',
                              e.target.value,
                            )
                          }
                          className="h-9 text-xs font-mono font-bold rounded-xl bg-muted/40 border-2"
                        />
                      </div>
                    </td>

                    {/* Output USD/1k */}
                    <td className="py-3 pr-4">
                      <div className="relative w-28 sm:w-32">
                        <Input
                          type="number"
                          step="0.00001"
                          min="0"
                          value={currentOut}
                          onChange={(e) =>
                            handleInputChange(
                              item.provider,
                              item.model,
                              'outputUsdPer1k',
                              e.target.value,
                            )
                          }
                          className="h-9 text-xs font-mono font-bold rounded-xl bg-muted/40 border-2"
                        />
                      </div>
                    </td>

                    {/* Equivalente por 1M tokens */}
                    <td className="py-3 pr-4 text-muted-foreground font-mono text-[11px] whitespace-nowrap">
                      ${(inFloat * 1000).toFixed(2)} / ${(outFloat * 1000).toFixed(2)} M
                    </td>

                    {/* Botão de Salvar Linha */}
                    <td className="py-3 text-right">
                      <Button
                        type="button"
                        size="sm"
                        disabled={!isEditing || isSaving}
                        onClick={() => handleSaveRow(item)}
                        className="h-8 px-3 rounded-xl font-black text-[11px] bg-[#58CC02] hover:bg-[#46a302] text-white border-b-2 border-[#3d8c02] active:scale-95 transition-all disabled:opacity-40"
                      >
                        {isSaving ? (
                          <RotateCw className="w-3 h-3 animate-spin" />
                        ) : (
                          <span className="flex items-center gap-1">
                            <Check className="w-3 h-3" /> Salvar
                          </span>
                        )}
                      </Button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
