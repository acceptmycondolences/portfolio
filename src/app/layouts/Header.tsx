import { Link } from '@tanstack/react-router'

import { Menu } from '~/widgets/menu'
import { Navbar } from '~/widgets/navbar'

import { ThemeSwitcher, useTheme } from '~/features/theme'

import { useIsMobile } from '~/shared/lib'
import { Container, IconPaw, IconPawFilled } from '~/shared/ui'

export function Header() {
  const { theme } = useTheme()

  const isMobile = useIsMobile()

  return (
    <header className="sticky top-0 left-0 z-50 bg-orange-50/95 py-4 text-zinc-800 backdrop-blur supports-backdrop-filter:bg-orange-50/50 dark:bg-zinc-800/95 dark:text-orange-50 dark:supports-backdrop-filter:bg-zinc-800/50">
      <Container className="flex items-center">
        <Link
          className="inline-flex h-9 shrink-0 items-center justify-center gap-2 text-sm font-semibold whitespace-nowrap uppercase [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg]:-rotate-[22.5deg] [&_svg]:transition-transform hover:[&_svg]:rotate-0"
          title="Home page"
          to="/"
        >
          {theme === 'dark' ? <IconPaw /> : <IconPawFilled />}
          Alibek Allanazarov
        </Link>

        {!isMobile && <Navbar />}

        <div className="ml-auto flex items-center gap-2">
          <ThemeSwitcher />
          {isMobile && <Menu />}
        </div>
      </Container>
    </header>
  )
}
