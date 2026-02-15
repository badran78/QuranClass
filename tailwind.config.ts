import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eef9f6',
          100: '#d8f0e8',
          500: '#188f6f',
          700: '#10614d',
          900: '#0c4235'
        }
      }
    }
  },
  plugins: []
} satisfies Config;
