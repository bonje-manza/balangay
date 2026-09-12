/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        canvas: '#F7F2E8',
        oat: '#F7F2E8',
        surface: '#FFFDF9',
        butter: '#FFED9E',
        blossom: '#F2C0CA',
        pistachio: '#DAE097',
        sky: '#A6CFF2',
        income: '#124224',
        'income-bg': '#E8EED9',
        expense: '#9E2A3B',
        'expense-bg': '#F8E7EA',
        'dark-anchor': '#111111',
        'dark-forest': '#124224',
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Outfit', 'sans-serif'],
        serif: ['Fraunces', 'serif'],
      },
      borderRadius: {
        'xl': '12px',
        '2xl': '16px',
        '3xl': '20px',
        '4xl': '24px',
      },
      boxShadow: {
        'subtle': '0 1px 2px 0 rgba(17, 17, 17, 0.05)',
        'card': '0 1px 3px 0 rgba(0, 0, 0, 0.05), 0 1px 2px -1px rgba(0, 0, 0, 0.03)',
        'float': '0 8px 20px -4px rgba(17, 17, 17, 0.08), 0 4px 8px -3px rgba(17, 17, 17, 0.04)',
        'neo': '1px 1px 0px 0px #111111',
        'neo-lg': '2px 2px 0px 0px #111111',
      },
    },
  },
  plugins: [],
};
