import { it as baseIt, describe, expect, vi } from 'vitest'
import { render } from 'vitest-browser-react'

import { ThemeSwitcher } from '../ui/ThemeSwitcher'
import { ThemeProvider } from './ThemeProvider'

const it = baseIt.extend<{ themeStorage: string }>({
  themeStorage: [
    async ({ task }, provide) => {
      const key = `theme-test-${task.id}`
      const saved = localStorage.getItem('theme')
      const setItem = localStorage.setItem.bind(localStorage)
      localStorage.removeItem('theme')
      try {
        await provide(key)
      } finally {
        localStorage.removeItem(key)
        if (saved === null) localStorage.removeItem('theme')
        else setItem('theme', saved)
      }
    },
    { auto: true },
  ],
})

describe('ThemeProvider', () => {
  it('использует тему по умолчанию при неизвестном сохранённом значении', async () => {
    localStorage.setItem('theme', 'unexpected')

    try {
      await render(
        <ThemeProvider>
          <ThemeSwitcher />
        </ThemeProvider>,
      )

      await expect.element(document.documentElement).toHaveClass('dark')
      await expect.element(document.documentElement).not.toHaveClass('unexpected')
    } finally {
      localStorage.removeItem('theme')
    }
  })

  it('обновляет цвет браузерного интерфейса при переключении темы', async () => {
    localStorage.removeItem('theme')
    const meta = document.createElement('meta')
    meta.name = 'theme-color'
    meta.content = '#27272a'
    document.head.append(meta)

    try {
      const screen = await render(
        <ThemeProvider>
          <ThemeSwitcher />
        </ThemeProvider>,
      )

      await screen.getByRole('button', { name: 'Toggle theme' }).click()

      await expect.element(document.documentElement).toHaveClass('light')
      await expect.element(meta).toHaveAttribute('content', '#fff7ed')
      await screen.getByRole('button', { name: 'Toggle theme' }).click()
      await expect.element(meta).toHaveAttribute('content', '#27272a')
    } finally {
      meta.remove()
      localStorage.removeItem('theme')
    }
  })

  it('использует заданную тему при недоступном хранилище', async () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new DOMException('Storage is unavailable', 'SecurityError')
    })

    await render(
      <ThemeProvider defaultTheme="light">
        <ThemeSwitcher />
      </ThemeProvider>,
    )

    await expect.element(document.documentElement).toHaveClass('light')
  })

  it('переключает светлую тему на тёмную и сохраняет выбор', async () => {
    localStorage.removeItem('theme')

    const screen = await render(
      <ThemeProvider defaultTheme="light">
        <ThemeSwitcher />
      </ThemeProvider>,
    )

    await screen.getByRole('button', { name: 'Toggle theme' }).click()

    await expect.element(document.documentElement).toHaveClass('dark')
    expect(localStorage.getItem('theme')).toBe('dark')
  })

  it('восстанавливает сохранённую светлую тему', async () => {
    localStorage.setItem('theme', 'light')

    try {
      await render(
        <ThemeProvider>
          <ThemeSwitcher />
        </ThemeProvider>,
      )

      await expect.element(document.documentElement).toHaveClass('light')
    } finally {
      localStorage.removeItem('theme')
    }
  })

  it('переключает тему, даже если хранилище запрещает запись', async () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('Storage is unavailable', 'SecurityError')
    })
    const screen = await render(
      <ThemeProvider>
        <ThemeSwitcher />
      </ThemeProvider>,
    )

    await screen.getByRole('button', { name: 'Toggle theme' }).click()
    await expect.element(document.documentElement).toHaveClass('light')
    await screen.getByRole('button', { name: 'Toggle theme' }).click()
    await expect.element(document.documentElement).toHaveClass('dark')
  })

  it('читает и сохраняет тему по заданному ключу', async ({ themeStorage }) => {
    localStorage.setItem(themeStorage, 'light')
    localStorage.setItem('theme', 'unexpected')
    try {
      const screen = await render(
        <ThemeProvider storageKey={themeStorage}>
          <ThemeSwitcher />
        </ThemeProvider>,
      )
      await expect.element(document.documentElement).toHaveClass('light')
      await screen.getByRole('button', { name: 'Toggle theme' }).click()
      expect(localStorage.getItem(themeStorage)).toBe('dark')
      expect(localStorage.getItem('theme')).toBe('unexpected')
    } finally {
      localStorage.removeItem(themeStorage)
    }
  })
})
