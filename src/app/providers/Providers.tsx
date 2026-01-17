import { RouterProvider } from '@tanstack/react-router'

import { router } from '~/app/router'

import { ThemeProvider } from '~/features/theme'

export function Providers() {
  return (
    <ThemeProvider>
      <RouterProvider router={router} />
    </ThemeProvider>
  )
}
