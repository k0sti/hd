/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts}'],
  theme: {
    extend: {
      colors: {
        'hd-personality': '#333333',
        'hd-design': '#A44344',
        'hd-transit': '#44aa55',
        'hd-person-b-p': '#3366CC',
        'hd-person-b-d': '#8844AA',
        'hd-composite': '#DAA520',
        'hd-inactive': '#e0ddd8',
      },
    },
  },
  plugins: [],
};
