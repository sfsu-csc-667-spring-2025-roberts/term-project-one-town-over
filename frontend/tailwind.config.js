/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#14532d", // Poker table green
          light: "#15803d",
          dark: "#052e16",
        },
        secondary: {
          DEFAULT: "#7c2d12", // Wood/card back brown
          light: "#9a3412",
          dark: "#431407",
        },
        accent: {
          DEFAULT: "#ca8a04", // Gold chip color
          light: "#eab308",
          dark: "#854d0e",
        },
      },
      fontFamily: {
        sans: ["Inter", "sans-serif"],
        display: ["Poppins", "sans-serif"],
      },
    },
  },
  plugins: [],
};
