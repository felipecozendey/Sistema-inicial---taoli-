import * as React from 'react'
import { ThemeProvider as NextThemesProvider } from 'next-themes'
import { type ThemeProviderProps } from 'next-themes'

type ColorTheme = 'default' | 'ocean' | 'forest' | 'sunset' | 'midnight' | 'cyberpunk'

interface ColorThemeContextType {
  colorTheme: ColorTheme
  setColorTheme: (theme: ColorTheme) => void
}

const ColorThemeContext = React.createContext<ColorThemeContextType>({
  colorTheme: 'default',
  setColorTheme: () => {},
})

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  const [colorTheme, setColorThemeState] = React.useState<ColorTheme>(
    () => (localStorage.getItem('vt-color-theme') as ColorTheme) || 'default',
  )

  React.useEffect(() => {
    document.documentElement.setAttribute('data-theme', colorTheme)
    localStorage.setItem('vt-color-theme', colorTheme)
  }, [colorTheme])

  const setColorTheme = React.useCallback((theme: ColorTheme) => {
    setColorThemeState(theme)
  }, [])

  return (
    <ColorThemeContext.Provider value={{ colorTheme, setColorTheme }}>
      <NextThemesProvider {...props}>{children}</NextThemesProvider>
    </ColorThemeContext.Provider>
  )
}

export const useColorTheme = () => React.useContext(ColorThemeContext)
