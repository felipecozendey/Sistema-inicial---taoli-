import { useEffect, useState, useMemo } from 'react'
import { supabase } from '@/lib/supabase/client'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Search, Dumbbell, ExternalLink } from 'lucide-react'

interface ExerciseRow {
  id: string
  name: string
  muscleGroup: string
  equipment: string | null
  difficulty: string | null
  instructions: string | null
  videoUrl: string
}

const MUSCLE_GROUPS = ['Todos', 'Peito', 'Costas', 'Pernas', 'Ombros', 'Braços', 'Core', 'Cardio']

export function GlobalExercisesCatalog() {
  const [exercises, setExercises] = useState<ExerciseRow[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selectedMuscle, setSelectedMuscle] = useState('Todos')

  useEffect(() => {
    async function fetchGlobalExercises() {
      setLoading(true)
      const { data } = await supabase
        .from('global_exercises')
        .select('*')
        .eq('is_active', true)
        .order('name', { ascending: true })

      if (data) {
        setExercises(
          data.map((r: any) => ({
            id: r.id,
            name: r.name,
            muscleGroup: r.muscle_group,
            equipment: r.equipment,
            difficulty: r.difficulty,
            instructions: r.instructions,
            videoUrl: r.video_url || '',
          })),
        )
      }
      setLoading(false)
    }

    fetchGlobalExercises()
  }, [])

  const filtered = useMemo(() => {
    return exercises.filter((ex) => {
      const matchSearch =
        ex.name.toLowerCase().includes(search.toLowerCase()) ||
        (ex.equipment && ex.equipment.toLowerCase().includes(search.toLowerCase())) ||
        (ex.instructions && ex.instructions.toLowerCase().includes(search.toLowerCase()))

      const matchMuscle = selectedMuscle === 'Todos' || ex.muscleGroup === selectedMuscle

      return matchSearch && matchMuscle
    })
  }, [exercises, search, selectedMuscle])

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="relative flex-1 sm:w-80">
          <Search className="w-4 h-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nome, aparelho, instruções..."
            className="pl-9 rounded-2xl border-2 h-11 text-xs font-bold"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {MUSCLE_GROUPS.map((mg) => (
            <button
              key={mg}
              type="button"
              onClick={() => setSelectedMuscle(mg)}
              className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all border-b-2 active:border-b-0 whitespace-nowrap ${
                selectedMuscle === mg
                  ? 'bg-[#FF9600] text-white border-[#CC7800]'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              {mg}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between text-xs font-bold text-muted-foreground px-1">
        <span>
          Mostrando {filtered.length} de {exercises.length} exercícios na biblioteca global
        </span>
        <Badge
          variant="outline"
          className="text-[10px] font-extrabold rounded-full border-blue-500/30 text-blue-600 bg-blue-500/10"
        >
          Biblioteca do Sistema
        </Badge>
      </div>

      {loading ? (
        <div className="p-8 text-center text-xs font-bold text-muted-foreground">
          Carregando biblioteca de exercícios...
        </div>
      ) : filtered.length === 0 ? (
        <Card className="rounded-3xl border-2 p-12 text-center bg-card">
          <Dumbbell className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
          <p className="font-extrabold text-foreground">Nenhum exercício encontrado</p>
          <p className="text-xs text-muted-foreground mt-1">
            Tente buscar por outro termo ou selecione outro grupo muscular.
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map((ex) => (
            <Card
              key={ex.id}
              className="rounded-3xl border-2 border-b-4 border-b-[#FF9600]/40 p-4 bg-card shadow-sm transition-all hover:translate-y-[-2px] flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <div className="min-w-0">
                    <h4 className="font-black text-sm text-foreground truncate">{ex.name}</h4>
                    <p className="text-xs text-muted-foreground font-semibold mt-0.5">
                      {ex.muscleGroup}
                      {ex.equipment && ` · ${ex.equipment}`}
                    </p>
                  </div>
                  {ex.difficulty && (
                    <Badge
                      variant="secondary"
                      className="text-[10px] font-extrabold rounded-full px-2 py-0.5"
                    >
                      {ex.difficulty}
                    </Badge>
                  )}
                </div>

                {ex.instructions && (
                  <p className="text-xs text-muted-foreground line-clamp-3 mt-2 leading-relaxed bg-muted/30 p-2.5 rounded-xl">
                    {ex.instructions}
                  </p>
                )}
              </div>

              {ex.videoUrl && (
                <div className="pt-3 mt-3 border-t flex justify-end">
                  <a
                    href={ex.videoUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[11px] font-bold text-[#1CB0F6] hover:underline flex items-center gap-1"
                  >
                    Vídeo demonstrativo <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
