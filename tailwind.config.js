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
          hover: '#E05D26', // slightly darker for hover states
        },
        peach: {
          soft: '#FFF7F3',
        },
        surface: '#FFFFFF',
        border: {
          DEFAULT: '#E8E8E8',
          light: '#F1F5F9',
        },
        text: {
          main: '#172033',
          muted: '#64748B',
        },
        status: {
          success: '#10B981', // Restrained green
          warning: '#F59E0B', // Amber/orange
          danger: '#EF4444',  // Restrained red
        },
        sidebar: {
          dark: '#080D1C',
        },
        muted: {
          DEFAULT: '#F8FAFC',
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
