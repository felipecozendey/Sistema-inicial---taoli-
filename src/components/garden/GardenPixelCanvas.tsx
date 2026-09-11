import React from 'react'
import {
  useGardenDecorationsStore,
  GRID_COLS,
  GRID_ROWS,
  PlacedDecoration,
} from '@/stores/useGardenDecorationsStore'
import { getShopItem } from './shop-catalog'
import { Trash2, Move, Sparkles } from 'lucide-react'

export const GardenPixelCanvas: React.FC = () => {
  const {
    isEditing,
    placed,
    draftPlaced,
    selectedItemToPlace,
    selectedPlacedId,
    placeItemOnGrid,
    selectPlacedItem,
    removePlacedItem,
  } = useGardenDecorationsStore()

  const currentPlaced = isEditing ? draftPlaced : placed

  // Organizar itens por célula para renderização fácil
  // Chave: `${x},${y}`
  const cellsMap = new Map<string, PlacedDecoration[]>()
  currentPlaced.forEach((item) => {
    const key = `${item.x},${item.y}`
    const list = cellsMap.get(key) || []
    list.push(item)
    // Ordena pelo layer: 0 (chão) embaixo, 1 (objeto) em cima
    list.sort((a, b) => a.layer - b.layer)
    cellsMap.set(key, list)
  })

  const handleCellClick = (x: number, y: number) => {
    if (!isEditing) return
    placeItemOnGrid(x, y)
  }

  const handleItemClick = (e: React.MouseEvent, item: PlacedDecoration) => {
    if (!isEditing) return
    e.stopPropagation()

    // Se clicou no mesmo item já selecionado, desseleciona
    if (selectedPlacedId === item.id) {
      selectPlacedItem(null)
    } else {
      selectPlacedItem(item.id)
    }
  }

  return (
    <div className="relative w-full overflow-hidden rounded-3xl border-4 border-[#3F2817] shadow-xl bg-gradient-to-b from-sky-300 via-sky-200 to-emerald-200 dark:from-slate-900 dark:via-emerald-950/80 dark:to-emerald-900 select-none">
      {/* Céu com nuvens em pixel art e sol radiante */}
      <div className="relative h-28 sm:h-36 w-full overflow-hidden border-b-2 border-emerald-600/30">
        {/* Sol Pixel Art */}
        <div className="absolute top-4 right-8 w-12 h-12">
          <svg
            viewBox="0 0 24 24"
            className="w-full h-full animate-spin-slow"
            style={{ shapeRendering: 'crispEdges' }}
          >
            <rect x="8" y="8" width="8" height="8" fill="#FBBF24" />
            <rect x="9" y="9" width="6" height="6" fill="#FEF08A" />
            {/* Raios */}
            <rect x="11" y="2" width="2" height="4" fill="#F59E0B" />
            <rect x="11" y="18" width="2" height="4" fill="#F59E0B" />
            <rect x="2" y="11" width="4" height="2" fill="#F59E0B" />
            <rect x="18" y="11" width="4" height="2" fill="#F59E0B" />
            <rect x="4" y="4" width="3" height="3" fill="#F59E0B" />
            <rect x="17" y="4" width="3" height="3" fill="#F59E0B" />
            <rect x="4" y="17" width="3" height="3" fill="#F59E0B" />
            <rect x="17" y="17" width="3" height="3" fill="#F59E0B" />
          </svg>
        </div>

        {/* Nuvem pixel 1 */}
        <div className="absolute top-6 left-10 w-20 h-10 opacity-90 animate-pulse">
          <svg
            viewBox="0 0 32 16"
            className="w-full h-full"
            style={{ shapeRendering: 'crispEdges' }}
          >
            <rect x="6" y="8" width="20" height="6" fill="#FFFFFF" />
            <rect x="10" y="4" width="12" height="8" fill="#FFFFFF" />
            <rect x="8" y="6" width="6" height="6" fill="#F1F5F9" />
            <rect x="18" y="6" width="6" height="6" fill="#F1F5F9" />
          </svg>
        </div>

        {/* Nuvem pixel 2 */}
        <div className="absolute top-12 left-1/2 -translate-x-1/2 w-16 h-8 opacity-80">
          <svg
            viewBox="0 0 32 16"
            className="w-full h-full"
            style={{ shapeRendering: 'crispEdges' }}
          >
            <rect x="8" y="8" width="16" height="5" fill="#FFFFFF" />
            <rect x="12" y="5" width="8" height="6" fill="#FFFFFF" />
          </svg>
        </div>

        {/* Montanhas ao fundo (Horizonte 2.5D) */}
        <div className="absolute bottom-0 inset-x-0 h-12 flex items-end">
          <svg
            viewBox="0 0 100 24"
            preserveAspectRatio="none"
            className="w-full h-full opacity-60 text-emerald-800 dark:text-emerald-950"
            style={{ shapeRendering: 'crispEdges' }}
          >
            {/* Silhueta de colinas */}
            <polygon
              points="0,24 10,12 25,24 40,8 60,24 75,10 90,24 100,16 100,24"
              fill="currentColor"
            />
          </svg>
        </div>

        {/* Faixa de horizonte com grama alta */}
        <div className="absolute bottom-0 inset-x-0 h-3 bg-gradient-to-r from-[#4E8C1D] via-[#5FB324] to-[#4E8C1D] border-t-2 border-emerald-900/40" />
      </div>

      {/* Chão de Grama Pixel Art (Cenário 2.5D com perspectiva e linhas suaves) */}
      <div
        className="relative p-4 sm:p-8 min-h-[420px] sm:min-h-[500px] flex items-center justify-center"
        style={{
          backgroundColor: '#58A72B',
          backgroundImage: `
            radial-gradient(#6EBC35 15%, transparent 16%),
            radial-gradient(#498C22 15%, transparent 16%)
          `,
          backgroundSize: '32px 32px',
          backgroundPosition: '0 0, 16px 16px',
        }}
      >
        {/* Camada sutil de textura de grama isométrica/2.5D */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-black/20 pointer-events-none" />

        {/* Grade do Jardim (8 colunas x 6 linhas) */}
        <div
          className="relative grid grid-cols-8 gap-2 sm:gap-3 w-full max-w-4xl p-3 sm:p-5 rounded-3xl bg-[#4A8F24]/60 border-4 border-[#3D741E] shadow-2xl backdrop-blur-xs"
          style={{
            transform: 'perspective(900px) rotateX(12deg)',
            transformOrigin: 'center bottom',
          }}
        >
          {Array.from({ length: GRID_ROWS }).map((_, rowIndex) =>
            Array.from({ length: GRID_COLS }).map((__, colIndex) => {
              const x = colIndex
              const y = rowIndex
              const itemsInCell = cellsMap.get(`${x},${y}`) || []
              const hasItems = itemsInCell.length > 0

              // Fator de escala por profundidade (itens mais ao fundo — linhas superiores — ligeiramente menores)
              // rowIndex 0 (fundo): scale 0.9; rowIndex 5 (frente): scale 1.05
              const depthScale = 0.88 + (rowIndex / (GRID_ROWS - 1)) * 0.22

              const isTargetForMoving = isEditing && selectedPlacedId !== null
              const isTargetForPlacing = isEditing && selectedItemToPlace !== null

              return (
                <div
                  key={`${x}-${y}`}
                  onClick={() => handleCellClick(x, y)}
                  className={`relative aspect-square rounded-2xl flex items-center justify-center transition-all duration-150 ${
                    isEditing
                      ? isTargetForPlacing || isTargetForMoving
                        ? 'border-2 border-dashed border-white/80 bg-white/20 hover:bg-white/40 cursor-pointer shadow-inner animate-pulse'
                        : 'border-2 border-dashed border-white/30 bg-black/10 hover:bg-white/15 cursor-pointer'
                      : 'border border-transparent'
                  }`}
                >
                  {/* Coordenadas discretas no modo edição */}
                  {isEditing && (
                    <span className="absolute top-1 left-1.5 text-[8px] font-mono text-white/50 select-none">
                      {x},{y}
                    </span>
                  )}

                  {/* Renderiza itens presentes nesta célula */}
                  {itemsInCell.map((item) => {
                    const shopItem = getShopItem(item.item_key)
                    if (!shopItem) return null

                    const isSelected = isEditing && selectedPlacedId === item.id
                    const isGround = item.layer === 0

                    return (
                      <div
                        key={item.id}
                        onClick={(e) => handleItemClick(e, item)}
                        style={{
                          transform: isGround ? undefined : `scale(${depthScale})`,
                          transformOrigin: 'bottom center',
                        }}
                        className={`relative flex items-center justify-center transition-all duration-200 ${
                          isGround ? 'absolute inset-0 z-0' : 'z-10'
                        } ${isEditing ? 'cursor-pointer hover:scale-110 active:scale-95' : ''} ${
                          isSelected
                            ? 'ring-4 ring-amber-400 rounded-2xl animate-bounce shadow-lg'
                            : ''
                        }`}
                      >
                        {/* Sprite pixel art inline */}
                        <div className="relative group">
                          {shopItem.renderSprite(
                            isGround
                              ? 'w-full h-full object-contain'
                              : 'w-10 h-10 sm:w-14 sm:h-14 drop-shadow-md',
                          )}

                          {/* Botão de remoção rápida se o item estiver selecionado no modo edição */}
                          {isSelected && (
                            <div className="absolute -top-3 -right-3 z-30 flex items-center gap-1">
                              <button
                                type="button"
                                title="Mover este item (toque em outra célula)"
                                className="w-6 h-6 rounded-full bg-sky-500 text-white flex items-center justify-center shadow-md border border-white"
                              >
                                <Move className="w-3 h-3" />
                              </button>
                              <button
                                type="button"
                                title="Guardar na mochila"
                                onClick={(ev) => {
                                  ev.stopPropagation()
                                  removePlacedItem(item.id)
                                }}
                                className="w-6 h-6 rounded-full bg-rose-600 text-white flex items-center justify-center shadow-md border border-white hover:bg-rose-700 active:scale-90"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}

                  {/* Dica visual quando célula está vazia no modo colocar */}
                  {!hasItems && isEditing && selectedItemToPlace && (
                    <div className="w-2.5 h-2.5 rounded-full bg-white/60 pointer-events-none" />
                  )}
                </div>
              )
            }),
          )}
        </div>

        {/* Efeito de partículas/brilho no chão (CSS decorativo) */}
        <div className="absolute top-1/4 left-1/4 pointer-events-none animate-ping opacity-30">
          <Sparkles className="w-4 h-4 text-amber-300" />
        </div>
        <div className="absolute bottom-1/4 right-1/4 pointer-events-none animate-ping opacity-30 delay-700">
          <Sparkles className="w-5 h-5 text-amber-300" />
        </div>
      </div>
    </div>
  )
}
