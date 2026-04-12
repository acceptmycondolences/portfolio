import type { JSX } from 'react'

export interface BioListItem {
  date: string
  description: () => JSX.Element
}

export interface SocialMedia {
  href: string
  icon: () => JSX.Element
  label: string
}
