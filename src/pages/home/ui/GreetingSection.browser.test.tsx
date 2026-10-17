import { describe, expect, it } from 'vitest'
import { render } from 'vitest-browser-react'

import { ThemeProvider, ThemeSwitcher } from '~/features/theme'

import { GreetingSection } from './GreetingSection'

describe('GreetingSection', () => {
  it('показывает итоговый текст анимированного приветствия', async () => {
    const screen = await render(<GreetingSection />)

    await expect.element(screen.getByText(/frontend developer\./), { timeout: 15000 }).toBeVisible()

    await screen.unmount()
  })

  it.for(['dark', 'light'] as const)('обновляет цвет курсора при переключении темы из %s', async (theme) => {
    const storageKey = `greeting-cursor-${theme}`
    localStorage.removeItem(storageKey)
    const screen = await render(
      <ThemeProvider defaultTheme={theme} storageKey={storageKey}>
        <ThemeSwitcher />
        <GreetingSection />
      </ThemeProvider>,
    )
    try {
      const paragraph = screen.container.querySelector('[data-typeit-id]')
      const cursor = screen.container.querySelector('.ti-cursor')
      if (!paragraph || !(cursor instanceof HTMLElement)) throw new Error('Анимация приветствия не инициализирована')
      const initialColor = getComputedStyle(paragraph).color
      await expect.element(cursor).toHaveStyle({ color: initialColor })

      await screen.getByRole('button', { name: 'Toggle theme' }).click()

      const nextColor = getComputedStyle(paragraph).color
      expect(nextColor).not.toBe(initialColor)
      await expect.element(cursor, { timeout: 1000 }).toHaveStyle({ color: nextColor })
      expect(screen.container.querySelector('.ti-cursor')).toBe(cursor)

      await screen.getByRole('button', { name: 'Toggle theme' }).click()

      await expect.element(cursor).toHaveStyle({ color: initialColor })
      expect(screen.container.querySelector('.ti-cursor')).toBe(cursor)
    } finally {
      await screen.unmount()
      localStorage.removeItem(storageKey)
    }
  })
})
