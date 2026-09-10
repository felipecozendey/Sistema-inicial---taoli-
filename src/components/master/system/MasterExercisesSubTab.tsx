import { useState, useMemo } from 'react'
import { useSystemStore, type GlobalExercise } from '@/stores/useSystemStore'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
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
import { Search, Plus, Edit2, Trash2, Power, Dumbbell, ExternalLink } from 'lucide-react'
import { MasterExerciseModal } from './MasterExerciseModal'

const MUSCLE_GROUPS = ['Todos', 'Peito', 'Costas', 'Pernas', 'Ombros', 'Braços', 'Core', 'Cardio']

export function MasterExercisesSubTab() {
  const { globalExercises, updateExercise, deleteExercise } = useSystemStore()

  const [search, setSearch] = useState('')
  const [selectedMuscle, setSelectedMuscle] = useState<string>('Todos')
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all')

  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [editingExercise, setEditingExercise] = useState<GlobalExercise | null>(null)
  const [deletingExercise, setDeletingExercise] = useState<GlobalExercise | null>(null)

  const filteredExercises = useMemo(() => {
    return globalExercises.filter((ex) => {
      const matchSearch =
        ex.name.toLowerCase().includes(search.toLowerCase()) ||
        (ex.equipment && ex.equipment.toLowerCase().includes(search.toLowerCase())) ||
        (ex.instructions && ex.instructions.toLowerCase().includes(search.toLowerCase()))

      const matchMuscle = selectedMuscle === 'Todos' || ex.muscleGroup === selectedMuscle

      const matchDifficulty = selectedDifficulty === 'all' || ex.difficulty === selectedDifficulty

      const matchStatus =
        statusFilter === 'all' ||
        (statusFilter === 'active' && ex.isActive) ||
        (statusFilter === 'inactive' && !ex.isActive)

      return matchSearch && matchMuscle && matchDifficulty && matchStatus
    })
  }, [globalExercises, search, selectedMuscle, selectedDifficulty, statusFilter])

  const handleToggleStatus = async (ex: GlobalExercise) => {
    await updateExercise(ex.id, { isActive: !ex.isActive })
  }

  const handleDeleteConfirm = async () => {
    if (!deletingExercise) return
    await deleteExercise(deletingExercise.id)
    setDeletingExercise(null)
  }

  const getDifficultyColor = (diff: string | null) => {
    switch (diff) {
      case 'Iniciante':
        return 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30'
      case 'Intermediário':
        return 'bg-amber-500/10 text-amber-600 border-amber-500/30'
      case 'Avançado':
        return 'bg-rose-500/10 text-rose-600 border-rose-500/30'
      default:
        return 'bg-muted text-muted-foreground'
    }
  }

  return (
    <div className="space-y-4">
      {/* Top action bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          <div className="relative flex-1 sm:w-80">
            <Search className="w-4 h-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por nome, aparelho, instruções..."
              className="pl-9 rounded-2xl border-2 h-11 text-xs font-bold"
            />
          </div>

          <select
            value={selectedMuscle}
            onChange={(e) => setSelectedMuscle(e.target.value)}
            className="h-11 px-3 rounded-2xl border-2 bg-card text-xs font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-[#FF9600]"
          >
            {MUSCLE_GROUPS.map((mg) => (
              <option key={mg} value={mg}>
                {mg === 'Todos' ? `Todos Grupos (${globalExercises.length})` : mg}
              </option>
            ))}
          </select>

          <select
            value={selectedDifficulty}
            onChange={(e) => setSelectedDifficulty(e.target.value)}
            className="h-11 px-3 rounded-2xl border-2 bg-card text-xs font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-[#FF9600]"
          >
            <option value="all">Todas Dificuldades</option>
            <option value="Iniciante">Iniciante</option>
            <option value="Intermediário">Intermediário</option>
            <option value="Avançado">Avançado</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="h-11 px-3 rounded-2xl border-2 bg-card text-xs font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-[#FF9600]"
          >
            <option value="all">Todos Status</option>
            <option value="active">Ativos</option>
            <option value="inactive">Inativos</option>
          </select>
        </div>

        <Button
          onClick={() => {
            setEditingExercise(null)
            setCreateModalOpen(true)
          }}
          className="rounded-2xl h-11 px-4 font-black bg-[#FF9600] hover:bg-[#E68700] text-white border-b-4 border-[#CC7800] active:translate-y-1 active:border-b-0 transition-all text-xs flex items-center gap-1.5"
        >
          <Plus className="w-4 h-4" />
          <span>Novo Exercício</span>
        </Button>
      </div>

      {/* Counter */}
      <div className="flex items-center justify-between text-xs font-bold text-muted-foreground px-1">
        <span>
          Mostrando {filteredExercises.length} de {globalExercises.length} exercícios na biblioteca
        </span>
        <span className="hidden sm:inline">
          {globalExercises.filter((e) => e.isActive).length} ativos ·{' '}
          {globalExercises.filter((e) => !e.isActive).length} inativos
        </span>
      </div>

      {/* Cards Grid */}
      {filteredExercises.length === 0 ? (
        <Card className="rounded-3xl border-2 p-12 text-center bg-card">
          <Dumbbell className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
          <p className="font-extrabold text-foreground">Nenhum exercício encontrado</p>
          <p className="text-xs text-muted-foreground mt-1">
            Cadastre um novo exercício na biblioteca para disponibilizar aos alunos.
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {filteredExercises.map((ex) => (
            <Card
              key={ex.id}
              className={`rounded-3xl border-2 border-b-4 p-4 bg-card shadow-sm transition-all hover:translate-y-[-2px] flex flex-col justify-between ${
                ex.isActive ? 'border-b-[#FF9600]/40' : 'border-b-muted-foreground/30 opacity-75'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="min-w-0">
                    <h4 className="font-black text-sm text-foreground truncate">{ex.name}</h4>
                    <p className="text-xs text-muted-foreground font-semibold mt-0.5">
                      {ex.muscleGroup}
                      {ex.equipment && ` · ${ex.equipment}`}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 shrink-0">
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => handleToggleStatus(ex)}
                      title={ex.isActive ? 'Desativar exercício' : 'Ativar exercício'}
                      className={`h-8 w-8 rounded-xl ${
                        ex.isActive
                          ? 'text-[#58CC02] hover:bg-[#58CC02]/10'
                          : 'text-muted-foreground hover:bg-muted'
                      }`}
                    >
                      <Power className="w-4 h-4" />
                    </Button>

                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => {
                        setEditingExercise(ex)
                        setCreateModalOpen(true)
                      }}
                      title="Editar exercício"
                      className="h-8 w-8 rounded-xl text-foreground hover:bg-muted"
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>

                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => setDeletingExercise(ex)}
                      title="Excluir exercício"
                      className="h-8 w-8 rounded-xl text-rose-500 hover:bg-rose-500/10"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {/* Instructions */}
                {ex.instructions && (
                  <p className="text-xs text-muted-foreground line-clamp-2 mt-2 leading-relaxed bg-muted/30 p-2 rounded-xl">
                    {ex.instructions}
                  </p>
                )}
              </div>

              {/* Bottom footer tags */}
              <div className="pt-3 mt-3 border-t flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5 flex-wrap">
                  {ex.difficulty && (
                    <span
                      className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${getDifficultyColor(
                        ex.difficulty,
                      )}`}
                    >
                      {ex.difficulty}
                    </span>
                  )}
                  <Badge
                    variant="secondary"
                    className={`text-[10px] font-extrabold rounded-full px-2 py-0.5 ${
                      ex.isActive
                        ? 'bg-[#58CC02]/15 text-[#58CC02]'
                        : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {ex.isActive ? 'Ativo' : 'Inativo'}
                  </Badge>
                </div>

                {ex.videoUrl && (
                  <a
                    href={ex.videoUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[11px] font-bold text-[#1CB0F6] hover:underline flex items-center gap-1"
                  >
                    Vídeo <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Modal create/edit */}
      <MasterExerciseModal
        open={createModalOpen}
        onOpenChange={setCreateModalOpen}
        exerciseToEdit={editingExercise}
      />

      {/* Delete confirmation dialog */}
      <AlertDialog open={!!deletingExercise} onOpenChange={(o) => !o && setDeletingExercise(null)}>
        <AlertDialogContent className="rounded-3xl max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-lg font-black">
              Excluir Exercício da Biblioteca?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs font-semibold">
              Tem certeza de que deseja remover o exercício "{deletingExercise?.name}" da biblioteca
              global? Fichas e treinos históricos já salvos continuarão intactos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel className="rounded-2xl font-bold border-2">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="rounded-2xl font-black bg-rose-500 hover:bg-rose-600 text-white"
            >
              Excluir Exercício
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
