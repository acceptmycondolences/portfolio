import { createRouter } from '@tanstack/react-router'

import { routeTree } from '~/app/router'

import { NotFoundPage } from '~/pages/not-found'

export const router = createRouter({
  defaultNotFoundComponent: NotFoundPage,
  defaultStructuralSharing: true,
  defaultViewTransition: true,
  routeTree,
  scrollRestoration: true,
})
