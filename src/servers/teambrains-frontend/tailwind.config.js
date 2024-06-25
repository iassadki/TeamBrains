/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors:{
        'green-tb': '#00C673',
        customGreenStart: '#00CF78',
        customGreenEnd: '#00F08B'
      },
      fontFamily: {
        poppins: ['Poppins', 'sans-serif'],
        montserrat: ['Montserrat', 'sans-serif']
    }
    },
  },
  plugins: [require("rippleui")],
  rippleui: {
    defaultStyle: false,
    removeThemes: ["dark"],
    themes: [
      {
        themeName: "light",
        colorScheme: "light",
        colors: {
          primary: "#00C673",
          backgroundPrimary: "#964643",
        },
      }
    ],
  },
}