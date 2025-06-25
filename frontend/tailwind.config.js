import daisyui from "daisyui";

/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {},
  },
  plugins: [daisyui],
  daisyui: {
    themes: [
      {
        customBlack: {
          primary: "rgb(29, 155, 240)",
          secondary: "#000000",
          accent: "#1FB2A6",
          neutral: "#000000",
          "base-100": "#000000",
          "base-200": "#000000",
          "base-300": "#000000",
          "base-content": "#ffffff",
          info: "#3ABFF8",
          success: "#36D399",
          warning: "#FBBD23",
          error: "#F87272",
        },
      },
    ],
  },
};