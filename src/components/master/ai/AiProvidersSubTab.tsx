import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { AiProvider, useAiStore } from '@/stores/useAiStore'
import {
  KeyRound,
  CheckCircle2,
  XCircle,
  Play,
  RotateCw,
  Globe,
  Boxes,
  HelpCircle,
  Eye,
  EyeOff,
} from 'lucide-react'

interface AiProvidersSubTabProps {
  providers: AiProvider[]
  testingProvider: string | null
}

export function AiProvidersSubTab({ providers, testingProvider }: AiProvidersSubTabProps) {
  const { updateProviderSettings, testProviderKey } = useAiStore()

  // State local de inputs editáveis por provedor
  const [editingKeys, setEditingKeys] = useState<Record<string, string>>({})
  const [editingBaseUrls, setEditingBaseUrls] = useState<Record<string, string>>({})
  const [editingModels, setEditingModels] = useState<Record<string, string>>({})
  const [showKeyPlain, setShowKeyPlain] = useState<Record<string, boolean>>({})
  const [isSaving, setIsSaving] = useState<Record<string, boolean>>({})

  const handleKeyChange = (provider: string, val: string) => {
    setEditingKeys((prev) => ({ ...prev, [provider]: val }))
  }

  const handleBaseUrlChange = (provider: string, val: string) => {
    setEditingBaseUrls((prev) => ({ ...prev, [provider]: val }))
  }

  const handleModelChange = (provider: string, val: string) => {
    setEditingModels((prev) => ({ ...prev, [provider]: val }))
  }

  const handleSaveProvider = async (p: AiProvider) => {
    setIsSaving((prev) => ({ ...prev, [p.provider]: true }))

    const newKey = editingKeys[p.provider]
    const newBaseUrl = editingBaseUrls[p.provider]
    const newModel = editingModels[p.provider]

    const success = await updateProviderSettings(p.provider, {
      baseUrl: newBaseUrl !== undefined ? newBaseUrl : p.baseUrl,
      defaultModel: newModel !== undefined ? newModel : p.defaultModel,
      newApiKey: newKey !== undefined ? newKey : undefined,
    })

    if (success && newKey !== undefined) {
      // Limpa input de nova chave para que a UI mostre a máscara
      setEditingKeys((prev) => {
        const copy = { ...prev }
        delete copy[p.provider]
        return copy
      })
    }

    setIsSaving((prev) => ({ ...prev, [p.provider]: false }))
  }

  const handleToggleProvider = async (p: AiProvider, enabled: boolean) => {
    await updateProviderSettings(p.provider, { enabled })
  }

  const handleTestKey = async (p: AiProvider) => {
    const rawKey = editingKeys[p.provider]
    await testProviderKey(p.provider, rawKey)
  }

  // Cores de destaque por provedor
  const getProviderMeta = (provider: string) => {
    switch (provider) {
      case 'openai':
        return {
          themeColor: 'border-b-[#10A37F]',
          badgeBg: 'bg-[#10A37F]/10 text-[#10A37F]',
          modelSuggestions: ['gpt-4o-mini', 'gpt-4o', 'gpt-4-turbo'],
          hint: 'Chave obtida no dashboard platform.openai.com/api-keys (sk-...)',
        }
      case 'gemini':
        return {
          themeColor: 'border-b-[#1CB0F6]',
          badgeBg: 'bg-[#1CB0F6]/10 text-[#1CB0F6]',
          modelSuggestions: ['gemini-1.5-flash', 'gemini-1.5-pro', 'gemini-2.0-flash-exp'],
          hint: 'Chave obtida no Google AI Studio (aistudio.google.com)',
        }
      case 'anthropic':
        return {
          themeColor: 'border-b-[#FF9600]',
          badgeBg: 'bg-[#FF9600]/10 text-[#FF9600]',
          modelSuggestions: [
            'claude-3-5-haiku-20241022',
            'claude-3-5-sonnet-20241022',
            'claude-3-opus-20240229',
          ],
          hint: 'Chave obtida no console.anthropic.com/settings/keys (sk-ant-...)',
        }
      default:
        return {
          themeColor: 'border-b-primary',
          badgeBg: 'bg-primary/10 text-primary',
          modelSuggestions: [],
          hint: '',
        }
    }
  }

  return (
    <div className="space-y-6">
      {/* Aviso de Segurança */}
      <div className="p-4 rounded-3xl bg-amber-500/10 border-2 border-amber-500/30 flex items-start gap-3">
        <KeyRound className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
        <div className="text-xs space-y-1">
          <p className="font-extrabold text-foreground">
            Proteção das Chaves de API (Zero Client Exposure)
          </p>
          <p className="text-muted-foreground font-medium leading-relaxed">
            As chaves de API nunca são enviadas ao navegador de usuários comuns, nem incluídas no
            bundle da aplicação. Toda comunicação passa pela Edge Function{' '}
            <code className="bg-muted px-1.5 py-0.5 rounded text-foreground font-mono">
              ai-proxy
            </code>
            , e as linhas da tabela de provedores são protegidas por RLS exclusiva para Master.
          </p>
        </div>
      </div>

      {/* Cards por Provedor */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {providers.map((p) => {
          const meta = getProviderMeta(p.provider)
          const isTesting = testingProvider === p.provider
          const isPendingSave = isSaving[p.provider]
          const isKeyEntered = editingKeys[p.provider] !== undefined
          const currentKeyDisplay = isKeyEntered ? editingKeys[p.provider] : p.apiKeyMasked
          const currentBaseUrl =
            editingBaseUrls[p.provider] !== undefined ? editingBaseUrls[p.provider] : p.baseUrl
          const currentModel =
            editingModels[p.provider] !== undefined ? editingModels[p.provider] : p.defaultModel
          const isPlainVisible = Boolean(showKeyPlain[p.provider])

          const hasUnsavedChanges =
            isKeyEntered ||
            (editingBaseUrls[p.provider] !== undefined &&
              editingBaseUrls[p.provider] !== p.baseUrl) ||
            (editingModels[p.provider] !== undefined &&
              editingModels[p.provider] !== p.defaultModel)

          return (
            <Card
              key={p.id}
              className={`rounded-3xl border-2 border-b-4 ${meta.themeColor} p-5 sm:p-6 bg-card shadow-sm flex flex-col justify-between space-y-5`}
            >
              {/* Header do Provedor */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`p-2 rounded-2xl ${meta.badgeBg}`}>
                      <Boxes className="w-5 h-5" />
                    </span>
                    <div>
                      <h4 className="font-black text-base text-foreground leading-tight">
                        {p.displayName}
                      </h4>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        {p.enabled ? (
                          <Badge className="bg-[#58CC02] text-white text-[10px] font-black h-5">
                            Ativo
                          </Badge>
                        ) : (
                          <Badge
                            variant="outline"
                            className="text-muted-foreground text-[10px] font-bold h-5"
                          >
                            Inativo
                          </Badge>
                        )}
                        {p.hasKey ? (
                          <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                            <CheckCircle2 className="w-3 h-3" /> Chave OK
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-[10px] font-bold text-rose-500">
                            <XCircle className="w-3 h-3" /> Sem Chave
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Switch Habilitar Provedor */}
                  <div className="flex flex-col items-end gap-1">
                    <span className="text-[10px] font-bold text-muted-foreground">Habilitar</span>
                    <Switch
                      checked={p.enabled}
                      onCheckedChange={(checked) => handleToggleProvider(p, checked)}
                      className="data-[state=checked]:bg-[#58CC02]"
                    />
                  </div>
                </div>

                {/* Campo Chave de API */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-black text-foreground flex items-center gap-1.5">
                      <KeyRound className="w-3.5 h-3.5 text-muted-foreground" />
                      Chave de API (Secret Key)
                    </label>
                    {isKeyEntered && (
                      <button
                        type="button"
                        onClick={() =>
                          setShowKeyPlain((prev) => ({ ...prev, [p.provider]: !prev[p.provider] }))
                        }
                        className="text-[11px] font-bold text-muted-foreground hover:text-foreground flex items-center gap-1"
                      >
                        {isPlainVisible ? (
                          <EyeOff className="w-3 h-3" />
                        ) : (
                          <Eye className="w-3 h-3" />
                        )}
                        {isPlainVisible ? 'Ocultar' : 'Exibir'}
                      </button>
                    )}
                  </div>

                  <div className="relative">
                    <Input
                      type={isPlainVisible ? 'text' : 'password'}
                      placeholder={p.hasKey ? p.apiKeyMasked : 'Cole aqui a chave (ex: sk-...)'}
                      value={currentKeyDisplay}
                      onChange={(e) => handleKeyChange(p.provider, e.target.value)}
                      className="rounded-2xl h-10 text-xs font-mono pr-20 bg-muted/40 border-2"
                    />
                    {isKeyEntered && (
                      <button
                        type="button"
                        onClick={() => {
                          setEditingKeys((prev) => {
                            const c = { ...prev }
                            delete c[p.provider]
                            return c
                          })
                        }}
                        className="absolute right-2 top-2.5 text-[10px] font-bold text-muted-foreground hover:text-foreground bg-muted px-2 py-0.5 rounded-lg"
                      >
                        Desfazer
                      </button>
                    )}
                  </div>
                  <p className="text-[10px] text-muted-foreground font-medium flex items-center gap-1">
                    <HelpCircle className="w-3 h-3 shrink-0" />
                    {meta.hint}
                  </p>
                </div>

                {/* Modelo Padrão */}
                <div className="space-y-1.5">
                  <label className="text-xs font-black text-foreground flex items-center gap-1.5">
                    <Boxes className="w-3.5 h-3.5 text-muted-foreground" />
                    Modelo Padrão
                  </label>
                  <Input
                    type="text"
                    value={currentModel}
                    onChange={(e) => handleModelChange(p.provider, e.target.value)}
                    placeholder="Ex: gpt-4o-mini"
                    className="rounded-2xl h-10 text-xs font-mono bg-muted/40 border-2"
                  />
                  {meta.modelSuggestions.length > 0 && (
                    <div className="flex flex-wrap gap-1 pt-1">
                      {meta.modelSuggestions.map((m) => (
                        <button
                          key={m}
                          type="button"
                          onClick={() => handleModelChange(p.provider, m)}
                          className={`text-[10px] font-mono px-2 py-0.5 rounded-lg border transition-all ${
                            currentModel === m
                              ? 'bg-primary text-primary-foreground font-bold border-primary'
                              : 'bg-muted/60 text-muted-foreground hover:bg-muted border-border'
                          }`}
                        >
                          {m}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Base URL (Avançado) */}
                <div className="space-y-1.5">
                  <label className="text-xs font-black text-foreground flex items-center gap-1.5">
                    <Globe className="w-3.5 h-3.5 text-muted-foreground" />
                    Base URL (Endpoint Oficial)
                  </label>
                  <Input
                    type="text"
                    value={currentBaseUrl}
                    onChange={(e) => handleBaseUrlChange(p.provider, e.target.value)}
                    className="rounded-2xl h-10 text-xs font-mono bg-muted/40 border-2"
                  />
                </div>
              </div>

              {/* Botões de Ação Duolingo Style (border-b-4, rounded-2xl) */}
              <div className="space-y-2 pt-2 border-t border-border">
                <div className="grid grid-cols-2 gap-2">
                  {/* Botão Testar Chave */}
                  <Button
                    type="button"
                    variant="outline"
                    disabled={isTesting || (!p.hasKey && !isKeyEntered)}
                    onClick={() => handleTestKey(p)}
                    className="rounded-2xl h-10 text-xs font-bold border-2 border-b-4 active:scale-95 transition-all flex items-center justify-center gap-1.5 hover:bg-muted"
                  >
                    {isTesting ? (
                      <>
                        <RotateCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Testando...</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-3.5 h-3.5 text-primary" />
                        <span>Testar Chave</span>
                      </>
                    )}
                  </Button>

                  {/* Botão Salvar Provedor */}
                  <Button
                    type="button"
                    disabled={isPendingSave || !hasUnsavedChanges}
                    onClick={() => handleSaveProvider(p)}
                    className="rounded-2xl h-10 text-xs font-black bg-[#58CC02] hover:bg-[#46a302] text-white border-b-4 border-[#3d8c02] active:scale-95 transition-all shadow-sm flex items-center justify-center gap-1.5 disabled:opacity-50"
                  >
                    {isPendingSave ? (
                      <>
                        <RotateCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Salvando...</span>
                      </>
                    ) : (
                      <span>Salvar</span>
                    )}
                  </Button>
                </div>

                {hasUnsavedChanges && (
                  <p className="text-[10px] text-amber-500 font-bold text-center">
                    Alterações pendentes. Clique em "Salvar" para confirmar.
                  </p>
                )}
              </div>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
