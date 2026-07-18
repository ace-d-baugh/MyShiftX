export type Theme = 'light' | 'dark' | 'midnight' | 'cyberpunk' | 'nordic'

export const THEME_STORAGE_KEY = 'myshiftx-theme'

export interface ThemeInfo {
  id: Theme
  label: string
  description: string
  pro: boolean
  /** Swatch colors for the theme picker preview. */
  preview: { bg: string; accent: string; text: string }
}

export const THEMES: ThemeInfo[] = [
  { id: 'light',     label: 'Light',     description: 'The classic MyShiftX look',                  pro: false, preview: { bg: '#FFFFFF', accent: '#BD80FF', text: '#2F2040' } },
  { id: 'dark',      label: 'Dark',      description: 'Easy on the eyes',                           pro: false, preview: { bg: '#191023', accent: '#BD80FF', text: '#E9E3F2' } },
  { id: 'midnight',  label: 'Midnight',  description: 'True OLED black — saves battery on mobile',  pro: true,  preview: { bg: '#000000', accent: '#BD80FF', text: '#EBEBEB' } },
  { id: 'cyberpunk', label: 'Cyberpunk', description: 'Neon on black, monospace edge',              pro: true,  preview: { bg: '#060213', accent: '#FF2ED2', text: '#7CFCE0' } },
  { id: 'nordic',    label: 'Nordic',    description: 'Muted sage, cream, and slate',               pro: true,  preview: { bg: '#F7F4EC', accent: '#5E8570', text: '#3C4650' } },
]

/** Themes built on the dark palette — they carry the `dark` class so every `.dark` style applies. */
const DARK_BASED: readonly Theme[] = ['dark', 'midnight', 'cyberpunk']

/** Themes that add their own `theme-<id>` class on top of the light/dark base. */
const CLASSED: readonly Theme[] = ['midnight', 'cyberpunk', 'nordic']

export function isTheme(value: unknown): value is Theme {
  return THEMES.some(t => t.id === value)
}

export function isProTheme(theme: Theme): boolean {
  return THEMES.find(t => t.id === theme)?.pro ?? false
}

export function getStoredTheme(): Theme {
  if (typeof window === 'undefined') return 'light'
  const stored = localStorage.getItem(THEME_STORAGE_KEY)
  return isTheme(stored) ? stored : 'light'
}

export function applyTheme(theme: Theme) {
  const root = document.documentElement
  root.classList.toggle('dark', DARK_BASED.includes(theme))
  for (const t of CLASSED) root.classList.toggle(`theme-${t}`, t === theme)
  localStorage.setItem(THEME_STORAGE_KEY, theme)
}
