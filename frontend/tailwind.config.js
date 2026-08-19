/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#F66F35',
          light: '#FFF2EB',
          lighter: '#FFF7F2',
          hover: '#E05D26',
          dark: '#C94F1A',
        },
        peach: {
          soft: '#FAF7F4',
        },
        surface: '#FFFFFF',
        canvas: '#F5F4F2',
        border: {
          DEFAULT: '#E8E4DF',
          light: '#F1EDE8',
          strong: '#D4CFC9',
        },
        text: {
          main: '#1A1A1A',
          sub: '#3D3D3D',
          muted: '#7A7A7A',
          faint: '#B0AEAB',
        },
        status: {
          success: '#22C55E',
          'success-bg': '#F0FDF4',
          'success-text': '#15803D',
          warning: '#F59E0B',
          'warning-bg': '#FFFBEB',
          'warning-text': '#B45309',
          danger: '#EF4444',
          'danger-bg': '#FEF2F2',
          'danger-text': '#B91C1C',
          info: '#3B82F6',
          'info-bg': '#EFF6FF',
          'info-text': '#1D4ED8',
          preparing: '#8B5CF6',
          'preparing-bg': '#F5F3FF',
        },
        sidebar: {
          dark: '#0F1117',
          item: '#1C1F2A',
        },
        muted: {
          DEFAULT: '#F8F6F3',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Inter', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        '2xs': ['0.625rem', { lineHeight: '0.875rem' }],
      },
      borderRadius: {
        'xl': '0.75rem',
        '2xl': '1rem',
        '3xl': '1.5rem',
        '4xl': '2rem',
      },
      boxShadow: {
        'card': '0 1px 3px 0 rgba(0,0,0,0.06), 0 1px 2px -1px rgba(0,0,0,0.06)',
        'card-hover': '0 4px 16px 0 rgba(0,0,0,0.10), 0 2px 4px -1px rgba(0,0,0,0.06)',
        'card-active': '0 0 0 2px #F66F35, 0 4px 16px 0 rgba(246,111,53,0.15)',
        'panel': '0 4px 24px 0 rgba(0,0,0,0.08)',
        'modal': '0 20px 60px 0 rgba(0,0,0,0.18), 0 8px 16px -4px rgba(0,0,0,0.10)',
        'primary-sm': '0 2px 8px 0 rgba(246,111,53,0.30)',
        'primary-md': '0 4px 16px 0 rgba(246,111,53,0.25)',
        'sidebar': '4px 0 24px 0 rgba(0,0,0,0.20)',
        'header': '0 1px 0 0 #E8E4DF',
        'bottom-sheet': '0 -8px 32px 0 rgba(0,0,0,0.12)',
        'status-ready': '0 0 0 2px #22C55E, 0 4px 12px rgba(34,197,94,0.20)',
      },
      spacing: {
        'touch': '44px',
        'touch-lg': '52px',
      },
      transitionTimingFunction: {
        'spring': 'cubic-bezier(0.34, 1.56, 0.64, 1)',
        'smooth': 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
      },
      keyframes: {
        'fade-in': {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        'slide-up': {
          from: { transform: 'translateY(12px)', opacity: '0' },
          to: { transform: 'translateY(0)', opacity: '1' },
        },
        'slide-down': {
          from: { transform: 'translateY(-8px)', opacity: '0' },
          to: { transform: 'translateY(0)', opacity: '1' },
        },
        'scale-in': {
          from: { transform: 'scale(0.95)', opacity: '0' },
          to: { transform: 'scale(1)', opacity: '1' },
        },
        'sheet-up': {
          from: { transform: 'translateY(100%)' },
          to: { transform: 'translateY(0)' },
        },
        'pulse-dot': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.4' },
        },
        'shimmer': {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.2s ease-out',
        'slide-up': 'slide-up 0.25s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
        'slide-down': 'slide-down 0.2s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
        'scale-in': 'scale-in 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)',
        'sheet-up': 'sheet-up 0.35s cubic-bezier(0.32, 0.72, 0, 1)',
        'pulse-dot': 'pulse-dot 1.5s ease-in-out infinite',
        'shimmer': 'shimmer 1.5s linear infinite',
      },
    },
  },
  plugins: [],
}
