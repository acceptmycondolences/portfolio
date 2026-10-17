import { createMemoryHistory, createRouter, RouterProvider } from '@tanstack/react-router'
import { describe, expect, it, vi } from 'vitest'
import { render } from 'vitest-browser-react'

import { routeTree } from '~/app/router/generatedRouteTree'

import { ThemeProvider } from '~/features/theme'

import { NotFoundRedirect } from './NotFoundRedirect'

vi.mock(import('typeit-react'), () => ({
  default: () => <p>Hi, I am a frontend developer.</p>,
}))

describe('NotFoundRedirect', () => {
  it('перенаправляет неизвестный адрес на главную страницу', async () => {
    const router = createRouter({
      defaultNotFoundComponent: NotFoundRedirect,
      defaultViewTransition: false,
      history: createMemoryHistory({ initialEntries: ['/missing-route'] }),
      routeTree,
    })
    const screen = await render(
      <ThemeProvider>
        <RouterProvider router={router} />
      </ThemeProvider>,
    )

    await vi.waitFor(() => {
      expect(router.state.location.pathname).toBe('/')
    })

    await expect.element(screen.getByRole('heading', { name: 'About' })).toBeVisible()
  })
})
