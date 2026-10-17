import { describe, expect, it, vi } from 'vitest'
import { renderHook } from 'vitest-browser-react'

import { useIsMobile } from './useIsMobile'

describe('useIsMobile', () => {
  it.for([
    { expected: true, viewportWidth: 767.5 },
    { expected: false, viewportWidth: 768 },
    { expected: false, viewportWidth: 1024 },
  ])('при ширине $viewportWidth возвращает $expected', async ({ expected, viewportWidth }) => {
    vi.stubGlobal('matchMedia', (query: string) => {
      const match = /^\((max-width: |width < )(\d+(?:\.\d+)?)(px|rem)\)$/.exec(query)
      if (!match) throw new Error(`Unsupported media query: ${query}`)

      const threshold = Number(match[2]) * (match[3] === 'rem' ? 16 : 1)

      return {
        addEventListener: vi.fn(),
        matches: match[1] === 'width < ' ? viewportWidth < threshold : viewportWidth <= threshold,
        removeEventListener: vi.fn(),
      }
    })

    const { result } = await renderHook(() => useIsMobile())

    expect(result.current).toBe(expected)
  })

  it('подхватывает изменение ширины при подключении слушателя', async () => {
    let matches = false

    vi.stubGlobal('matchMedia', () => ({
      addEventListener: () => {
        matches = true
      },
      get matches() {
        return matches
      },
      removeEventListener: vi.fn(),
    }))

    const { result } = await renderHook(() => useIsMobile())

    expect(result.current).toBe(true)
  })

  it('обновляется при изменении медиаусловия', async () => {
    const mediaQueryList = new EventTarget()
    let matches = false

    vi.stubGlobal('matchMedia', () => ({
      addEventListener: mediaQueryList.addEventListener.bind(mediaQueryList),
      get matches() {
        return matches
      },
      removeEventListener: mediaQueryList.removeEventListener.bind(mediaQueryList),
    }))

    const { result } = await renderHook(() => useIsMobile())
    expect(result.current).toBe(false)

    matches = true
    mediaQueryList.dispatchEvent(new Event('change'))

    await vi.waitFor(() => {
      expect(result.current).toBe(true)
    })
  })
})
