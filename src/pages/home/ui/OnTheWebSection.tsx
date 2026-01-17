import type { JSX } from 'react'

import { IconBrandGithub, IconBrandInstagram, IconBrandTelegram } from '~/shared/ui'

interface SocialMedia {
  href: string
  icon: () => JSX.Element
  id: number
  label: string
}

const SOCIAL_MEDIA: SocialMedia[] = [
  {
    href: 'https://t.me/acceptmycondolences/',
    icon: IconBrandTelegram,
    id: 1,
    label: 'Telegram',
  },
  {
    href: 'https://instagram.com/acceptmycondolences/',

    icon: IconBrandInstagram,
    id: 2,
    label: 'Instagram',
  },
  {
    href: 'https://github.com/acceptmycondolences/',
    icon: IconBrandGithub,
    id: 3,
    label: 'Github',
  },
]

export function OnTheWebSection() {
  return (
    <section className="space-y-4">
      <h2 className="w-max border-b-4 pb-2 font-mono text-3xl font-semibold tracking-tight">On the web</h2>

      <ul className="flex flex-col">
        {SOCIAL_MEDIA.map((item) => (
          <li className="not-last:mb-2" key={item.id}>
            <a
              className="inline-flex h-9 items-center justify-center gap-0.75 px-1.5 text-sm whitespace-nowrap transition-colors hover:underline hover:underline-offset-4 [&_svg]:pointer-events-none [&_svg]:shrink-0"
              href={item.href}
              rel="noopener,noreferrer"
              target="_blank"
            >
              {item.icon()}
              {item.label}
            </a>
          </li>
        ))}
      </ul>
    </section>
  )
}
