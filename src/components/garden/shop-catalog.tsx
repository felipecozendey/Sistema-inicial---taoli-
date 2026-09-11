import React from 'react'

export type ItemCategory = 'plants' | 'structures' | 'water' | 'special'

export interface ShopItem {
  key: string
  name: string
  category: ItemCategory
  price: number
  description: string
  layer: 0 | 1 // 0: ground, 1: object/structure
  width: number // tile width
  height: number // tile height
  renderSprite: (className?: string) => React.ReactElement
}

export const CATEGORY_LABELS: Record<ItemCategory, { name: string; icon: string }> = {
  plants: { name: 'Plantas', icon: '🌿' },
  structures: { name: 'Estruturas', icon: '🪵' },
  water: { name: 'Água & Clima', icon: '💧' },
  special: { name: 'Especiais', icon: '⭐' },
}

export const SHOP_CATALOG: ShopItem[] = [
  // --- PLANTAS (15 - 60 pts) ---
  {
    key: 'flower_pixel',
    name: 'Flor Vermelha',
    category: 'plants',
    price: 15,
    description: 'Pequena flor silvestre com pétalas carmim e miolo brilhante.',
    layer: 1,
    width: 1,
    height: 1,
    renderSprite: (className = 'w-10 h-10') => (
      <svg
        viewBox="0 0 24 24"
        className={className}
        style={{ shapeRendering: 'crispEdges' }}
        aria-hidden="true"
      >
        {/* Sombra base */}
        <ellipse cx="12" cy="22" rx="7" ry="2" fill="rgba(0,0,0,0.25)" />
        {/* Caule */}
        <rect x="11" y="13" width="2" height="8" fill="#2E7D32" />
        <rect x="9" y="16" width="2" height="2" fill="#4CAF50" />
        <rect x="13" y="15" width="2" height="2" fill="#4CAF50" />
        {/* Pétalas */}
        <rect x="10" y="5" width="4" height="3" fill="#D32F2F" />
        <rect x="10" y="13" width="4" height="3" fill="#D32F2F" />
        <rect x="6" y="9" width="3" height="4" fill="#D32F2F" />
        <rect x="15" y="9" width="3" height="4" fill="#D32F2F" />
        {/* Cantos das pétalas */}
        <rect x="8" y="7" width="2" height="2" fill="#F44336" />
        <rect x="14" y="7" width="2" height="2" fill="#F44336" />
        <rect x="8" y="12" width="2" height="2" fill="#B71C1C" />
        <rect x="14" y="12" width="2" height="2" fill="#B71C1C" />
        {/* Miolo */}
        <rect x="9" y="8" width="6" height="5" fill="#FDD835" />
        <rect x="10" y="9" width="4" height="3" fill="#FFEE58" />
        <rect x="11" y="10" width="2" height="1" fill="#FFF59D" />
      </svg>
    ),
  },
  {
    key: 'sunflower_pixel',
    name: 'Girassol Radiante',
    category: 'plants',
    price: 30,
    description: 'Girassol dourado que segue os raios de sol e inspira disciplina.',
    layer: 1,
    width: 1,
    height: 1,
    renderSprite: (className = 'w-10 h-10') => (
      <svg
        viewBox="0 0 24 24"
        className={className}
        style={{ shapeRendering: 'crispEdges' }}
        aria-hidden="true"
      >
        <ellipse cx="12" cy="22" rx="7" ry="2" fill="rgba(0,0,0,0.25)" />
        {/* Caule grosso */}
        <rect x="11" y="14" width="2" height="8" fill="#1B5E20" />
        <rect x="12" y="14" width="1" height="7" fill="#2E7D32" />
        <rect x="8" y="17" width="3" height="2" fill="#43A047" />
        <rect x="13" y="16" width="3" height="2" fill="#43A047" />
        {/* Pétalas amarelas */}
        <rect x="9" y="3" width="6" height="3" fill="#F59E0B" />
        <rect x="9" y="15" width="6" height="3" fill="#D97706" />
        <rect x="3" y="9" width="3" height="6" fill="#F59E0B" />
        <rect x="18" y="9" width="3" height="6" fill="#D97706" />
        <rect x="6" y="5" width="4" height="4" fill="#FBBF24" />
        <rect x="14" y="5" width="4" height="4" fill="#FBBF24" />
        <rect x="6" y="13" width="4" height="3" fill="#B45309" />
        <rect x="14" y="13" width="4" height="3" fill="#B45309" />
        {/* Centro de sementes */}
        <rect x="7" y="7" width="10" height="8" fill="#451A03" />
        <rect x="8" y="8" width="8" height="6" fill="#78350F" />
        <rect x="10" y="9" width="4" height="4" fill="#92400E" />
        <rect x="11" y="10" width="2" height="2" fill="#B45309" />
      </svg>
    ),
  },
  {
    key: 'bush_pixel',
    name: 'Arbusto Frutífero',
    category: 'plants',
    price: 25,
    description: 'Folhagem verde densa com pequenas frutinhas silvestres.',
    layer: 1,
    width: 1,
    height: 1,
    renderSprite: (className = 'w-10 h-10') => (
      <svg
        viewBox="0 0 24 24"
        className={className}
        style={{ shapeRendering: 'crispEdges' }}
        aria-hidden="true"
      >
        <ellipse cx="12" cy="22" rx="9" ry="2" fill="rgba(0,0,0,0.25)" />
        {/* Contorno / Base escura */}
        <rect x="4" y="12" width="16" height="9" fill="#14532D" />
        <rect x="6" y="9" width="12" height="4" fill="#14532D" />
        {/* Camada média */}
        <rect x="5" y="11" width="14" height="8" fill="#16A34A" />
        <rect x="7" y="8" width="10" height="5" fill="#16A34A" />
        {/* Iluminação do topo */}
        <rect x="7" y="7" width="7" height="3" fill="#4ADE80" />
        <rect x="6" y="10" width="4" height="3" fill="#4ADE80" />
        <rect x="12" y="9" width="4" height="2" fill="#22C55E" />
        {/* Frutinhas vermelhas */}
        <rect x="8" y="13" width="2" height="2" fill="#EF4444" />
        <rect x="14" y="12" width="2" height="2" fill="#EF4444" />
        <rect x="11" y="16" width="2" height="2" fill="#DC2626" />
      </svg>
    ),
  },
  {
    key: 'tree_small',
    name: 'Árvore Jovem',
    category: 'plants',
    price: 45,
    description: 'Tronco esbelto com copa redonda em pixel art 16-bit.',
    layer: 1,
    width: 1,
    height: 1,
    renderSprite: (className = 'w-10 h-10') => (
      <svg
        viewBox="0 0 24 24"
        className={className}
        style={{ shapeRendering: 'crispEdges' }}
        aria-hidden="true"
      >
        <ellipse cx="12" cy="22" rx="8" ry="2" fill="rgba(0,0,0,0.25)" />
        {/* Tronco */}
        <rect x="10" y="14" width="4" height="8" fill="#5C3A21" />
        <rect x="11" y="14" width="2" height="8" fill="#784A29" />
        <rect x="10" y="20" width="1" height="2" fill="#422916" />
        {/* Copa contorno */}
        <rect x="5" y="5" width="14" height="10" fill="#0F4C1B" />
        <rect x="7" y="3" width="10" height="4" fill="#0F4C1B" />
        {/* Copa miolo */}
        <rect x="6" y="4" width="12" height="9" fill="#168039" />
        {/* Highlight copa */}
        <rect x="8" y="4" width="6" height="4" fill="#4ADE80" />
        <rect x="7" y="7" width="4" height="3" fill="#22C55E" />
        <rect x="13" y="9" width="4" height="3" fill="#0D5F28" />
      </svg>
    ),
  },
  {
    key: 'tree_large',
    name: 'Carvalho Centenário',
    category: 'plants',
    price: 60,
    description: 'Árvore frondosa e imponente, símbolo de consistência e força.',
    layer: 1,
    width: 1,
    height: 1,
    renderSprite: (className = 'w-10 h-10') => (
      <svg
        viewBox="0 0 24 24"
        className={className}
        style={{ shapeRendering: 'crispEdges' }}
        aria-hidden="true"
      >
        <ellipse cx="12" cy="22" rx="10" ry="2" fill="rgba(0,0,0,0.3)" />
        {/* Tronco robusto */}
        <rect x="9" y="13" width="6" height="9" fill="#451A03" />
        <rect x="10" y="13" width="4" height="9" fill="#78350F" />
        <rect x="8" y="19" width="2" height="3" fill="#361502" />
        <rect x="14" y="19" width="2" height="3" fill="#361502" />
        {/* Copa grande */}
        <rect x="3" y="3" width="18" height="12" fill="#064E3B" />
        <rect x="5" y="1" width="14" height="4" fill="#064E3B" />
        {/* Copa folhas vivas */}
        <rect x="4" y="2" width="16" height="11" fill="#059669" />
        {/* Camada clara */}
        <rect x="6" y="2" width="8" height="5" fill="#34D399" />
        <rect x="5" y="6" width="6" height="4" fill="#10B981" />
        <rect x="13" y="7" width="6" height="5" fill="#047857" />
        {/* Fruto sutil */}
        <rect x="7" y="9" width="2" height="2" fill="#F87171" />
        <rect x="15" y="5" width="2" height="2" fill="#F87171" />
      </svg>
    ),
  },
  {
    key: 'cactus_pixel',
    name: 'Cacto do Deserto',
    category: 'plants',
    price: 35,
    description: 'Resistente como seus dias mais difíceis. Nunca desiste!',
    layer: 1,
    width: 1,
    height: 1,
    renderSprite: (className = 'w-10 h-10') => (
      <svg
        viewBox="0 0 24 24"
        className={className}
        style={{ shapeRendering: 'crispEdges' }}
        aria-hidden="true"
      >
        <ellipse cx="12" cy="22" rx="7" ry="2" fill="rgba(0,0,0,0.25)" />
        {/* Tronco principal */}
        <rect x="10" y="5" width="4" height="17" fill="#14532D" />
        <rect x="11" y="6" width="2" height="15" fill="#22C55E" />
        {/* Braço esquerdo */}
        <rect x="5" y="9" width="3" height="6" fill="#14532D" />
        <rect x="6" y="10" width="2" height="4" fill="#22C55E" />
        <rect x="7" y="12" width="4" height="3" fill="#14532D" />
        <rect x="7" y="13" width="3" height="1" fill="#22C55E" />
        {/* Braço direito */}
        <rect x="16" y="8" width="3" height="7" fill="#14532D" />
        <rect x="16" y="9" width="2" height="5" fill="#22C55E" />
        <rect x="13" y="11" width="4" height="3" fill="#14532D" />
        <rect x="14" y="12" width="3" height="1" fill="#22C55E" />
        {/* Flor rosa no topo */}
        <rect x="11" y="3" width="2" height="2" fill="#EC4899" />
        <rect x="10" y="4" width="4" height="1" fill="#F472B6" />
      </svg>
    ),
  },

  // --- ESTRUTURAS (60 - 150 pts) ---
  {
    key: 'fence_wood',
    name: 'Cerca de Madeira',
    category: 'structures',
    price: 60,
    description: 'Segmento rústico de cerca estilo fazenda para delimitar seu espaço.',
    layer: 1,
    width: 1,
    height: 1,
    renderSprite: (className = 'w-10 h-10') => (
      <svg
        viewBox="0 0 24 24"
        className={className}
        style={{ shapeRendering: 'crispEdges' }}
        aria-hidden="true"
      >
        <ellipse cx="12" cy="22" rx="9" ry="2" fill="rgba(0,0,0,0.25)" />
        {/* Postes verticais */}
        <rect x="4" y="9" width="3" height="13" fill="#451A03" />
        <rect x="5" y="8" width="1" height="1" fill="#78350F" />
        <rect x="5" y="10" width="1" height="11" fill="#B45309" />

        <rect x="17" y="9" width="3" height="13" fill="#451A03" />
        <rect x="18" y="8" width="1" height="1" fill="#78350F" />
        <rect x="18" y="10" width="1" height="11" fill="#B45309" />

        {/* Travessas horizontais */}
        <rect x="2" y="11" width="20" height="3" fill="#78350F" />
        <rect x="2" y="12" width="20" height="1" fill="#D97706" />

        <rect x="2" y="16" width="20" height="3" fill="#78350F" />
        <rect x="2" y="17" width="20" height="1" fill="#D97706" />

        {/* Pregos */}
        <rect x="5" y="12" width="1" height="1" fill="#1C1917" />
        <rect x="18" y="12" width="1" height="1" fill="#1C1917" />
        <rect x="5" y="17" width="1" height="1" fill="#1C1917" />
        <rect x="18" y="17" width="1" height="1" fill="#1C1917" />
      </svg>
    ),
  },
  {
    key: 'stone_path',
    name: 'Caminho de Pedra',
    category: 'structures',
    price: 70,
    description: 'Ladrilhos rústicos de pedra no chão para compor trilhas elegantes.',
    layer: 0, // chão
    width: 1,
    height: 1,
    renderSprite: (className = 'w-10 h-10') => (
      <svg
        viewBox="0 0 24 24"
        className={className}
        style={{ shapeRendering: 'crispEdges' }}
        aria-hidden="true"
      >
        {/* Pedra grande 1 */}
        <rect x="3" y="6" width="8" height="6" fill="#334155" />
        <rect x="4" y="7" width="6" height="4" fill="#64748B" />
        <rect x="5" y="8" width="4" height="2" fill="#94A3B8" />

        {/* Pedra média 2 */}
        <rect x="13" y="4" width="7" height="5" fill="#334155" />
        <rect x="14" y="5" width="5" height="3" fill="#64748B" />
        <rect x="15" y="6" width="3" height="1" fill="#94A3B8" />

        {/* Pedra 3 */}
        <rect x="4" y="14" width="7" height="6" fill="#334155" />
        <rect x="5" y="15" width="5" height="4" fill="#64748B" />
        <rect x="6" y="16" width="3" height="2" fill="#94A3B8" />

        {/* Pedra 4 */}
        <rect x="13" y="12" width="8" height="7" fill="#334155" />
        <rect x="14" y="13" width="6" height="5" fill="#64748B" />
        <rect x="15" y="14" width="4" height="2" fill="#94A3B8" />
      </svg>
    ),
  },
  {
    key: 'park_bench',
    name: 'Banco de Praça',
    category: 'structures',
    price: 110,
    description: 'Um refúgio acolhedor de madeira e ferro para descansar a mente.',
    layer: 1,
    width: 1,
    height: 1,
    renderSprite: (className = 'w-10 h-10') => (
      <svg
        viewBox="0 0 24 24"
        className={className}
        style={{ shapeRendering: 'crispEdges' }}
        aria-hidden="true"
      >
        <ellipse cx="12" cy="22" rx="9" ry="2" fill="rgba(0,0,0,0.25)" />
        {/* Pés de ferro */}
        <rect x="5" y="15" width="2" height="7" fill="#1F2937" />
        <rect x="17" y="15" width="2" height="7" fill="#1F2937" />
        <rect x="4" y="21" width="4" height="1" fill="#111827" />
        <rect x="16" y="21" width="4" height="1" fill="#111827" />
        {/* Encosto */}
        <rect x="3" y="8" width="18" height="2" fill="#78350F" />
        <rect x="4" y="8" width="16" height="1" fill="#B45309" />
        <rect x="3" y="11" width="18" height="2" fill="#78350F" />
        <rect x="4" y="11" width="16" height="1" fill="#B45309" />
        {/* Suportes do encosto */}
        <rect x="5" y="7" width="2" height="7" fill="#1F2937" />
        <rect x="17" y="7" width="2" height="7" fill="#1F2937" />
        {/* Assento */}
        <rect x="2" y="14" width="20" height="3" fill="#92400E" />
        <rect x="3" y="14" width="18" height="1" fill="#F59E0B" />
      </svg>
    ),
  },
  {
    key: 'wishing_well',
    name: 'Poço dos Desejos',
    category: 'structures',
    price: 150,
    description: 'Poço de pedra ancestral com água cristalina e telhado de telhas.',
    layer: 1,
    width: 1,
    height: 1,
    renderSprite: (className = 'w-10 h-10') => (
      <svg
        viewBox="0 0 24 24"
        className={className}
        style={{ shapeRendering: 'crispEdges' }}
        aria-hidden="true"
      >
        <ellipse cx="12" cy="22" rx="9" ry="2" fill="rgba(0,0,0,0.3)" />
        {/* Telhado triangular */}
        <rect x="5" y="3" width="14" height="2" fill="#7F1D1D" />
        <rect x="6" y="2" width="12" height="2" fill="#B91C1C" />
        <rect x="8" y="1" width="8" height="2" fill="#EF4444" />
        <rect x="10" y="0" width="4" height="2" fill="#F87171" />
        {/* Pilares de madeira */}
        <rect x="6" y="5" width="2" height="9" fill="#78350F" />
        <rect x="16" y="5" width="2" height="9" fill="#78350F" />
        {/* Manivela / Corda */}
        <rect x="11" y="5" width="2" height="4" fill="#FBBF24" />
        <rect x="10" y="9" width="4" height="3" fill="#92400E" />
        {/* Base de pedra do poço */}
        <rect x="4" y="13" width="16" height="9" fill="#334155" />
        <rect x="5" y="14" width="14" height="7" fill="#64748B" />
        <rect x="6" y="14" width="12" height="2" fill="#0284C7" />
        <rect x="7" y="15" width="10" height="1" fill="#38BDF8" />
        {/* Tijolinhos */}
        <rect x="6" y="17" width="4" height="2" fill="#475569" />
        <rect x="12" y="17" width="5" height="2" fill="#475569" />
        <rect x="9" y="19" width="5" height="2" fill="#475569" />
      </svg>
    ),
  },

  // --- ÁGUA & CLIMA (100 - 200 pts) ---
  {
    key: 'small_pond',
    name: 'Lago de Carpas',
    category: 'water',
    price: 120,
    description: 'Lago sereno de água azul com pedras nas margens e vitória-régia.',
    layer: 0, // chão
    width: 1,
    height: 1,
    renderSprite: (className = 'w-10 h-10') => (
      <svg
        viewBox="0 0 24 24"
        className={className}
        style={{ shapeRendering: 'crispEdges' }}
        aria-hidden="true"
      >
        {/* Margem de terra/pedra */}
        <ellipse cx="12" cy="12" rx="11" ry="8" fill="#475569" />
        <ellipse cx="12" cy="12" rx="10" ry="7" fill="#0284C7" />
        {/* Água miolo vibrante */}
        <ellipse cx="12" cy="12" rx="8" ry="5" fill="#38BDF8" />
        {/* Reflexos de água */}
        <rect x="8" y="10" width="4" height="1" fill="#E0F2FE" />
        <rect x="13" y="13" width="5" height="1" fill="#E0F2FE" />
        {/* Folha vitória-régia */}
        <rect x="6" y="12" width="4" height="3" fill="#15803D" />
        <rect x="7" y="13" width="2" height="1" fill="#4ADE80" />
        {/* Pequena carpa laranja */}
        <rect x="13" y="11" width="3" height="2" fill="#EA580C" />
      </svg>
    ),
  },
  {
    key: 'stone_fountain',
    name: 'Fonte Imperial',
    category: 'water',
    price: 180,
    description: 'Fonte esculpida em pedra cinza com borbulhar relaxante de água.',
    layer: 1,
    width: 1,
    height: 1,
    renderSprite: (className = 'w-10 h-10') => (
      <svg
        viewBox="0 0 24 24"
        className={className}
        style={{ shapeRendering: 'crispEdges' }}
        aria-hidden="true"
      >
        <ellipse cx="12" cy="22" rx="10" ry="2" fill="rgba(0,0,0,0.3)" />
        {/* Bacia inferior */}
        <rect x="3" y="16" width="18" height="6" fill="#334155" />
        <rect x="4" y="17" width="16" height="4" fill="#0284C7" />
        <rect x="5" y="17" width="14" height="2" fill="#38BDF8" />
        {/* Coluna central */}
        <rect x="10" y="8" width="4" height="9" fill="#475569" />
        <rect x="11" y="9" width="2" height="8" fill="#64748B" />
        {/* Bacia superior */}
        <rect x="6" y="8" width="12" height="4" fill="#334155" />
        <rect x="7" y="9" width="10" height="2" fill="#0284C7" />
        <rect x="8" y="9" width="8" height="1" fill="#7DD3FC" />
        {/* Jato d'água no topo */}
        <rect x="11" y="3" width="2" height="5" fill="#38BDF8" />
        <rect x="10" y="4" width="4" height="2" fill="#BAE6FD" />
        <rect x="11" y="2" width="2" height="2" fill="#FFFFFF" />
        {/* Gotículas caindo */}
        <rect x="8" y="6" width="1" height="2" fill="#BAE6FD" />
        <rect x="15" y="6" width="1" height="2" fill="#BAE6FD" />
      </svg>
    ),
  },

  // --- ESPECIAIS (200 - 400 pts) ---
  {
    key: 'scarecrow_pixel',
    name: 'Espantalho Amigo',
    category: 'special',
    price: 220,
    description: 'Guardião carismático do jardim com chapéu de palha e camisa xadrez.',
    layer: 1,
    width: 1,
    height: 1,
    renderSprite: (className = 'w-10 h-10') => (
      <svg
        viewBox="0 0 24 24"
        className={className}
        style={{ shapeRendering: 'crispEdges' }}
        aria-hidden="true"
      >
        <ellipse cx="12" cy="22" rx="7" ry="2" fill="rgba(0,0,0,0.25)" />
        {/* Poste de madeira */}
        <rect x="11" y="10" width="2" height="12" fill="#78350F" />
        {/* Chapéu de palha */}
        <rect x="6" y="3" width="12" height="2" fill="#D97706" />
        <rect x="8" y="1" width="8" height="3" fill="#F59E0B" />
        <rect x="9" y="3" width="6" height="1" fill="#B45309" />
        {/* Rosto de saco de estopa */}
        <rect x="9" y="4" width="6" height="5" fill="#FDE68A" />
        <rect x="10" y="6" width="1" height="1" fill="#1F2937" />
        <rect x="13" y="6" width="1" height="1" fill="#1F2937" />
        <rect x="11" y="7" width="2" height="1" fill="#EA580C" />
        {/* Braços abertos com camisa xadrez */}
        <rect x="4" y="9" width="16" height="3" fill="#DC2626" />
        <rect x="6" y="9" width="2" height="3" fill="#FEE2E2" />
        <rect x="10" y="9" width="4" height="3" fill="#B91C1C" />
        <rect x="16" y="9" width="2" height="3" fill="#FEE2E2" />
        {/* Palha saindo das mangas */}
        <rect x="2" y="10" width="2" height="2" fill="#F59E0B" />
        <rect x="20" y="10" width="2" height="2" fill="#F59E0B" />
        {/* Calça jeans rasgada */}
        <rect x="9" y="12" width="6" height="6" fill="#1D4ED8" />
        <rect x="11" y="15" width="2" height="3" fill="#1E40AF" />
        {/* Palha saindo na barra */}
        <rect x="10" y="18" width="4" height="2" fill="#F59E0B" />
      </svg>
    ),
  },
  {
    key: 'birdhouse_pixel',
    name: 'Casa de Passarinho',
    category: 'special',
    price: 250,
    description: 'Casinha de madeira aconchegante habitada por um simpático passarinho azul.',
    layer: 1,
    width: 1,
    height: 1,
    renderSprite: (className = 'w-10 h-10') => (
      <svg
        viewBox="0 0 24 24"
        className={className}
        style={{ shapeRendering: 'crispEdges' }}
        aria-hidden="true"
      >
        <ellipse cx="12" cy="22" rx="6" ry="2" fill="rgba(0,0,0,0.25)" />
        {/* Poste */}
        <rect x="11" y="11" width="2" height="11" fill="#78350F" />
        {/* Telhado */}
        <rect x="5" y="4" width="14" height="2" fill="#991B1B" />
        <rect x="7" y="3" width="10" height="2" fill="#DC2626" />
        <rect x="9" y="2" width="6" height="2" fill="#EF4444" />
        <rect x="11" y="1" width="2" height="2" fill="#F87171" />
        {/* Corpo da casinha */}
        <rect x="7" y="6" width="10" height="8" fill="#D97706" />
        <rect x="8" y="7" width="8" height="6" fill="#F59E0B" />
        {/* Furo de entrada */}
        <rect x="10" y="8" width="4" height="4" fill="#451A03" />
        {/* Poleiro */}
        <rect x="11" y="12" width="2" height="2" fill="#78350F" />
        {/* Passarinho azul pousado */}
        <rect x="13" y="11" width="3" height="3" fill="#0284C7" />
        <rect x="15" y="12" width="2" height="1" fill="#F59E0B" />
      </svg>
    ),
  },
  {
    key: 'duo_statue',
    name: 'Estatueta da Vitória',
    category: 'special',
    price: 320,
    description: 'Monumento dourado lapidado que celebra sua dedicação e maestria.',
    layer: 1,
    width: 1,
    height: 1,
    renderSprite: (className = 'w-10 h-10') => (
      <svg
        viewBox="0 0 24 24"
        className={className}
        style={{ shapeRendering: 'crispEdges' }}
        aria-hidden="true"
      >
        <ellipse cx="12" cy="22" rx="9" ry="2" fill="rgba(0,0,0,0.3)" />
        {/* Pedestal de mármore */}
        <rect x="4" y="18" width="16" height="4" fill="#334155" />
        <rect x="5" y="17" width="14" height="2" fill="#64748B" />
        <rect x="6" y="16" width="12" height="2" fill="#94A3B8" />
        {/* Troféu dourado */}
        <rect x="9" y="12" width="6" height="4" fill="#B45309" />
        <rect x="10" y="13" width="4" height="3" fill="#F59E0B" />
        {/* Taça */}
        <rect x="7" y="6" width="10" height="6" fill="#D97706" />
        <rect x="8" y="6" width="8" height="5" fill="#FBBF24" />
        <rect x="9" y="7" width="6" height="3" fill="#FDE68A" />
        {/* Alças da taça */}
        <rect x="5" y="7" width="2" height="4" fill="#B45309" />
        <rect x="17" y="7" width="2" height="4" fill="#B45309" />
        {/* Estrela no topo */}
        <rect x="11" y="2" width="2" height="4" fill="#FEF08A" />
        <rect x="10" y="3" width="4" height="2" fill="#FEF08A" />
      </svg>
    ),
  },
  {
    key: 'festive_flags',
    name: 'Bandeirinhas de Festa',
    category: 'special',
    price: 280,
    description: 'Varal alegre com bandeirinhas coloridas que trazem clima de celebração.',
    layer: 1,
    width: 1,
    height: 1,
    renderSprite: (className = 'w-10 h-10') => (
      <svg
        viewBox="0 0 24 24"
        className={className}
        style={{ shapeRendering: 'crispEdges' }}
        aria-hidden="true"
      >
        <ellipse cx="12" cy="22" rx="8" ry="2" fill="rgba(0,0,0,0.2)" />
        {/* Postes dos lados */}
        <rect x="2" y="5" width="2" height="17" fill="#78350F" />
        <rect x="20" y="5" width="2" height="17" fill="#78350F" />
        {/* Fio */}
        <rect x="3" y="6" width="18" height="1" fill="#475569" />
        <rect x="5" y="7" width="14" height="1" fill="#475569" />
        {/* Bandeirinha 1 (Verde) */}
        <polygon points="5,7 8,7 6.5,12" fill="#22C55E" />
        {/* Bandeirinha 2 (Amarela) */}
        <polygon points="9,8 12,8 10.5,13" fill="#FBBF24" />
        {/* Bandeirinha 3 (Azul) */}
        <polygon points="13,8 16,8 14.5,13" fill="#38BDF8" />
        {/* Bandeirinha 4 (Rosa) */}
        <polygon points="17,7 20,7 18.5,12" fill="#F43F5E" />
      </svg>
    ),
  },
]

export const SHOP_CATALOG_MAP = new Map<string, ShopItem>(
  SHOP_CATALOG.map((item) => [item.key, item]),
)

export function getShopItem(key: string): ShopItem | undefined {
  return SHOP_CATALOG_MAP.get(key)
}
