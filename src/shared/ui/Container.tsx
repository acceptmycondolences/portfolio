import type { ComponentProps } from 'react'

import { classNames } from '~/shared/lib'

export function Container({ className, ...props }: ComponentProps<'div'>) {
  return <div className={classNames('mx-auto w-full max-w-200 px-4 md:max-w-204 md:px-6', className)} {...props} />
}
