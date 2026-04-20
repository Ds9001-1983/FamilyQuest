/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        mission: {
          green: "#059669",
          blue: "#3B82F6",
          purple: "#9333ea",
          text: "#1F2937",
        },
      },
    },
  },
  plugins: [],
};
