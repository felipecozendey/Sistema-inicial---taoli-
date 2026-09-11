import React, { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Sparkles, ShoppingBag, Check } from 'lucide-react'
import { SHOP_CATALOG, CATEGORY_LABELS, ItemCategory, ShopItem } from './shop-catalog'
import { useGardenStore } from '@/stores/useGardenStore'
import { useGardenDecorationsStore } from '@/stores/useGardenDecorationsStore'

interface GardenShopModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export const GardenShopModal: React.FC<GardenShopModalProps> = ({ open, onOpenChange }) => {
  const { state } = useGardenStore()
  const { buyItem, inventory } = useGardenDecorationsStore()
  const [activeCategory, setActiveCategory] = useState<ItemCategory>('plants')
  const [buyingKey, setBuyingKey] = useState<string | null>(null)

  const categories: ItemCategory[] = ['plants', 'structures', 'water', 'special']

  const filteredItems = SHOP_CATALOG.filter((item) => item.category === activeCategory)

  const handleBuy = async (item: ShopItem) => {
    setBuyingKey(item.key)
    try {
      await buyItem(item)
    } finally {
      setBuyingKey(null)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl rounded-3xl p-0 overflow-hidden border-2 border-b-4 border-[#E5E5E5] dark:border-[#3B4A55]">
        {/* Header da Lojinha */}
        <div className="bg-gradient-to-r from-[#58CC02]/20 via-emerald-500/15 to-[#1CB0F6]/20 p-6 border-b-2 border-border/80">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-[#58CC02] text-white flex items-center justify-center shadow-md border-b-4 border-[#46a302]">
                <ShoppingBag className="w-6 h-6" />
              </div>
              <div>
                <DialogTitle className="text-xl font-black tracking-tight flex items-center gap-2">
                  Lojinha da Fazendinha Pixel
                </DialogTitle>
                <DialogDescription className="text-xs font-semibold text-muted-foreground mt-0.5">
                  Troque seus pontos de conquistas por ornamentos e construções 16-bit!
                </DialogDescription>
              </div>
            </div>

            {/* Saldo de Pontos */}
            <div className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-card rounded-2xl border-2 border-border shadow-sm shrink-0">
              <Sparkles className="w-5 h-5 text-amber-500 animate-pulse" />
              <div>
                <p className="text-[10px] uppercase font-bold text-muted-foreground">Seu Saldo</p>
                <p className="text-lg font-black text-[#58CC02] leading-none">
                  {state.points} <span className="text-xs text-muted-foreground">pts</span>
                </p>
              </div>
            </div>
          </div>

          {/* Abas de Categorias */}
          <div className="flex items-center gap-2 mt-5 overflow-x-auto pb-1 scrollbar-none">
            {categories.map((cat) => {
              const info = CATEGORY_LABELS[cat]
              const isActive = activeCategory === cat
              return (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl font-extrabold text-xs transition-all whitespace-nowrap border-b-2 ${
                    isActive
                      ? 'bg-[#58CC02] text-white border-[#46a302] shadow-sm'
                      : 'bg-white/80 dark:bg-card/80 text-muted-foreground hover:text-foreground border-transparent hover:bg-white dark:hover:bg-card'
                  }`}
                >
                  <span>{info.icon}</span>
                  <span>{info.name}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Grade de Itens */}
        <div className="p-6 max-h-[60vh] overflow-y-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {filteredItems.map((item) => {
              const ownedCount = inventory[item.key] || 0
              const canAfford = state.points >= item.price
              const isBuying = buyingKey === item.key

              return (
                <div
                  key={item.key}
                  className="group relative flex flex-col justify-between p-4 rounded-3xl bg-card border-2 border-b-4 border-[#E5E5E5] dark:border-[#3B4A55] hover:border-[#58CC02]/80 transition-all shadow-sm hover:shadow"
                >
                  <div className="flex items-start gap-3.5">
                    {/* Sprite Pixel Art */}
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-b from-sky-100/60 to-emerald-100/60 dark:from-sky-950/40 dark:to-emerald-950/40 border-2 border-border/80 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform duration-200 shadow-inner">
                      {item.renderSprite('w-12 h-12')}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <h4 className="font-extrabold text-sm text-foreground truncate">
                          {item.name}
                        </h4>
                        {ownedCount > 0 && (
                          <Badge
                            variant="secondary"
                            className="text-[10px] px-1.5 py-0 rounded-md font-extrabold bg-[#58CC02]/15 text-[#58CC02] border-0 shrink-0"
                          >
                            Mochila: {ownedCount}
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2 mt-1 leading-snug font-medium">
                        {item.description}
                      </p>
                    </div>
                  </div>

                  {/* Preço e Botão Comprar */}
                  <div className="mt-4 pt-3 border-t border-border/60 flex items-center justify-between gap-2">
                    <div className="flex items-baseline gap-1">
                      <span className="text-base font-black text-foreground">{item.price}</span>
                      <span className="text-[11px] font-bold text-muted-foreground">pts</span>
                    </div>

                    <Button
                      size="sm"
                      onClick={() => handleBuy(item)}
                      disabled={!canAfford || isBuying}
                      className={`h-9 px-4 rounded-2xl font-black text-xs gap-1.5 transition-all shadow-sm ${
                        canAfford
                          ? 'bg-[#58CC02] hover:bg-[#46a302] text-white border-b-4 border-[#46a302] active:border-b-0 active:translate-y-1'
                          : 'bg-muted text-muted-foreground border-b-2 border-transparent cursor-not-allowed'
                      }`}
                    >
                      {isBuying ? (
                        <span>Comprando...</span>
                      ) : canAfford ? (
                        <>
                          <ShoppingBag className="w-3.5 h-3.5" />
                          <span>Comprar</span>
                        </>
                      ) : (
                        <span>Pontos insuficientes</span>
                      )}
                    </Button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Rodapé informativo */}
        <div className="p-4 bg-muted/40 border-t border-border flex items-center justify-between text-xs text-muted-foreground font-semibold">
          <span className="flex items-center gap-1.5">
            <Check className="w-4 h-4 text-[#58CC02]" />
            Itens comprados vão para sua mochila e podem ser colocados e movidos quando quiser!
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="rounded-xl font-bold text-xs"
          >
            Fechar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
