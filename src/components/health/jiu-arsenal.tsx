import { useState, useEffect, useMemo } from 'react'
import { useAppStore } from '@/stores/useAppStore'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'
import { TECHNIQUE_CATEGORIES, PROFICIENCY_CONFIG } from '@/components/health/jiu-constants'

export function JiuArsenal() {
  const jiuTechniques = useAppStore((s) => s.jiuTechniques)
  const fetchJiuTechniques = useAppStore((s) => s.fetchJiuTechniques)
  const addJiuTechnique = useAppStore((s) => s.addJiuTechnique)
  const deleteJiuTechnique = useAppStore((s) => s.deleteJiuTechnique)
  const [modalOpen, setModalOpen] = useState(false)
  const [name, setName] = useState('')
  const [category, setCategory] = useState('Queda')
  const [proficiency, setProficiency] = useState(1)

  useEffect(() => {
    fetchJiuTechniques()
  }, [fetchJiuTechniques])

  const grouped = useMemo(() => {
    const map: Record<string, typeof jiuTechniques> = {}
    TECHNIQUE_CATEGORIES.forEach((c) => {
      map[c] = []
    })
    jiuTechniques.forEach((t) => {
      if (!map[t.category]) map[t.category] = []
      map[t.category].push(t)
    })
    return map
  }, [jiuTechniques])

  const handleSubmit = () => {
    if (!name.trim()) return
    addJiuTechnique({ name: name.trim(), category, proficiency })
    setModalOpen(false)
    setName('')
    setCategory('Queda')
    setProficiency(1)
  }

  return (
    <div className="space-y-6">
      {TECHNIQUE_CATEGORIES.map((cat) => (
        <div key={cat}>
          <h3 className="font-extrabold text-lg mb-3">{cat}</h3>
          {grouped[cat]?.length > 0 ? (
            <div className="space-y-2">
              {grouped[cat].map((t) => {
                const pc = PROFICIENCY_CONFIG[t.proficiency]
                return (
                  <div
                    key={t.id}
                    className="bg-card rounded-2xl p-4 border-2 border-b-4 border-[#E5E5E5] dark:border-[#3B4A55] flex items-center justify-between"
                  >
                    <span className="font-bold">{t.name}</span>
                    <div className="flex items-center gap-2">
                      <span
                        className={cn(
                          'text-xs font-extrabold px-2 py-1 rounded-full border',
                          pc.color,
                        )}
                      >
                        {pc.emoji} {pc.label}
                      </span>
                      <button
                        onClick={() => deleteJiuTechnique(t.id)}
                        className="text-muted-foreground hover:text-red-500 text-sm"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground italic">Nenhuma técnica aqui</p>
          )}
        </div>
      ))}

      <button
        onClick={() => setModalOpen(true)}
        className="fixed bottom-24 right-6 z-30 w-14 h-14 rounded-full bg-[#1CB0F6] text-white text-2xl font-bold border-b-4 border-[#1899D6] active:translate-y-1 active:border-b-0 transition-all shadow-lg"
      >
        +
      </button>

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-sm rounded-3xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-extrabold">Nova Técnica</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-sm font-extrabold">Nome</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Triângulo"
                className="rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-extrabold">Categoria</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="rounded-xl font-bold">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TECHNIQUE_CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-extrabold">Proficiência</Label>
              <div className="flex gap-2">
                {[1, 2, 3].map((n) => {
                  const pc = PROFICIENCY_CONFIG[n]
                  return (
                    <button
                      key={n}
                      onClick={() => setProficiency(n)}
                      className={cn(
                        'flex-1 py-3 rounded-xl font-bold text-xs border-b-4 transition-all',
                        proficiency === n
                          ? pc.color + ' border-current'
                          : 'bg-muted text-muted-foreground border-transparent',
                      )}
                    >
                      {pc.emoji} {pc.label}
                    </button>
                  )
                })}
              </div>
            </div>
            <Button
              onClick={handleSubmit}
              className="w-full py-6 rounded-3xl bg-[#1CB0F6] hover:bg-[#1899D6] text-white font-extrabold border-b-4 border-[#1899D6] active:translate-y-1 active:border-b-0 transition-all"
            >
              Adicionar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
