// tailwind.config.ts

import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: 'class',
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Semantic / CSS-variable-driven colors (match globals.css --color-* vars).
        // The <alpha-value> placeholder lets Tailwind opacity modifiers (e.g. text-text/50)
        // keep working once these are variables instead of static hex.
        border: 'hsl(var(--color-border) / <alpha-value>)',
        input: 'hsl(var(--color-input) / <alpha-value>)',
        ring: 'hsl(var(--color-ring) / <alpha-value>)',
        background: 'hsl(var(--color-background) / <alpha-value>)',
        foreground: 'hsl(var(--color-foreground) / <alpha-value>)',
        card: {
          DEFAULT: 'hsl(var(--color-card) / <alpha-value>)',
          foreground: 'hsl(var(--color-card-foreground) / <alpha-value>)',
        },
        muted: {
          DEFAULT: 'hsl(var(--color-primary-light) / <alpha-value>)',
          foreground: 'hsl(var(--color-text) / <alpha-value>)',
        },
        // Design system brand colors
        primary: {
          DEFAULT: 'hsl(var(--color-primary) / <alpha-value>)',
          light: 'hsl(var(--color-primary-light) / <alpha-value>)',
          foreground: '#ffffff',
        },
        secondary: {
          DEFAULT: 'hsl(var(--color-secondary) / <alpha-value>)',
          foreground: '#2F2040',
        },
        accent: {
          DEFAULT: 'hsl(var(--color-accent) / <alpha-value>)',
          foreground: '#2F2040',
        },
        text: 'hsl(var(--color-text) / <alpha-value>)',
        success: 'hsl(var(--color-success) / <alpha-value>)',
        info: 'hsl(var(--color-info) / <alpha-value>)',
        warning: 'hsl(var(--color-warning) / <alpha-value>)',
        'secondary-accent': 'hsl(var(--color-secondary-accent) / <alpha-value>)',
        destructive: {
          DEFAULT: 'hsl(var(--color-warning) / <alpha-value>)',
          foreground: '#ffffff',
        },
        popover: {
          DEFAULT: 'hsl(var(--color-card) / <alpha-value>)',
          foreground: 'hsl(var(--color-card-foreground) / <alpha-value>)',
        },
      },
      fontFamily: {
        sans: ['var(--font-lato)', 'system-ui', 'sans-serif'],
        accent: ['var(--font-philosopher)', 'serif'],
      },
      keyframes: {
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(24px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideDown: {
          '0%': { opacity: '0', transform: 'translateY(-16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        blobPulse: {
          '0%, 100%': { transform: 'translate(0, 0) scale(1)', opacity: '0.4' },
          '33%': { transform: 'translate(4%, 3%) scale(1.08)', opacity: '0.55' },
          '66%': { transform: 'translate(-3%, 5%) scale(0.96)', opacity: '0.45' },
        },
        expandWidth: {
          '0%': { width: '0%' },
          '100%': { width: '100%' },
        },
        authCardIn: {
          '0%': { opacity: '0', transform: 'translateY(20px) scale(0.97)' },
          '100%': { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
        shake: {
          '0%, 100%': { transform: 'translateX(0)' },
          '15%, 45%, 75%': { transform: 'translateX(-5px)' },
          '30%, 60%, 90%': { transform: 'translateX(5px)' },
        },
        popIn: {
          '0%': { opacity: '0', transform: 'scale(0)' },
          '60%': { transform: 'scale(1.2)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        cardIn: {
          '0%':   { opacity: '0', transform: 'translateY(10px) scale(0.99)' },
          '100%': { opacity: '1', transform: 'translateY(0)   scale(1)'    },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-12px)' },
        },
        navMenuOpen: {
          '0%':   { opacity: '0', transform: 'translateY(-10px)' },
          '55%':  { opacity: '1', transform: 'translateY(6px)' },
          '75%':  { transform: 'translateY(-3px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        navMenuClose: {
          '0%':   { opacity: '1', transform: 'translateY(0)' },
          '100%': { opacity: '0', transform: 'translateY(-10px)' },
        },
        starFall: {
          // Falls along a -30deg line (vertical drop paired with a proportional
          // leftward drift) and stays tilted to match, like a streak of rain.
          '0%': { transform: 'translateY(-10vh) translateX(0) rotate(-30deg)', opacity: '0' },
          '8%': { opacity: '1' },
          '92%': { opacity: '1' },
          '100%': { transform: 'translateY(115vh) translateX(-66vh) rotate(-30deg)', opacity: '0' },
        },
      },
      animation: {
        'fade-in-up': 'fadeInUp 0.65s ease-out both',
        'fade-in': 'fadeIn 0.5s ease-out both',
        'slide-down': 'slideDown 0.5s ease-out both',
        'blob': 'blobPulse 9s ease-in-out infinite',
        'expand-width': 'expandWidth 0.7s ease-out both',
        'auth-card-in': 'authCardIn 0.4s cubic-bezier(0.16, 1, 0.3, 1) both',
        'shake': 'shake 0.45s ease-in-out',
        'pop-in': 'popIn 0.5s cubic-bezier(0.16, 1, 0.3, 1) both',
        'float': 'float 3.5s ease-in-out infinite',
        'star-fall': 'starFall 6s linear infinite',
        'card-in':      'cardIn 0.35s cubic-bezier(0.16, 1, 0.3, 1) both',
        'nav-menu-open':  'navMenuOpen 0.38s ease-out both',
        'nav-menu-close': 'navMenuClose 0.18s ease-in both',
      },
      transitionTimingFunction: {
        spring: 'cubic-bezier(0.16, 1, 0.3, 1)',
      },
    },
  },
  plugins: [],
}

export default config
