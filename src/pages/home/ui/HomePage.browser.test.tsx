import { describe, expect, it, vi } from 'vitest'
import { render } from 'vitest-browser-react'

import { HomePage } from './HomePage'

vi.mock(import('typeit-react'), () => ({
  default: () => <p>Hi, I am a frontend developer.</p>,
}))

describe('HomePage', () => {
  it('показывает разделы профиля, биографию и социальные ссылки', async () => {
    const screen = await render(<HomePage />)

    await expect.element(screen.getByRole('heading', { level: 2, name: 'About' })).toBeVisible()
    await expect.element(screen.getByRole('heading', { level: 2, name: 'Bio' })).toBeVisible()
    await expect.element(screen.getByRole('heading', { level: 2, name: 'I like' })).toBeVisible()
    await expect.element(screen.getByRole('heading', { level: 2, name: 'On the web' })).toBeVisible()
    await expect.element(screen.getByText('28.09.2003')).toBeVisible()
    await expect.element(screen.getByText('Currently')).toBeVisible()

    const decorativeGraphics = screen.container.querySelectorAll('svg')
    expect(decorativeGraphics.length).toBeGreaterThan(0)

    for (const graphic of decorativeGraphics) {
      await expect.element(graphic).toHaveAttribute('aria-hidden', 'true')
    }

    await expect.element(screen.getByText('frontend developer', { exact: true })).toBeVisible()

    for (const [name, href] of [
      ['Telegram', 'https://t.me/taleofbygoneyears/'],
      ['Instagram', 'https://instagram.com/acceptmycondolences/'],
      ['Phone number', 'tel:+998-99-882-96-16'],
    ]) {
      const link = screen.getByRole('link', { name })
      await expect.element(link).toBeVisible()
      await expect.element(link).toHaveAttribute('href', href)
      await expect.element(link).toHaveAttribute('target', '_blank')
      await expect.element(link).toHaveAttribute('rel', 'noopener,noreferrer')
    }
  })
})
