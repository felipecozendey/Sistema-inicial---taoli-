import { useState, useEffect } from 'react'
import { useTaskSettingsStore } from '@/stores/useTaskSettingsStore'
import { useAuth } from '@/hooks/use-auth'
import { supabase } from '@/lib/supabase/client'
import { toast } from '@/hooks/use-toast'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Sparkles,
  Flower2,
  CalendarDays,
  Save,
  RotateCcw,
  CheckCircle2,
  Layers,
  Award,
  Zap,
} from 'lucide-react'
import { DEFAULT_TASK_SETTINGS } from '@/types/task-settings'

export function MasterTaskSettingsSubTab() {
  const { user } = useAuth()
  const { settings, fetchSettings, updateSettings, resetToDefaults } = useTaskSettingsStore()

  const [formData, setFormData] = useState({
    points_per_task: settings.points_per_task,
    points_per_habit: settings.points_per_habit,
    bonus_streak: settings.bonus_streak,
    points_per_level: settings.points_per_level,
    unlock_plot_cost: settings.unlock_plot_cost,
    show_garden: settings.show_garden,
    show_week_day_tabs: settings.show_week_day_tabs,
  })

  const [saving, setSaving] = useState(false)
  const [dirty, setDirty] = useState(false)

  useEffect(() => {
    fetchSettings()
  }, [fetchSettings])

  useEffect(() => {
    setFormData({
      points_per_task: settings.points_per_task ?? DEFAULT_TASK_SETTINGS.points_per_task,
      points_per_habit: settings.points_per_habit ?? DEFAULT_TASK_SETTINGS.points_per_habit,
      bonus_streak: settings.bonus_streak ?? DEFAULT_TASK_SETTINGS.bonus_streak,
      points_per_level: settings.points_per_level ?? DEFAULT_TASK_SETTINGS.points_per_level,
      unlock_plot_cost: settings.unlock_plot_cost ?? DEFAULT_TASK_SETTINGS.unlock_plot_cost,
      show_garden: settings.show_garden ?? DEFAULT_TASK_SETTINGS.show_garden,
      show_week_day_tabs: settings.show_week_day_tabs ?? DEFAULT_TASK_SETTINGS.show_week_day_tabs,
    })
    setDirty(false)
  }, [settings])

  const handleNumberChange = (field: string, value: string) => {
    const num = parseInt(value, 10)
    setFormData((prev) => ({
      ...prev,
      [field]: isNaN(num) ? 0 : Math.max(0, num),
    }))
    setDirty(true)
  }

  const handleToggleChange = (field: string, val: boolean) => {
    setFormData((prev) => ({
      ...prev,
      [field]: val,
    }))
    setDirty(true)
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const ok = await updateSettings(formData, user?.email)
      if (ok) {
        setDirty(false)
      }
    } catch (err) {
      console.error('Erro ao salvar configurações:', err)
    } finally {
      setSaving(false)
    }
  }

  const handleRestoreDefaults = async () => {
    if (
      !confirm(
        'Tem certeza que deseja restaurar as configurações padrão de Hábitos, Tarefas e Jardim?',
      )
    ) {
      return
    }

    setSaving(true)
    try {
      const ok = await resetToDefaults(user?.email)
      if (ok) {
        setFormData({
          points_per_task: DEFAULT_TASK_SETTINGS.points_per_task,
          points_per_habit: DEFAULT_TASK_SETTINGS.points_per_habit,
          bonus_streak: DEFAULT_TASK_SETTINGS.bonus_streak,
          points_per_level: DEFAULT_TASK_SETTINGS.points_per_level,
          unlock_plot_cost: DEFAULT_TASK_SETTINGS.unlock_plot_cost,
          show_garden: DEFAULT_TASK_SETTINGS.show_garden,
          show_week_day_tabs: DEFAULT_TASK_SETTINGS.show_week_day_tabs,
        })
        setDirty(false)
      }
    } catch (err) {
      console.error('Erro ao restaurar padrões:', err)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Barra de Ações Superior */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-3xl bg-card border-2 border-b-4 border-[#E5E5E5] dark:border-[#3B4A55] shadow-sm">
        <div>
          <h4 className="font-extrabold text-base flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#58CC02]" />
            Parâmetros de Gamificação & Exibição
          </h4>
          <p className="text-xs font-semibold text-muted-foreground mt-0.5">
            Configure pontuações para tarefas, hábitos, economia do jardim e modo de exibição.
          </p>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <Button
            type="button"
            variant="outline"
            onClick={handleRestoreDefaults}
            disabled={saving}
            className="rounded-2xl border-2 border-b-4 font-extrabold text-xs h-10 px-3.5 hover:bg-muted active:border-b-2 active:translate-y-0.5 transition-all gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Restaurar padrão</span>
          </Button>

          <Button
            type="button"
            onClick={handleSave}
            disabled={saving || !dirty}
            className="rounded-2xl bg-[#58CC02] hover:bg-[#46a302] text-white border-b-4 border-[#46a302] active:border-b-0 active:translate-y-1 font-black text-xs h-10 px-4 shadow-sm gap-1.5 transition-all disabled:opacity-50"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{saving ? 'Salvando...' : 'Salvar Alterações'}</span>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Card 1: Pontuações e Recompensas */}
        <Card className="rounded-3xl border-2 border-b-4 border-[#E5E5E5] dark:border-[#3B4A55] shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-extrabold flex items-center gap-2">
              <Award className="w-5 h-5 text-[#FF9600]" />
              Pontuação e Recompensas
            </CardTitle>
            <CardDescription className="text-xs font-semibold">
              Defina a quantidade de pontos que o usuário ganha ao concluir atividades.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-black flex items-center justify-between">
                <span>Pontos por Tarefa Concluída</span>
                <span className="text-[11px] text-muted-foreground font-bold">
                  Padrão: {DEFAULT_TASK_SETTINGS.points_per_task} pts
                </span>
              </Label>
              <Input
                type="number"
                min={0}
                max={1000}
                value={formData.points_per_task}
                onChange={(e) => handleNumberChange('points_per_task', e.target.value)}
                className="rounded-2xl font-bold h-11 border-2"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-black flex items-center justify-between">
                <span>Pontos por Hábito Concluído</span>
                <span className="text-[11px] text-muted-foreground font-bold">
                  Padrão: {DEFAULT_TASK_SETTINGS.points_per_habit} pts
                </span>
              </Label>
              <Input
                type="number"
                min={0}
                max={1000}
                value={formData.points_per_habit}
                onChange={(e) => handleNumberChange('points_per_habit', e.target.value)}
                className="rounded-2xl font-bold h-11 border-2"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-black flex items-center justify-between">
                <span>Bônus de Streak (Sequência)</span>
                <span className="text-[11px] text-muted-foreground font-bold">
                  Padrão: {DEFAULT_TASK_SETTINGS.bonus_streak} pts
                </span>
              </Label>
              <Input
                type="number"
                min={0}
                max={1000}
                value={formData.bonus_streak}
                onChange={(e) => handleNumberChange('bonus_streak', e.target.value)}
                className="rounded-2xl font-bold h-11 border-2"
              />
            </div>
          </CardContent>
        </Card>

        {/* Card 2: Economia do Jardim */}
        <Card className="rounded-3xl border-2 border-b-4 border-[#E5E5E5] dark:border-[#3B4A55] shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-extrabold flex items-center gap-2">
              <Zap className="w-5 h-5 text-[#1CB0F6]" />
              Economia do Jardim & Níveis
            </CardTitle>
            <CardDescription className="text-xs font-semibold">
              Regras de progressão de nível e custos de desbloqueio de canteiros.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-black flex items-center justify-between">
                <span>Pontos Necessários por Nível</span>
                <span className="text-[11px] text-muted-foreground font-bold">
                  Padrão: {DEFAULT_TASK_SETTINGS.points_per_level} pts
                </span>
              </Label>
              <Input
                type="number"
                min={10}
                max={5000}
                value={formData.points_per_level}
                onChange={(e) => handleNumberChange('points_per_level', e.target.value)}
                className="rounded-2xl font-bold h-11 border-2"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-black flex items-center justify-between">
                <span>Custo para Desbloquear Canteiro</span>
                <span className="text-[11px] text-muted-foreground font-bold">
                  Padrão: {DEFAULT_TASK_SETTINGS.unlock_plot_cost} pts
                </span>
              </Label>
              <Input
                type="number"
                min={0}
                max={5000}
                value={formData.unlock_plot_cost}
                onChange={(e) => handleNumberChange('unlock_plot_cost', e.target.value)}
                className="rounded-2xl font-bold h-11 border-2"
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Card 3: Toggles de Exibição Global */}
      <Card className="rounded-3xl border-2 border-b-4 border-[#E5E5E5] dark:border-[#3B4A55] shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-extrabold flex items-center gap-2">
            <Layers className="w-5 h-5 text-[#58CC02]" />
            Visibilidade e Comportamento Visual
          </CardTitle>
          <CardDescription className="text-xs font-semibold">
            Controle os recursos visíveis aos usuários na tela de Hábitos e Tarefas.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 rounded-2xl bg-muted/40 border-2">
            <div className="space-y-0.5 pr-4">
              <div className="flex items-center gap-2">
                <Flower2 className="w-4 h-4 text-[#58CC02]" />
                <Label htmlFor="toggle-garden" className="text-sm font-extrabold cursor-pointer">
                  Exibir Jardim
                </Label>
              </div>
              <p className="text-xs text-muted-foreground font-medium">
                Quando desativado, oculta totalmente a aba Jardim na tela de Hábitos e Tarefas para
                todos os usuários.
              </p>
            </div>
            <Switch
              id="toggle-garden"
              checked={formData.show_garden}
              onCheckedChange={(val) => handleToggleChange('show_garden', val)}
            />
          </div>

          <div className="flex items-center justify-between p-4 rounded-2xl bg-muted/40 border-2">
            <div className="space-y-0.5 pr-4">
              <div className="flex items-center gap-2">
                <CalendarDays className="w-4 h-4 text-[#1CB0F6]" />
                <Label htmlFor="toggle-week-tabs" className="text-sm font-extrabold cursor-pointer">
                  Exibir abas por dia na semana
                </Label>
              </div>
              <p className="text-xs text-muted-foreground font-medium">
                Quando ativado, o filtro &quot;Esta semana&quot; exibe a coluna lateral de dias no
                desktop e abas horizontais no mobile. Se desativado, exibe a lista empilhada
                tradicional.
              </p>
            </div>
            <Switch
              id="toggle-week-tabs"
              checked={formData.show_week_day_tabs}
              onCheckedChange={(val) => handleToggleChange('show_week_day_tabs', val)}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
