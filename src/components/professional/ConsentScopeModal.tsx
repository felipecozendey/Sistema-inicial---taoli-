import React from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { PatientLink } from '@/stores/useProfessionalStore'
import {
  CONSENT_SCOPES,
  SCOPE_CATEGORIES,
  SCOPE_LABELS,
  SCOPE_BADGE_STYLES,
  normalizeGrantedPages,
} from './consent-scopes.tsx'
import {
  ShieldCheck,
  Calendar,
  Mail,
  Stethoscope,
  Building2,
  Award,
  AlertCircle,
  Users2,
  Activity,
  HeartPulse,
  Brain,
  Utensils,
  Dumbbell,
  Scan,
  DollarSign,
  GraduationCap,
  FileText,
  Sparkles,
} from 'lucide-react'
import { safeFormatDate } from '@/lib/date-utils'
import { cn } from '@/lib/utils'

interface ConsentScopeModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  link: PatientLink | null
  mode: 'accept' | 'manage'
  onConfirm: (grantedPages: string[], allowMultidisciplinary: boolean) => Promise<void> | void
  onReject?: () => Promise<void> | void
  isSubmitting?: boolean
}

const SCOPE_ICONS: Record<string, React.ReactNode> = {
  prontuario_geral: <HeartPulse className="w-4 h-4 text-emerald-500" />,
  tarefas: <Activity className="w-4 h-4 text-[#58CC02]" />,
  mente: <Brain className="w-4 h-4 text-[#CE82FF]" />,
  nutricao: <Utensils className="w-4 h-4 text-orange-500" />,
  exercicios: <Dumbbell className="w-4 h-4 text-blue-500" />,
  raio_x: <Scan className="w-4 h-4 text-cyan-500" />,
  financas: <DollarSign className="w-4 h-4 text-amber-500" />,
  estudos: <GraduationCap className="w-4 h-4 text-[#1CB0F6]" />,
  historico_social: <FileText className="w-4 h-4 text-rose-500" />,
}

