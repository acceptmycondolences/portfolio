import { use } from 'react'

import { ThemeContext } from '~/features/theme'

export const useTheme = () => {
  const context = use(ThemeContext)

  return context
}
