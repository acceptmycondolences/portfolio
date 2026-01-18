import type { JSX } from 'react'

import { IconBrandInstagram, IconBrandTelegram, IconPhone } from '~/shared/ui'

interface SocialMedia {
  href: string
  icon: () => JSX.Element
  id: number
  label: string
}

const SOCIAL_MEDIA: SocialMedia[] = [
  {
    href: 'https://t.me/taleofbygoneyears/',
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
    href: 'tel:+998-99-882-96-16',
    icon: IconPhone,
    id: 3,
    label: 'Phone number',
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
