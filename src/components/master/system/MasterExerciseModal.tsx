import { useState, useMemo } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  useSystemStore,
  type GlobalExercise,
  type NewGlobalExerciseInput,
} from '@/stores/useSystemStore'
import { Dumbbell, Check } from 'lucide-react'
import { toast } from 'sonner'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  exerciseToEdit?: GlobalExercise | null
}

const MUSCLE_GROUPS = [
  'Peito',
  'Costas',
  'Pernas',
  'Ombros',
  'Braços',
  'Core',
  'Cardio',
  'Corpo Inteiro',
  'Outro',
]

export function MasterExerciseModal({ open, onOpenChange, exerciseToEdit }: Props) {
  const { createExercise, updateExercise } = useSystemStore()

  const [name, setName] = useState('')
  const [muscleGroup, setMuscleGroup] = useState('Peito')
  const [equipment, setEquipment] = useState('')
  const [difficulty, setDifficulty] = useState<'Iniciante' | 'Intermediário' | 'Avançado'>(
    'Iniciante',
  )
  const [instructions, setInstructions] = useState('')
  const [videoUrl, setVideoUrl] = useState('')
  const [isActive, setIsActive] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleOpenChange = (isOpen: boolean) => {
    if (isOpen) {
      if (exerciseToEdit) {
        setName(exerciseToEdit.name)
        setMuscleGroup(exerciseToEdit.muscleGroup)
        setEquipment(exerciseToEdit.equipment || '')
        setDifficulty(exerciseToEdit.difficulty || 'Iniciante')
        setInstructions(exerciseToEdit.instructions || '')
        setVideoUrl(exerciseToEdit.videoUrl || '')
        setIsActive(exerciseToEdit.isActive)
      } else {
        setName('')
        setMuscleGroup('Peito')
        setEquipment('')
        setDifficulty('Iniciante')
        setInstructions('')
        setVideoUrl('')
        setIsActive(true)
      }
    }
    onOpenChange(isOpen)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      toast.error('Informe o nome do exercício')
      return
    }

    const payload: NewGlobalExerciseInput = {
      name: name.trim(),
      muscleGroup,
      equipment: equipment.trim() || null,
      difficulty,
      instructions: instructions.trim() || null,
      videoUrl: videoUrl.trim(),
      isActive,
    }

    setIsSubmitting(true)
    let ok = false
    if (exerciseToEdit) {
      ok = await updateExercise(exerciseToEdit.id, payload)
    } else {
      ok = await createExercise(payload)
    }
    setIsSubmitting(false)

    if (ok) {
      onOpenChange(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-lg rounded-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-2xl bg-[#FF9600]/10 text-[#FF9600] border-2 border-[#FF9600]/30">
              <Dumbbell className="w-5 h-5" />
            </span>
            <div>
              <DialogTitle className="text-xl font-black">
                {exerciseToEdit ? 'Editar Exercício da Biblioteca' : 'Novo Exercício da Biblioteca'}
              </DialogTitle>
              <DialogDescription className="text-xs font-semibold">
                Catálogo global de exercícios acessível nos treinos de todos os usuários
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <Label className="text-xs font-extrabold">Nome do Exercício *</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Supino Reto com Barra"
              className="rounded-2xl border-2 font-bold"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-extrabold">Grupo Muscular *</Label>
              <Select value={muscleGroup} onValueChange={setMuscleGroup}>
                <SelectTrigger className="rounded-2xl border-2 font-bold">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MUSCLE_GROUPS.map((mg) => (
                    <SelectItem key={mg} value={mg}>
                      {mg}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-extrabold">Dificuldade</Label>
              <Select
                value={difficulty}
                onValueChange={(v) =>
                  setDifficulty(v as 'Iniciante' | 'Intermediário' | 'Avançado')
                }
              >
                <SelectTrigger className="rounded-2xl border-2 font-bold">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Iniciante">Iniciante</SelectItem>
                  <SelectItem value="Intermediário">Intermediário</SelectItem>
                  <SelectItem value="Avançado">Avançado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-extrabold">Equipamento / Aparelho</Label>
            <Input
              value={equipment}
              onChange={(e) => setEquipment(e.target.value)}
              placeholder="Ex: Barra e Banco, Halteres, Polia, Máquina Smith"
              className="rounded-2xl border-2 font-bold"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-extrabold">Instruções de Execução (opcional)</Label>
            <Textarea
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              placeholder="Descreva a postura, trajetória do movimento, respiração e dicas de segurança..."
              rows={4}
              className="rounded-2xl border-2 text-xs font-semibold p-3"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-extrabold">URL de Vídeo / Demonstração (opcional)</Label>
            <Input
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
              placeholder="https://..."
              className="rounded-2xl border-2 font-bold"
            />
          </div>

          <div className="flex items-center justify-between p-3 rounded-2xl bg-muted/30 border-2">
            <div>
              <Label className="text-xs font-extrabold block">Exercício Ativo</Label>
              <span className="text-[11px] text-muted-foreground font-semibold">
                Exercícios ativos são exibidos aos usuários na biblioteca de treinos
              </span>
            </div>
            <Switch checked={isActive} onCheckedChange={setIsActive} />
          </div>

          <div className="pt-2 flex gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="w-1/3 rounded-2xl h-12 font-bold border-2"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 rounded-2xl h-12 font-black bg-[#FF9600] hover:bg-[#E68700] text-white border-b-4 border-[#CC7800] active:translate-y-1 active:border-b-0 transition-all flex items-center justify-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>{exerciseToEdit ? 'Salvar Exercício' : 'Criar Exercício'}</span>
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
