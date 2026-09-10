import { useState, useEffect } from 'react'
import {
  useSiteSettingsStore,
  SiteSettingsData,
  FeatureCardItem,
  DEFAULT_SITE_SETTINGS,
} from '@/stores/useSiteSettingsStore'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import {
  Globe,
  LayoutTemplate,
  RotateCcw,
  Save,
  Eye,
  Plus,
  Trash2,
  Sparkles,
  CheckSquare,
  HeartPulse,
  GraduationCap,
  Wallet,
  BarChart2,
  Flame,
  Zap,
  Check,
} from 'lucide-react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

const AVAILABLE_ICONS = [
  { id: 'CheckSquare', label: 'Tarefas' },
  { id: 'HeartPulse', label: 'Saúde' },
  { id: 'GraduationCap', label: 'Estudos' },
  { id: 'Wallet', label: 'Finanças' },
  { id: 'BarChart2', label: 'Relatórios' },
  { id: 'Sparkles', label: 'Geral' },
  { id: 'Flame', label: 'Streaks' },
  { id: 'Zap', label: 'Raio' },
]

export function SiteSettingsTab() {
  const {
    settings,
    flags,
    updateSetting,
    toggleContentFlag,
    restoreDefaults,
    loading,
    loadSiteData,
  } = useSiteSettingsStore()

  // Local state for forms
  const [formData, setFormData] = useState<SiteSettingsData>(settings)
  const [hasChanges, setHasChanges] = useState(false)
  const [resetDialogOpen, setResetDialogOpen] = useState(false)
  const [saving, setSaving] = useState(false)

  // Sync formData with store when settings change from outside
  useEffect(() => {
    setFormData(settings)
  }, [settings])

  const handleInputChange = (field: keyof SiteSettingsData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    setHasChanges(true)
  }

  const handleFeatureChange = (index: number, field: keyof FeatureCardItem, value: any) => {
    const nextFeatures = [...formData.features]
    nextFeatures[index] = { ...nextFeatures[index], [field]: value }
    handleInputChange('features', nextFeatures)
  }

  const handleAddFeature = () => {
    const newFeature: FeatureCardItem = {
      id: `feature-${Date.now()}`,
      title: 'Nova Funcionalidade',
      description: 'Descrição objetiva dos benefícios desta funcionalidade.',
      icon: 'Sparkles',
      color: '#58CC02',
    }
    handleInputChange('features', [...formData.features, newFeature])
  }

  const handleRemoveFeature = (index: number) => {
    const nextFeatures = formData.features.filter((_, i) => i !== index)
    handleInputChange('features', nextFeatures)
  }

  const handleStepChange = (index: number, field: 'title' | 'description', value: string) => {
    const nextSteps = [...formData.steps]
    nextSteps[index] = { ...nextSteps[index], [field]: value }
    handleInputChange('steps', nextSteps)
  }

  const handleSaveAll = async () => {
    setSaving(true)
    try {
      const keys = Object.keys(formData) as (keyof SiteSettingsData)[]
      let allOk = true
      for (const k of keys) {
        const ok = await updateSetting(k, formData[k])
        if (!ok) allOk = false
      }
      if (allOk) {
        setHasChanges(false)
      }
    } finally {
      setSaving(false)
    }
  }

  const handleRestore = async () => {
    setResetDialogOpen(false)
    const ok = await restoreDefaults()
    if (ok) {
      setFormData(DEFAULT_SITE_SETTINGS)
      setHasChanges(false)
    }
  }

  return (
    <div className="space-y-8">
      {/* Top Header Card */}
      <div className="bg-card border-2 rounded-3xl p-5 sm:p-6 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-[#58CC02]/15 text-[#58CC02] border-2 border-[#58CC02]/30 flex items-center justify-center shrink-0">
            <Globe className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-black text-foreground">Gestão de Conteúdo: Site & Login</h2>
            <p className="text-xs text-muted-foreground font-semibold mt-0.5">
              Altere textos, botões e visibilidade de seções públicas sem necessidade de novo
              deploy.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <Button
            type="button"
            variant="outline"
            onClick={() => setResetDialogOpen(true)}
            className="rounded-2xl border-2 font-bold text-xs h-10 px-3.5 flex items-center gap-1.5 flex-1 md:flex-none"
          >
            <RotateCcw className="w-3.5 h-3.5 text-muted-foreground" />
            <span>Restaurar padrão</span>
          </Button>

          <Button
            type="button"
            onClick={handleSaveAll}
            disabled={saving || (!hasChanges && !loading)}
            className="rounded-2xl bg-[#58CC02] hover:bg-[#58CC02]/90 border-b-4 border-[#46A302] text-white font-black text-xs h-10 px-5 flex items-center gap-1.5 flex-1 md:flex-none active:translate-y-0.5 active:border-b-0"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Salvando...' : 'Salvar Alterações'}</span>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Form Column (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Seção 1: Toggles de Visibilidade das Seções */}
          <Card className="rounded-3xl border-2 p-5 sm:p-6 bg-card space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2">
                <LayoutTemplate className="w-4 h-4 text-[#1CB0F6]" />
                <h3 className="font-black text-base text-foreground">Seções do Site & Cadastro</h3>
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                content_flags
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div className="flex items-center justify-between p-3 rounded-2xl bg-muted/40 border">
                <div>
                  <Label className="font-bold text-xs">Hero Principal</Label>
                  <p className="text-[11px] text-muted-foreground">Banner e CTAs do topo</p>
                </div>
                <Switch
                  checked={flags.hero}
                  onCheckedChange={(checked) => toggleContentFlag('hero', checked)}
                  className="data-[state=checked]:bg-[#58CC02]"
                />
              </div>

              <div className="flex items-center justify-between p-3 rounded-2xl bg-muted/40 border">
                <div>
                  <Label className="font-bold text-xs">Funcionalidades</Label>
                  <p className="text-[11px] text-muted-foreground">Grid de cards coloridos</p>
                </div>
                <Switch
                  checked={flags.features_section}
                  onCheckedChange={(checked) => toggleContentFlag('features_section', checked)}
                  className="data-[state=checked]:bg-[#58CC02]"
                />
              </div>

              <div className="flex items-center justify-between p-3 rounded-2xl bg-muted/40 border">
                <div>
                  <Label className="font-bold text-xs">Como Funciona</Label>
                  <p className="text-[11px] text-muted-foreground">Passo a passo 1, 2, 3</p>
                </div>
                <Switch
                  checked={flags.how_it_works}
                  onCheckedChange={(checked) => toggleContentFlag('how_it_works', checked)}
                  className="data-[state=checked]:bg-[#58CC02]"
                />
              </div>

              <div className="flex items-center justify-between p-3 rounded-2xl bg-muted/40 border">
                <div>
                  <Label className="font-bold text-xs">CTA Final</Label>
                  <p className="text-[11px] text-muted-foreground">Chamada para ação do rodapé</p>
                </div>
                <Switch
                  checked={flags.final_cta}
                  onCheckedChange={(checked) => toggleContentFlag('final_cta', checked)}
                  className="data-[state=checked]:bg-[#58CC02]"
                />
              </div>

              <div className="flex items-center justify-between p-3 rounded-2xl bg-muted/40 border">
                <div>
                  <Label className="font-bold text-xs">Rodapé do Site</Label>
                  <p className="text-[11px] text-muted-foreground">Mensagem e copyright</p>
                </div>
                <Switch
                  checked={flags.footer}
                  onCheckedChange={(checked) => toggleContentFlag('footer', checked)}
                  className="data-[state=checked]:bg-[#58CC02]"
                />
              </div>

              <div className="flex items-center justify-between p-3 rounded-2xl bg-[#58CC02]/10 border border-[#58CC02]/30">
                <div>
                  <Label className="font-black text-xs text-[#58CC02]">Cadastro Público</Label>
                  <p className="text-[11px] text-muted-foreground">
                    Permitir "Criar conta" no login
                  </p>
                </div>
                <Switch
                  checked={flags.public_signup}
                  onCheckedChange={(checked) => toggleContentFlag('public_signup', checked)}
                  className="data-[state=checked]:bg-[#58CC02]"
                />
              </div>
            </div>
          </Card>

          {/* Seção 2: Identidade e Hero */}
          <Card className="rounded-3xl border-2 p-5 sm:p-6 bg-card space-y-4">
            <h3 className="font-black text-base text-foreground border-b pb-3 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#58CC02]" />
              Identidade do Aplicativo e Hero
            </h3>

            <div className="space-y-3">
              <div>
                <Label className="text-xs font-bold text-muted-foreground">Nome da Aplicação</Label>
                <Input
                  value={formData.app_name}
                  onChange={(e) => handleInputChange('app_name', e.target.value)}
                  className="rounded-2xl font-semibold border-2 mt-1"
                />
              </div>

              <div>
                <Label className="text-xs font-bold text-muted-foreground">
                  Título Principal (Hero)
                </Label>
                <Input
                  value={formData.hero_title}
                  onChange={(e) => handleInputChange('hero_title', e.target.value)}
                  className="rounded-2xl font-semibold border-2 mt-1"
                />
              </div>

              <div>
                <Label className="text-xs font-bold text-muted-foreground">Subtítulo do Hero</Label>
                <Textarea
                  value={formData.hero_subtitle}
                  onChange={(e) => handleInputChange('hero_subtitle', e.target.value)}
                  rows={3}
                  className="rounded-2xl font-semibold border-2 mt-1 resize-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs font-bold text-muted-foreground">
                    Botão Primário (CTA)
                  </Label>
                  <Input
                    value={formData.cta_primary_label}
                    onChange={(e) => handleInputChange('cta_primary_label', e.target.value)}
                    className="rounded-2xl font-semibold border-2 mt-1"
                  />
                </div>
                <div>
                  <Label className="text-xs font-bold text-muted-foreground">
                    Botão Secundário
                  </Label>
                  <Input
                    value={formData.cta_secondary_label}
                    onChange={(e) => handleInputChange('cta_secondary_label', e.target.value)}
                    className="rounded-2xl font-semibold border-2 mt-1"
                  />
                </div>
              </div>
            </div>
          </Card>

          {/* Seção 3: Tela de Login */}
          <Card className="rounded-3xl border-2 p-5 sm:p-6 bg-card space-y-4">
            <h3 className="font-black text-base text-foreground border-b pb-3 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#1CB0F6]" />
              Textos da Tela de Login (/login)
            </h3>

            <div className="space-y-3">
              <div>
                <Label className="text-xs font-bold text-muted-foreground">Título do Login</Label>
                <Input
                  value={formData.login_title}
                  onChange={(e) => handleInputChange('login_title', e.target.value)}
                  className="rounded-2xl font-semibold border-2 mt-1"
                />
              </div>

              <div>
                <Label className="text-xs font-bold text-muted-foreground">
                  Subtítulo do Login
                </Label>
                <Textarea
                  value={formData.login_subtitle}
                  onChange={(e) => handleInputChange('login_subtitle', e.target.value)}
                  rows={2}
                  className="rounded-2xl font-semibold border-2 mt-1 resize-none"
                />
              </div>
            </div>
          </Card>

          {/* Seção 4: Cards de Funcionalidades */}
          <Card className="rounded-3xl border-2 p-5 sm:p-6 bg-card space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-black text-base text-foreground flex items-center gap-2">
                <CheckSquare className="w-4 h-4 text-[#58CC02]" />
                Cards de Funcionalidades ({formData.features.length})
              </h3>
              <Button
                type="button"
                size="sm"
                onClick={handleAddFeature}
                className="rounded-2xl bg-[#58CC02] hover:bg-[#58CC02]/90 border-b-2 border-[#46A302] text-white font-bold text-xs h-8 px-3 flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Adicionar</span>
              </Button>
            </div>

            <div className="space-y-4">
              {formData.features.map((feat, idx) => (
                <div
                  key={feat.id || idx}
                  className="p-4 rounded-2xl border-2 bg-muted/20 space-y-3 relative group"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-foreground">Card #{idx + 1}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveFeature(idx)}
                      className="h-8 w-8 text-red-500 hover:bg-red-500/10 rounded-xl"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <Label className="text-[11px] font-bold text-muted-foreground">Título</Label>
                      <Input
                        value={feat.title}
                        onChange={(e) => handleFeatureChange(idx, 'title', e.target.value)}
                        className="rounded-xl font-semibold border-2 text-xs h-9 mt-0.5"
                      />
                    </div>

                    <div>
                      <Label className="text-[11px] font-bold text-muted-foreground">Ícone</Label>
                      <select
                        value={feat.icon}
                        onChange={(e) => handleFeatureChange(idx, 'icon', e.target.value)}
                        className="w-full rounded-xl font-semibold border-2 bg-background text-xs h-9 mt-0.5 px-2"
                      >
                        {AVAILABLE_ICONS.map((ic) => (
                          <option key={ic.id} value={ic.id}>
                            {ic.label} ({ic.id})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <Label className="text-[11px] font-bold text-muted-foreground">Descrição</Label>
                    <Textarea
                      value={feat.description}
                      onChange={(e) => handleFeatureChange(idx, 'description', e.target.value)}
                      rows={2}
                      className="rounded-xl font-semibold border-2 text-xs mt-0.5 resize-none"
                    />
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Seção 5: Passos de Como Funciona */}
          <Card className="rounded-3xl border-2 p-5 sm:p-6 bg-card space-y-4">
            <h3 className="font-black text-base text-foreground border-b pb-3 flex items-center gap-2">
              <Flame className="w-4 h-4 text-[#FFC800]" />
              Passos de "Como Funciona"
            </h3>

            <div className="space-y-3">
              {formData.steps.map((st, idx) => (
                <div key={idx} className="p-3 rounded-2xl border bg-muted/20 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-[#58CC02] text-white flex items-center justify-center font-black text-xs">
                      {st.step || idx + 1}
                    </span>
                    <Input
                      value={st.title}
                      onChange={(e) => handleStepChange(idx, 'title', e.target.value)}
                      className="rounded-xl font-bold border-2 text-xs h-8 flex-1"
                    />
                  </div>
                  <Textarea
                    value={st.description}
                    onChange={(e) => handleStepChange(idx, 'description', e.target.value)}
                    rows={2}
                    className="rounded-xl font-semibold border-2 text-xs resize-none"
                  />
                </div>
              ))}
            </div>
          </Card>

          {/* Seção 6: Rodapé */}
          <Card className="rounded-3xl border-2 p-5 sm:p-6 bg-card space-y-4">
            <h3 className="font-black text-base text-foreground border-b pb-3">
              Mensagem do Rodapé
            </h3>
            <div>
              <Label className="text-xs font-bold text-muted-foreground">Frase curta</Label>
              <Input
                value={formData.footer_message}
                onChange={(e) => handleInputChange('footer_message', e.target.value)}
                className="rounded-2xl font-semibold border-2 mt-1"
              />
            </div>
          </Card>
        </div>

        {/* Right Preview Column (5 cols sticky) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="sticky top-24 space-y-4">
            <div className="flex items-center gap-2 px-1">
              <Eye className="w-4 h-4 text-[#1CB0F6]" />
              <h3 className="font-black text-sm uppercase tracking-wider text-muted-foreground">
                Preview em Tempo Real
              </h3>
            </div>

            {/* Preview do Hero */}
            <div className="rounded-3xl border-2 p-5 bg-card shadow-sm space-y-4 text-center overflow-hidden relative">
              <div className="absolute top-2 right-2 text-[10px] font-bold px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                Miniatura Hero
              </div>

              <div className="w-10 h-10 rounded-2xl bg-[#58CC02]/15 border-2 border-[#58CC02]/30 flex items-center justify-center mx-auto mt-2">
                <Sparkles className="w-5 h-5 text-[#58CC02]" />
              </div>

              <div>
                <h4 className="text-base font-black text-foreground line-clamp-2">
                  {formData.hero_title || 'Título do Hero'}
                </h4>
                <p className="text-[11px] text-muted-foreground font-semibold mt-1 line-clamp-3">
                  {formData.hero_subtitle || 'Subtítulo do Hero'}
                </p>
              </div>

              <div className="flex items-center justify-center gap-2 pt-1">
                <div className="rounded-xl bg-[#58CC02] border-b-2 border-[#46A302] text-white text-[11px] font-black px-3 py-1.5 shadow-sm">
                  {formData.cta_primary_label || 'Entrar'}
                </div>
                {flags.public_signup && (
                  <div className="rounded-xl border-2 text-[11px] font-bold px-3 py-1.5 text-foreground bg-muted/50">
                    {formData.cta_secondary_label || 'Criar conta'}
                  </div>
                )}
              </div>
            </div>

            {/* Preview da Tela de Login */}
            <div className="rounded-3xl border-2 p-5 bg-card shadow-sm space-y-3 text-center relative">
              <div className="absolute top-2 right-2 text-[10px] font-bold px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                Miniatura /login
              </div>

              <div className="w-8 h-8 rounded-xl bg-[#58CC02]/15 border flex items-center justify-center mx-auto mt-2">
                <Sparkles className="w-4 h-4 text-[#58CC02]" />
              </div>

              <div>
                <h5 className="text-xs font-black text-foreground">
                  {formData.login_title || 'Bem-vindo de volta!'}
                </h5>
                <p className="text-[10px] text-muted-foreground font-semibold mt-0.5 line-clamp-2">
                  {formData.login_subtitle ||
                    'Acesse sua conta para continuar evoluindo suas metas.'}
                </p>
              </div>

              <div className="p-3 rounded-2xl bg-muted/40 border space-y-2 text-left">
                <div className="h-6 rounded-lg bg-background border px-2 text-[9px] flex items-center text-muted-foreground font-semibold">
                  seu@email.com
                </div>
                <div className="h-6 rounded-lg bg-background border px-2 text-[9px] flex items-center text-muted-foreground font-semibold">
                  ••••••••
                </div>
                <div className="h-7 rounded-lg bg-[#58CC02] border-b-2 border-[#46A302] text-white font-black text-[10px] flex items-center justify-center shadow-sm">
                  Entrar
                </div>
              </div>

              <div className="text-[10px] text-muted-foreground font-semibold">
                {flags.public_signup ? (
                  <span>
                    Não tem conta? <span className="text-[#1CB0F6] font-bold">Criar conta</span>
                  </span>
                ) : (
                  <span className="text-amber-500 font-bold">
                    Cadastro público desativado pelo Master
                  </span>
                )}
              </div>
            </div>

            {/* Status Card */}
            <div className="p-4 rounded-3xl bg-[#58CC02]/10 border-2 border-[#58CC02]/30 flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-[#58CC02] text-white flex items-center justify-center shrink-0">
                <Check className="w-4 h-4" />
              </div>
              <div className="text-xs">
                <p className="font-black text-foreground">Integração Imediata</p>
                <p className="text-muted-foreground text-[11px] leading-tight">
                  Visitantes e usuários verão qualquer modificação instantaneamente.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Dialog para Restaurar Padrões */}
      <AlertDialog open={resetDialogOpen} onOpenChange={setResetDialogOpen}>
        <AlertDialogContent className="rounded-3xl border-2 max-w-sm">
          <AlertDialogHeader>
            <div className="w-12 h-12 rounded-2xl bg-amber-500/15 text-amber-500 flex items-center justify-center mx-auto mb-2">
              <RotateCcw className="w-6 h-6" />
            </div>
            <AlertDialogTitle className="text-center font-black text-xl">
              Restaurar textos padrão?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-center text-xs font-semibold text-muted-foreground">
              Essa ação substituirá todos os textos e seções do site público e do login pelas
              configurações originais do sistema.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2 mt-2">
            <AlertDialogCancel className="rounded-2xl border-2 font-bold flex-1">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRestore}
              className="rounded-2xl font-black bg-amber-500 hover:bg-amber-600 border-b-4 border-amber-700 text-white flex-1"
            >
              Sim, restaurar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
