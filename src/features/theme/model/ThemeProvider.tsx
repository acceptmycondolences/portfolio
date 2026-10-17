import { useLayoutEffect, useMemo, useState, type PropsWithChildren } from 'react'

import { ThemeContext, type ThemeContextValue } from './theme.context'
import type { Theme } from './theme.types'

interface ThemeProviderProps {
  defaultTheme?: Theme
  storageKey?: string
}

export function ThemeProvider({
  children,
  defaultTheme = 'dark',
  storageKey = 'theme',
}: PropsWithChildren & ThemeProviderProps) {
  const [theme, setTheme] = useState<Theme>(() => {
    try {
      const storedTheme = localStorage.getItem(storageKey)

      return storedTheme === 'dark' || storedTheme === 'light' ? storedTheme : defaultTheme
    } catch {
      return defaultTheme
    }
  })

  useLayoutEffect(() => {
    const html = window.document.documentElement

    html.classList.remove('dark', 'light')

    html.classList.add(theme)

    window.document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute('content', theme === 'dark' ? '#27272a' : '#fff7ed')
  }, [theme])

  const value = useMemo<ThemeContextValue>(
    () => ({
      setTheme: (theme: Theme) => {
        try {
          localStorage.setItem(storageKey, theme)
        } catch {
          // Запрет записи в хранилище не должен мешать переключению темы в текущей вкладке.
        }

        setTheme(theme)
      },
      theme,
    }),
    [storageKey, theme],
  )

  return <ThemeContext value={value}>{children}</ThemeContext>
}
