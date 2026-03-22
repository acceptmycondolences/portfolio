import { use } from 'react'

import { ThemeContext } from '~/features/theme'

export function useTheme() {
  const context = use(ThemeContext)

  return context
}
