import { useState, useMemo } from 'react'
import { useFinanceStore, FinanceCategory } from '@/stores/useFinanceStore'
import { FinanceCategoryModal } from '@/components/finance/finance-category-modal'
import { toast } from 'sonner'
import { Plus, Pencil, Trash2, ChevronRight } from 'lucide-react'

export function FinanceSettingsTab() {
  const financeCategories = useFinanceStore((s) => s.financeCategories)
  const deleteFinanceCategory = useFinanceStore((s) => s.deleteFinanceCategory)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<FinanceCategory | null>(null)
  const [parentCategory, setParentCategory] = useState<FinanceCategory | null>(null)

  const { mainCategories, subcategoriesByParent } = useMemo(() => {
    const mains = financeCategories.filter((c) => !c.parentId)
    const subs: Record<string, FinanceCategory[]> = {}
    financeCategories
      .filter((c) => c.parentId)
      .forEach((c) => {
        if (c.parentId) {
          if (!subs[c.parentId]) subs[c.parentId] = []
          subs[c.parentId].push(c)
        }
      })
    return { mainCategories: mains, subcategoriesByParent: subs }
  }, [financeCategories])

  const openNewCategory = () => {
    setEditingCategory(null)
    setParentCategory(null)
    setModalOpen(true)
  }

  const openNewSubcategory = (parent: FinanceCategory) => {
    setEditingCategory(null)
    setParentCategory(parent)
    setModalOpen(true)
  }

  const openEditCategory = (cat: FinanceCategory) => {
    setEditingCategory(cat)
    setParentCategory(null)
    setModalOpen(true)
  }

  const handleDelete = (cat: FinanceCategory) => {
    deleteFinanceCategory(cat.id)
    toast.success('Categoria removida! 🗑️')
  }

  return (
    <div className="space-y-4 pb-24">
      <div className="flex items-center justify-between">
        <h3 className="font-extrabold text-lg">🏷️ Categorias Financeiras</h3>
        <button
          onClick={openNewCategory}
          className="flex items-center gap-1 px-4 py-2 rounded-2xl bg-[#58CC02] hover:bg-[#46A302] text-white font-extrabold text-sm border-b-4 border-[#46A302] active:translate-y-1 active:border-b-0 transition-all duration-150"
        >
          <Plus className="w-4 h-4" strokeWidth={3} />
          Nova
        </button>
      </div>

      {mainCategories.length === 0 ? (
        <div className="rounded-3xl p-8 bg-card border text-center">
          <p className="text-muted-foreground font-bold">Nenhuma categoria criada ainda.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {mainCategories.map((cat) => (
            <div
              key={cat.id}
              className="rounded-3xl p-4 bg-card border"
              style={{ borderColor: cat.color + '40' }}
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
                  style={{ backgroundColor: cat.color + '20' }}
                >
                  {cat.icon}
                </div>
                <p className="font-extrabold text-sm flex-1">{cat.name}</p>
                <button
                  onClick={() => openEditCategory(cat)}
                  className="text-muted-foreground hover:text-foreground p-1"
                >
                  <Pencil className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(cat)}
                  className="text-muted-foreground hover:text-[#FF4B4B] p-1"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {subcategoriesByParent[cat.id]?.length > 0 && (
                <div className="mt-3 space-y-1.5">
                  {subcategoriesByParent[cat.id].map((sub) => (
                    <div
                      key={sub.id}
                      className="flex items-center gap-2 pl-3 py-1.5 rounded-lg bg-muted/50"
                    >
                      <ChevronRight className="w-3 h-3 text-muted-foreground" />
                      <span className="text-sm">{sub.icon}</span>
                      <span className="font-bold text-xs flex-1">{sub.name}</span>
                      <button
                        onClick={() => openEditCategory(sub)}
                        className="text-muted-foreground hover:text-foreground"
                      >
                        <Pencil className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => handleDelete(sub)}
                        className="text-muted-foreground hover:text-[#FF4B4B]"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <button
                onClick={() => openNewSubcategory(cat)}
                className="mt-2 w-full py-2 rounded-xl bg-muted/50 hover:bg-muted font-bold text-xs text-muted-foreground transition-colors flex items-center justify-center gap-1"
              >
                <Plus className="w-3 h-3" strokeWidth={3} />
                Subcategoria
              </button>
            </div>
          ))}
        </div>
      )}

      <FinanceCategoryModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        editingCategory={editingCategory}
        parentCategory={parentCategory}
      />
    </div>
  )
}
