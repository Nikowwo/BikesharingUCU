/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        ucu: {
          navy: '#1B263B',
          green: '#1B4332',
          mint: '#52B788',
          cream: '#F8F5F0',
          card: '#FDF8F1',
        },
      },
      fontFamily: {
        asap: ['Asap', 'sans-serif'],
        inter: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