export function ConsentScopeModal({
  open,
  onOpenChange,
  link,
  mode,
  onConfirm,
  onReject,
  isSubmitting = false,
}: ConsentScopeModalProps) {
  const [selectedScopes, setSelectedScopes] = React.useState<string[]>([])
  const [allowMultidisciplinary, setAllowMultidisciplinary] = React.useState<boolean>(false)

  React.useEffect(() => {
    if (!open || !link) return
    if (mode === 'manage') {
      const normalized = normalizeGrantedPages(
        Array.isArray(link.granted_pages) ? link.granted_pages : [],
      )
      setSelectedScopes(normalized)
      setAllowMultidisciplinary(Boolean(link.allow_multidisciplinary))
    } else {
      // No aceite, sugerir Prontuário Geral + Performance + Nutrição por padrão
      setSelectedScopes(['prontuario_geral', 'tarefas', 'nutricao'])
      setAllowMultidisciplinary(false)
    }
  }, [open, link, mode])

  if (!link) return null

  const toggleScope = (scopeId: string) => {
    setSelectedScopes((prev) =>
      prev.includes(scopeId) ? prev.filter((k) => k !== scopeId) : [...prev, scopeId],
    )
  }

  const selectAll = () => {
    setSelectedScopes(CONSENT_SCOPES.map((s) => s.id))
  }

  const clearAll = () => {
    setSelectedScopes([])
  }

  const hasAnySelected = selectedScopes.length > 0

  const handlePrimaryAction = async () => {
    if (!hasAnySelected) return
    await onConfirm(selectedScopes, allowMultidisciplinary)
  }

  const initials = (link.professional_name || link.professional_email || 'P')
    .slice(0, 2)
    .toUpperCase()

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg rounded-3xl border-2 p-0 gap-0 overflow-hidden shadow-2xl">
        {/* Cabeçalho Pro Azul */}
        <DialogHeader className="p-5 sm:p-6 pb-4 bg-[#1CB0F6]/10 border-b">
          <div className="flex items-start gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-[#1CB0F6] text-white flex items-center justify-center font-black text-lg shadow-sm shrink-0">
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <DialogTitle className="text-lg font-black text-foreground">
                  {mode === 'accept' ? 'Aceitar Convite Profissional' : 'Gerenciar Consentimento'}
                </DialogTitle>
                <Badge className="bg-[#1CB0F6] text-white text-[10px] font-extrabold uppercase">
                  {mode === 'accept' ? 'Convite' : 'Vínculo Ativo'}
                </Badge>
              </div>
              <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                {mode === 'accept'
                  ? 'Liberação granular: você escolhe exatamente quais áreas este profissional pode acessar.'
                  : 'Personalize o acesso por área a qualquer momento. Suas alterações têm efeito imediato.'}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="p-5 sm:p-6 space-y-5 max-h-[72vh] overflow-y-auto">
          {/* Cartão com Identificação Completa do Profissional */}
          <div className="p-4 rounded-2xl border-2 bg-card space-y-2.5">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11px] font-black uppercase text-muted-foreground tracking-wider">
                Profissional Solicitante
              </span>
              <div className="flex items-center gap-1 text-[11px] text-muted-foreground font-semibold">
                <Calendar className="w-3.5 h-3.5 text-[#1CB0F6]" />
                <span>
                  {mode === 'accept' ? 'Enviado em ' : 'Conectado desde '}
                  {safeFormatDate(link.created_at)}
                </span>
              </div>
            </div>

            <div className="space-y-1">
              <div className="text-base font-black text-foreground">{link.professional_name}</div>
              {link.professional_email && (
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-semibold">
                  <Mail className="w-3.5 h-3.5 text-muted-foreground" />
                  <span>{link.professional_email}</span>
                </div>
              )}
            </div>

            <div className="pt-2 border-t grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <div className="flex items-center gap-1.5">
                <Stethoscope className="w-3.5 h-3.5 text-[#1CB0F6] shrink-0" />
                <span className="font-bold text-foreground">
                  {link.professional_profession || 'Profissional da Saúde'}
                </span>
              </div>

              {link.professional_register && (
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <Award className="w-3.5 h-3.5 text-[#58CC02] shrink-0" />
                  <span>
                    Reg: <strong className="text-foreground">{link.professional_register}</strong>
                  </span>
                </div>
              )}

              {link.professional_specialty && (
                <div className="sm:col-span-2 text-[11px] text-muted-foreground">
                  Especialidade:{' '}
                  <strong className="text-foreground">{link.professional_specialty}</strong>
                </div>
              )}

              {link.professional_clinic && (
                <div className="sm:col-span-2 flex items-center gap-1.5 text-[11px] text-muted-foreground">
                  <Building2 className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                  <span>
                    Consultório:{' '}
                    <strong className="text-foreground">{link.professional_clinic}</strong>
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Atendimento Multidisciplinar (Opt-in do Paciente) */}
          <div className="p-4 rounded-2xl border-2 border-[#CE82FF]/40 bg-[#CE82FF]/5 space-y-2.5">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#CE82FF] text-white flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
                  <Users2 className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs sm:text-sm font-black text-foreground">
                      Atendimento Multidisciplinar
                    </span>
                    <Badge
                      variant="outline"
                      className="text-[9px] font-black border-[#CE82FF]/40 text-[#CE82FF] uppercase"
                    >
                      Opt-in
                    </Badge>
                  </div>
                  <p className="text-[11px] text-muted-foreground font-semibold mt-1 leading-relaxed">
                    Permito que meus profissionais vejam os registros uns dos outros nas áreas que
                    concedi a cada um (em modo somente-leitura com identificação do autor).
                  </p>
                </div>
              </div>

              <div className="pt-0.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                <Switch
                  checked={allowMultidisciplinary}
                  onCheckedChange={setAllowMultidisciplinary}
                  aria-label="Ativar atendimento multidisciplinar"
                />
              </div>
            </div>

            {allowMultidisciplinary && (
              <div className="pt-2 border-t border-[#CE82FF]/20 flex items-center gap-2 text-[11px] font-bold text-[#CE82FF]">
                <Sparkles className="w-3.5 h-3.5 shrink-0" />
                <span>
                  Visibilidade cruzada ativada para toda a sua equipe de profissionais vinculados!
                </span>
              </div>
            )}
          </div>

          {/* Seção com os 9 escopos granulares */}
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-1.5 text-xs font-black uppercase text-foreground tracking-wider">
                <ShieldCheck className="w-4 h-4 text-[#58CC02]" />
                <span>Áreas Compartilhadas com este Profissional</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={selectAll}
                  className="text-[11px] font-bold text-[#1CB0F6] hover:underline"
                >
                  Todas
                </button>
                <span className="text-muted-foreground text-xs">•</span>
                <button
                  type="button"
                  onClick={clearAll}
                  className="text-[11px] font-bold text-muted-foreground hover:underline"
                >
                  Nenhuma
                </button>
                <Badge variant="outline" className="text-[10px] font-bold ml-1">
                  {selectedScopes.length} de {CONSENT_SCOPES.length}
                </Badge>
              </div>
            </div>

            {/* Grupos de Categorias na mesma ordem do prontuário */}
            <div className="space-y-4">
              {SCOPE_CATEGORIES.map((cat) => {
                const categoryScopes = CONSENT_SCOPES.filter((s) => s.category === cat.id)
                if (categoryScopes.length === 0) return null

                return (
                  <div key={cat.id} className="space-y-2">
                    <div className="flex items-center gap-2 px-1">
                      <span
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: cat.color }}
                      />
                      <span className="text-xs font-black text-muted-foreground uppercase tracking-wide">
                        {cat.title}
                      </span>
                    </div>

                    <div className="space-y-2">
                      {categoryScopes.map((scope) => {
                        const isSelected = selectedScopes.includes(scope.id)
                        const icon = SCOPE_ICONS[scope.id] || <Activity className="w-4 h-4" />

                        return (
                          <div
                            key={scope.id}
                            onClick={() => toggleScope(scope.id)}
                            className={cn(
                              'p-3 sm:p-3.5 rounded-2xl border-2 transition-all cursor-pointer flex items-start justify-between gap-3',
                              isSelected
                                ? 'border-[#1CB0F6] bg-[#1CB0F6]/5 shadow-xs'
                                : 'border-border bg-card hover:bg-muted/30',
                            )}
                          >
                            <div className="flex items-start gap-3 min-w-0 flex-1">
                              <div
                                className={cn(
                                  'w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 border',
                                  isSelected
                                    ? 'bg-background shadow-xs'
                                    : 'bg-muted/50 border-transparent',
                                )}
                              >
                                {icon}
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="text-xs sm:text-sm font-black text-foreground">
                                    {scope.label}
                                  </span>
                                  {isSelected && (
                                    <span
                                      className={cn(
                                        'text-[9px] font-black px-1.5 py-0.2 rounded-full border',
                                        scope.badgeClass,
                                      )}
                                    >
                                      Liberado
                                    </span>
                                  )}
                                </div>
                                <p className="text-[11px] text-muted-foreground font-medium mt-0.5 leading-relaxed">
                                  {scope.description}
                                </p>
                              </div>
                            </div>

                            <div className="pt-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                              <Switch
                                checked={isSelected}
                                onCheckedChange={() => toggleScope(scope.id)}
                                aria-label={`Permitir acesso a ${scope.label}`}
                              />
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Resumo do que está sendo compartilhado */}
            {hasAnySelected ? (
              <div className="p-3 rounded-2xl border bg-muted/30 space-y-1.5">
                <span className="text-[10px] font-black uppercase text-muted-foreground tracking-wider">
                  Resumo compartilhado com este profissional:
                </span>
                <div className="flex flex-wrap gap-1.5 pt-0.5">
                  {selectedScopes.map((scopeId) => {
                    const label = SCOPE_LABELS[scopeId] || scopeId
                    const badgeStyle = SCOPE_BADGE_STYLES[scopeId] || 'bg-muted text-foreground'
                    return (
                      <span
                        key={scopeId}
                        className={cn(
                          'text-[10px] font-black px-2 py-0.5 rounded-full border',
                          badgeStyle,
                        )}
                      >
                        {label}
                      </span>
                    )
                  })}
                </div>
              </div>
            ) : (
              <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-400 text-xs font-bold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>Selecione pelo menos uma área para conceder acesso ao profissional.</span>
              </div>
            )}
          </div>
        </div>

        {/* Rodapé com botões Duolingo */}
        <DialogFooter className="p-4 sm:p-5 border-t bg-muted/20 flex-col-reverse sm:flex-row gap-2">
          {mode === 'accept' && onReject ? (
            <Button
              type="button"
              variant="outline"
              onClick={onReject}
              disabled={isSubmitting}
              className="rounded-2xl border-2 font-bold text-xs h-11 px-4 text-rose-600 border-rose-300 dark:border-rose-900 hover:bg-rose-50 dark:hover:bg-rose-950 flex-1 sm:flex-initial"
            >
              Recusar
            </Button>
          ) : (
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
              className="rounded-2xl border-2 font-bold text-xs h-11 px-4 flex-1 sm:flex-initial"
            >
              Cancelar
            </Button>
          )}

          <Button
            type="button"
            onClick={handlePrimaryAction}
            disabled={!hasAnySelected || isSubmitting}
            className={`rounded-2xl font-black text-xs h-11 px-6 text-white border-b-4 active:border-b-0 active:translate-y-1 transition-all flex-1 sm:flex-initial ${
              mode === 'accept'
                ? 'bg-[#58CC02] hover:bg-[#46a302] border-[#46a302]'
                : 'bg-[#1CB0F6] hover:bg-[#1899d6] border-[#147eb0]'
            } disabled:opacity-50 disabled:pointer-events-none`}
          >
            {isSubmitting
              ? 'Salvando...'
              : mode === 'accept'
                ? 'Aceitar e Conceder Acesso'
                : 'Salvar Permissões'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
