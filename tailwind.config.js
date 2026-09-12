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
        butter: '#FFED9E',
        blossom: '#F2C0CA',
        pistachio: '#DAE097',
        sky: '#A6CFF2',
        'dark-anchor': '#111111',
        'dark-forest': '#124224',
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Outfit', 'sans-serif'],
        serif: ['Fraunces', 'serif'],
      },
      borderRadius: {
        '2xl': '20px',
        '3xl': '28px',
        '4xl': '32px',
      },
      boxShadow: {
        'neo': '3px 3px 0px 0px #111111',
        'neo-lg': '5px 5px 0px 0px #111111',
      },
    },
  },
  plugins: [],
};
