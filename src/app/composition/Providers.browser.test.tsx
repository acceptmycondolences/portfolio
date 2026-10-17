import { describe, expect, it, vi } from 'vitest'
import { render } from 'vitest-browser-react'
import { page, userEvent } from 'vitest/browser'

import { Providers } from './Providers'

vi.mock(import('typeit-react'), () => ({
  default: () => <p>Hi, I am a frontend developer.</p>,
}))

describe('Providers', () => {
  it('переключает маршруты, закрывает меню и адаптирует навигацию к ширине', async () => {
    localStorage.removeItem('theme')
    await page.viewport(767, 900)

    const screen = await render(<Providers />)

    await expect.element(screen.getByRole('banner')).toBeVisible()
    await expect.element(screen.getByRole('link', { name: 'Alibek Allanazarov' })).toHaveAttribute('title', 'Home page')
    await expect.element(screen.getByRole('main')).toBeVisible()
    await expect.element(screen.getByRole('contentinfo')).toBeVisible()
    await expect.element(screen.getByRole('heading', { name: 'About' })).toBeVisible()

    const menuButton = screen.getByRole('button', { name: 'Menu' })
    await expect.element(menuButton).toHaveAttribute('aria-expanded', 'false')
    await expect.element(menuButton).toHaveAttribute('aria-haspopup', 'dialog')
    menuButton.element().focus()
    await userEvent.keyboard('{Enter}')
    const dialog = screen.getByRole('dialog', { name: 'Navigation' })
    await expect.element(dialog).toBeVisible()
    await expect.element(menuButton).toHaveAttribute('aria-expanded', 'true')
    const navigation = dialog.getByRole('navigation')
    await expect.element(navigation).toBeVisible()
    const navigationItems = navigation.element().querySelectorAll('li')
    expect(navigationItems).toHaveLength(3)
    await expect.element(navigationItems[1]).toHaveAttribute('aria-hidden', 'true')
    await expect.element(screen.getByRole('link', { name: 'Projects' })).not.toHaveAttribute('aria-current')
    for (const graphic of document.querySelectorAll<SVGSVGElement>('header svg, [role="dialog"] svg')) {
      await expect.element(graphic).toHaveAttribute('aria-hidden', 'true')
    }
    screen.getByRole('link', { name: 'Projects' }).element().focus()
    await userEvent.keyboard('{Tab}')
    await expect.element(screen.getByRole('link', { name: 'Source' })).toHaveFocus()
    await userEvent.keyboard('{Shift>}{Tab}{/Shift}')
    await expect.element(screen.getByRole('link', { name: 'Projects' })).toHaveFocus()
    await screen.getByRole('link', { name: 'Projects' }).click()

    await expect.element(screen.getByText('Coming soon…')).toBeVisible()
    await expect.element(menuButton).toHaveAttribute('aria-expanded', 'false')
    await expect.element(screen.getByRole('heading', { name: 'About' })).not.toBeInTheDocument()

    await menuButton.click()
    await expect.element(menuButton).toHaveAttribute('aria-expanded', 'true')
    await userEvent.keyboard('{Escape}')
    await expect.element(menuButton).toHaveAttribute('aria-expanded', 'false')
    await expect.element(menuButton).toHaveFocus()

    await menuButton.click()
    const mobileSource = screen.getByRole('link', { name: 'Source' })
    // Проверяем закрытие меню по настоящему клику, удерживая переход на внешний сайт в границе теста.
    mobileSource.element().addEventListener(
      'click',
      (event) => {
        event.preventDefault()
      },
      { once: true },
    )
    await mobileSource.click()
    await expect.element(menuButton).toHaveAttribute('aria-expanded', 'false')

    await page.viewport(1024, 900)

    const desktopProjectsLink = screen.getByRole('link', { name: 'Projects' })
    await expect.element(desktopProjectsLink).toBeVisible()
    await expect.element(desktopProjectsLink).toHaveAttribute('aria-current', 'page')
    await expect.element(screen.getByRole('navigation').getByRole('list')).toBeVisible()
    await expect.element(menuButton).not.toBeInTheDocument()

    const themeButton = screen.getByRole('button', { name: 'Toggle theme' })
    themeButton.element().focus()
    await userEvent.keyboard(' ')
    await expect.element(document.documentElement).toHaveClass('light')
    await expect.element(themeButton).toHaveFocus()
    for (const graphic of screen.getByRole('banner').element().querySelectorAll('svg')) {
      await expect.element(graphic).toHaveAttribute('aria-hidden', 'true')
    }

    await desktopProjectsLink.click()
    await expect.element(screen.getByText('Coming soon…')).toBeVisible()

    await expect
      .element(screen.getByRole('link', { name: 'Source' }))
      .toHaveAttribute('href', 'https://github.com/acceptmycondolences/portfolio/')
    await screen.getByRole('link', { name: 'Alibek Allanazarov' }).click()
    await expect.element(screen.getByRole('heading', { name: 'About' })).toBeVisible()
    await expect.element(desktopProjectsLink).not.toHaveAttribute('aria-current')
    await expect.element(screen.getByText('Coming soon…')).not.toBeInTheDocument()
    localStorage.removeItem('theme')
  })
})
