import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import type { JiuTechnique } from '@/stores/useAppStore'
import { PROFICIENCY_CONFIG } from '@/components/health/jiu-constants'
import { cn } from '@/lib/utils'

export function JiuTechniqueDetail({
  tech,
  onOpenChange,
}: {
  tech: JiuTechnique | null
  onOpenChange: (v: boolean) => void
}) {
  return (
    <Dialog open={!!tech} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm rounded-3xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-extrabold">{tech?.name}</DialogTitle>
        </DialogHeader>
        {tech && (
          <div className="space-y-3">
            <div className="flex gap-2">
              <span className="text-xs font-extrabold px-2 py-1 rounded-full border bg-muted">
                {tech.category}
              </span>
              <span
                className={cn(
                  'text-xs font-extrabold px-2 py-1 rounded-full border',
                  PROFICIENCY_CONFIG[tech.proficiency]?.color,
                )}
              >
                {PROFICIENCY_CONFIG[tech.proficiency]?.emoji}{' '}
                {PROFICIENCY_CONFIG[tech.proficiency]?.label}
              </span>
            </div>
            {tech.notes ? (
              <div>
                <p className="text-sm font-extrabold mb-1">Observações Detalhadas</p>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{tech.notes}</p>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground italic">Sem observações registradas</p>
            )}
            {tech.videoUrl && (
              <a
                href={tech.videoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full py-3 rounded-xl bg-[#1CB0F6] hover:bg-[#1899D6] text-white font-bold text-center text-sm transition-colors"
              >
                📺 Assistir Vídeo
              </a>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
