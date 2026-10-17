import { createRoot } from 'react-dom/client'

import { describe, expect, it, vi } from 'vitest'
import { page } from 'vitest/browser'

vi.mock(import('react-dom/client'), { spy: true })

vi.mock(import('typeit-react'), () => ({
  default: () => <p>Hi, I am a frontend developer.</p>,
}))

describe('application entry point', () => {
  it('монтирует приложение в существующий корневой элемент', async () => {
    const root = document.createElement('div')
    root.id = 'root'
    document.body.append(root)

    try {
      await import('./main')

      await expect.element(page.getByRole('heading', { name: 'About' })).toBeVisible()
      await expect.element(page.getByRole('banner')).toBeVisible()
      await expect.element(page.getByRole('contentinfo')).toBeVisible()
    } finally {
      for (const result of vi.mocked(createRoot).mock.results) {
        if (result.type === 'return') result.value.unmount()
      }
      root.remove()
    }
  })
})
