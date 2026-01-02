/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}", // 这一行非常重要，它确保扫描你的 App.tsx
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}