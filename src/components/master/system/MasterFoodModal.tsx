import { useState } from 'react'
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
import { Switch } from '@/components/ui/switch'
import { useSystemStore, type GlobalFood, type NewGlobalFoodInput } from '@/stores/useSystemStore'
import { Utensils, Check } from 'lucide-react'
import { toast } from 'sonner'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  foodToEdit?: GlobalFood | null
}

const CATEGORY_SUGGESTIONS = [
  'Cereais',
  'Leguminosas',
  'Frutas',
  'Verduras e Legumes',
  'Carnes e Derivados',
  'Ovos e Derivados',
  'Leites e Derivados',
  'Óleos e Gorduras',
  'Bebidas',
  'Suplementos',
  'TACO',
  'Geral',
]

export function MasterFoodModal({ open, onOpenChange, foodToEdit }: Props) {
  const { createFood, updateFood } = useSystemStore()

  const [name, setName] = useState('')
  const [category, setCategory] = useState('Geral')
  const [sourceTable, setSourceTable] = useState('TACO')
  const [baseUnit, setBaseUnit] = useState('100g')
  const [calories, setCalories] = useState('')
  const [carbsG, setCarbsG] = useState('')
  const [proteinG, setProteinG] = useState('')
  const [fatG, setFatG] = useState('')
  const [fibersG, setFibersG] = useState('')
  const [sodiumMg, setSodiumMg] = useState('')
  const [allergens, setAllergens] = useState('')
  const [tagsStr, setTagsStr] = useState('')
  const [isActive, setIsActive] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Reset or populate on open
  const handleOpenChange = (isOpen: boolean) => {
    if (isOpen) {
      if (foodToEdit) {
        setName(foodToEdit.name)
        setCategory(foodToEdit.category || 'Geral')
        setSourceTable(foodToEdit.sourceTable || 'TACO')
        setBaseUnit(foodToEdit.baseUnit || '100g')
        setCalories(String(foodToEdit.calories))
        setCarbsG(String(foodToEdit.carbsG))
        setProteinG(String(foodToEdit.proteinG))
        setFatG(String(foodToEdit.fatG))
        setFibersG(String(foodToEdit.fibersG))
        setSodiumMg(String(foodToEdit.sodiumMg))
        setAllergens(foodToEdit.allergens || '')
        setTagsStr((foodToEdit.tags || []).join(', '))
        setIsActive(foodToEdit.isActive)
      } else {
        setName('')
        setCategory('Cereais')
        setSourceTable('TACO')
        setBaseUnit('100g')
        setCalories('0')
        setCarbsG('0')
        setProteinG('0')
        setFatG('0')
        setFibersG('0')
        setSodiumMg('0')
        setAllergens('')
        setTagsStr('taco')
        setIsActive(true)
      }
    }
    onOpenChange(isOpen)
  }

  const parseNum = (v: string) => Math.max(0, parseFloat(v) || 0)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      toast.error('Informe o nome do alimento')
      return
    }

    const tags = tagsStr
      .split(',')
      .map((t) => t.trim().toLowerCase())
      .filter(Boolean)

    const payload: NewGlobalFoodInput = {
      name: name.trim(),
      category: category.trim() || 'Geral',
      sourceTable: (sourceTable.trim() || 'TACO').toUpperCase(),
      baseUnit: baseUnit.trim() || '100g',
      calories: parseNum(calories),
      carbsG: parseNum(carbsG),
      proteinG: parseNum(proteinG),
      fatG: parseNum(fatG),
      fibersG: parseNum(fibersG),
      sodiumMg: parseNum(sodiumMg),
      allergens: allergens.trim() || null,
      tags,
      isActive,
    }

    setIsSubmitting(true)
    let ok = false
    if (foodToEdit) {
      ok = await updateFood(foodToEdit.id, payload)
    } else {
      ok = await createFood(payload)
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
            <span className="p-2 rounded-2xl bg-[#58CC02]/10 text-[#58CC02] border-2 border-[#58CC02]/30">
              <Utensils className="w-5 h-5" />
            </span>
            <div>
              <DialogTitle className="text-xl font-black">
                {foodToEdit ? 'Editar Alimento Oficial' : 'Novo Alimento Oficial'}
              </DialogTitle>
              <DialogDescription className="text-xs font-semibold">
                Tabela nutricional global (visível a todos os usuários como item oficial)
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <Label className="text-xs font-extrabold">Nome do Alimento *</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Arroz integral cozido"
              className="rounded-2xl border-2 font-bold"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-extrabold">Tabela de Origem *</Label>
              <div className="space-y-1">
                <Input
                  value={sourceTable}
                  onChange={(e) => setSourceTable(e.target.value.toUpperCase())}
                  placeholder="Ex: TACO, USDA, IBGE"
                  className="rounded-2xl border-2 font-bold uppercase font-mono text-xs"
                  required
                />
                <div className="flex flex-wrap gap-1">
                  {['TACO', 'USDA', 'IBGE'].map((sug) => (
                    <button
                      key={sug}
                      type="button"
                      onClick={() => setSourceTable(sug)}
                      className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-muted hover:bg-muted-foreground/20 text-muted-foreground"
                    >
                      {sug}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-extrabold">Categoria</Label>
              <Input
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="Ex: Cereais, Frutas, Carnes"
                list="category-suggestions"
                className="rounded-2xl border-2 font-bold"
              />
              <datalist id="category-suggestions">
                {CATEGORY_SUGGESTIONS.map((c) => (
                  <option key={c} value={c} />
                ))}
              </datalist>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-extrabold">Porção / Unidade Base</Label>
              <Input
                value={baseUnit}
                onChange={(e) => setBaseUnit(e.target.value)}
                placeholder="Ex: 100g, 1 unidade (50g)"
                className="rounded-2xl border-2 font-bold"
              />
            </div>
          </div>

          {/* Macros Grid */}
          <div className="p-3.5 rounded-2xl bg-muted/40 border-2 space-y-3">
            <p className="text-xs font-black uppercase tracking-wider text-muted-foreground">
              Composição Nutricional (por porção base)
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              <div className="space-y-1">
                <span className="text-[11px] font-bold text-muted-foreground">Calorias (kcal)</span>
                <Input
                  type="number"
                  step="any"
                  min="0"
                  value={calories}
                  onChange={(e) => setCalories(e.target.value)}
                  className="rounded-xl border-2 font-extrabold text-sm text-[#FF4B4B]"
                />
              </div>

              <div className="space-y-1">
                <span className="text-[11px] font-bold text-muted-foreground">
                  Carboidratos (g)
                </span>
                <Input
                  type="number"
                  step="any"
                  min="0"
                  value={carbsG}
                  onChange={(e) => setCarbsG(e.target.value)}
                  className="rounded-xl border-2 font-extrabold text-sm text-[#FFC800]"
                />
              </div>

              <div className="space-y-1">
                <span className="text-[11px] font-bold text-muted-foreground">Proteínas (g)</span>
                <Input
                  type="number"
                  step="any"
                  min="0"
                  value={proteinG}
                  onChange={(e) => setProteinG(e.target.value)}
                  className="rounded-xl border-2 font-extrabold text-sm text-[#58CC02]"
                />
              </div>

              <div className="space-y-1">
                <span className="text-[11px] font-bold text-muted-foreground">Gorduras (g)</span>
                <Input
                  type="number"
                  step="any"
                  min="0"
                  value={fatG}
                  onChange={(e) => setFatG(e.target.value)}
                  className="rounded-xl border-2 font-extrabold text-sm text-[#1CB0F6]"
                />
              </div>

              <div className="space-y-1">
                <span className="text-[11px] font-bold text-muted-foreground">Fibras (g)</span>
                <Input
                  type="number"
                  step="any"
                  min="0"
                  value={fibersG}
                  onChange={(e) => setFibersG(e.target.value)}
                  className="rounded-xl border-2 font-extrabold text-sm text-emerald-600"
                />
              </div>

              <div className="space-y-1">
                <span className="text-[11px] font-bold text-muted-foreground">Sódio (mg)</span>
                <Input
                  type="number"
                  step="any"
                  min="0"
                  value={sodiumMg}
                  onChange={(e) => setSodiumMg(e.target.value)}
                  className="rounded-xl border-2 font-extrabold text-sm text-neutral-600 dark:text-neutral-300"
                />
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-extrabold">Alérgenos conhecidos (opcional)</Label>
            <Input
              value={allergens}
              onChange={(e) => setAllergens(e.target.value)}
              placeholder="Ex: Glúten, Lactose, Amendoim"
              className="rounded-2xl border-2 font-bold"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-extrabold">Tags (separadas por vírgula)</Label>
            <Input
              value={tagsStr}
              onChange={(e) => setTagsStr(e.target.value)}
              placeholder="Ex: taco, ibge, frutas, low-carb"
              className="rounded-2xl border-2 font-bold"
            />
          </div>

          <div className="flex items-center justify-between p-3 rounded-2xl bg-muted/30 border-2">
            <div>
              <Label className="text-xs font-extrabold block">Alimento Ativo no Catálogo</Label>
              <span className="text-[11px] text-muted-foreground font-semibold">
                Alimentos inativos não aparecem na busca dos usuários
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
              className="flex-1 rounded-2xl h-12 font-black bg-[#58CC02] hover:bg-[#46B302] text-white border-b-4 border-[#46A602] active:translate-y-1 active:border-b-0 transition-all flex items-center justify-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>{foodToEdit ? 'Salvar Alterações' : 'Criar Alimento'}</span>
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
