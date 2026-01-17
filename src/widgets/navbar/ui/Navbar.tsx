import { Link, type LinkProps } from '@tanstack/react-router'

import { useIsMobile } from '~/shared/lib'
import { IconBrandGithub } from '~/shared/ui'

interface Route {
  id: number
  label: string
  to: LinkProps['to']
}

const ROUTES: Route[] = [
  {
    id: 1,
    label: 'Projects',
    to: '/projects',
  },
]

interface NavbarProps {
  onClose?: () => void
}

export function Navbar({ onClose }: NavbarProps) {
  const isMobile = useIsMobile()

  return (
    <nav className="md:ml-6">
      <ul className="flex flex-col gap-2 md:flex-row md:items-center">
        {ROUTES.map((route) => (
          <li className="shrink-0" key={route.id}>
            <Link
              activeOptions={{ exact: true }}
              activeProps={{ className: 'bg-slate-500 md:bg-emerald-600 md:text-white' }}
              className="inline-flex h-9 w-full items-center px-6 py-2 text-sm whitespace-nowrap transition-colors md:w-max md:justify-center md:px-4"
              inactiveProps={{
                className: 'hover:bg-slate-500 md:hover:bg-transparent md:hover:underline md:hover:underline-offset-4',
              }}
              onClick={() => onClose?.()}
              to={route.to}
            >
              {route.label}
            </Link>
          </li>
        ))}
        {isMobile && <li className="h-px w-full shrink-0 bg-zinc-400" />}
        <li className="shrink-0">
          <a
            className="inline-flex h-9 w-full items-center gap-0.75 px-3.5 text-sm whitespace-nowrap transition-colors hover:bg-slate-500 md:w-max md:justify-center md:px-1.5 md:hover:bg-transparent md:hover:underline md:hover:underline-offset-4 [&_svg]:pointer-events-none [&_svg]:shrink-0"
            href="https://github.com/acceptmycondolences/portfolio/"
            onClick={() => onClose?.()}
            rel="noopener,noreferrer"
            target="_blank"
          >
            <IconBrandGithub />
            Source
          </a>
        </li>
      </ul>
    </nav>
  )
}
