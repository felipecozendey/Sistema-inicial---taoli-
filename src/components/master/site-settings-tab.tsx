import { useState, useEffect } from 'react'
import {
  useSiteSettingsStore,
  SiteSettingsData,
  FeatureCardItem,
  HowItWorksStep,
  DEFAULT_SITE_SETTINGS,
} from '@/stores/useSiteSettingsStore'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Globe,
  RotateCcw,
  Save,
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
  ArrowUp,
  ArrowDown,
  Smartphone,
  Sliders,
  Check,
  LogIn,
  AlertCircle,
  Eye,
  EyeOff,
  LayoutDashboard,
  Share2,
  Users,
  Calendar,
  FileText,
  MessageCircle,
} from 'lucide-react'
import { StethoscopeIcon } from '@/components/professional/StethoscopeIcon'
import {
  DEFAULT_USER_NAV_ITEMS,
  DEFAULT_PRO_NAV_ITEMS,
  NavItemCustomization,
  mergeNavCustomization,
} from '@/stores/useSiteSettingsStore'
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
  { id: 'LayoutDashboard', label: 'Dashboard / Painel' },
  { id: 'CheckSquare', label: 'Hábitos e Tarefas' },
  { id: 'Share2', label: 'Social' },
  { id: 'HeartPulse', label: 'Saúde' },
  { id: 'Wallet', label: 'Finanças' },
  { id: 'StethoscopeIcon', label: 'Estetoscópio (Pro)' },
  { id: 'Users', label: 'Pacientes / Usuários' },
  { id: 'Calendar', label: 'Consultas / Calendário' },
  { id: 'FileText', label: 'Anotações / Documento' },
  { id: 'MessageCircle', label: 'Grupos / Mensagens' },
  { id: 'GraduationCap', label: 'Estudos' },
  { id: 'BarChart2', label: 'Relatórios' },
  { id: 'Sparkles', label: 'Geral / Brilho' },
  { id: 'Flame', label: 'Streaks' },
  { id: 'Zap', label: 'Raio' },
]

const COLOR_PRESETS = [
  { label: 'Verde Duolingo', value: '#58CC02' },
  { label: 'Azul Celeste', value: '#1CB0F6' },
  { label: 'Vermelho Vibrante', value: '#FF4B4B' },
  { label: 'Amarelo Ouro', value: '#FFC800' },
  { label: 'Roxo Estudo', value: '#CE82FF' },
  { label: 'Laranja Fogo', value: '#FF9600' },
]

const ICON_MAP: Record<string, any> = {
  LayoutDashboard,
  CheckSquare,
  Share2,
  HeartPulse,
  Wallet,
  StethoscopeIcon,
  Users,
  Calendar,
  FileText,
  MessageCircle,
  GraduationCap,
  BarChart2,
  Sparkles,
  Flame,
  Zap,
}

