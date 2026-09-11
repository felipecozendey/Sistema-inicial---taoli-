import React from 'react'
import { cn } from '@/lib/utils'

interface BristolIconProps {
  type: number // 1 a 7
  className?: string
  size?: number | string
}

/**
 * BristolIcon: Ilustrações esquemáticas e amigáveis para cada tipo da Escala de Bristol (1 a 7).
 * Design no estilo Duolingo: traços arredondados, paleta terrosa/quente, formas estilizadas e claras,
 * sem parecer excessivamente cru ou fotográfico, facilitando a identificação imediata da consistência.
 */
export function BristolIcon({ type, className, size = 44 }: BristolIconProps) {
  // Paleta terrosa neutra/quente consistente
  const mainBrown = '#795548' // tom base médio
  const darkBrown = '#4E342E' // tom escuro para sombras/contornos/detalhes
  const lightBrown = '#8D6E63' // tom mais claro/iluminação
  const crackStroke = '#3E2723' // tom de fendas/rachaduras
  const liquidBase = '#8D6E63' // tom para consistência líquida
  const liquidDark = '#5D4037'

  const dimensionProps = {
    width: size,
    height: size,
    viewBox: '0 0 64 64',
    fill: 'none',
    xmlns: 'http://www.w3.org/2000/svg',
    className: cn('shrink-0 select-none overflow-visible', className),
    'aria-hidden': true,
  }

  switch (type) {
    case 1:
      // Tipo 1: Bolinhas duras separadas (como nozes / pedregulhos pequenos)
      return (
        <svg {...dimensionProps}>
          {/* Bolinha 1 - canto superior esquerdo */}
          <circle cx="20" cy="20" r="8" fill={mainBrown} />
          <circle cx="18" cy="18" r="6" fill={lightBrown} />
          <circle cx="16" cy="16" r="2.5" fill="#A1887F" />
          <path
            d="M22 22 C23 24 21 26 19 26"
            stroke={darkBrown}
            strokeWidth="1.5"
            strokeLinecap="round"
          />

          {/* Bolinha 2 - canto superior direito */}
          <circle cx="44" cy="22" r="7.5" fill={mainBrown} />
          <circle cx="42" cy="20" r="5.5" fill={lightBrown} />
          <circle cx="40" cy="18" r="2" fill="#A1887F" />
          <path
            d="M46 23 C47 25 45 27 43 27"
            stroke={darkBrown}
            strokeWidth="1.5"
            strokeLinecap="round"
          />

          {/* Bolinha 3 - centro/esquerda */}
          <circle cx="28" cy="36" r="8.5" fill={mainBrown} />
          <circle cx="26" cy="34" r="6.5" fill={lightBrown} />
          <circle cx="24" cy="32" r="2.5" fill="#A1887F" />
          <path
            d="M30 38 C31 40 29 42 27 42"
            stroke={darkBrown}
            strokeWidth="1.5"
            strokeLinecap="round"
          />

          {/* Bolinha 4 - inferior direito */}
          <circle cx="46" cy="42" r="7" fill={mainBrown} />
          <circle cx="44" cy="40" r="5" fill={lightBrown} />
          <circle cx="42" cy="38" r="2" fill="#A1887F" />
          <path
            d="M48 43 C49 45 47 47 45 47"
            stroke={darkBrown}
            strokeWidth="1.5"
            strokeLinecap="round"
          />

          {/* Bolinha 5 - pequena isolada inferior esquerda */}
          <circle cx="16" cy="46" r="5.5" fill={mainBrown} />
          <circle cx="15" cy="45" r="3.5" fill={lightBrown} />
          <circle cx="14" cy="44" r="1.5" fill="#A1887F" />
        </svg>
      )

    case 2:
      // Tipo 2: Aglomerado irregular de bolinhas (salsicha feita de pedaços empombados juntos)
      return (
        <svg {...dimensionProps}>
          {/* Base agrupada unida */}
          <rect x="12" y="24" width="40" height="18" rx="9" fill={darkBrown} />
          {/* Múltiplos módulos de bolinhas se sobrepondo em formato de salsicha granulada */}
          <ellipse cx="18" cy="30" rx="9" ry="11" fill={mainBrown} />
          <ellipse cx="16" cy="28" rx="6.5" ry="8" fill={lightBrown} />
          <circle cx="14" cy="25" r="2.5" fill="#A1887F" />

          <ellipse cx="28" cy="35" rx="8" ry="10" fill={mainBrown} />
          <ellipse cx="27" cy="33" rx="5.5" ry="7.5" fill={lightBrown} />

          <ellipse cx="32" cy="25" rx="8.5" ry="10" fill={mainBrown} />
          <ellipse cx="31" cy="23" rx="6" ry="7.5" fill={lightBrown} />
          <circle cx="29" cy="21" r="2.5" fill="#A1887F" />

          <ellipse cx="42" cy="34" rx="8" ry="10.5" fill={mainBrown} />
          <ellipse cx="40" cy="32" rx="6" ry="8" fill={lightBrown} />

          <ellipse cx="48" cy="27" rx="8" ry="9" fill={mainBrown} />
          <ellipse cx="46" cy="25" rx="5.5" ry="6.5" fill={lightBrown} />
          <circle cx="44" cy="23" r="2" fill="#A1887F" />

          {/* Divisórias curvas entre as saliências */}
          <path
            d="M23 23 C22 30 25 38 23 42"
            stroke={darkBrown}
            strokeWidth="1.8"
            strokeLinecap="round"
          />
          <path
            d="M37 21 C36 29 38 37 36 41"
            stroke={darkBrown}
            strokeWidth="1.8"
            strokeLinecap="round"
          />
        </svg>
      )

    case 3:
      // Tipo 3: Formato alongado tipo salsicha com rachaduras/fendas na superfície
      return (
        <svg {...dimensionProps}>
          {/* Silhueta cilíndrica suavemente curvada */}
          <path
            d="M12 36 C10 26 20 22 30 22 C42 22 52 26 52 34 C52 42 42 43 30 43 C18 43 12 42 12 36 Z"
            fill={mainBrown}
          />
          {/* Brilho superior suave */}
          <path
            d="M16 30 C16 26 24 24 32 24 C40 24 48 27 48 31"
            stroke={lightBrown}
            strokeWidth="3"
            strokeLinecap="round"
          />
          {/* Fendas / Rachaduras expressivas na superfície */}
          <path
            d="M20 25 L21 32 L19 36"
            stroke={crackStroke}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M28 24 L29 34 L27 41"
            stroke={crackStroke}
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M36 24 L38 31 L35 39"
            stroke={crackStroke}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M44 26 L45 33 L43 37"
            stroke={crackStroke}
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* Pequena fissura horizontal */}
          <path d="M22 32 L26 31" stroke={crackStroke} strokeWidth="1.5" strokeLinecap="round" />
          <path d="M37 33 L41 34" stroke={crackStroke} strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      )

    case 4:
      // Tipo 4: Formato de salsicha ou serpente, contínuo, liso, macio e arredondado (o padrão ideal)
      return (
        <svg {...dimensionProps}>
          {/* Sombra de profundidade sutil */}
          <path
            d="M10 37 C10 44 20 46 32 45 C44 44 54 42 54 35 C54 27 46 23 34 23 C20 23 10 28 10 37 Z"
            fill={darkBrown}
          />
          {/* Corpo principal perfeitamente arredondado e macio */}
          <path
            d="M10 35 C10 26 20 22 33 22 C45 22 54 26 54 33 C54 40 44 43 33 43 C20 43 10 41 10 35 Z"
            fill={mainBrown}
          />
          {/* Faixa de destaque / reflexo brilhante liso demonstrando superfície macia */}
          <path
            d="M15 30 C19 25 30 24 40 25 C46 26 49 28 49 30"
            stroke="#A1887F"
            strokeWidth="3.5"
            strokeLinecap="round"
          />
          <circle cx="16" cy="30" r="1.5" fill="#D7CCC8" />
          <path
            d="M22 27 C28 26 36 26 42 27"
            stroke="#D7CCC8"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
      )

    case 5:
      // Tipo 5: Pedaços macios separados, porém com contornos/bordas nítidas e bem definidas
      return (
        <svg {...dimensionProps}>
          {/* Pedaço 1 - centro-esquerda */}
          <path
            d="M12 28 C12 21 22 20 26 24 C29 27 28 35 23 37 C17 39 12 35 12 28 Z"
            fill={mainBrown}
            stroke={darkBrown}
            strokeWidth="1.5"
          />
          <circle cx="18" cy="27" r="3" fill={lightBrown} />
          <circle cx="17" cy="26" r="1" fill="#D7CCC8" />

          {/* Pedaço 2 - centro-direita superior */}
          <path
            d="M34 18 C37 14 47 16 48 22 C49 27 45 32 39 31 C33 30 31 23 34 18 Z"
            fill={mainBrown}
            stroke={darkBrown}
            strokeWidth="1.5"
          />
          <circle cx="41" cy="22" r="3" fill={lightBrown} />
          <circle cx="40" cy="21" r="1" fill="#D7CCC8" />

          {/* Pedaço 3 - inferior direita */}
          <path
            d="M32 37 C34 32 44 33 47 38 C49 43 45 49 39 48 C33 47 30 41 32 37 Z"
            fill={mainBrown}
            stroke={darkBrown}
            strokeWidth="1.5"
          />
          <circle cx="40" cy="41" r="3" fill={lightBrown} />
          <circle cx="39" cy="40" r="1" fill="#D7CCC8" />
        </svg>
      )

    case 6:
      // Tipo 6: Pedaços fofos/esfarrapados com bordas irregulares e pastosas
      return (
        <svg {...dimensionProps}>
          {/* Pedaço esfarrapado 1 - grande centro/esquerda */}
          <path
            d="M12 32 C10 25 16 23 20 25 C23 22 28 23 30 26 C34 24 38 27 36 32 C39 36 36 41 31 42 C27 44 24 41 21 43 C16 43 11 39 12 32 Z"
            fill={mainBrown}
          />
          {/* Mancha pastosa 2 - superior direita */}
          <path
            d="M37 20 C35 16 41 14 45 16 C49 14 53 18 51 22 C54 26 50 30 46 29 C42 30 38 27 37 20 Z"
            fill={lightBrown}
          />
          {/* Pequenos respingos/pedaços pastosos em volta */}
          <path
            d="M38 37 C36 34 40 33 43 34 C46 33 49 36 47 39 C49 42 46 45 43 44 C39 45 37 42 38 37 Z"
            fill={mainBrown}
          />
          <circle cx="16" cy="20" r="2.5" fill={lightBrown} />
          <circle cx="51" cy="35" r="2" fill={darkBrown} />
          <circle cx="27" cy="47" r="2.5" fill={darkBrown} />

          {/* Textura pastosa e irregular interna */}
          <path
            d="M17 31 C21 30 26 33 29 32"
            stroke={lightBrown}
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      )

    case 7:
      // Tipo 7: Totalmente líquido, aquoso e sem pedaços sólidos (poça ondulada com gotas/respingos)
      return (
        <svg {...dimensionProps}>
          {/* Poça líquida principal */}
          <path
            d="M8 43 C7 36 15 33 24 35 C32 32 42 31 52 35 C58 37 59 44 54 48 C46 51 32 52 20 50 C11 49 7 47 8 43 Z"
            fill={liquidBase}
          />
          {/* Camada interna de profundidade da poça */}
          <path
            d="M14 43 C18 40 28 39 40 40 C48 41 51 44 47 46 C39 48 26 48 17 46 C14 45 13 44 14 43 Z"
            fill={liquidDark}
          />
          {/* Ondulação / reflexo da água */}
          <path
            d="M20 42 C26 40 34 40 40 42"
            stroke="#D7CCC8"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
          <path
            d="M25 45 C30 44 36 44 39 45"
            stroke="#D7CCC8"
            strokeWidth="1.2"
            strokeLinecap="round"
          />

          {/* Gotas/respingos no ar indicando consistência totalmente fluida */}
          <path
            d="M23 20 C23 17 26 13 26 13 C26 13 29 17 29 20 C29 22 26 24 26 24 C26 24 23 22 23 20 Z"
            fill={liquidBase}
          />
          <path
            d="M39 23 C39 20 41 17 41 17 C41 17 43 20 43 23 C43 24.5 41 26 41 26 C41 26 39 24.5 39 23 Z"
            fill={lightBrown}
          />
          <circle cx="15" cy="27" r="2.5" fill={liquidBase} />
          <circle cx="49" cy="26" r="2" fill={liquidBase} />
        </svg>
      )

    default:
      return null
  }
}
