import { Card } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { AiGeneralConfig, DEFAULT_AI_FEATURES, useAiStore } from '@/stores/useAiStore'
import { Power, Shield, Layers, Sparkles, Users, GraduationCap } from 'lucide-react'

interface AiFeaturesSubTabProps {
  config: AiGeneralConfig | null
}

export function AiFeaturesSubTab({ config }: AiFeaturesSubTabProps) {
  const { toggleAiEnabled, toggleFeatureAccess } = useAiStore()

  const aiEnabled = Boolean(config?.aiEnabled)
  const featuresMap = config?.featuresEnabled || {}

  return (
    <div className="space-y-6">
      {/* 1. Master Switch Geral da IA */}
      <Card className="rounded-3xl border-2 border-b-4 border-b-[#58CC02]/40 p-5 sm:p-6 bg-card shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start sm:items-center gap-3">
          <div
            className={`p-3 rounded-2xl border-2 transition-colors ${
              aiEnabled
                ? 'bg-[#58CC02]/15 text-[#58CC02] border-[#58CC02]/30'
                : 'bg-muted text-muted-foreground border-border'
            }`}
          >
            <Power className="w-6 h-6" />
          </div>
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <h3 className="text-base sm:text-lg font-black text-foreground">
                Inteligência Artificial no Aplicativo
              </h3>
              {aiEnabled ? (
                <Badge className="bg-[#58CC02] text-white text-[10px] font-black h-5">
                  ATIVADA
                </Badge>
              ) : (
                <Badge
                  variant="outline"
                  className="text-rose-500 border-rose-300 text-[10px] font-black h-5"
                >
                  DESLIGADA
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground font-semibold leading-relaxed max-w-xl">
              Chave geral do ecossistema. Quando desligada, nenhum usuário consegue fazer
              requisições ao proxy e os recursos de IA são bloqueados com código 503 amigável.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 self-end sm:self-center shrink-0">
          <span className="text-xs font-black text-foreground">
            {aiEnabled ? 'Sistema Ativo' : 'Sistema Inativo'}
          </span>
          <Switch
            checked={aiEnabled}
            onCheckedChange={(checked) => toggleAiEnabled(checked)}
            className="data-[state=checked]:bg-[#58CC02]"
          />
        </div>
      </Card>

      {/* 2. Lista de Features Planejadas (Fase 2) com Toggles Pro / Comum */}
      <div className="bg-card border-2 rounded-3xl p-5 sm:p-6 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border pb-4">
          <div>
            <div className="flex items-center gap-2">
              <Layers className="w-5 h-5 text-primary" />
              <h3 className="font-extrabold text-base sm:text-lg text-foreground">
                Recursos Planejados & Controle de Acesso
              </h3>
            </div>
            <p className="text-xs text-muted-foreground font-semibold mt-0.5">
              Defina quais módulos têm permissão para chamar a IA e restrinja o acesso por tipo de
              conta
            </p>
          </div>

          <div className="flex items-center gap-4 text-xs font-extrabold text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-muted-foreground" />
              Usuários Comuns
            </span>
            <span className="flex items-center gap-1.5 text-amber-500">
              <Shield className="w-3.5 h-3.5 text-amber-500" />
              Usuários Pro
            </span>
          </div>
        </div>

        {/* Grade de Features */}
        <div className="divide-y divide-border">
          {DEFAULT_AI_FEATURES.map((feat) => {
            const access = featuresMap[feat.key] || { common: false, pro: false }

            return (
              <div
                key={feat.key}
                className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-muted/30 p-3 rounded-2xl transition-colors"
              >
                <div className="space-y-1 max-w-lg">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-primary shrink-0" />
                    <span className="font-black text-sm text-foreground">{feat.label}</span>
                    <code className="text-[10px] font-mono bg-muted px-1.5 py-0.5 rounded text-muted-foreground">
                      {feat.key}
                    </code>
                  </div>
                  <p className="text-xs text-muted-foreground font-medium leading-relaxed">
                    {feat.description}
                  </p>
                </div>

                {/* Duas chaves: Comum e Pro */}
                <div className="flex items-center gap-6 sm:gap-8 self-end sm:self-center shrink-0">
                  {/* Comum */}
                  <div className="flex flex-col items-center gap-1">
                    <span className="text-[10px] font-bold text-muted-foreground">Comum</span>
                    <Switch
                      checked={access.common}
                      disabled={!aiEnabled}
                      onCheckedChange={(checked) =>
                        toggleFeatureAccess(feat.key, 'common', checked)
                      }
                      className="data-[state=checked]:bg-[#1CB0F6]"
                    />
                  </div>

                  {/* Pro */}
                  <div className="flex flex-col items-center gap-1">
                    <span className="text-[10px] font-bold text-amber-500 flex items-center gap-0.5">
                      <GraduationCap className="w-3 h-3 text-amber-500" /> Pro
                    </span>
                    <Switch
                      checked={access.pro}
                      disabled={!aiEnabled}
                      onCheckedChange={(checked) => toggleFeatureAccess(feat.key, 'pro', checked)}
                      className="data-[state=checked]:bg-[#FF9600]"
                    />
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
