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
          secondary: "rgb(24, 24, 24)",
          accent: "#1FB2A6",
          neutral: "#191D24",
          "base-100": "#000000",
          "base-200": "#1a1a1a",
          "base-300": "#2a2a2a",
          "base-content": "#ffffff",
        },
      },
    ],
  },
};
