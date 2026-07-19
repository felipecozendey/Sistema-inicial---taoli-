import { useState, useEffect } from 'react'
import { useAppStore } from '@/stores/useAppStore'
import { Trash2, Plus } from 'lucide-react'

export function JiuSettingsTab() {
  const jiuCategories = useAppStore((s) => s.jiuCategories)
  const fetchJiuCategories = useAppStore((s) => s.fetchJiuCategories)
  const addJiuCategory = useAppStore((s) => s.addJiuCategory)
  const deleteJiuCategory = useAppStore((s) => s.deleteJiuCategory)
  const [newCat, setNewCat] = useState('')

  useEffect(() => {
    fetchJiuCategories()
  }, [fetchJiuCategories])

  const handleAdd = () => {
    if (!newCat.trim()) return
    addJiuCategory(newCat.trim())
    setNewCat('')
  }

  return (
    <div className="space-y-6 pb-24">
      <div className="bg-card rounded-3xl p-6 border-2 border-b-4 border-[#E5E5E5] dark:border-[#3B4A55]">
        <h3 className="font-extrabold text-lg mb-2">⚙️ Gerenciar Categorias</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Crie categorias personalizadas para organizar suas técnicas do "Arte Suave".
        </p>
        <div className="flex gap-2 mb-4">
          <input
            value={newCat}
            onChange={(e) => setNewCat(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
            placeholder="Ex: Guarda De La Riva"
            className="flex-1 px-4 py-3 rounded-xl bg-muted border-2 border-transparent focus:border-[#1CB0F6] outline-none font-bold text-sm"
          />
          <button
            onClick={handleAdd}
            className="flex items-center gap-1 px-4 py-3 rounded-xl bg-[#58CC02] hover:bg-[#46A302] text-white font-extrabold text-sm border-b-4 border-[#46A302] active:translate-y-1 active:border-b-0 transition-all duration-150 whitespace-nowrap"
          >
            <Plus className="w-4 h-4" strokeWidth={3} />
            Nova Categoria
          </button>
        </div>
        <div className="space-y-2">
          {jiuCategories.length > 0 ? (
            jiuCategories.map((cat) => (
              <div
                key={cat.id}
                className="flex items-center justify-between bg-muted/50 rounded-xl px-4 py-3"
              >
                <span className="font-bold text-sm">{cat.name}</span>
                <button
                  onClick={() => deleteJiuCategory(cat.id)}
                  className="text-muted-foreground hover:text-[#FF4B4B] transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))
          ) : (
            <p className="text-sm text-muted-foreground italic text-center py-4">
              Nenhuma categoria criada ainda.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
