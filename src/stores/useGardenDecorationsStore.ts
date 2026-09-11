import { create } from 'zustand'
import { supabase } from '@/lib/supabase/client'
import { toast } from '@/hooks/use-toast'
import { getShopItem, ShopItem } from '@/components/garden/shop-catalog'
import { useGardenStore } from './useGardenStore'

export interface PlacedDecoration {
  id: string
  user_id?: string
  item_key: string
  x: number // grid coordinate (0 to GRID_COLS - 1)
  y: number // grid coordinate (0 to GRID_ROWS - 1)
  layer: number // 0: ground, 1: object
  created_at?: string
  updated_at?: string
}

export interface InventoryItem {
  item_key: string
  count: number // quantidade não colocada na cena
}

interface GardenDecorationsStore {
  // Itens atualmente posicionados na cena
  placed: PlacedDecoration[]
  // Itens na mochila disponíveis para posicionar
  inventory: Record<string, number>
  isLoading: boolean
  isEditing: boolean
  // Seleção atual para colocar na grade
  selectedItemToPlace: string | null
  // Item colocado que está sendo movido
  selectedPlacedId: string | null
  // Cópia de backup para cancelar edição
  draftPlaced: PlacedDecoration[]
  draftInventory: Record<string, number>

  fetchDecorations: () => Promise<void>
  startEditing: () => void
  cancelEditing: () => void
  saveEditing: () => Promise<boolean>

  // Lojinha
  buyItem: (item: ShopItem) => Promise<boolean>

  // Modo edição
  selectItemToPlace: (itemKey: string | null) => void
  selectPlacedItem: (id: string | null) => void
  placeItemOnGrid: (x: number, y: number) => void
  movePlacedItem: (id: string, newX: number, newY: number) => void
  removePlacedItem: (id: string) => void
  clearDraft: () => void
}

export const GRID_COLS = 8
export const GRID_ROWS = 6

const INVENTORY_STORAGE_KEY_PREFIX = 'vibecoding_garden_inventory_'

function getInventoryStorageKey(userId: string) {
  return `${INVENTORY_STORAGE_KEY_PREFIX}${userId}`
}

function loadLocalInventory(userId: string): Record<string, number> {
  try {
    const raw = localStorage.getItem(getInventoryStorageKey(userId))
    if (!raw) return {}
    return JSON.parse(raw)
  } catch {
    return {}
  }
}

function saveLocalInventory(userId: string, inventory: Record<string, number>) {
  try {
    localStorage.setItem(getInventoryStorageKey(userId), JSON.stringify(inventory))
  } catch {
    // noop
  }
}

