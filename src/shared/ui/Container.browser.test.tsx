import { describe, expect, it } from 'vitest'
import { render } from 'vitest-browser-react'

import { Container } from './Container'

describe('Container', () => {
  it('передаёт свойства div и объединяет классы контейнера', async () => {
    const screen = await render(
      <Container aria-label="Project content" className="max-w-120" id="projects">
        Content
      </Container>,
    )

    const container = screen.getByLabelText('Project content')

    await expect.element(container).toHaveAttribute('id', 'projects')
    await expect.element(container).toHaveClass('max-w-120')
    await expect.element(container).not.toHaveClass('max-w-200')
    await expect.element(screen.getByText('Content')).toBeVisible()
  })
})
