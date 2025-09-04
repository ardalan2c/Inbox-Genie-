import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: ['class'],
  content: ['./src/**/*.{ts,tsx}', './app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: { DEFAULT: '#6E56CF', 600: '#5B45C6' },
        accent: { DEFAULT: '#12B5A5', 600: '#0EA69A' }
      },
      fontFamily: {
        inter: ['var(--font-inter)'],
        sora: ['var(--font-sora)']
      },
      borderRadius: { xl: '1rem', '2xl': '1.25rem' },
      boxShadow: { soft: '0 4px 12px rgba(0,0,0,0.06), 0 12px 24px rgba(0,0,0,0.04)' }
    }
  },
  plugins: []
}

export default config

