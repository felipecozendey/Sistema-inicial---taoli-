import { useState, useEffect, useMemo } from 'react'
import { useAppStore, type JiuTechnique } from '@/stores/useAppStore'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'
import { PROFICIENCY_CONFIG } from '@/components/health/jiu-constants'
import { JiuTechniqueDetail } from '@/components/health/jiu-technique-detail'

const DEFAULT_CATS = ['Queda', 'Passagem', 'Raspagem', 'Finalização', 'Defesa']

export function JiuArsenal() {
  const jiuTechniques = useAppStore((s) => s.jiuTechniques)
  const jiuCategories = useAppStore((s) => s.jiuCategories)
  const fetchJiuTechniques = useAppStore((s) => s.fetchJiuTechniques)
  const fetchJiuCategories = useAppStore((s) => s.fetchJiuCategories)
  const addJiuTechnique = useAppStore((s) => s.addJiuTechnique)
  const deleteJiuTechnique = useAppStore((s) => s.deleteJiuTechnique)
  const [modalOpen, setModalOpen] = useState(false)
  const [detailTech, setDetailTech] = useState<JiuTechnique | null>(null)
  const [search, setSearch] = useState('')
  const [filterCat, setFilterCat] = useState('all')
  const [name, setName] = useState('')
  const [category, setCategory] = useState('')
  const [proficiency, setProficiency] = useState(1)
  const [notes, setNotes] = useState('')
  const [videoUrl, setVideoUrl] = useState('')

  useEffect(() => {
    fetchJiuTechniques()
    fetchJiuCategories()
  }, [fetchJiuTechniques, fetchJiuCategories])

  const catNames = useMemo(
    () => (jiuCategories.length > 0 ? jiuCategories.map((c) => c.name) : DEFAULT_CATS),
    [jiuCategories],
  )

  const filtered = useMemo(
    () =>
      jiuTechniques.filter((t) => {
        const ms = t.name.toLowerCase().includes(search.toLowerCase())
        const mc = filterCat === 'all' || t.category === filterCat
        return ms && mc
      }),
    [jiuTechniques, search, filterCat],
  )

  const handleSubmit = () => {
    if (!name.trim()) return
    addJiuTechnique({
      name: name.trim(),
      category: category || catNames[0] || 'Queda',
      proficiency,
      notes: notes.trim(),
      videoUrl: videoUrl.trim(),
    })
    setModalOpen(false)
    setName('')
    setCategory('')
    setProficiency(1)
    setNotes('')
    setVideoUrl('')
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="🔍 Buscar técnica..."
          className="rounded-xl font-bold"
        />
        <Select value={filterCat} onValueChange={setFilterCat}>
          <SelectTrigger className="w-40 rounded-xl font-bold">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            {catNames.map((c) => (
              <SelectItem key={c} value={c}>
                {c}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {filtered.length > 0 ? (
        <div className="space-y-2">
          {filtered.map((t) => {
            const pc = PROFICIENCY_CONFIG[t.proficiency]
            return (
              <div
                key={t.id}
                onClick={() => setDetailTech(t)}
                className="bg-card rounded-2xl p-4 border-2 border-b-4 border-[#E5E5E5] dark:border-[#3B4A55] flex items-center justify-between cursor-pointer hover:border-[#1CB0F6] transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <span className="font-bold block truncate">{t.name}</span>
                  <span className="text-xs text-muted-foreground">{t.category}</span>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span
                    className={cn('text-xs font-extrabold px-2 py-1 rounded-full border', pc.color)}
                  >
                    {pc.emoji} {pc.label}
                  </span>
                  {t.videoUrl && (
                    <a
                      href={t.videoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="text-[#1CB0F6] hover:text-[#1899D6] text-sm"
                    >
                      📺
                    </a>
                  )}
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      deleteJiuTechnique(t.id)
                    }}
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
        <p className="text-sm text-muted-foreground italic text-center py-8">
          {search || filterCat !== 'all'
            ? 'Nenhuma técnica encontrada'
            : 'Nenhuma técnica cadastrada'}
        </p>
      )}

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
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  {catNames.map((c) => (
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
            <div className="space-y-2">
              <Label className="text-sm font-extrabold">Observações Detalhadas</Label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Detalhes da técnica, pontos chave..."
                className="rounded-xl min-h-[80px]"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-extrabold">Link de Estudo (Vídeo URL)</Label>
              <Input
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
                placeholder="https://youtube.com/..."
                className="rounded-xl"
              />
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

      <JiuTechniqueDetail tech={detailTech} onOpenChange={(v) => !v && setDetailTech(null)} />
    </div>
  )
}
