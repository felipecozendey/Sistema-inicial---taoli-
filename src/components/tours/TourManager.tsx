import { useCallback, useEffect, useMemo, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { useSiteSettingsStore, TutorialItem } from '@/stores/useSiteSettingsStore'
import { useAuth } from '@/hooks/use-auth'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { X, CircleHelp, ChevronRight, ChevronLeft, Lightbulb, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'

/**
 * TourManager — Motor de Tutoriais do Aplicativo
 *
 * Carrega os tutoriais ativos do site_settings (via useSiteSettingsStore),
 * casa rota atual + público + página-alvo e exibe:
 * - tour: overlay com destaque simples por passos
 * - popup: modal Duolingo com botão "Entendi"
 * - dica: card discreto dismissível no canto
 *
 * Gatilhos:
 * - first_access: exibe uma vez por usuário (persistido em localStorage)
 * - always: exibe a cada visita à página
 * - help_button: não exibe automaticamente; reaberto via ícone ? no header
 */

const PAGE_PATHS: Record<string, string> = {
  dashboard: '/dashboard',
  tasks: '/tasks',
  social: '/social',
  health: '/health',
  finance: '/finance',
  studies: '/studies',
  settings: '/settings',
  overview: '/professional',
  patients: '/professional',
  appointments: '/professional',
  notes: '/professional',
  groups_pro: '/professional',
}

function matchesPage(tutorial: TutorialItem, pathname: string, activeTab: string | null) {
  const expectedPath = PAGE_PATHS[tutorial.target_page]
  if (!expectedPath) return false
  if (!pathname.startsWith(expectedPath)) return false

  // Em /professional, filtrar por aba ativa quando o tutorial mira uma aba específica
  if (expectedPath === '/professional' && activeTab) {
    return tutorial.target_page === activeTab
  }
  return true
}

function getDismissKey(id: string) {
  return `vt_tour_dismissed_${id}`
}

export function TourManager({ context = 'user' }: { context?: 'user' | 'professional' }) {
  const location = useLocation()
  const { user } = useAuth()
  const settings = useSiteSettingsStore((s) => s.settings)
  const loadSiteData = useSiteSettingsStore((s) => s.loadSiteData)

  const tutorials = useMemo(
    () =>
      (settings.tutorials || []).filter(
        (t) => t.active && t.audience === context && matchesPage(t, location.pathname, null),
      ),
    [settings.tutorials, context, location.pathname],
  )

  const [activeOverlay, setActiveOverlay] = useState<TutorialItem | null>(null)
  const [visibleTip, setVisibleTip] = useState<TutorialItem | null>(null)
  const [stepIndex, setStepIndex] = useState(0)
  const [showHelpMenu, setShowHelpMenu] = useState(false)

  // Carregar tutoriais ao montar
  useEffect(() => {
    loadSiteData()
  }, [loadSiteData])

  // Determinar qual tutorial deve aparecer automaticamente ao mudar de rota ou tutoriais
  useEffect(() => {
    if (!user) return

    // Um tutorial por vez: prioriza tour > popup > dica
    const priority = { tour: 0, popup: 1, tip: 2 }
    const candidates = [...tutorials].sort((a, b) => priority[a.type] - priority[b.type])

    for (const t of candidates) {
      if (t.trigger === 'help_button') continue
      if (t.trigger === 'first_access' && localStorage.getItem(getDismissKey(t.id))) continue

      // Se já há overlay ou dica visível, não abre outro automaticamente
      if (activeOverlay || visibleTip) break

      if (t.type === 'tip') {
        setVisibleTip(t)
      } else {
        setActiveOverlay(t)
        setStepIndex(0)
      }
      break
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tutorials, user?.id, location.pathname])

  // Dismiss helpers
  const dismissTutorial = useCallback((t: TutorialItem) => {
    if (t.trigger === 'first_access') {
      try {
        localStorage.setItem(getDismissKey(t.id), '1')
      } catch {
        /* ignore */
      }
    }
    setActiveOverlay(null)
    setVisibleTip(null)
    setStepIndex(0)
  }, [])

  const openTutorial = (t: TutorialItem) => {
    if (t.type === 'tip') {
      setVisibleTip(t)
    } else {
      setStepIndex(0)
      setActiveOverlay(t)
      setShowHelpMenu(false)
    }
  }

  // Esc fecha dica / overlay
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setActiveOverlay(null)
        setVisibleTip(null)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  // Determina quais tutoriais estão disponíveis via botão de ajuda
  const helpTutorials = tutorials.filter(
    (t) => t.trigger === 'help_button' || t.trigger === 'always',
  )
  const hasHelp = helpTutorials.length > 0

  if (!user) return null

  return (
    <>
      {/* Ícone ? no header flutuante — exibido se houver tutoriais nesta tela */}
      {hasHelp && (
        <div className="fixed top-3 right-3 z-50 md:top-4 md:right-4">
          <button
            type="button"
            onClick={() => setShowHelpMenu((v) => !v)}
            title="Tutoriais desta página"
            className="h-9 w-9 rounded-2xl bg-card border-2 border-b-4 border-[#E5E5E5] dark:border-[#3B4A55] text-muted-foreground hover:text-[#1CB0F6] hover:border-[#1CB0F6] hover:bg-[#1CB0F6]/5 active:border-b-2 active:translate-y-0.5 transition-all flex items-center justify-center font-black cursor-pointer shadow-sm"
          >
            <CircleHelp className="w-5 h-5 text-[#1CB0F6]" strokeWidth={2.5} />
            <span className="sr-only">Tutoriais</span>
          </button>
        </div>
      )}

      {/* Menu de tutoriais via botão de ajuda */}
      {showHelpMenu && helpTutorials.length > 0 && (
        <div className="fixed top-14 right-3 md:top-16 md:right-4 z-50 w-72 max-w-[calc(100vw-24px)] rounded-3xl bg-card border-2 shadow-2xl p-3 space-y-2 animate-in fade-in zoom-in-95">
          <div className="flex items-center justify-between px-1 pb-1 border-b">
            <span className="font-black text-xs text-foreground flex items-center gap-1.5">
              <CircleHelp className="w-3.5 h-3.5 text-[#1CB0F6]" />
              Tutoriais desta página
            </span>
            <button
              type="button"
              onClick={() => setShowHelpMenu(false)}
              className="text-muted-foreground hover:text-foreground cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="space-y-1">
            {helpTutorials.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => openTutorial(t)}
                className="w-full text-left px-3 py-2 rounded-xl hover:bg-muted transition-colors cursor-pointer block border"
              >
                <div className="font-bold text-xs text-foreground truncate">{t.title}</div>
                <div className="text-[10px] text-muted-foreground font-semibold line-clamp-1">
                  {t.content}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Overlay: Tour / Popup */}
      {activeOverlay && (
        <div
          className="fixed inset-0 z-[70] bg-black/60 backdrop-blur-[2px] flex items-center justify-center p-4"
          onClick={() => {
            // Fechar se for popup clicando fora
            if (activeOverlay.type === 'popup') {
              dismissTutorial(activeOverlay)
            }
          }}
        >
          <div
            className="w-full max-w-sm rounded-3xl bg-card border-2 border-b-4 shadow-2xl p-5 space-y-4 animate-in zoom-in-95 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {activeOverlay.type === 'tour' ? (
              <>
                <div className="flex items-center justify-between gap-2">
                  <Badge className="bg-[#58CC02] text-white font-black text-[10px] px-2.5 py-0.5 rounded-full border-b-2 border-[#46A302]">
                    passo {stepIndex + 1} de {activeOverlay.steps?.length || 1}
                  </Badge>
                  <button
                    type="button"
                    onClick={() => dismissTutorial(activeOverlay)}
                    className="text-muted-foreground hover:text-foreground cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div>
                  <h3 className="font-black text-lg text-foreground leading-tight">
                    {activeOverlay.steps?.[stepIndex]?.title || activeOverlay.title}
                  </h3>
                  <p className="text-sm text-muted-foreground font-medium mt-1 leading-relaxed">
                    {activeOverlay.steps?.[stepIndex]?.content || activeOverlay.content}
                  </p>
                  {activeOverlay.steps?.[stepIndex]?.target && (
                    <div className="mt-2 text-[10px] font-bold text-[#1CB0F6] bg-[#1CB0F6]/10 px-2 py-0.5 rounded-lg inline-block">
                      🎯 {activeOverlay.steps[stepIndex].target}
                    </div>
                  )}
                </div>

                {/* Barra de progresso do tour */}
                <div className="flex items-center gap-1.5">
                  {(activeOverlay.steps || []).map((_, i) => (
                    <div
                      key={i}
                      className={cn(
                        'h-1.5 flex-1 rounded-full transition-all',
                        i <= stepIndex ? 'bg-[#58CC02]' : 'bg-muted',
                      )}
                    />
                  ))}
                </div>

                <div className="flex items-center justify-between pt-1">
                  <button
                    type="button"
                    onClick={() => dismissTutorial(activeOverlay)}
                    className="text-xs font-bold text-muted-foreground hover:text-foreground cursor-pointer"
                  >
                    Fechar
                  </button>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={stepIndex === 0}
                      onClick={() => setStepIndex((i) => Math.max(0, i - 1))}
                      className="rounded-2xl font-black text-xs border-2 h-9 px-3.5 cursor-pointer"
                    >
                      <ChevronLeft className="w-3.5 h-3.5 mr-0.5" /> Anterior
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => {
                        if (stepIndex < (activeOverlay.steps?.length || 1) - 1) {
                          setStepIndex((i) => i + 1)
                        } else {
                          dismissTutorial(activeOverlay)
                        }
                      }}
                      className="rounded-2xl font-black text-xs h-9 px-3.5 bg-[#58CC02] border-b-4 border-[#46A302] text-white active:translate-y-0.5 active:border-b-0 cursor-pointer"
                    >
                      {stepIndex < (activeOverlay.steps?.length || 1) - 1 ? 'Próximo' : 'Concluir'}
                      <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              /* Popup Duolingo */
              <>
                <div className="w-12 h-12 rounded-2xl bg-[#1CB0F6]/15 text-[#1CB0F6] flex items-center justify-center mx-auto border-2 border-[#1CB0F6]/30">
                  <Sparkles className="w-6 h-6" />
                </div>
                <div className="text-center space-y-1.5">
                  <h3 className="font-black text-lg text-foreground">{activeOverlay.title}</h3>
                  <p className="text-sm text-muted-foreground font-medium leading-relaxed">
                    {activeOverlay.content}
                  </p>
                </div>
                <Button
                  type="button"
                  onClick={() => dismissTutorial(activeOverlay)}
                  className="w-full h-11 rounded-2xl font-black text-sm bg-[#1CB0F6] border-b-4 border-[#1899D6] text-white active:translate-y-0.5 active:border-b-0 cursor-pointer"
                >
                  Entendi
                </Button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Dica discreta no canto */}
      {visibleTip && (
        <div className="fixed bottom-20 right-3 md:bottom-6 md:right-6 z-[65] w-72 max-w-[calc(100vw-24px)] animate-in fade-in slide-in-from-bottom-2">
          <div className="p-3.5 rounded-3xl bg-card border-2 border-[#FFC800] shadow-xl space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase text-[#FFC800] flex items-center gap-1">
                <Lightbulb className="w-3.5 h-3.5" /> Dica rápida
              </span>
              <button
                type="button"
                onClick={() => setVisibleTip(null)}
                className="text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            <h6 className="font-black text-xs text-foreground">{visibleTip.title}</h6>
            <p className="text-[11px] text-muted-foreground font-medium leading-relaxed">
              {visibleTip.content}
            </p>
          </div>
        </div>
      )}
    </>
  )
}
