/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      colors: {
        surface: {
          1: "#FFFFFF",
          2: "#F7F6F3",
        },
        border: {
          DEFAULT: "#E5E4DF",
          strong: "#C8C7C0",
        },
        text: {
          primary: "#1A1A18",
          secondary: "#4A4A46",
          muted: "#9A9990",
        },
        status: {
          developed: { bg: "#EAF3DE", text: "#3B6D11" },
          lab:       { bg: "#FAEEDA", text: "#854F0B" },
          shot:      { bg: "#F1EFE8", text: "#5F5E5A" },
        },
      },
    },
  },
  plugins: [],
};
