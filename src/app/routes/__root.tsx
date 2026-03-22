import { createRootRoute } from '@tanstack/react-router'

import { RootLayout } from '~/app/layouts'

export const Route = createRootRoute({
  component: RootLayout,
})
