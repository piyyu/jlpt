/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Noto Sans JP', 'monospace'],
      },
      colors: {
        pink: {
          DEFAULT: '#FF0080',
          hover: '#FF33A0',
          dim: 'rgba(255,0,128,0.08)',
          border: 'rgba(255,0,128,0.25)',
        },
        ink: {
          50:  '#3a3a3a',
          100: '#2a2a2a',
          200: '#222222',
          300: '#1a1a1a',
          400: '#141414',
          500: '#111111',
          600: '#0d0d0d',
          700: '#0a0a0a',
          800: '#080808',
        },
      },
    },
  },
  plugins: [],
};
