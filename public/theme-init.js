/* global document */

;(() => {
  let storedTheme

  try {
    storedTheme = localStorage.getItem('theme')
  } catch {
    storedTheme = null
  }

  const theme = storedTheme === 'light' ? 'light' : 'dark'

  document.documentElement.classList.add(theme)

  document.querySelector('meta[name="theme-color"]').content = theme === 'dark' ? '#27272a' : '#fff7ed'
})()
