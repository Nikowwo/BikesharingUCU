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
      fontSize: {
        /* Títulos Asap: +6px vs escala Tailwind; line-height = tamaño + 5px */
        'heading-sm': ['24px', { lineHeight: '29px' }],
        'heading-md': ['26px', { lineHeight: '31px' }],
        'heading-lg': ['30px', { lineHeight: '35px' }],
        'heading-xl': ['36px', { lineHeight: '41px' }],
        'heading-2xl': ['54px', { lineHeight: '59px' }],
        'heading-base': ['22px', { lineHeight: '27px' }],
      },
    },
  },
  plugins: [],
};
