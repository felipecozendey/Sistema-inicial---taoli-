import { Lock } from 'lucide-react'

export function RevisionPlaceholder() {
  return (
    <div className="flex flex-col items-center justify-center p-12 bg-card rounded-3xl border-2 border-dashed text-center">
      <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
        <Lock className="w-8 h-8 text-muted-foreground" strokeWidth={2} />
      </div>
      <h3 className="text-xl font-extrabold mb-2">Flashcards em breve</h3>
      <p className="text-muted-foreground font-semibold max-w-sm">
        O motor de Flashcards está sendo construído! Em breve...
      </p>
    </div>
  )
}
