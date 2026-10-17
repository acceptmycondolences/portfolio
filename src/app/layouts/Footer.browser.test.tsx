import { describe, expect, it } from 'vitest'
import { render } from 'vitest-browser-react'

import { Footer } from './Footer'

describe('Footer', () => {
  it('показывает текущий год и владельца', async () => {
    const screen = await render(<Footer />)
    const currentYear = new Date().getFullYear()

    await expect
      .element(screen.getByRole('contentinfo'))
      .toMatchTextContent(`© ${String(currentYear)} Alibek Allanazarov.`)
    await expect.element(screen.getByText(/All Rights Reserved\./)).toBeVisible()
  })
})
