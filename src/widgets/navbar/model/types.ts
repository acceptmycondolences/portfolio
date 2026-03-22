import type { LinkProps } from '@tanstack/react-router'

export interface Route {
  label: string
  to: LinkProps['to']
}
