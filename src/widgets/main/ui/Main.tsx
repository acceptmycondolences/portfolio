import { lazy, Suspense } from 'react'

import { Outlet } from '@tanstack/react-router'

import { Container, IconLoader } from '~/shared/ui'

const VoxelDogLazy = lazy(() =>
  import('~/widgets/voxel-dog/ui/VoxelDog').then((module) => ({ default: module.VoxelDog })),
)

export function Main() {
  return (
    <main className="flex-1 py-8">
      <Container className="flex max-w-136 flex-col gap-12 md:max-w-140">
        <Suspense
          fallback={
            <div className="mx-auto -mt-17.5 -mb-22.5 flex size-72 items-center justify-center md:-mt-25.5 md:-mb-33.5 md:size-128 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg]:animate-spin">
              <IconLoader />
            </div>
          }
        >
          <VoxelDogLazy />
        </Suspense>
        <Outlet />
      </Container>
    </main>
  )
}
