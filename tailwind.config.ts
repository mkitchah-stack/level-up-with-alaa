import type { Config } from 'tailwindcss';

// Palette sampled from the approved planner PDF (forest green, gold, cream).
const config: Config = {
  content: ['./src/**/*.{ts,tsx,js}'],
  theme: {
    extend: {
      colors: {
        forest: { DEFAULT: '#1F4A3E', deep: '#163A30', soft: '#2E5E50', mist: '#E3ECE7' },
        gold: { DEFAULT: '#C9A453', soft: '#EBDDB4', pale: '#F7EFD9', ink: '#7E5F1D' },
        cream: '#FBF7EF',
        sand: '#F5EEE1',
        line: '#E4DCC9',
        ink: { DEFAULT: '#1E2B27', muted: '#5F665E' },
        rose: { DEFAULT: '#B5655A', pale: '#F6E6E1' },
      },
      fontFamily: {
        sans: ['"IBM Plex Sans Arabic"', 'Tahoma', 'Arial', 'sans-serif'],
        display: ['"Cormorant Garamond"', '"IBM Plex Sans Arabic"', 'Georgia', 'serif'],
      },
      borderRadius: { card: '1.25rem' },
      boxShadow: { card: '0 1px 0 rgba(31,74,62,0.06), 0 8px 24px -16px rgba(31,74,62,0.25)' },
    },
  },
  plugins: [],
};
export default config;
