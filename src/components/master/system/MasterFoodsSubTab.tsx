import { useState, useMemo } from 'react'
import { useSystemStore, type GlobalFood } from '@/stores/useSystemStore'
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
import { Search, Plus, FileSpreadsheet, Edit2, Trash2, Power, Utensils, Filter } from 'lucide-react'
import { MasterFoodModal } from './MasterFoodModal'
import { MasterFoodImportModal } from './MasterFoodImportModal'

export function MasterFoodsSubTab() {
  const { globalFoods, updateFood, deleteFood } = useSystemStore()

  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all')

  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [importModalOpen, setImportModalOpen] = useState(false)
  const [editingFood, setEditingFood] = useState<GlobalFood | null>(null)
  const [deletingFood, setDeletingFood] = useState<GlobalFood | null>(null)

  const categories = useMemo(() => {
    const set = new Set<string>()
    globalFoods.forEach((f) => {
      if (f.category) set.add(f.category)
    })
    return Array.from(set).sort()
  }, [globalFoods])

  const filteredFoods = useMemo(() => {
    return globalFoods.filter((food) => {
      const matchSearch =
        food.name.toLowerCase().includes(search.toLowerCase()) ||
        food.category.toLowerCase().includes(search.toLowerCase()) ||
        (food.tags && food.tags.some((t) => t.toLowerCase().includes(search.toLowerCase())))

      const matchCategory = selectedCategory === 'all' || food.category === selectedCategory

      const matchStatus =
        statusFilter === 'all' ||
        (statusFilter === 'active' && food.isActive) ||
        (statusFilter === 'inactive' && !food.isActive)

      return matchSearch && matchCategory && matchStatus
    })
  }, [globalFoods, search, selectedCategory, statusFilter])

  const handleToggleStatus = async (food: GlobalFood) => {
    await updateFood(food.id, { isActive: !food.isActive })
  }

  const handleDeleteConfirm = async () => {
    if (!deletingFood) return
    await deleteFood(deletingFood.id)
    setDeletingFood(null)
  }

  return (
    <div className="space-y-4">
      {/* Top action bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="relative flex-1 sm:w-80">
            <Search className="w-4 h-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por nome, categoria ou tag..."
              className="pl-9 rounded-2xl border-2 h-11 text-xs font-bold"
            />
          </div>

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="h-11 px-3 rounded-2xl border-2 bg-card text-xs font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-[#58CC02]"
          >
            <option value="all">Todas Categorias ({globalFoods.length})</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="h-11 px-3 rounded-2xl border-2 bg-card text-xs font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-[#58CC02]"
          >
            <option value="all">Todos Status</option>
            <option value="active">Somente Ativos</option>
            <option value="inactive">Somente Inativos</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={() => setImportModalOpen(true)}
            variant="outline"
            className="rounded-2xl h-11 px-4 font-bold border-2 border-b-4 hover:bg-muted active:scale-95 transition-all text-xs flex items-center gap-1.5"
          >
            <FileSpreadsheet className="w-4 h-4 text-[#1CB0F6]" />
            <span>Importar Tabela (TACO)</span>
          </Button>

          <Button
            onClick={() => {
              setEditingFood(null)
              setCreateModalOpen(true)
            }}
            className="rounded-2xl h-11 px-4 font-black bg-[#58CC02] hover:bg-[#46B302] text-white border-b-4 border-[#46A602] active:translate-y-1 active:border-b-0 transition-all text-xs flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Novo Alimento</span>
          </Button>
        </div>
      </div>

      {/* Foods count and status */}
      <div className="flex items-center justify-between text-xs font-bold text-muted-foreground px-1">
        <span>
          Mostrando {filteredFoods.length} de {globalFoods.length} alimentos oficiais
        </span>
        <span className="hidden sm:inline">
          {globalFoods.filter((f) => f.isActive).length} ativos ·{' '}
          {globalFoods.filter((f) => !f.isActive).length} inativos
        </span>
      </div>

      {/* Cards list */}
      {filteredFoods.length === 0 ? (
        <Card className="rounded-3xl border-2 p-12 text-center bg-card">
          <Utensils className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
          <p className="font-extrabold text-foreground">Nenhum alimento oficial encontrado</p>
          <p className="text-xs text-muted-foreground mt-1">
            Cadastre um novo alimento ou use a importação em lote para preencher a tabela TACO.
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {filteredFoods.map((food) => (
            <Card
              key={food.id}
              className={`rounded-3xl border-2 border-b-4 p-4 bg-card shadow-sm transition-all hover:translate-y-[-2px] flex flex-col justify-between ${
                food.isActive ? 'border-b-[#58CC02]/40' : 'border-b-muted-foreground/30 opacity-75'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-black text-sm text-foreground truncate">{food.name}</h4>
                      <Badge
                        variant="secondary"
                        className={`text-[10px] font-extrabold rounded-full px-2 py-0.5 ${
                          food.isActive
                            ? 'bg-[#58CC02]/15 text-[#58CC02]'
                            : 'bg-muted text-muted-foreground'
                        }`}
                      >
                        {food.isActive ? 'Ativo' : 'Inativo'}
                      </Badge>
                      <Badge
                        variant="outline"
                        className="text-[10px] font-bold rounded-full border-blue-500/30 text-blue-600 bg-blue-500/10"
                      >
                        Tabela Oficial
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground font-semibold mt-0.5">
                      {food.category} · Porção: {food.baseUnit}
                      {food.allergens && ` · Alérgenos: ${food.allergens}`}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 shrink-0">
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => handleToggleStatus(food)}
                      title={food.isActive ? 'Desativar alimento' : 'Ativar alimento'}
                      className={`h-8 w-8 rounded-xl ${
                        food.isActive
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
                        setEditingFood(food)
                        setCreateModalOpen(true)
                      }}
                      title="Editar alimento"
                      className="h-8 w-8 rounded-xl text-foreground hover:bg-muted"
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>

                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => setDeletingFood(food)}
                      title="Excluir alimento"
                      className="h-8 w-8 rounded-xl text-rose-500 hover:bg-rose-500/10"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {/* Macros line */}
                <div className="grid grid-cols-4 sm:grid-cols-6 gap-1.5 pt-2 text-center text-xs">
                  <div className="bg-muted/40 rounded-xl p-1.5">
                    <span className="text-[10px] font-bold text-muted-foreground block">kcal</span>
                    <span className="font-extrabold text-[#FF4B4B]">{food.calories}</span>
                  </div>
                  <div className="bg-muted/40 rounded-xl p-1.5">
                    <span className="text-[10px] font-bold text-muted-foreground block">Carb</span>
                    <span className="font-extrabold text-[#FFC800]">{food.carbsG}g</span>
                  </div>
                  <div className="bg-muted/40 rounded-xl p-1.5">
                    <span className="text-[10px] font-bold text-muted-foreground block">Prot</span>
                    <span className="font-extrabold text-[#58CC02]">{food.proteinG}g</span>
                  </div>
                  <div className="bg-muted/40 rounded-xl p-1.5">
                    <span className="text-[10px] font-bold text-muted-foreground block">Gord</span>
                    <span className="font-extrabold text-[#1CB0F6]">{food.fatG}g</span>
                  </div>
                  <div className="bg-muted/40 rounded-xl p-1.5 hidden sm:block">
                    <span className="text-[10px] font-bold text-muted-foreground block">Fibra</span>
                    <span className="font-extrabold text-emerald-600">{food.fibersG}g</span>
                  </div>
                  <div className="bg-muted/40 rounded-xl p-1.5 hidden sm:block">
                    <span className="text-[10px] font-bold text-muted-foreground block">Sódio</span>
                    <span className="font-extrabold text-muted-foreground">{food.sodiumMg}mg</span>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Modal create/edit */}
      <MasterFoodModal
        open={createModalOpen}
        onOpenChange={setCreateModalOpen}
        foodToEdit={editingFood}
      />

      {/* Modal bulk import */}
      <MasterFoodImportModal open={importModalOpen} onOpenChange={setImportModalOpen} />

      {/* Delete confirmation dialog */}
      <AlertDialog open={!!deletingFood} onOpenChange={(o) => !o && setDeletingFood(null)}>
        <AlertDialogContent className="rounded-3xl max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-lg font-black">
              Excluir Alimento Oficial?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs font-semibold">
              Tem certeza de que deseja remover o alimento "{deletingFood?.name}" da tabela oficial?
              Essa ação não afetará refeições já registradas no histórico dos usuários.
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
              Excluir Alimento
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
