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
        },
        peach: {
          soft: '#FFF7F3',
        },
        surface: '#FFFFFF',
        border: '#FFE2D6',
        text: {
          main: '#1F2937',
          muted: '#687280',
        },
        status: {
          success: '#22C55E',
          warning: '#F59E0B',
          danger: '#EF4444',
        },
        sidebar: {
          dark: '#0F1729',
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
