export type Theme = 'light' | 'dark'

export const THEME_STORAGE_KEY = 'wdwshiftx-theme'

export function getStoredTheme(): Theme {
  if (typeof window === 'undefined') return 'light'
  return localStorage.getItem(THEME_STORAGE_KEY) === 'dark' ? 'dark' : 'light'
}

export function applyTheme(theme: Theme) {
  document.documentElement.classList.toggle('dark', theme === 'dark')
  localStorage.setItem(THEME_STORAGE_KEY, theme)
}
