import { createContext } from 'react'

import type { Theme } from './theme.types'

export interface ThemeContextValue {
  setTheme: (theme: Theme) => void
  theme: Theme
}

export const ThemeContext = createContext<null | ThemeContextValue>(null)
