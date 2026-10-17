import { describe, expect, it } from 'vitest'

describe('application entry point without a root element', () => {
  it('не монтирует приложение без корневого элемента', async () => {
    document.getElementById('root')?.remove()
    const childrenBefore = document.body.childElementCount

    await import('./main')

    expect(document.body.childElementCount).toBe(childrenBefore)
  })
})
