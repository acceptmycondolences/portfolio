import { createMemoryHistory, createRouter, RouterProvider } from '@tanstack/react-router'
import { describe, expect, it, vi } from 'vitest'
import { render } from 'vitest-browser-react'

import { ThemeProvider } from '~/features/theme'

import { routeTree } from './generatedRouteTree'

// Таймеры сторонней анимации не относятся к контракту маршрутизации; её реальный цикл проверяет GreetingSection.
vi.mock(import('typeit-react'), () => ({
  default: () => <p>Hi, I am a frontend developer.</p>,
}))

describe('routeConfig', () => {
  it.for([
    { path: '/', text: 'About' },
    { path: '/projects', text: 'Coming soon…' },
  ])('показывает страницу $path вместе с общим layout', async ({ path, text }) => {
    const router = createRouter({
      defaultViewTransition: false,
      history: createMemoryHistory({ initialEntries: [path] }),
      routeTree,
    })
    const screen = await render(
      <ThemeProvider>
        <RouterProvider router={router} />
      </ThemeProvider>,
    )

    await expect.element(screen.getByRole('banner')).toBeVisible()
    await expect.element(screen.getByRole('main').getByText(text, { exact: true })).toBeVisible()
    await expect.element(screen.getByRole('contentinfo')).toBeVisible()
    expect(router.state.location.pathname).toBe(path)
  })
})
