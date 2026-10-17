import { describe, expect, it } from 'vitest'
import { render } from 'vitest-browser-react'

import { ProjectsPage } from './ProjectsPage'

describe('ProjectsPage', () => {
  it('показывает сообщение о будущих проектах', async () => {
    const screen = await render(<ProjectsPage />)

    await expect.element(screen.getByText('Coming soon…')).toBeVisible()
  })
})