export function SiteSettingsTab() {
  const {
    settings,
    flags,
    updateSetting,
    toggleContentFlag,
    restorePageDefaults,
    loading,
    loadSiteData,
  } = useSiteSettingsStore()

  // Tab selector: 'landing' | 'login' | 'system' | 'system_pro' | 'tutorials'
  const [selectedPage, setSelectedPage] = useState<
    'landing' | 'login' | 'system' | 'system_pro' | 'tutorials'
  >('landing')

  // Selected tutorial being edited
  const [editingTutorialId, setEditingTutorialId] = useState<string | null>(null)

  // Local form state for zero-lag editing and live preview
  const [formData, setFormData] = useState<SiteSettingsData>(settings)
  const [hasChanges, setHasChanges] = useState(false)
  const [resetDialogOpen, setResetDialogOpen] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    loadSiteData()
  }, [loadSiteData])

  useEffect(() => {
    setFormData(settings)
  }, [settings])

  const handleInputChange = (field: keyof SiteSettingsData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    setHasChanges(true)
  }

  // Feature cards helpers
  const handleFeatureChange = (index: number, field: keyof FeatureCardItem, value: any) => {
    const nextFeatures = [...formData.features]
    nextFeatures[index] = { ...nextFeatures[index], [field]: value }
    handleInputChange('features', nextFeatures)
  }

  const handleAddFeature = () => {
    if (formData.features.length >= 8) return
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

  const handleMoveFeature = (index: number, direction: 'up' | 'down') => {
    const nextFeatures = [...formData.features]
    const targetIndex = direction === 'up' ? index - 1 : index + 1
    if (targetIndex < 0 || targetIndex >= nextFeatures.length) return
    const temp = nextFeatures[index]
    nextFeatures[index] = nextFeatures[targetIndex]
    nextFeatures[targetIndex] = temp
    handleInputChange('features', nextFeatures)
  }

  // Steps helpers
  const handleStepChange = (index: number, field: keyof HowItWorksStep, value: any) => {
    const nextSteps = [...formData.steps]
    nextSteps[index] = { ...nextSteps[index], [field]: value }
    handleInputChange('steps', nextSteps)
  }

  const handleAddStep = () => {
    const nextStepNum = formData.steps.length + 1
    const newStep: HowItWorksStep = {
      step: nextStepNum,
      title: `Passo ${nextStepNum}`,
      description: 'Explique brevemente o que o usuário faz nesta etapa.',
    }
    handleInputChange('steps', [...formData.steps, newStep])
  }

  const handleRemoveStep = (index: number) => {
    const nextSteps = formData.steps
      .filter((_, i) => i !== index)
      .map((s, idx) => ({ ...s, step: idx + 1 }))
    handleInputChange('steps', nextSteps)
  }

  const handleMoveStep = (index: number, direction: 'up' | 'down') => {
    const nextSteps = [...formData.steps]
    const targetIndex = direction === 'up' ? index - 1 : index + 1
    if (targetIndex < 0 || targetIndex >= nextSteps.length) return
    const temp = nextSteps[index]
    nextSteps[index] = nextSteps[targetIndex]
    nextSteps[targetIndex] = temp
    const reindexed = nextSteps.map((s, idx) => ({ ...s, step: idx + 1 }))
    handleInputChange('steps', reindexed)
  }

  // User nav helpers
  const handleUserNavChange = (index: number, field: keyof NavItemCustomization, value: any) => {
    const list = [...(formData.nav_customization || DEFAULT_USER_NAV_ITEMS)]
    list[index] = { ...list[index], [field]: value }
    handleInputChange('nav_customization', list)
  }

  const handleMoveUserNav = (index: number, direction: 'up' | 'down') => {
    const list = [...(formData.nav_customization || DEFAULT_USER_NAV_ITEMS)]
    const target = direction === 'up' ? index - 1 : index + 1
    if (target < 0 || target >= list.length) return
    const temp = list[index]
    list[index] = list[target]
    list[target] = temp
    const reordered = list.map((item, idx) => ({ ...item, order: idx }))
    handleInputChange('nav_customization', reordered)
  }

  const handleToggleUserNavVisible = (index: number, currentVisible: boolean) => {
    const list = [...(formData.nav_customization || DEFAULT_USER_NAV_ITEMS)]
    // Não permitir ocultar se for o único visível
    const visibleCount = list.filter((i) => i.visible).length
    if (currentVisible && visibleCount <= 1) {
      alert('Pelo menos um item do menu deve permanecer visível.')
      return
    }
    list[index] = { ...list[index], visible: !currentVisible }
    handleInputChange('nav_customization', list)
  }

  // Pro nav helpers
  const handleProNavChange = (index: number, field: keyof NavItemCustomization, value: any) => {
    const list = [...(formData.pro_nav_customization || DEFAULT_PRO_NAV_ITEMS)]
    list[index] = { ...list[index], [field]: value }
    handleInputChange('pro_nav_customization', list)
  }

  const handleMoveProNav = (index: number, direction: 'up' | 'down') => {
    const list = [...(formData.pro_nav_customization || DEFAULT_PRO_NAV_ITEMS)]
    const target = direction === 'up' ? index - 1 : index + 1
    if (target < 0 || target >= list.length) return
    const temp = list[index]
    list[index] = list[target]
    list[target] = temp
    const reordered = list.map((item, idx) => ({ ...item, order: idx }))
    handleInputChange('pro_nav_customization', reordered)
  }

  const handleToggleProNavVisible = (index: number, currentVisible: boolean) => {
    const list = [...(formData.pro_nav_customization || DEFAULT_PRO_NAV_ITEMS)]
    const visibleCount = list.filter((i) => i.visible).length
    if (currentVisible && visibleCount <= 1) {
      alert('Pelo menos um item do menu Pro deve permanecer visível.')
      return
    }
    list[index] = { ...list[index], visible: !currentVisible }
    handleInputChange('pro_nav_customization', list)
  }

  const handleSaveAll = async () => {
    // Validação: brand_name e pro_brand_name não podem ser vazios
    if (selectedPage === 'system' && !formData.brand_name?.trim()) {
      alert('O Nome do Sistema não pode ficar vazio.')
      return
    }
    if (selectedPage === 'system_pro' && !formData.pro_brand_name?.trim()) {
      alert('O Nome do Painel Pro não pode ficar vazio.')
      return
    }

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

  const handleConfirmRestorePage = async () => {
    setResetDialogOpen(false)
    const ok = await restorePageDefaults(selectedPage)
    if (ok) {
      if (selectedPage === 'landing') {
        setFormData((prev) => ({
          ...prev,
          app_name: DEFAULT_SITE_SETTINGS.app_name,
          hero_title: DEFAULT_SITE_SETTINGS.hero_title,
          hero_subtitle: DEFAULT_SITE_SETTINGS.hero_subtitle,
          cta_primary_label: DEFAULT_SITE_SETTINGS.cta_primary_label,
          cta_secondary_label: DEFAULT_SITE_SETTINGS.cta_secondary_label,
          final_cta_title: DEFAULT_SITE_SETTINGS.final_cta_title,
          final_cta_subtitle: DEFAULT_SITE_SETTINGS.final_cta_subtitle,
          footer_message: DEFAULT_SITE_SETTINGS.footer_message,
          copyright_text: DEFAULT_SITE_SETTINGS.copyright_text,
          features: DEFAULT_SITE_SETTINGS.features,
          steps: DEFAULT_SITE_SETTINGS.steps,
        }))
      } else if (selectedPage === 'login') {
        setFormData((prev) => ({
          ...prev,
          login_title: DEFAULT_SITE_SETTINGS.login_title,
          login_subtitle: DEFAULT_SITE_SETTINGS.login_subtitle,
          login_button_label: DEFAULT_SITE_SETTINGS.login_button_label,
          login_footer_text: DEFAULT_SITE_SETTINGS.login_footer_text,
        }))
      } else if (selectedPage === 'system') {
        setFormData((prev) => ({
          ...prev,
          brand_name: DEFAULT_SITE_SETTINGS.brand_name,
          nav_customization: DEFAULT_USER_NAV_ITEMS,
        }))
      } else if (selectedPage === 'system_pro') {
        setFormData((prev) => ({
          ...prev,
          pro_brand_name: DEFAULT_SITE_SETTINGS.pro_brand_name,
          pro_nav_customization: DEFAULT_PRO_NAV_ITEMS,
        }))
      } else if (selectedPage === 'tutorials') {
        setFormData((prev) => ({
          ...prev,
          tutorials: [],
        }))
        setEditingTutorialId(null)
      }
      setHasChanges(false)
    }
  }

  // Tutorial CRUD helpers
  const currentTutorials = formData.tutorials || []
  const activeTutorial = currentTutorials.find((t) => t.id === editingTutorialId) || null

  const handleAddTutorial = () => {
    const newId = `tut-${Date.now()}`
    const newTut = {
      id: newId,
      audience: 'user' as const,
      target_page: 'dashboard',
      title: 'Novo Tutorial',
      content: 'Instruções claras para guiar o usuário nesta tela.',
      type: 'tour' as const,
      trigger: 'first_access' as const,
      active: true,
      steps: [
        {
          step: 1,
          title: 'Primeiro passo',
          content: 'Bem-vindo! Esta é a visão geral do seu dia.',
          target: 'Visão Geral',
        },
        {
          step: 2,
          title: 'Segundo passo',
          content: 'Acompanhe seu progresso e hábitos por aqui.',
          target: 'Hábitos e Tarefas',
        },
      ],
    }
    const nextList = [...currentTutorials, newTut]
    handleInputChange('tutorials', nextList)
    setEditingTutorialId(newId)
  }

  const handleUpdateActiveTutorial = (field: string, value: any) => {
    if (!editingTutorialId) return
    const nextList = currentTutorials.map((t) => {
      if (t.id === editingTutorialId) {
        return { ...t, [field]: value }
      }
      return t
    })
    handleInputChange('tutorials', nextList)
  }

  const handleDeleteTutorial = (id: string) => {
    const nextList = currentTutorials.filter((t) => t.id !== id)
    handleInputChange('tutorials', nextList)
    if (editingTutorialId === id) {
      setEditingTutorialId(null)
    }
  }

  const handleToggleTutorialActive = (id: string, current: boolean) => {
    const nextList = currentTutorials.map((t) => {
      if (t.id === id) {
        return { ...t, active: !current }
      }
      return t
    })
    handleInputChange('tutorials', nextList)
  }

  const handleAddStepToTutorial = () => {
    if (!activeTutorial) return
    const curSteps = activeTutorial.steps || []
    const nextStepNum = curSteps.length + 1
    const newStep = {
      step: nextStepNum,
      title: `Passo ${nextStepNum}`,
      content: 'Descrição deste passo do tour.',
      target: '',
    }
    handleUpdateActiveTutorial('steps', [...curSteps, newStep])
  }

  const handleUpdateStep = (stepIdx: number, field: string, val: any) => {
    if (!activeTutorial) return
    const curSteps = [...(activeTutorial.steps || [])]
    curSteps[stepIdx] = { ...curSteps[stepIdx], [field]: val }
    handleUpdateActiveTutorial('steps', curSteps)
  }

  const handleRemoveStepFromTutorial = (stepIdx: number) => {
    if (!activeTutorial) return
    const curSteps = (activeTutorial.steps || [])
      .filter((_, i) => i !== stepIdx)
      .map((s, idx) => ({ ...s, step: idx + 1 }))
    handleUpdateActiveTutorial('steps', curSteps)
  }

  const handleMoveTutorialStep = (stepIdx: number, direction: 'up' | 'down') => {
    if (!activeTutorial) return
    const curSteps = [...(activeTutorial.steps || [])]
    const targetIdx = direction === 'up' ? stepIdx - 1 : stepIdx + 1
    if (targetIdx < 0 || targetIdx >= curSteps.length) return
    const temp = curSteps[stepIdx]
    curSteps[stepIdx] = curSteps[targetIdx]
    curSteps[targetIdx] = temp
    const reindexed = curSteps.map((s, idx) => ({ ...s, step: idx + 1 }))
    handleUpdateActiveTutorial('steps', reindexed)
  }

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="bg-card border-2 rounded-3xl p-5 sm:p-6 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-[#58CC02]/15 text-[#58CC02] border-2 border-[#58CC02]/30 flex items-center justify-center shrink-0">
            <Globe className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-black text-foreground">Site & Login</h2>
              {hasChanges && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-500/15 text-amber-600 border border-amber-500/30 animate-pulse">
                  Alterações não salvas
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground font-semibold mt-0.5">
              Edite textos, botões e visibilidade de seções com preview fiel em tempo real.
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
            <span>
              Restaurar{' '}
              {selectedPage === 'landing'
                ? 'Landing'
                : selectedPage === 'login'
                  ? 'Login'
                  : selectedPage === 'system'
                    ? 'Ada'
                    : selectedPage === 'system_pro'
                      ? 'Ada Pro'
                      : 'Tutoriais'}
            </span>
          </Button>

          <Button
            type="button"
            onClick={handleSaveAll}
            disabled={saving || (!hasChanges && !loading)}
            className="rounded-2xl bg-[#58CC02] hover:bg-[#58CC02]/90 border-b-4 border-[#46A302] text-white font-black text-xs h-10 px-5 flex items-center gap-1.5 flex-1 md:flex-none active:translate-y-0.5 active:border-b-0"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Salvando...' : 'Salvar alterações'}</span>
          </Button>
        </div>
      </div>

      {/* Page Selector Tabs (Duolingo Style: Landing, Login, Sistema Ada, Sistema Ada Pro) */}
      <div className="overflow-x-auto pb-1 max-w-full">
        <div className="flex items-center gap-2 bg-muted/50 p-1.5 rounded-2xl border-2 w-max min-w-full sm:min-w-0">
          <button
            type="button"
            onClick={() => setSelectedPage('landing')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-black text-xs transition-all shrink-0 ${
              selectedPage === 'landing'
                ? 'bg-[#58CC02] text-white shadow-md border-b-2 border-[#46A302]'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Globe className="w-4 h-4" />
            <span>Landing Page (/)</span>
          </button>

          <button
            type="button"
            onClick={() => setSelectedPage('login')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-black text-xs transition-all shrink-0 ${
              selectedPage === 'login'
                ? 'bg-[#1CB0F6] text-white shadow-md border-b-2 border-[#1899D6]'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <LogIn className="w-4 h-4" />
            <span>Login (/login)</span>
          </button>

          <button
            type="button"
            onClick={() => setSelectedPage('system')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-black text-xs transition-all shrink-0 ${
              selectedPage === 'system'
                ? 'bg-[#CE82FF] text-white shadow-md border-b-2 border-[#A653EB]'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Sliders className="w-4 h-4 text-purple-200" />
            <span>Sistema Ada</span>
          </button>

          <button
            type="button"
            onClick={() => setSelectedPage('system_pro')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-black text-xs transition-all shrink-0 ${
              selectedPage === 'system_pro'
                ? 'bg-[#FFC800] text-neutral-900 shadow-md border-b-2 border-[#CCA000]'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <StethoscopeIcon size={16} className="text-neutral-800" />
            <span>Sistema Ada Pro</span>
          </button>

          <button
            type="button"
            onClick={() => setSelectedPage('tutorials')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-black text-xs transition-all shrink-0 ${
              selectedPage === 'tutorials'
                ? 'bg-[#1CB0F6] text-white shadow-md border-b-2 border-[#1899D6]'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <GraduationCap className="w-4 h-4 text-white" />
            <span>Tutoriais</span>
          </button>
        </div>
      </div>

      {/* 2-Column Layout: Left Form, Right Preview Sticky */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Form Column (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {selectedPage === 'landing' ? (
            <>
              {/* Seção: Visibilidade das Seções */}
              <Card className="rounded-3xl border-2 p-5 sm:p-6 bg-card space-y-4">
                <div className="flex items-center justify-between border-b pb-3">
                  <div className="flex items-center gap-2">
                    <Sliders className="w-4 h-4 text-[#1CB0F6]" />
                    <h3 className="font-black text-base text-foreground">
                      Visibilidade das Seções (Landing)
                    </h3>
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
                      <p className="text-[11px] text-muted-foreground">Passos 1, 2, 3</p>
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
                      <p className="text-[11px] text-muted-foreground">Chamada antes do rodapé</p>
                    </div>
                    <Switch
                      checked={flags.final_cta}
                      onCheckedChange={(checked) => toggleContentFlag('final_cta', checked)}
                      className="data-[state=checked]:bg-[#58CC02]"
                    />
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-2xl bg-muted/40 border sm:col-span-2">
                    <div>
                      <Label className="font-bold text-xs">Rodapé do Site</Label>
                      <p className="text-[11px] text-muted-foreground">
                        Mensagem e dados de copyright
                      </p>
                    </div>
                    <Switch
                      checked={flags.footer}
                      onCheckedChange={(checked) => toggleContentFlag('footer', checked)}
                      className="data-[state=checked]:bg-[#58CC02]"
                    />
                  </div>
                </div>
              </Card>

              {/* Seção: Hero */}
              <Card className="rounded-3xl border-2 p-5 sm:p-6 bg-card space-y-4">
                <h3 className="font-black text-base text-foreground border-b pb-3 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#58CC02]" />
                  Hero da Landing Page
                </h3>

                <div className="space-y-3">
                  <div>
                    <Label className="text-xs font-bold text-muted-foreground">
                      Nome da Aplicação
                    </Label>
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
                    <Label className="text-xs font-bold text-muted-foreground">
                      Subtítulo do Hero
                    </Label>
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
                        Texto do Botão Primário (Entrar)
                      </Label>
                      <Input
                        value={formData.cta_primary_label}
                        onChange={(e) => handleInputChange('cta_primary_label', e.target.value)}
                        className="rounded-2xl font-semibold border-2 mt-1"
                      />
                    </div>
                    <div>
                      <Label className="text-xs font-bold text-muted-foreground">
                        Texto do Botão Secundário (Criar conta)
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

              {/* Seção: Cards de Funcionalidades */}
              <Card className="rounded-3xl border-2 p-5 sm:p-6 bg-card space-y-4">
                <div className="flex items-center justify-between border-b pb-3">
                  <div>
                    <h3 className="font-black text-base text-foreground flex items-center gap-2">
                      <CheckSquare className="w-4 h-4 text-[#58CC02]" />
                      Cards de Funcionalidades ({formData.features.length}/8)
                    </h3>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      Adicione, reordene e personalize ícones e cores do Design System.
                    </p>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    disabled={formData.features.length >= 8}
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
                      className="p-4 rounded-2xl border-2 bg-muted/20 space-y-3 relative"
                    >
                      <div className="flex items-center justify-between border-b pb-2">
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded-lg bg-card border font-black text-xs flex items-center justify-center">
                            #{idx + 1}
                          </span>
                          <span className="text-xs font-black text-foreground truncate max-w-[200px]">
                            {feat.title || 'Sem título'}
                          </span>
                        </div>

                        <div className="flex items-center gap-1">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            disabled={idx === 0}
                            onClick={() => handleMoveFeature(idx, 'up')}
                            className="h-7 w-7 rounded-lg text-muted-foreground hover:text-foreground"
                          >
                            <ArrowUp className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            disabled={idx === formData.features.length - 1}
                            onClick={() => handleMoveFeature(idx, 'down')}
                            className="h-7 w-7 rounded-lg text-muted-foreground hover:text-foreground"
                          >
                            <ArrowDown className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => handleRemoveFeature(idx)}
                            className="h-7 w-7 text-rose-500 hover:bg-rose-500/10 rounded-lg"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div className="sm:col-span-2">
                          <Label className="text-[11px] font-bold text-muted-foreground">
                            Título
                          </Label>
                          <Input
                            value={feat.title}
                            onChange={(e) => handleFeatureChange(idx, 'title', e.target.value)}
                            className="rounded-xl font-semibold border-2 text-xs h-9 mt-0.5"
                          />
                        </div>

                        <div>
                          <Label className="text-[11px] font-bold text-muted-foreground">
                            Ícone
                          </Label>
                          <select
                            value={feat.icon}
                            onChange={(e) => handleFeatureChange(idx, 'icon', e.target.value)}
                            className="w-full rounded-xl font-semibold border-2 bg-background text-xs h-9 mt-0.5 px-2"
                          >
                            {AVAILABLE_ICONS.map((ic) => (
                              <option key={ic.id} value={ic.id}>
                                {ic.label}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      {/* Color preset chips */}
                      <div className="space-y-1">
                        <Label className="text-[11px] font-bold text-muted-foreground">
                          Cor de Destaque
                        </Label>
                        <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                          {COLOR_PRESETS.map((cp) => (
                            <button
                              key={cp.value}
                              type="button"
                              onClick={() => handleFeatureChange(idx, 'color', cp.value)}
                              className={`h-6 px-2 rounded-lg text-[10px] font-black flex items-center gap-1.5 border transition-all ${
                                feat.color === cp.value
                                  ? 'ring-2 ring-primary border-transparent'
                                  : 'opacity-70 hover:opacity-100'
                              }`}
                              style={{ backgroundColor: `${cp.value}20`, color: cp.value }}
                            >
                              <span
                                className="w-2.5 h-2.5 rounded-full"
                                style={{ backgroundColor: cp.value }}
                              />
                              <span>{cp.label}</span>
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <Label className="text-[11px] font-bold text-muted-foreground">
                          Descrição
                        </Label>
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

              {/* Seção: Como Funciona */}
              <Card className="rounded-3xl border-2 p-5 sm:p-6 bg-card space-y-4">
                <div className="flex items-center justify-between border-b pb-3">
                  <div>
                    <h3 className="font-black text-base text-foreground flex items-center gap-2">
                      <Flame className="w-4 h-4 text-[#FFC800]" />
                      Passos de "Como Funciona" ({formData.steps.length})
                    </h3>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      Adicione, reordene ou edite as etapas didáticas do produto.
                    </p>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleAddStep}
                    className="rounded-2xl bg-[#FFC800] hover:bg-[#FFC800]/90 border-b-2 border-[#CCA000] text-neutral-900 font-bold text-xs h-8 px-3 flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Adicionar Passo</span>
                  </Button>
                </div>

                <div className="space-y-3">
                  {formData.steps.map((st, idx) => (
                    <div key={idx} className="p-3 rounded-2xl border-2 bg-muted/20 space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 flex-1">
                          <span className="w-7 h-7 rounded-xl bg-[#58CC02] text-white flex items-center justify-center font-black text-xs shrink-0">
                            {st.step || idx + 1}
                          </span>
                          <Input
                            value={st.title}
                            onChange={(e) => handleStepChange(idx, 'title', e.target.value)}
                            placeholder="Título da etapa"
                            className="rounded-xl font-bold border-2 text-xs h-8 flex-1"
                          />
                        </div>

                        <div className="flex items-center gap-1">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            disabled={idx === 0}
                            onClick={() => handleMoveStep(idx, 'up')}
                            className="h-7 w-7 rounded-lg text-muted-foreground hover:text-foreground"
                          >
                            <ArrowUp className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            disabled={idx === formData.steps.length - 1}
                            onClick={() => handleMoveStep(idx, 'down')}
                            className="h-7 w-7 rounded-lg text-muted-foreground hover:text-foreground"
                          >
                            <ArrowDown className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => handleRemoveStep(idx)}
                            className="h-7 w-7 text-rose-500 hover:bg-rose-500/10 rounded-lg"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </div>

                      <Textarea
                        value={st.description}
                        onChange={(e) => handleStepChange(idx, 'description', e.target.value)}
                        rows={2}
                        placeholder="Descrição da etapa"
                        className="rounded-xl font-semibold border-2 text-xs resize-none"
                      />
                    </div>
                  ))}
                </div>
              </Card>

              {/* Seção: CTA Final e Rodapé */}
              <Card className="rounded-3xl border-2 p-5 sm:p-6 bg-card space-y-4">
                <h3 className="font-black text-base text-foreground border-b pb-3">
                  CTA Final e Rodapé
                </h3>

                <div className="space-y-3">
                  <div>
                    <Label className="text-xs font-bold text-muted-foreground">
                      Título do CTA Final
                    </Label>
                    <Input
                      value={formData.final_cta_title || ''}
                      onChange={(e) => handleInputChange('final_cta_title', e.target.value)}
                      placeholder="Pronto para elevar seu ritmo diário?"
                      className="rounded-2xl font-semibold border-2 mt-1"
                    />
                  </div>

                  <div>
                    <Label className="text-xs font-bold text-muted-foreground">
                      Subtítulo do CTA Final
                    </Label>
                    <Textarea
                      value={formData.final_cta_subtitle || ''}
                      onChange={(e) => handleInputChange('final_cta_subtitle', e.target.value)}
                      rows={2}
                      className="rounded-2xl font-semibold border-2 mt-1 resize-none"
                    />
                  </div>

                  <div>
                    <Label className="text-xs font-bold text-muted-foreground">
                      Frase do Rodapé
                    </Label>
                    <Input
                      value={formData.footer_message}
                      onChange={(e) => handleInputChange('footer_message', e.target.value)}
                      className="rounded-2xl font-semibold border-2 mt-1"
                    />
                  </div>

                  <div>
                    <Label className="text-xs font-bold text-muted-foreground">
                      Mensagem de Copyright
                    </Label>
                    <Input
                      value={formData.copyright_text || ''}
                      onChange={(e) => handleInputChange('copyright_text', e.target.value)}
                      placeholder="Todos os direitos reservados."
                      className="rounded-2xl font-semibold border-2 mt-1"
                    />
                  </div>
                </div>
              </Card>
            </>
          ) : selectedPage === 'login' ? (
            <>
              {/* Editor da Página de Login */}
              <Card className="rounded-3xl border-2 p-5 sm:p-6 bg-card space-y-4">
                <div className="flex items-center justify-between border-b pb-3">
                  <div className="flex items-center gap-2">
                    <LogIn className="w-4 h-4 text-[#1CB0F6]" />
                    <h3 className="font-black text-base text-foreground">
                      Textos e Configurações de /login
                    </h3>
                  </div>
                  <Badge variant="outline" className="font-bold text-[10px]">
                    /login
                  </Badge>
                </div>

                {/* Toggle Cadastro Público */}
                <div className="flex items-center justify-between p-4 rounded-2xl bg-[#58CC02]/10 border-2 border-[#58CC02]/30">
                  <div>
                    <Label className="font-black text-sm text-foreground flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-[#58CC02]" />
                      Cadastro Público (public_signup)
                    </Label>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Quando ativado, exibe a opção de criar nova conta na tela de login e o botão
                      secundário na landing page.
                    </p>
                  </div>
                  <Switch
                    checked={flags.public_signup}
                    onCheckedChange={(checked) => toggleContentFlag('public_signup', checked)}
                    className="data-[state=checked]:bg-[#58CC02]"
                  />
                </div>

                <div className="space-y-3 pt-2">
                  <div>
                    <Label className="text-xs font-bold text-muted-foreground">
                      Título da Tela de Login
                    </Label>
                    <Input
                      value={formData.login_title}
                      onChange={(e) => handleInputChange('login_title', e.target.value)}
                      className="rounded-2xl font-semibold border-2 mt-1"
                    />
                  </div>

                  <div>
                    <Label className="text-xs font-bold text-muted-foreground">
                      Subtítulo da Tela de Login
                    </Label>
                    <Textarea
                      value={formData.login_subtitle}
                      onChange={(e) => handleInputChange('login_subtitle', e.target.value)}
                      rows={2}
                      className="rounded-2xl font-semibold border-2 mt-1 resize-none"
                    />
                  </div>

                  <div>
                    <Label className="text-xs font-bold text-muted-foreground">
                      Texto do Botão Principal de Login
                    </Label>
                    <Input
                      value={formData.login_button_label || 'Entrar'}
                      onChange={(e) => handleInputChange('login_button_label', e.target.value)}
                      className="rounded-2xl font-semibold border-2 mt-1"
                    />
                  </div>

                  <div>
                    <Label className="text-xs font-bold text-muted-foreground">
                      Texto de Suporte / Rodapé do Login
                    </Label>
                    <Textarea
                      value={formData.login_footer_text || ''}
                      onChange={(e) => handleInputChange('login_footer_text', e.target.value)}
                      placeholder="Dúvidas ou suporte? Entre em contato com o suporte da sua organização."
                      rows={2}
                      className="rounded-2xl font-semibold border-2 mt-1 resize-none"
                    />
                  </div>
                </div>
              </Card>
            </>
          ) : selectedPage === 'system' ? (
            <>
              {/* Editor Sistema Ada (Usuário) */}
              <Card className="rounded-3xl border-2 p-5 sm:p-6 bg-card space-y-4">
                <div className="flex items-center justify-between border-b pb-3">
                  <div className="flex items-center gap-2">
                    <Sliders className="w-4 h-4 text-[#CE82FF]" />
                    <h3 className="font-black text-base text-foreground">
                      Nome do Sistema Ada (brand_name)
                    </h3>
                  </div>
                  <Badge className="bg-[#CE82FF] text-white font-bold text-[10px]">
                    Whitelabel
                  </Badge>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-bold text-muted-foreground">
                    Nome exibido em todo o app (Sidebar, Mobile, Título do navegador, etc.)
                  </Label>
                  <Input
                    maxLength={30}
                    value={formData.brand_name || ''}
                    placeholder="VibeCoding Tarefas"
                    onChange={(e) => handleInputChange('brand_name', e.target.value)}
                    className="rounded-2xl font-black text-sm border-2 h-11"
                  />
                  <p className="text-[11px] text-muted-foreground font-semibold">
                    Máximo de 30 caracteres. Não pode ficar vazio.
                  </p>
                </div>
              </Card>

              {/* Itens do Menu do Usuário */}
              <Card className="rounded-3xl border-2 p-5 sm:p-6 bg-card space-y-4">
                <div className="border-b pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <LayoutDashboard className="w-4 h-4 text-[#58CC02]" />
                      <h3 className="font-black text-base text-foreground">
                        Itens do Menu do Usuário
                      </h3>
                    </div>
                    <Badge variant="outline" className="text-[10px] font-bold">
                      {
                        (formData.nav_customization || DEFAULT_USER_NAV_ITEMS).filter(
                          (i) => i.visible,
                        ).length
                      }{' '}
                      visíveis
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Edite rótulos, escolha ícones, ordene e oculte itens. Rotas permanecem ativas
                    pela URL.
                  </p>
                </div>

                <div className="space-y-3">
                  {(formData.nav_customization || DEFAULT_USER_NAV_ITEMS).map((item, idx) => {
                    const isFirst = idx === 0
                    const isLast =
                      idx === (formData.nav_customization || DEFAULT_USER_NAV_ITEMS).length - 1
                    const IconComp = ICON_MAP[item.icon] || LayoutDashboard

                    return (
                      <div
                        key={item.key}
                        className={`p-3.5 rounded-2xl border-2 transition-all space-y-3 ${
                          item.visible
                            ? 'bg-muted/20 border-border'
                            : 'bg-muted/5 border-dashed opacity-60'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-8 h-8 rounded-xl bg-card border flex items-center justify-center shrink-0 text-primary">
                              <IconComp className="w-4 h-4" />
                            </div>
                            <div className="min-w-0">
                              <span className="text-[10px] uppercase font-black tracking-wider text-muted-foreground block">
                                Chave: {item.key}
                              </span>
                              <span className="font-black text-xs text-foreground truncate block">
                                {item.label || item.key}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-1 shrink-0">
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              disabled={isFirst}
                              onClick={() => handleMoveUserNav(idx, 'up')}
                              className="h-7 w-7 rounded-lg text-muted-foreground hover:text-foreground"
                            >
                              <ArrowUp className="w-3.5 h-3.5" />
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              disabled={isLast}
                              onClick={() => handleMoveUserNav(idx, 'down')}
                              className="h-7 w-7 rounded-lg text-muted-foreground hover:text-foreground"
                            >
                              <ArrowDown className="w-3.5 h-3.5" />
                            </Button>

                            <button
                              type="button"
                              onClick={() => handleToggleUserNavVisible(idx, item.visible)}
                              className={`h-7 px-2 rounded-xl text-[10px] font-black flex items-center gap-1 border transition-all ${
                                item.visible
                                  ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30'
                                  : 'bg-muted text-muted-foreground border-border'
                              }`}
                              title={item.visible ? 'Item visível no menu' : 'Item oculto no menu'}
                            >
                              {item.visible ? (
                                <>
                                  <Eye className="w-3 h-3" />
                                  <span>Visível</span>
                                </>
                              ) : (
                                <>
                                  <EyeOff className="w-3 h-3" />
                                  <span>Oculto</span>
                                </>
                              )}
                            </button>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 border-t">
                          <div>
                            <Label className="text-[10px] font-bold text-muted-foreground">
                              Rótulo do Menu (máx. 20)
                            </Label>
                            <Input
                              maxLength={20}
                              value={item.label}
                              placeholder="Nome do item"
                              onChange={(e) => handleUserNavChange(idx, 'label', e.target.value)}
                              className="rounded-xl font-bold border-2 text-xs h-9 mt-0.5"
                            />
                          </div>

                          <div>
                            <Label className="text-[10px] font-bold text-muted-foreground">
                              Ícone
                            </Label>
                            <select
                              value={item.icon}
                              onChange={(e) => handleUserNavChange(idx, 'icon', e.target.value)}
                              className="w-full rounded-xl font-semibold border-2 bg-background text-xs h-9 mt-0.5 px-2"
                            >
                              {AVAILABLE_ICONS.map((ic) => (
                                <option key={ic.id} value={ic.id}>
                                  {ic.label}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>

                {/* Alerta de segurança sobre itens fixos */}
                <div className="p-3 rounded-2xl bg-muted/40 border text-[11px] text-muted-foreground font-semibold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-500 shrink-0" />
                  <span>
                    <strong>Itens Fixos:</strong> Configurações e Masterização permanecem fixos no
                    rodapé da navegação e não são removíveis.
                  </span>
                </div>
              </Card>
            </>
          ) : selectedPage === 'tutorials' ? (
            <>
              {/* Seção Tutoriais: Editor Completo */}
              <Card className="rounded-3xl border-2 p-5 sm:p-6 bg-card space-y-5">
                <div className="flex items-center justify-between border-b pb-3">
                  <div className="flex items-center gap-2">
                    <GraduationCap className="w-5 h-5 text-[#1CB0F6]" />
                    <h3 className="font-black text-base text-foreground">
                      Gerenciamento de Tutoriais & Tours
                    </h3>
                  </div>
                  <Button
                    type="button"
                    onClick={handleAddTutorial}
                    className="rounded-2xl bg-[#58CC02] hover:bg-[#58CC02]/90 border-b-4 border-[#46A302] text-white font-black text-xs h-9 px-3.5 flex items-center gap-1.5 active:translate-y-0.5 active:border-b-0"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Novo tutorial</span>
                  </Button>
                </div>

                <p className="text-xs text-muted-foreground font-semibold">
                  Crie tours guiados, popups ou dicas contextuais para qualquer tela do usuário ou
                  do Painel Pro.
                </p>

                {/* Lista de Tutoriais Cadastrados */}
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    Tutoriais Criados ({currentTutorials.length})
                  </Label>

                  {currentTutorials.length === 0 ? (
                    <div className="p-8 text-center border-2 border-dashed rounded-3xl bg-muted/20 space-y-3">
                      <GraduationCap className="w-10 h-10 text-muted-foreground mx-auto opacity-40" />
                      <div>
                        <p className="font-black text-sm text-foreground">
                          Nenhum tutorial criado ainda
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          O sistema inicia limpo. Clique em "Novo tutorial" para criar o primeiro
                          tour.
                        </p>
                      </div>
                      <Button
                        type="button"
                        onClick={handleAddTutorial}
                        className="rounded-2xl bg-[#1CB0F6] hover:bg-[#1CB0F6]/90 border-b-4 border-[#1899D6] text-white font-black text-xs h-9 px-4"
                      >
                        <Plus className="w-3.5 h-3.5 mr-1" /> Criar meu primeiro tutorial
                      </Button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-2.5">
                      {currentTutorials.map((tut) => {
                        const isSelected = tut.id === editingTutorialId
                        return (
                          <div
                            key={tut.id}
                            onClick={() => setEditingTutorialId(tut.id)}
                            className={`p-3.5 rounded-2xl border-2 cursor-pointer transition-all flex items-center justify-between gap-3 ${
                              isSelected
                                ? 'border-[#1CB0F6] bg-[#1CB0F6]/10 shadow-sm'
                                : 'bg-card border-border hover:bg-muted/30'
                            }`}
                          >
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-black text-xs text-foreground truncate">
                                  {tut.title || 'Tutorial sem título'}
                                </span>
                                <Badge
                                  variant="outline"
                                  className="text-[9px] font-black uppercase px-1.5 py-0"
                                >
                                  {tut.audience === 'professional' ? 'Painel Pro' : 'Usuário'}
                                </Badge>
                                <Badge
                                  className={`text-[9px] font-black uppercase px-1.5 py-0 ${
                                    tut.type === 'tour'
                                      ? 'bg-[#58CC02] text-white'
                                      : tut.type === 'popup'
                                        ? 'bg-[#1CB0F6] text-white'
                                        : 'bg-[#FFC800] text-neutral-900'
                                  }`}
                                >
                                  {tut.type}
                                </Badge>
                                <Badge
                                  variant="outline"
                                  className="text-[9px] font-bold text-muted-foreground"
                                >
                                  {tut.target_page}
                                </Badge>
                              </div>
                              <p className="text-[11px] text-muted-foreground truncate mt-0.5">
                                {tut.content ||
                                  (tut.steps?.length
                                    ? `${tut.steps.length} passos`
                                    : 'Sem conteúdo')}
                              </p>
                            </div>

                            <div
                              className="flex items-center gap-2 shrink-0"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <Switch
                                checked={tut.active}
                                onCheckedChange={() =>
                                  handleToggleTutorialActive(tut.id, tut.active)
                                }
                                className="data-[state=checked]:bg-[#58CC02]"
                              />
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDeleteTutorial(tut.id)}
                                className="h-8 w-8 text-muted-foreground hover:text-destructive rounded-xl"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>

                {/* Formulário de Edição do Tutorial Ativo */}
                {activeTutorial && (
                  <div className="pt-4 border-t space-y-4 animate-in fade-in">
                    {/* Breadcrumb de Contexto Claro */}
                    <div className="p-3 rounded-2xl bg-muted/60 border text-xs font-black text-foreground flex items-center gap-1.5 flex-wrap">
                      <span className="text-[#1CB0F6]">
                        {activeTutorial.audience === 'professional'
                          ? 'Painel Pro'
                          : 'Sistema do usuário'}
                      </span>
                      <span className="text-muted-foreground">›</span>
                      <span className="capitalize">{activeTutorial.target_page}</span>
                      <span className="text-muted-foreground">›</span>
                      <span className="text-foreground truncate">{activeTutorial.title}</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <Label className="text-xs font-bold text-muted-foreground">Público</Label>
                        <select
                          value={activeTutorial.audience}
                          onChange={(e) => handleUpdateActiveTutorial('audience', e.target.value)}
                          className="w-full rounded-2xl font-bold border-2 bg-background text-xs h-10 mt-1 px-3"
                        >
                          <option value="user">Sistema do usuário</option>
                          <option value="professional">Painel Pro (/professional)</option>
                        </select>
                      </div>

                      <div>
                        <Label className="text-xs font-bold text-muted-foreground">
                          Página-alvo
                        </Label>
                        <select
                          value={activeTutorial.target_page}
                          onChange={(e) =>
                            handleUpdateActiveTutorial('target_page', e.target.value)
                          }
                          className="w-full rounded-2xl font-bold border-2 bg-background text-xs h-10 mt-1 px-3"
                        >
                          {activeTutorial.audience === 'professional' ? (
                            <>
                              <option value="overview">Visão Geral Pro</option>
                              <option value="patients">Pacientes</option>
                              <option value="appointments">Consultas / Agenda</option>
                              <option value="notes">Anotações Clínicas</option>
                              <option value="groups_pro">Grupos Pro</option>
                            </>
                          ) : (
                            <>
                              <option value="dashboard">Dashboard</option>
                              <option value="tasks">Performance (Tarefas e Hábitos)</option>
                              <option value="health">Saúde & Nutrição</option>
                              <option value="finance">Finanças</option>
                              <option value="social">Social</option>
                              <option value="studies">Estudos</option>
                              <option value="settings">Configurações</option>
                            </>
                          )}
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <Label className="text-xs font-bold text-muted-foreground">
                          Tipo de Tutorial
                        </Label>
                        <select
                          value={activeTutorial.type}
                          onChange={(e) => handleUpdateActiveTutorial('type', e.target.value)}
                          className="w-full rounded-2xl font-bold border-2 bg-background text-xs h-10 mt-1 px-3"
                        >
                          <option value="tour">Tour por Passos (Passo a passo com destaque)</option>
                          <option value="popup">Popup Informativo (Modal com botão Entendi)</option>
                          <option value="tip">Dica no Canto (Card discreto dismissível)</option>
                        </select>
                      </div>

                      <div>
                        <Label className="text-xs font-bold text-muted-foreground">
                          Gatilho de Exibição
                        </Label>
                        <select
                          value={activeTutorial.trigger}
                          onChange={(e) => handleUpdateActiveTutorial('trigger', e.target.value)}
                          className="w-full rounded-2xl font-bold border-2 bg-background text-xs h-10 mt-1 px-3"
                        >
                          <option value="first_access">Primeiro acesso (1x, dismissível)</option>
                          <option value="always">Sempre que abrir a página</option>
                          <option value="help_button">Botão de ajuda (ícone ? no header)</option>
                        </select>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <Label className="text-xs font-bold text-muted-foreground">
                        Título do Tutorial
                      </Label>
                      <Input
                        value={activeTutorial.title}
                        onChange={(e) => handleUpdateActiveTutorial('title', e.target.value)}
                        placeholder="Ex: Tour de boas-vindas à Saúde"
                        className="rounded-2xl font-black text-sm border-2 h-10"
                      />
                    </div>

                    <div className="space-y-1">
                      <Label className="text-xs font-bold text-muted-foreground">
                        Texto Curto / Resumo
                      </Label>
                      <Textarea
                        rows={2}
                        value={activeTutorial.content}
                        onChange={(e) => handleUpdateActiveTutorial('content', e.target.value)}
                        placeholder="Mensagem explicativa para o usuário..."
                        className="rounded-2xl font-semibold text-xs border-2"
                      />
                    </div>

                    {/* Editor de Passos (apenas se tipo === 'tour') */}
                    {activeTutorial.type === 'tour' && (
                      <div className="pt-3 border-t space-y-3">
                        <div className="flex items-center justify-between">
                          <Label className="text-xs font-black uppercase text-foreground tracking-wider">
                            Passos do Tour ({activeTutorial.steps?.length || 0})
                          </Label>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={handleAddStepToTutorial}
                            className="rounded-xl font-bold text-xs h-8 px-3"
                          >
                            <Plus className="w-3 h-3 mr-1" /> Adicionar passo
                          </Button>
                        </div>

                        <div className="space-y-2.5">
                          {(activeTutorial.steps || []).map((step, sIdx) => {
                            const isFirst = sIdx === 0
                            const isLast = sIdx === (activeTutorial.steps || []).length - 1
                            return (
                              <div
                                key={sIdx}
                                className="p-3.5 rounded-2xl border-2 bg-muted/20 space-y-2.5"
                              >
                                <div className="flex items-center justify-between gap-2">
                                  <div className="flex items-center gap-2">
                                    <span className="w-6 h-6 rounded-lg bg-[#58CC02] text-white font-black text-xs flex items-center justify-center shrink-0">
                                      {step.step || sIdx + 1}
                                    </span>
                                    <span className="font-black text-xs text-foreground">
                                      {step.title || `Passo ${sIdx + 1}`}
                                    </span>
                                  </div>

                                  <div className="flex items-center gap-1">
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="icon"
                                      disabled={isFirst}
                                      onClick={() => handleMoveTutorialStep(sIdx, 'up')}
                                      className="h-7 w-7 rounded-lg"
                                    >
                                      <ArrowUp className="w-3 h-3" />
                                    </Button>
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="icon"
                                      disabled={isLast}
                                      onClick={() => handleMoveTutorialStep(sIdx, 'down')}
                                      className="h-7 w-7 rounded-lg"
                                    >
                                      <ArrowDown className="w-3 h-3" />
                                    </Button>
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => handleRemoveStepFromTutorial(sIdx)}
                                      className="h-7 w-7 rounded-lg text-muted-foreground hover:text-destructive"
                                    >
                                      <Trash2 className="w-3 h-3" />
                                    </Button>
                                  </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                  <div>
                                    <Label className="text-[10px] font-bold text-muted-foreground">
                                      Título do passo
                                    </Label>
                                    <Input
                                      value={step.title || ''}
                                      placeholder="Título"
                                      onChange={(e) =>
                                        handleUpdateStep(sIdx, 'title', e.target.value)
                                      }
                                      className="rounded-xl text-xs font-bold border-2 h-8 mt-0.5"
                                    />
                                  </div>
                                  <div>
                                    <Label className="text-[10px] font-bold text-muted-foreground">
                                      Elemento alvo / destaque (opcional)
                                    </Label>
                                    <Input
                                      value={step.target || ''}
                                      placeholder="Ex: Botão de Nova Tarefa"
                                      onChange={(e) =>
                                        handleUpdateStep(sIdx, 'target', e.target.value)
                                      }
                                      className="rounded-xl text-xs font-semibold border-2 h-8 mt-0.5"
                                    />
                                  </div>
                                </div>

                                <div>
                                  <Label className="text-[10px] font-bold text-muted-foreground">
                                    Texto explicativo deste passo
                                  </Label>
                                  <Textarea
                                    rows={2}
                                    value={step.content}
                                    placeholder="O que o usuário deve saber sobre esta seção..."
                                    onChange={(e) =>
                                      handleUpdateStep(sIdx, 'content', e.target.value)
                                    }
                                    className="rounded-xl text-xs font-semibold border-2 mt-0.5"
                                  />
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </Card>
            </>
          ) : (
            <>
              {/* Editor Sistema Ada Pro (Painel Profissional) */}
              <Card className="rounded-3xl border-2 p-5 sm:p-6 bg-card space-y-4">
                <div className="border-b pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <LayoutDashboard className="w-4 h-4 text-[#1CB0F6]" />
                      <h3 className="font-black text-base text-foreground">
                        Itens do Menu Pro (/professional)
                      </h3>
                    </div>
                    <Badge variant="outline" className="text-[10px] font-bold">
                      {
                        (formData.pro_nav_customization || DEFAULT_PRO_NAV_ITEMS).filter(
                          (i) => i.visible,
                        ).length
                      }{' '}
                      visíveis
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Personalize os botões de navegação interna do consultório médico/clínico. Mínimo
                    1 item visível.
                  </p>
                </div>

                <div className="space-y-3">
                  {(formData.pro_nav_customization || DEFAULT_PRO_NAV_ITEMS).map((item, idx) => {
                    const isFirst = idx === 0
                    const isLast =
                      idx === (formData.pro_nav_customization || DEFAULT_PRO_NAV_ITEMS).length - 1
                    const IconComp = ICON_MAP[item.icon] || StethoscopeIcon

                    return (
                      <div
                        key={item.key}
                        className={`p-3.5 rounded-2xl border-2 transition-all space-y-3 ${
                          item.visible
                            ? 'bg-muted/20 border-border'
                            : 'bg-muted/5 border-dashed opacity-60'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-8 h-8 rounded-xl bg-card border flex items-center justify-center shrink-0 text-[#1CB0F6]">
                              <IconComp className="w-4 h-4" />
                            </div>
                            <div className="min-w-0">
                              <span className="text-[10px] uppercase font-black tracking-wider text-muted-foreground block">
                                Seção: {item.key}
                              </span>
                              <span className="font-black text-xs text-foreground truncate block">
                                {item.label || item.key}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-1 shrink-0">
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              disabled={isFirst}
                              onClick={() => handleMoveProNav(idx, 'up')}
                              className="h-7 w-7 rounded-lg text-muted-foreground hover:text-foreground"
                            >
                              <ArrowUp className="w-3.5 h-3.5" />
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              disabled={isLast}
                              onClick={() => handleMoveProNav(idx, 'down')}
                              className="h-7 w-7 rounded-lg text-muted-foreground hover:text-foreground"
                            >
                              <ArrowDown className="w-3.5 h-3.5" />
                            </Button>

                            <button
                              type="button"
                              onClick={() => handleToggleProNavVisible(idx, item.visible)}
                              className={`h-7 px-2 rounded-xl text-[10px] font-black flex items-center gap-1 border transition-all ${
                                item.visible
                                  ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30'
                                  : 'bg-muted text-muted-foreground border-border'
                              }`}
                              title={item.visible ? 'Item visível' : 'Item oculto'}
                            >
                              {item.visible ? (
                                <>
                                  <Eye className="w-3 h-3" />
                                  <span>Visível</span>
                                </>
                              ) : (
                                <>
                                  <EyeOff className="w-3 h-3" />
                                  <span>Oculto</span>
                                </>
                              )}
                            </button>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 border-t">
                          <div>
                            <Label className="text-[10px] font-bold text-muted-foreground">
                              Rótulo da Aba (máx. 20)
                            </Label>
                            <Input
                              maxLength={20}
                              value={item.label}
                              placeholder="Nome da aba"
                              onChange={(e) => handleProNavChange(idx, 'label', e.target.value)}
                              className="rounded-xl font-bold border-2 text-xs h-9 mt-0.5"
                            />
                          </div>

                          <div>
                            <Label className="text-[10px] font-bold text-muted-foreground">
                              Ícone
                            </Label>
                            <select
                              value={item.icon}
                              onChange={(e) => handleProNavChange(idx, 'icon', e.target.value)}
                              className="w-full rounded-xl font-semibold border-2 bg-background text-xs h-9 mt-0.5 px-2"
                            >
                              {AVAILABLE_ICONS.map((ic) => (
                                <option key={ic.id} value={ic.id}>
                                  {ic.label}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </Card>
            </>
          )}
        </div>

        {/* Right Sticky Preview Column (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="sticky top-20 space-y-3">
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-[#1CB0F6]" />
                <h3 className="font-black text-xs uppercase tracking-wider text-muted-foreground">
                  Preview (
                  {selectedPage === 'landing'
                    ? 'Landing'
                    : selectedPage === 'login'
                      ? 'Login'
                      : selectedPage === 'system'
                        ? 'Sistema Ada'
                        : selectedPage === 'system_pro'
                          ? 'Sistema Ada Pro'
                          : 'Tutoriais'}
                  )
                </h3>
              </div>
              <Badge className="bg-amber-500 hover:bg-amber-500 text-white font-extrabold text-[10px] px-2 py-0.5 rounded-full border-b-2 border-amber-700">
                Pré-visualização
              </Badge>
            </div>

            {/* Device Mockup Frame */}
            <div className="rounded-[2.5rem] border-4 border-muted-foreground/20 p-3 bg-muted/30 shadow-xl overflow-hidden relative">
              {/* Speaker / camera notch */}
              <div className="w-20 h-4 bg-muted-foreground/30 rounded-full mx-auto mb-3" />

              {/* Screen Body */}
              <div className="bg-background rounded-[2rem] border-2 overflow-hidden shadow-inner max-h-[640px] overflow-y-auto text-left relative scrollbar-none">
                {selectedPage === 'landing' ? (
                  /* Mini Landing Page Preview */
                  <div className="space-y-6 pb-6">
                    {/* Mini Hero */}
                    {flags.hero !== false && (
                      <div className="p-4 pt-6 text-center space-y-3 bg-gradient-to-b from-[#58CC02]/10 to-transparent border-b">
                        <div className="w-10 h-10 rounded-2xl bg-[#58CC02]/15 border-2 border-[#58CC02]/30 flex items-center justify-center mx-auto shadow-sm">
                          <Sparkles className="w-5 h-5 text-[#58CC02]" />
                        </div>
                        <h4 className="text-base font-black text-foreground leading-tight">
                          {formData.hero_title || 'Título do Hero'}
                        </h4>
                        <p className="text-[11px] text-muted-foreground font-semibold leading-relaxed">
                          {formData.hero_subtitle || 'Subtítulo do Hero'}
                        </p>
                        <div className="flex flex-col gap-2 pt-1">
                          <div className="rounded-xl bg-[#58CC02] border-b-2 border-[#46A302] text-white text-xs font-black py-2 shadow-sm text-center">
                            {formData.cta_primary_label || 'Entrar'}
                          </div>
                          {flags.public_signup && (
                            <div className="rounded-xl border-2 text-xs font-bold py-1.5 text-foreground bg-card text-center">
                              {formData.cta_secondary_label || 'Criar conta'}
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Mini Features */}
                    {flags.features_section !== false && (
                      <div className="px-4 space-y-3">
                        <div className="text-center space-y-0.5">
                          <span className="text-[9px] font-black uppercase tracking-wider text-[#1CB0F6]">
                            Funcionalidades
                          </span>
                          <p className="text-xs font-black text-foreground">
                            Tudo em uma plataforma
                          </p>
                        </div>
                        <div className="grid grid-cols-1 gap-2">
                          {formData.features.map((feat) => {
                            const Icon = ICON_MAP[feat.icon] || Sparkles
                            return (
                              <div
                                key={feat.id}
                                className="p-2.5 rounded-xl border-2 bg-card flex items-start gap-2.5 border-b-2 shadow-xs"
                                style={{ borderBottomColor: feat.color }}
                              >
                                <div
                                  className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 border"
                                  style={{
                                    backgroundColor: `${feat.color}15`,
                                    borderColor: `${feat.color}35`,
                                    color: feat.color,
                                  }}
                                >
                                  <Icon className="w-3.5 h-3.5" />
                                </div>
                                <div className="min-w-0 flex-1">
                                  <div className="text-[11px] font-black text-foreground truncate">
                                    {feat.title}
                                  </div>
                                  <div className="text-[9px] text-muted-foreground font-semibold leading-tight line-clamp-2">
                                    {feat.description}
                                  </div>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )}

                    {/* Mini Steps */}
                    {flags.how_it_works !== false && (
                      <div className="px-4 space-y-2 pt-2 border-t">
                        <div className="text-center space-y-0.5">
                          <span className="text-[9px] font-black uppercase tracking-wider text-[#FFC800]">
                            Passo a Passo
                          </span>
                          <p className="text-xs font-black text-foreground">Como funciona</p>
                        </div>
                        <div className="space-y-1.5">
                          {formData.steps.map((st, i) => (
                            <div
                              key={i}
                              className="p-2 rounded-xl border bg-card flex items-start gap-2 text-left"
                            >
                              <span className="w-5 h-5 rounded-md bg-[#58CC02] text-white flex items-center justify-center font-black text-[10px] shrink-0">
                                {st.step || i + 1}
                              </span>
                              <div className="min-w-0 flex-1">
                                <div className="text-[10px] font-black text-foreground">
                                  {st.title}
                                </div>
                                <div className="text-[9px] text-muted-foreground font-semibold line-clamp-1">
                                  {st.description}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Mini Final CTA */}
                    {flags.final_cta !== false && (
                      <div className="px-4 py-4 text-center space-y-2 bg-gradient-to-b from-transparent to-[#58CC02]/10 border-t">
                        <h5 className="text-xs font-black text-foreground">
                          {formData.final_cta_title || 'Pronto para começar?'}
                        </h5>
                        <p className="text-[9px] text-muted-foreground leading-tight line-clamp-2">
                          {formData.final_cta_subtitle ||
                            'Eleve seu ritmo diário com o VibeCoding.'}
                        </p>
                        <div className="rounded-xl bg-[#58CC02] text-white text-[11px] font-black py-2 shadow-sm text-center">
                          {formData.cta_primary_label || 'Entrar'}
                        </div>
                      </div>
                    )}

                    {/* Mini Footer */}
                    {flags.footer !== false && (
                      <div className="px-4 pt-3 pb-2 border-t text-center space-y-1 text-[9px] text-muted-foreground">
                        <p className="font-black text-foreground">{formData.app_name}</p>
                        <p className="leading-tight">{formData.footer_message}</p>
                        <p className="text-[8px] opacity-75">
                          © {new Date().getFullYear()} {formData.app_name}.{' '}
                          {formData.copyright_text || 'Todos os direitos reservados.'}
                        </p>
                      </div>
                    )}
                  </div>
                ) : selectedPage === 'login' ? (
                  /* Mini Login Page Preview */
                  <div className="p-5 py-8 text-center space-y-4">
                    <div className="w-12 h-12 rounded-2xl bg-[#58CC02]/15 border-2 border-[#58CC02]/30 flex items-center justify-center mx-auto shadow-sm">
                      <Sparkles className="w-6 h-6 text-[#58CC02]" />
                    </div>

                    <div className="space-y-1">
                      <h4 className="text-base font-black text-foreground">
                        {formData.login_title || 'Bem-vindo de volta!'}
                      </h4>
                      <p className="text-[11px] text-muted-foreground font-semibold leading-relaxed">
                        {formData.login_subtitle ||
                          'Acesse sua conta para continuar evoluindo suas metas.'}
                      </p>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-muted/40 border-2 space-y-2.5 text-left">
                      <div className="space-y-1">
                        <span className="text-[9px] font-bold text-muted-foreground uppercase">
                          Email
                        </span>
                        <div className="h-8 rounded-xl bg-background border px-2.5 text-[10px] flex items-center text-muted-foreground font-semibold">
                          seu@email.com
                        </div>
                      </div>

                      <div className="space-y-1">
                        <span className="text-[9px] font-bold text-muted-foreground uppercase">
                          Senha
                        </span>
                        <div className="h-8 rounded-xl bg-background border px-2.5 text-[10px] flex items-center text-muted-foreground font-semibold">
                          ••••••••
                        </div>
                      </div>

                      <div className="h-9 rounded-xl bg-[#58CC02] border-b-2 border-[#46A302] text-white font-black text-xs flex items-center justify-center shadow-sm">
                        {formData.login_button_label || 'Entrar'}
                      </div>
                    </div>

                    <div className="text-[10px] text-muted-foreground font-semibold">
                      {flags.public_signup ? (
                        <span>
                          Não tem conta?{' '}
                          <span className="text-[#1CB0F6] font-bold">Criar conta</span>
                        </span>
                      ) : (
                        <span className="text-amber-500 font-bold">
                          Cadastro público desativado pelo Master
                        </span>
                      )}
                    </div>

                    {formData.login_footer_text && (
                      <p className="text-[9px] text-muted-foreground/80 leading-relaxed px-2">
                        {formData.login_footer_text}
                      </p>
                    )}
                  </div>
                ) : selectedPage === 'system' ? (
                  /* Mini Preview do Menu / App do Usuário (Sistema Ada) */
                  <div className="p-4 space-y-4">
                    {/* Header da Sidebar no Preview */}
                    <div className="flex items-center gap-2.5 pb-3 border-b">
                      <div className="w-8 h-8 rounded-xl bg-[#58CC02]/15 border border-[#58CC02]/30 flex items-center justify-center text-[#58CC02] shrink-0">
                        <Sparkles className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="font-black text-sm text-foreground truncate">
                          {formData.brand_name || 'VibeCoding Tarefas'}
                        </div>
                        <div className="text-[9px] text-muted-foreground font-semibold">
                          Menu do Usuário (Sidebar)
                        </div>
                      </div>
                    </div>

                    {/* Itens do Menu Ordenados */}
                    <div className="space-y-1.5">
                      {(formData.nav_customization || DEFAULT_USER_NAV_ITEMS)
                        .filter((item) => item.visible)
                        .map((item, idx) => {
                          const IconComp = ICON_MAP[item.icon] || LayoutDashboard
                          const isPro = item.key === 'professional'

                          return (
                            <div
                              key={item.key}
                              className={`flex items-center gap-2.5 px-3 py-2 rounded-xl border text-xs font-bold ${
                                idx === 0
                                  ? 'bg-primary/20 text-primary border-primary/30'
                                  : isPro
                                    ? 'bg-[#1CB0F6]/10 text-[#1CB0F6] border-[#1CB0F6]/30'
                                    : 'bg-card text-foreground border-border/80'
                              }`}
                            >
                              <IconComp className="w-4 h-4 shrink-0" />
                              <span className="truncate flex-1">
                                {isPro && item.label === 'Painel Pro'
                                  ? formData.pro_brand_name || 'Painel Pro'
                                  : item.label || item.key}
                              </span>
                              {idx === 0 && (
                                <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                              )}
                            </div>
                          )
                        })}

                      {/* Itens de Rodapé Fixos */}
                      <div className="pt-3 border-t mt-3 space-y-1.5 opacity-70">
                        <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-amber-500/10 text-amber-600 border border-amber-500/20 text-[11px] font-bold">
                          <Sliders className="w-3.5 h-3.5" />
                          <span>Masterização (Fixo)</span>
                        </div>
                        <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-muted text-muted-foreground border text-[11px] font-bold">
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>Configurações (Fixo)</span>
                        </div>
                      </div>
                    </div>

                    {/* Representação do Mobile Bottom Nav */}
                    <div className="pt-2 border-t">
                      <span className="text-[9px] font-black uppercase tracking-wider text-muted-foreground block mb-2 text-center">
                        Prévia da Barra Mobile (BottomNav)
                      </span>
                      <div className="flex items-center justify-around bg-card border rounded-2xl p-1.5 py-2">
                        {(formData.nav_customization || DEFAULT_USER_NAV_ITEMS)
                          .filter((i) => i.visible)
                          .slice(0, 5)
                          .map((item) => {
                            const IconComp = ICON_MAP[item.icon] || LayoutDashboard
                            return (
                              <div
                                key={item.key}
                                className="flex flex-col items-center gap-0.5 text-center min-w-0 flex-1"
                              >
                                <IconComp className="w-3.5 h-3.5 text-muted-foreground" />
                                <span className="text-[8px] font-bold text-muted-foreground truncate max-w-[40px]">
                                  {item.label}
                                </span>
                              </div>
                            )
                          })}
                      </div>
                    </div>
                  </div>
                ) : selectedPage === 'system_pro' ? (
                  /* Mini Preview do Painel Pro (Sistema Ada Pro) */
                  <div className="p-4 space-y-4">
                    {/* Header do Painel Pro */}
                    <div className="p-3.5 rounded-2xl bg-gradient-to-r from-[#1CB0F6] to-[#0284c7] text-white space-y-1 shadow-sm">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                          <StethoscopeIcon size={16} className="text-white" />
                        </div>
                        <h5 className="font-black text-xs truncate">
                          {formData.pro_brand_name || 'Painel Pro'}
                        </h5>
                      </div>
                      <p className="text-[9px] text-white/80 font-medium">
                        Consultório Médico & Clínico
                      </p>
                    </div>

                    {/* Chips do Menu Pro Ordenados */}
                    <div className="space-y-1.5">
                      <span className="text-[9px] font-black uppercase tracking-wider text-[#1CB0F6] block">
                        Abas de Navegação Pro
                      </span>
                      <div className="flex flex-col gap-1.5">
                        {(formData.pro_nav_customization || DEFAULT_PRO_NAV_ITEMS)
                          .filter((item) => item.visible)
                          .map((item, idx) => {
                            const IconComp = ICON_MAP[item.icon] || LayoutDashboard
                            const isGroups = item.key === 'groups_pro'

                            return (
                              <div
                                key={item.key}
                                className={`flex items-center gap-2.5 px-3 py-2 rounded-xl border text-xs font-bold ${
                                  idx === 0
                                    ? 'bg-[#1CB0F6] text-white border-[#1CB0F6] shadow-xs'
                                    : isGroups
                                      ? 'bg-[#58CC02]/10 text-[#58CC02] border-[#58CC02]/30'
                                      : 'bg-card text-foreground border-border'
                                }`}
                              >
                                <IconComp className="w-4 h-4 shrink-0" />
                                <span className="truncate flex-1">{item.label || item.key}</span>
                                {isGroups && (
                                  <Badge className="bg-[#CE82FF] text-white text-[8px] font-black uppercase px-1 py-0">
                                    Pro
                                  </Badge>
                                )}
                              </div>
                            )
                          })}
                      </div>
                    </div>

                    {/* Mini Card de Pacientes Pro */}
                    <div className="p-3 rounded-2xl bg-muted/40 border space-y-2">
                      <div className="text-[10px] font-black text-foreground">
                        Exemplo de Conteúdo da Aba
                      </div>
                      <div className="p-2 rounded-xl bg-background border flex items-center gap-2">
                        <div className="w-6 h-6 rounded-lg bg-[#1CB0F6]/20 text-[#1CB0F6] font-black text-[10px] flex items-center justify-center shrink-0">
                          P
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-[10px] font-bold truncate">Paciente Exemplo</div>
                          <div className="text-[8px] text-muted-foreground truncate">
                            Plano Nutricional Ativo
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Mini Preview do Tutorial Selecionado (ou mock geral) */
                  <div className="p-4 space-y-4 relative min-h-[420px] flex flex-col justify-between">
                    {/* Mock da tela de fundo */}
                    <div className="space-y-3 opacity-40 pointer-events-none">
                      <div className="flex items-center justify-between pb-2 border-b">
                        <div className="h-4 w-28 bg-muted-foreground/30 rounded-lg" />
                        <div className="h-6 w-6 rounded-full bg-muted-foreground/30" />
                      </div>
                      <div className="h-16 rounded-2xl bg-muted/80 border border-dashed" />
                      <div className="grid grid-cols-2 gap-2">
                        <div className="h-14 rounded-xl bg-muted/80" />
                        <div className="h-14 rounded-xl bg-muted/80" />
                      </div>
                      <div className="h-20 rounded-2xl bg-muted/80" />
                    </div>

                    {/* Sobreposição do Tutorial Ativo */}
                    {activeTutorial ? (
                      <div className="my-auto relative z-10 animate-in zoom-in-95 duration-200">
                        {activeTutorial.type === 'tour' ? (
                          /* Tour Card Preview */
                          <div className="p-4 rounded-3xl bg-card border-2 border-[#58CC02] shadow-2xl space-y-3">
                            <div className="flex items-center justify-between">
                              <Badge className="bg-[#58CC02] text-white text-[9px] font-black">
                                Passo 1 de {activeTutorial.steps?.length || 1}
                              </Badge>
                              <span className="text-[10px] text-muted-foreground font-bold">
                                {activeTutorial.target_page}
                              </span>
                            </div>

                            <div>
                              <h5 className="font-black text-sm text-foreground">
                                {activeTutorial.steps?.[0]?.title || activeTutorial.title}
                              </h5>
                              <p className="text-xs text-muted-foreground font-medium mt-1 leading-relaxed">
                                {activeTutorial.steps?.[0]?.content || activeTutorial.content}
                              </p>
                              {activeTutorial.steps?.[0]?.target && (
                                <div className="mt-2 text-[10px] font-bold text-[#1CB0F6] bg-[#1CB0F6]/10 px-2 py-0.5 rounded-lg inline-block">
                                  🎯 Alvo: {activeTutorial.steps[0].target}
                                </div>
                              )}
                            </div>

                            <div className="flex items-center justify-between pt-2 border-t">
                              <span className="text-[10px] font-bold text-muted-foreground">
                                Pular
                              </span>
                              <div className="flex items-center gap-1.5">
                                <Button
                                  type="button"
                                  size="sm"
                                  disabled
                                  className="h-7 text-[10px] rounded-xl font-bold"
                                  variant="outline"
                                >
                                  Anterior
                                </Button>
                                <Button
                                  type="button"
                                  size="sm"
                                  className="h-7 text-[10px] rounded-xl font-black bg-[#58CC02] border-b-2 border-[#46A302] text-white"
                                >
                                  Próximo
                                </Button>
                              </div>
                            </div>
                          </div>
                        ) : activeTutorial.type === 'popup' ? (
                          /* Popup Modal Preview */
                          <div className="p-5 rounded-3xl bg-card border-2 border-[#1CB0F6] shadow-2xl space-y-3 text-center">
                            <div className="w-10 h-10 rounded-2xl bg-[#1CB0F6]/15 text-[#1CB0F6] flex items-center justify-center mx-auto">
                              <GraduationCap className="w-5 h-5" />
                            </div>
                            <h5 className="font-black text-sm text-foreground">
                              {activeTutorial.title}
                            </h5>
                            <p className="text-xs text-muted-foreground font-medium leading-relaxed">
                              {activeTutorial.content}
                            </p>
                            <Button
                              type="button"
                              className="w-full h-9 rounded-2xl font-black text-xs bg-[#1CB0F6] border-b-4 border-[#1899D6] text-white active:translate-y-0.5"
                            >
                              Entendi
                            </Button>
                          </div>
                        ) : (
                          /* Dica no Canto Preview */
                          <div className="p-3.5 rounded-2xl bg-amber-500/15 border-2 border-amber-500/30 text-amber-950 dark:text-amber-100 shadow-lg space-y-1.5">
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-black uppercase text-amber-600 dark:text-amber-400">
                                💡 Dica rápida
                              </span>
                              <span className="text-[10px] text-muted-foreground font-bold">✕</span>
                            </div>
                            <h6 className="font-black text-xs text-foreground">
                              {activeTutorial.title}
                            </h6>
                            <p className="text-[11px] text-muted-foreground font-medium leading-relaxed">
                              {activeTutorial.content}
                            </p>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-center p-6 border-2 border-dashed rounded-3xl bg-muted/40 my-auto">
                        <GraduationCap className="w-8 h-8 text-muted-foreground mx-auto mb-2 opacity-50" />
                        <p className="text-xs font-black text-foreground">
                          Selecione ou crie um tutorial
                        </p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">
                          A prévia em tempo real de como o usuário verá o tour aparecerá aqui.
                        </p>
                      </div>
                    )}

                    <div className="text-center text-[10px] font-bold text-muted-foreground pt-2 border-t">
                      Simulação da tela: {activeTutorial?.target_page || 'geral'}
                    </div>
                  </div>
                )}
              </div>

              {/* Bottom bar indicator */}
              <div className="w-24 h-1 bg-muted-foreground/40 rounded-full mx-auto mt-2" />
            </div>

            {/* Quick Helper Banner */}
            <div className="p-3.5 rounded-2xl bg-[#58CC02]/10 border-2 border-[#58CC02]/20 flex items-center gap-2.5 text-xs">
              <Check className="w-4 h-4 text-[#58CC02] shrink-0" />
              <p className="text-muted-foreground text-[11px] leading-tight">
                <strong>Zero Lag:</strong> Qualquer texto alterado atualiza imediatamente a prévia e
                o site ao clicar em "Salvar alterações".
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Dialog: Restore Defaults for selected page */}
      <AlertDialog open={resetDialogOpen} onOpenChange={setResetDialogOpen}>
        <AlertDialogContent className="rounded-3xl border-2 max-w-sm">
          <AlertDialogHeader>
            <div className="w-12 h-12 rounded-2xl bg-amber-500/15 text-amber-500 flex items-center justify-center mx-auto mb-2">
              <RotateCcw className="w-6 h-6" />
            </div>
            <AlertDialogTitle className="text-center font-black text-xl">
              Restaurar{' '}
              {selectedPage === 'landing'
                ? 'Landing Page'
                : selectedPage === 'login'
                  ? 'Login'
                  : selectedPage === 'system'
                    ? 'Sistema Ada'
                    : selectedPage === 'system_pro'
                      ? 'Sistema Ada Pro'
                      : 'Tutoriais'}
              ?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-center text-xs font-semibold text-muted-foreground">
              Esta ação substituirá as configurações de{' '}
              <strong>
                {selectedPage === 'landing'
                  ? 'Landing Page'
                  : selectedPage === 'login'
                    ? 'Página de Login'
                    : selectedPage === 'system'
                      ? 'Sistema Ada'
                      : selectedPage === 'system_pro'
                        ? 'Sistema Ada Pro'
                        : 'Tutoriais (a lista será limpa)'}
              </strong>{' '}
              pelos padrões originais do sistema. As configurações das demais páginas serão
              mantidas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2 mt-2">
            <AlertDialogCancel className="rounded-2xl border-2 font-bold flex-1">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmRestorePage}
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
