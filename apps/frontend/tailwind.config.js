/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          blue: '#2E5BFF',
          dark: '#1E293B',
        },
        surface: {
          app: '#F4F6F9',
          card: '#FFFFFF',
          border: '#E2E8F0',
          textMuted: '#64748B',
        },
        status: {
          open: '#EF4444',
          canceled: '#94A3B8',
          submitToOe: '#3B82F6',
          submitToOwner: '#8B5CF6',
          rejected: '#F59E0B',
          closed: '#10B981',
        }
      },
      fontFamily: {
        sans: ['Inter', 'Noto Sans Thai', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
