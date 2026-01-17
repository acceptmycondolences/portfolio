import { createRootRoute } from '@tanstack/react-router'

import { RootLayouts } from '~/app/layouts'

export const Route = createRootRoute({
  component: RootLayouts,
})
