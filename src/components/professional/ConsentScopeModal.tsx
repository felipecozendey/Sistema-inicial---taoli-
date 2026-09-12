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
import { CONSENT_SCOPES } from './consent-scopes.tsx'
import {
  ShieldCheck,
  Calendar,
  Mail,
  Stethoscope,
  Building2,
  Award,
  AlertCircle,
} from 'lucide-react'
import { safeFormatDate } from '@/lib/date-utils'

interface ConsentScopeModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  link: PatientLink | null
  mode: 'accept' | 'manage'
  onConfirm: (grantedPages: string[]) => Promise<void> | void
  onReject?: () => Promise<void> | void
  isSubmitting?: boolean
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

  React.useEffect(() => {
    if (!open || !link) return
    if (mode === 'manage') {
      setSelectedScopes(Array.isArray(link.granted_pages) ? link.granted_pages : [])
    } else {
      // In accept mode, preselect health and tasks as recommended default
      setSelectedScopes(['tarefas', 'saude'])
    }
  }, [open, link, mode])

  if (!link) return null

  const toggleScope = (scopeKey: string) => {
    setSelectedScopes((prev) =>
      prev.includes(scopeKey) ? prev.filter((k) => k !== scopeKey) : [...prev, scopeKey],
    )
  }

  const hasAnySelected = selectedScopes.length > 0

  const handlePrimaryAction = async () => {
    if (!hasAnySelected) return
    await onConfirm(selectedScopes)
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
                  {mode === 'accept' ? 'Aceitar Convite do Profissional' : 'Gerenciar Permissões'}
                </DialogTitle>
                <Badge className="bg-[#1CB0F6] text-white text-[10px] font-extrabold uppercase">
                  {mode === 'accept' ? 'Convite' : 'Vínculo Ativo'}
                </Badge>
              </div>
              <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                {mode === 'accept'
                  ? 'Revise os dados do profissional e selecione quais módulos liberar.'
                  : 'Ative ou desative o acesso do profissional a cada módulo a qualquer momento.'}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="p-5 sm:p-6 space-y-5 max-h-[70vh] overflow-y-auto">
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

          {/* Seção com as 4 permissões modulares */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-black uppercase text-foreground tracking-wider">
                <ShieldCheck className="w-4 h-4 text-[#58CC02]" />
                <span>Escolha o que este profissional poderá ver</span>
              </div>
              <span className="text-[11px] font-bold text-muted-foreground">
                {selectedScopes.length} de {CONSENT_SCOPES.length} liberadas
              </span>
            </div>

            <div className="space-y-2.5">
              {CONSENT_SCOPES.map((scope) => {
                const isSelected = selectedScopes.includes(scope.key)
                return (
                  <div
                    key={scope.key}
                    onClick={() => toggleScope(scope.key)}
                    className={`p-3.5 rounded-2xl border-2 transition-all cursor-pointer flex items-start justify-between gap-3 ${
                      isSelected
                        ? 'border-[#1CB0F6] bg-[#1CB0F6]/5'
                        : 'border-border bg-card hover:bg-muted/30'
                    }`}
                  >
                    <div className="flex items-start gap-3 min-w-0 flex-1">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                          isSelected ? 'bg-[#1CB0F6] text-white' : 'bg-muted text-muted-foreground'
                        }`}
                      >
                        <scope.icon className="w-4 h-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs sm:text-sm font-extrabold text-foreground">
                            {scope.title}
                          </span>
                        </div>
                        <p className="text-[11px] text-muted-foreground font-medium mt-0.5 leading-relaxed">
                          {scope.description}
                        </p>
                      </div>
                    </div>

                    <div className="pt-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                      <Switch
                        checked={isSelected}
                        onCheckedChange={() => toggleScope(scope.key)}
                        aria-label={`Permitir acesso a ${scope.title}`}
                      />
                    </div>
                  </div>
                )
              })}
            </div>

            {!hasAnySelected && (
              <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-400 text-xs font-bold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>Selecione pelo menos uma área para conceder acesso ao profissional.</span>
              </div>
            )}
          </div>
        </div>

        {/* Rodapé com botões de ação Duolingo */}
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
