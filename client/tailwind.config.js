/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f0fdf4',
          100: '#dcfce7',
          500: '#10b981',
          600: '#059669',
          700: '#047857',
          900: '#064e3b',
        },
        graph: {
          bg: '#0B0F19',
          node: '#1E293B',
          edge: '#334155',
          accent: '#38BDF8',
        }
      }
    },
  },
  plugins: [],
}

