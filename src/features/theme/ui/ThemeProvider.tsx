import { useEffect, useMemo, useState, type PropsWithChildren } from 'react'

import { ThemeContext, type Theme, type ThemeContextState } from '~/features/theme'

interface ThemeProviderProps {
  defaultTheme?: Theme
  storageKey?: string
}

export function ThemeProvider({
  children,
  defaultTheme = 'dark',
  storageKey = 'theme',
}: PropsWithChildren & ThemeProviderProps) {
  const [theme, setTheme] = useState<Theme>(
    () => (localStorage.getItem(storageKey) as Theme | undefined) ?? defaultTheme,
  )

  useEffect(() => {
    const html = window.document.documentElement

    html.classList.remove('dark', 'light')

    html.classList.add(theme)
  }, [theme])

  const value = useMemo<ThemeContextState>(
    () => ({
      setTheme: (theme: Theme) => {
        setTheme(theme)

        localStorage.setItem(storageKey, theme)
      },
      theme,
    }),
    [storageKey, theme],
  )

  return <ThemeContext value={value}>{children}</ThemeContext>
}
