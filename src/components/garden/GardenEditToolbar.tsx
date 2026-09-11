import React from 'react'
import { useGardenDecorationsStore } from '@/stores/useGardenDecorationsStore'
import { getShopItem } from './shop-catalog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Package, X, Check, Trash2, ShoppingBag } from 'lucide-react'

interface GardenEditToolbarProps {
  onOpenShop: () => void
}

export const GardenEditToolbar: React.FC<GardenEditToolbarProps> = ({ onOpenShop }) => {
  const {
    isEditing,
    startEditing,
    cancelEditing,
    saveEditing,
    draftInventory,
    selectedItemToPlace,
    selectItemToPlace,
    selectedPlacedId,
    selectPlacedItem,
    removePlacedItem,
    clearDraft,
  } = useGardenDecorationsStore()

  if (!isEditing) {
    return (
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-3xl bg-card border-2 border-b-4 border-[#E5E5E5] dark:border-[#3B4A55] shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#58CC02]/15 text-[#58CC02] flex items-center justify-center font-bold">
            <Package className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-extrabold text-sm text-foreground">Decoração Livre</h4>
            <p className="text-xs text-muted-foreground font-semibold">
              Entre no modo de edição para posicionar seus ornamentos e mover elementos na fazenda.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            onClick={onOpenShop}
            variant="outline"
            className="rounded-2xl border-2 border-b-4 font-black text-xs h-10 px-4 hover:bg-muted active:border-b-2 active:translate-y-0.5 gap-2"
          >
            <ShoppingBag className="w-4 h-4 text-[#58CC02]" />
            <span>Lojinha</span>
          </Button>

          <Button
            type="button"
            onClick={startEditing}
            className="rounded-2xl bg-[#58CC02] hover:bg-[#46a302] text-white border-b-4 border-[#46a302] active:border-b-0 active:translate-y-1 font-black text-xs h-10 px-5 shadow-sm gap-2 transition-all"
          >
            <span>Editar Jardim</span>
          </Button>
        </div>
      </div>
    )
  }

  // Itens disponíveis na mochila do modo edição
  const inventoryEntries = Object.entries(draftInventory).filter(([_, count]) => count > 0)
  const totalItemsInBackpack = inventoryEntries.reduce((acc, [_, count]) => acc + count, 0)

  return (
    <div className="space-y-4 p-5 rounded-3xl bg-gradient-to-r from-amber-500/10 via-emerald-500/10 to-sky-500/10 border-2 border-amber-400 dark:border-amber-500/40 shadow-md animate-in fade-in-50">
      {/* Barra de controle principal */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Badge className="bg-amber-500 text-white font-extrabold text-[11px] rounded-full px-2.5 py-0.5 border-0">
              Modo Edição Ativo
            </Badge>
            <h3 className="text-base font-black tracking-tight text-foreground">
              Toque em uma posição para colocar ou mover
            </h3>
          </div>
          <p className="text-xs text-muted-foreground font-semibold mt-1">
            Selecione um item da mochila abaixo e toque em um espaço livre do jardim. Toque em um
            item colocado para movê-lo ou guardá-lo.
          </p>
        </div>

        {/* Botões de Ação */}
        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={clearDraft}
            className="rounded-2xl font-bold text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 gap-1.5 h-10 px-3"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Limpar Jardim</span>
          </Button>

          <Button
            type="button"
            variant="outline"
            onClick={cancelEditing}
            className="rounded-2xl border-2 border-b-4 font-black text-xs h-10 px-4 hover:bg-muted active:border-b-2 active:translate-y-0.5 gap-1.5"
          >
            <X className="w-4 h-4 text-rose-500" />
            <span>Cancelar</span>
          </Button>

          <Button
            type="button"
            onClick={saveEditing}
            className="rounded-2xl bg-[#58CC02] hover:bg-[#46a302] text-white border-b-4 border-[#46a302] active:border-b-0 active:translate-y-1 font-black text-xs h-10 px-5 shadow-sm gap-1.5 transition-all"
          >
            <Check className="w-4 h-4" />
            <span>Salvar Jardim</span>
          </Button>
        </div>
      </div>

      {/* Mochila de Itens */}
      <div className="pt-3 border-t border-border/80">
        <div className="flex items-center justify-between mb-2.5">
          <span className="text-xs font-black uppercase text-foreground flex items-center gap-1.5">
            <Package className="w-3.5 h-3.5 text-[#58CC02]" />
            Mochila: Meus Itens ({totalItemsInBackpack})
          </span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onOpenShop}
            className="h-7 text-[11px] rounded-xl font-extrabold border-2 gap-1 px-2.5"
          >
            <ShoppingBag className="w-3 h-3 text-[#58CC02]" />
            Comprar mais
          </Button>
        </div>

        {inventoryEntries.length === 0 ? (
          <div className="p-4 rounded-2xl bg-white/60 dark:bg-card/60 border-2 border-dashed border-border text-center">
            <p className="text-xs font-bold text-muted-foreground">
              Sua mochila está sem itens sobrando. Todos já estão no jardim ou visite a Lojinha!
            </p>
          </div>
        ) : (
          <div className="flex items-center gap-3 overflow-x-auto pb-2 pt-1 scrollbar-thin">
            {inventoryEntries.map(([itemKey, count]) => {
              const shopItem = getShopItem(itemKey)
              if (!shopItem) return null
              const isSelected = selectedItemToPlace === itemKey

              return (
                <button
                  key={itemKey}
                  type="button"
                  onClick={() => selectItemToPlace(isSelected ? null : itemKey)}
                  className={`group relative flex items-center gap-2.5 p-2 rounded-2xl border-2 transition-all shrink-0 ${
                    isSelected
                      ? 'bg-white dark:bg-card border-[#58CC02] shadow-md ring-2 ring-[#58CC02]/40 -translate-y-0.5'
                      : 'bg-white/80 dark:bg-card/80 border-border hover:border-[#58CC02]/60 hover:bg-white dark:hover:bg-card'
                  }`}
                >
                  <div className="w-10 h-10 rounded-xl bg-muted/60 flex items-center justify-center shrink-0">
                    {shopItem.renderSprite('w-8 h-8')}
                  </div>
                  <div className="text-left pr-2">
                    <p className="text-xs font-black text-foreground leading-tight line-clamp-1">
                      {shopItem.name}
                    </p>
                    <span className="text-[10px] font-extrabold text-[#58CC02]">
                      x{count} disp.
                    </span>
                  </div>
                  {isSelected && (
                    <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-[#58CC02] text-white flex items-center justify-center text-[10px] font-black shadow">
                      ✓
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        )}
      </div>

      {/* Dica para o item selecionado para movimentação */}
      {selectedPlacedId && (
        <div className="flex items-center justify-between p-3 rounded-2xl bg-sky-50 dark:bg-sky-950/40 border border-sky-300 text-sky-900 dark:text-sky-200 text-xs font-bold animate-in fade-in-50">
          <span>Elemento selecionado! Toque em uma célula vazia para movê-lo.</span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => removePlacedItem(selectedPlacedId)}
              className="text-xs text-rose-600 hover:underline flex items-center gap-1"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Guardar na mochila
            </button>
            <button
              type="button"
              onClick={() => selectPlacedItem(null)}
              className="text-xs text-muted-foreground hover:underline ml-2"
            >
              Desmarcar
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
