import { createContext } from 'react'

import type { Theme } from '~/features/theme'

export interface ThemeContextState {
  setTheme: (theme: Theme) => void
  theme: Theme
}

export const ThemeContext = createContext<ThemeContextState>({ setTheme: () => null, theme: 'dark' })