export const useGardenDecorationsStore = create<GardenDecorationsStore>((set, get) => ({
  placed: [],
  inventory: {},
  isLoading: false,
  isEditing: false,
  selectedItemToPlace: null,
  selectedPlacedId: null,
  draftPlaced: [],
  draftInventory: {},

  fetchDecorations: async () => {
    set({ isLoading: true })
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        set({ isLoading: false })
        return
      }

      const { data, error } = await (supabase as any)
        .from('garden_decorations')
        .select('*')
        .eq('user_id', user.id)
        .order('layer', { ascending: true })

      if (error) {
        console.warn('Erro ao carregar decorações:', error)
      }

      let loadedPlaced: PlacedDecoration[] = (data as unknown as PlacedDecoration[]) || []
      let loadedInventory = loadLocalInventory(user.id)

      // Se for a primeira vez do usuário e ele não tem itens colocados nem no inventário:
      // Dar de presente 1 item inicial (flor_pixel) já colocado ou na mochila
      const totalInventoryCount = Object.values(loadedInventory).reduce((a, b) => a + b, 0)
      if (loadedPlaced.length === 0 && totalInventoryCount === 0) {
        const starterItemKey = 'flower_pixel'
        const initialItem: PlacedDecoration = {
          id: crypto.randomUUID(),
          user_id: user.id,
          item_key: starterItemKey,
          x: 3,
          y: 3,
          layer: 1,
        }

        // Tentar salvar no banco a flor de presente
        try {
          const { data: savedInitial } = await (supabase as any)
            .from('garden_decorations')
            .insert({
              id: initialItem.id,
              user_id: user.id,
              item_key: initialItem.item_key,
              x: initialItem.x,
              y: initialItem.y,
              layer: initialItem.layer,
            })
            .select()
            .single()

          if (savedInitial) {
            loadedPlaced = [savedInitial as unknown as PlacedDecoration]
          } else {
            loadedPlaced = [initialItem]
          }
        } catch {
          loadedPlaced = [initialItem]
        }
      }

      set({
        placed: loadedPlaced,
        inventory: loadedInventory,
        draftPlaced: loadedPlaced,
        draftInventory: loadedInventory,
        isLoading: false,
      })
    } catch (err) {
      console.warn('Falha na inicialização do jardim:', err)
      set({ isLoading: false })
    }
  },

  startEditing: () => {
    const { placed, inventory } = get()
    set({
      isEditing: true,
      selectedItemToPlace: null,
      selectedPlacedId: null,
      draftPlaced: [...placed],
      draftInventory: { ...inventory },
    })
  },

  cancelEditing: () => {
    const { placed, inventory } = get()
    set({
      isEditing: false,
      selectedItemToPlace: null,
      selectedPlacedId: null,
      draftPlaced: [...placed],
      draftInventory: { ...inventory },
    })
    toast({
      title: 'Edição cancelada',
      description: 'As alterações não salvas foram descartadas.',
    })
  },

  saveEditing: async () => {
    const { draftPlaced, draftInventory } = get()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      toast({
        title: 'Usuário não autenticado',
        description: 'Faça login para salvar suas decorações.',
        variant: 'destructive',
      })
      return false
    }

    try {
      // 1. Limpar decorações antigas do usuário e inserir novo conjunto
      // Transação via delete + insert de lote
      const { error: deleteError } = await (supabase as any)
        .from('garden_decorations')
        .delete()
        .eq('user_id', user.id)

      if (deleteError) {
        toast({
          title: 'Erro ao salvar',
          description: deleteError.message || 'Falha ao sincronizar decorações.',
          variant: 'destructive',
        })
        return false
      }

      if (draftPlaced.length > 0) {
        const payload = draftPlaced.map((item) => ({
          id: item.id || crypto.randomUUID(),
          user_id: user.id,
          item_key: item.item_key,
          x: item.x,
          y: item.y,
          layer: item.layer ?? 0,
        }))

        const { error: insertError } = await (supabase as any)
          .from('garden_decorations')
          .insert(payload)

        if (insertError) {
          toast({
            title: 'Erro ao salvar itens',
            description: insertError.message || 'Falha ao posicionar itens no banco.',
            variant: 'destructive',
          })
          return false
        }
      }

      // 2. Salvar inventário local do usuário
      saveLocalInventory(user.id, draftInventory)

      // 3. Atualizar estado real
      set({
        placed: draftPlaced,
        inventory: draftInventory,
        isEditing: false,
        selectedItemToPlace: null,
        selectedPlacedId: null,
      })

      toast({
        title: '✨ Jardim salvo com sucesso!',
        description: 'Sua fazendinha pixel está radiante e atualizada!',
      })
      return true
    } catch (err: any) {
      toast({
        title: 'Erro inesperado',
        description: err?.message || 'Não foi possível salvar as alterações.',
        variant: 'destructive',
      })
      return false
    }
  },

  buyItem: async (item: ShopItem) => {
    const { spendPoints } = useGardenStore.getState()
    const success = await spendPoints(item.price)
    if (!success) return false

    const {
      data: { user },
    } = await supabase.auth.getUser()

    const currentInventory = { ...get().inventory }
    const currentCount = currentInventory[item.key] || 0
    currentInventory[item.key] = currentCount + 1

    if (user) {
      saveLocalInventory(user.id, currentInventory)
    }

    set({
      inventory: currentInventory,
      draftInventory: { ...currentInventory },
    })

    toast({
      title: `🛍️ Comprou: ${item.name}!`,
      description: `Item adicionado à sua mochila. Entre no Modo Edição para posicioná-lo!`,
    })

    return true
  },

  selectItemToPlace: (itemKey: string | null) => {
    set({
      selectedItemToPlace: itemKey,
      selectedPlacedId: null,
    })
  },

  selectPlacedItem: (id: string | null) => {
    set({
      selectedPlacedId: id,
      selectedItemToPlace: null,
    })
  },

  placeItemOnGrid: (x: number, y: number) => {
    const { isEditing, selectedItemToPlace, selectedPlacedId, draftPlaced, draftInventory } = get()
    if (!isEditing) return

    // Se estiver movendo um item já colocado
    if (selectedPlacedId) {
      // Verificar se a célula alvo já tem um item do mesmo layer
      const itemToMove = draftPlaced.find((p) => p.id === selectedPlacedId)
      if (!itemToMove) return

      const occupiedSameLayer = draftPlaced.some(
        (p) => p.id !== selectedPlacedId && p.x === x && p.y === y && p.layer === itemToMove.layer,
      )
      if (occupiedSameLayer) {
        toast({
          title: 'Espaço ocupado',
          description: 'Já existe um elemento na mesma camada nesta posição.',
        })
        return
      }

      const updated = draftPlaced.map((p) => (p.id === selectedPlacedId ? { ...p, x, y } : p))
      set({
        draftPlaced: updated,
        selectedPlacedId: null,
      })
      return
    }

    // Se estiver colocando um novo item da mochila
    if (!selectedItemToPlace) return

    const availableCount = draftInventory[selectedItemToPlace] || 0
    if (availableCount <= 0) {
      toast({
        title: 'Item esgotado na mochila',
        description: 'Compre mais na lojinha para posicionar outro!',
      })
      set({ selectedItemToPlace: null })
      return
    }

    const catalogItem = getShopItem(selectedItemToPlace)
    const layer = catalogItem ? catalogItem.layer : 1

    // Verificar se a célula alvo já tem um item da mesma camada
    const occupiedSameLayer = draftPlaced.some((p) => p.x === x && p.y === y && p.layer === layer)
    if (occupiedSameLayer) {
      toast({
        title: 'Espaço ocupado',
        description: 'Já existe um elemento desta categoria nesta posição.',
      })
      return
    }

    const newItem: PlacedDecoration = {
      id: crypto.randomUUID(),
      item_key: selectedItemToPlace,
      x,
      y,
      layer,
    }

    const newInventory = {
      ...draftInventory,
      [selectedItemToPlace]: availableCount - 1,
    }
    if (newInventory[selectedItemToPlace] <= 0) {
      delete newInventory[selectedItemToPlace]
    }

    set({
      draftPlaced: [...draftPlaced, newItem],
      draftInventory: newInventory,
      // Se acabou o estoque deste item, desmarca a seleção
      selectedItemToPlace:
        newInventory[selectedItemToPlace] && newInventory[selectedItemToPlace] > 0
          ? selectedItemToPlace
          : null,
    })
  },

  movePlacedItem: (id: string, newX: number, newY: number) => {
    const { draftPlaced } = get()
    const target = draftPlaced.find((p) => p.id === id)
    if (!target) return

    // Validar limites
    if (newX < 0 || newX >= GRID_COLS || newY < 0 || newY >= GRID_ROWS) return

    const occupiedSameLayer = draftPlaced.some(
      (p) => p.id !== id && p.x === newX && p.y === newY && p.layer === target.layer,
    )
    if (occupiedSameLayer) return

    const updated = draftPlaced.map((p) => (p.id === id ? { ...p, x: newX, y: newY } : p))
    set({ draftPlaced: updated })
  },

  removePlacedItem: (id: string) => {
    const { draftPlaced, draftInventory } = get()
    const target = draftPlaced.find((p) => p.id === id)
    if (!target) return

    // Devolve para o inventário
    const currentCount = draftInventory[target.item_key] || 0
    const newInventory = {
      ...draftInventory,
      [target.item_key]: currentCount + 1,
    }

    const updatedPlaced = draftPlaced.filter((p) => p.id !== id)

    set({
      draftPlaced: updatedPlaced,
      draftInventory: newInventory,
      selectedPlacedId: null,
    })

    const catalogItem = getShopItem(target.item_key)
    toast({
      title: 'Item guardado na mochila',
      description: `${catalogItem?.name || 'Elemento'} removido do jardim e guardado.`,
    })
  },

  clearDraft: () => {
    const { draftPlaced, draftInventory } = get()
    // Devolve todos os colocados para a mochila
    const newInventory = { ...draftInventory }
    draftPlaced.forEach((item) => {
      newInventory[item.item_key] = (newInventory[item.item_key] || 0) + 1
    })

    set({
      draftPlaced: [],
      draftInventory: newInventory,
      selectedPlacedId: null,
      selectedItemToPlace: null,
    })

    toast({
      title: 'Jardim limpo',
      description: 'Todos os itens foram recolhidos para a mochila.',
    })
  },
}))
