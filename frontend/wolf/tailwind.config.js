export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        wolf: {
          primary: '#8B5CF6',   // purple-500
          secondary: '#4B5563', // gray-600
          dark: '#111827',      // gray-900
          light: '#F3F4F6'      // gray-100
        }
      }
    },
  },
  plugins: [],
}