import { createMemoryHistory, createRootRoute, createRoute, createRouter, RouterProvider } from '@tanstack/react-router'
import { describe, expect, it } from 'vitest'
import { render } from 'vitest-browser-react'

import { Main } from './Main'

describe('Main', () => {
  it('показывает доступный статус до загрузки lazy-компонента, сохраняя содержимое страницы', async () => {
    const rootRoute = createRootRoute({ component: Main })
    const indexRoute = createRoute({
      component: () => <p>Page content</p>,
      getParentRoute: () => rootRoute,
      path: '/',
    })
    const router = createRouter({
      history: createMemoryHistory({ initialEntries: ['/'] }),
      routeTree: rootRoute.addChildren([indexRoute]),
    })
    await router.load()

    const container = document.createElement('div')
    document.body.append(container)
    const announcements: { busy: null | string; loaderHidden: null | string; text: null | string }[] = []
    // Fallback может исчезнуть до завершения render: наблюдаем настоящие вставки DOM, не подменяя lazy или виджет.
    const observer = new MutationObserver((records) => {
      for (const record of records) {
        for (const node of record.addedNodes) {
          if (!(node instanceof Element)) continue
          const statuses = node.matches('[role="status"]') ? [node] : node.querySelectorAll('[role="status"]')
          statuses.forEach((status) => {
            if (status.querySelector('canvas')) return
            announcements.push({
              busy: status.getAttribute('aria-busy'),
              loaderHidden: status.querySelector('svg')?.getAttribute('aria-hidden') ?? null,
              text: status.textContent,
            })
          })
        }
      }
    })
    observer.observe(container, { childList: true, subtree: true })

    const screen = await render(<RouterProvider router={router} />, { container })
    try {
      await expect.element(screen.getByRole('main').getByText('Page content')).toBeVisible()
      expect(announcements).toContainEqual({
        busy: 'true',
        loaderHidden: 'true',
        text: 'Loading 3D voxel dog model...',
      })
    } finally {
      observer.disconnect()
      await screen.unmount()
      container.remove()
    }
  })
})
