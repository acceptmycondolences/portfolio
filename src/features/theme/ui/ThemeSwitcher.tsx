import { useTheme } from '~/features/theme'

import { IconMoonFilled, IconSun } from '~/shared/ui'

export function ThemeSwitcher() {
  const { setTheme, theme } = useTheme()

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark')
  }

  return (
    <button
      className="inline-flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-md text-gray-600 transition-colors hover:bg-gray-600/10 dark:text-yellow-200 dark:hover:bg-yellow-200/5 [&_svg]:pointer-events-none [&_svg]:shrink-0"
      onClick={toggleTheme}
      type="button"
    >
      {theme === 'dark' ? <IconSun /> : <IconMoonFilled />}
      <span className="sr-only">Toggle theme</span>
    </button>
  )
}
