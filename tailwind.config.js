/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'cream': '#f8f5f0',
        'sage': '#94a89a',
        'terracotta': '#dd9a7c',
        'navy': '#2d4654',
        'honey': '#e8b64c',
        'copper': '#b87333',
      },
      fontFamily: {
        'serif': ['Playfair Display', 'serif'],
        'sans': ['Inter', 'sans-serif'],
        'handwritten': ['Caveat', 'cursive'],
      },
    },
  },
  plugins: [],
}