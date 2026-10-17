import { describe, expect, it } from 'vitest'
import { renderHook } from 'vitest-browser-react'

import { useTheme } from './useTheme'

describe('useTheme', () => {
  it('сообщает об отсутствии ThemeProvider', async () => {
    await expect(renderHook(() => useTheme())).rejects.toThrow('useTheme must be used within a ThemeProvider')
  })
})
