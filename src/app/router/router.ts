import { createRouter } from '@tanstack/react-router'

import { routeTree } from './generatedRouteTree'
import { NotFoundRedirect } from './NotFoundRedirect'

export const router = createRouter({
  defaultNotFoundComponent: NotFoundRedirect,
  defaultStructuralSharing: true,
  defaultViewTransition: true,
  routeTree,
  scrollRestoration: true,
})
