/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        coffee: {
          50: '#fdf8f4',
          100: '#f9edd7',
          200: '#f2d6b3',
          300: '#e7b686',
          400: '#d99059',
          500: '#cc7137',
          600: '#b7562c',
          700: '#944026',
          800: '#773523',
          900: '#4a2015',
          950: '#2b1009',
        },
        cream: {
          DEFAULT: '#FDF9F3',
          dark: '#F4ECE1',
        },
        espresso: {
          light: '#3D251E',
          DEFAULT: '#261510',
          dark: '#160B08',
        }
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'sans-serif'],
        display: ['var(--font-outfit)', 'sans-serif'],
      },
      boxShadow: {
        'coffee-glow': '0 8px 30px rgba(183, 86, 44, 0.15)',
        'card-hover': '0 12px 24px -10px rgba(43, 16, 9, 0.12)',
      }
    },
  },
  plugins: [],
};
