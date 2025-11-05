/** @type {import('tailwindcss').Config} */
export default {
  content: ["./src/**/*.{js,jsx,ts,tsx}", "./public/index.html"],
  theme: {
    screens: {
      sm: "640px",
      md: "768px",
      lg: "1024px",
      xl: "1280px",
      xxl: "1300px", // custom breakpoint for wide layouts
      "2xl": "1536px",
    },
    extend: {
      screens: {
        xxl: "1300px",
      },
      colors: {
        midnight: "#080B16",
        sapphire: "#111C2F",
        aurora: "#1F2E4C",
        accent: "#7C5CFC",
        teal: "#2DD4BF",
        amber: "#FBBF24",
      },
      backgroundImage: {
        "portfolio-gradient":
          "radial-gradient(circle at 0% 0%, rgba(124,92,252,0.15), transparent 45%), radial-gradient(circle at 100% 0%, rgba(45,212,191,0.12), transparent 40%), linear-gradient(180deg, #080B16 0%, #111C2F 35%, #04060B 100%)",
        "card-glow":
          "linear-gradient(145deg, rgba(124,92,252,0.12), rgba(59,130,246,0.08))",
      },
      boxShadow: {
        glow: "0 20px 45px -25px rgba(124,92,252,0.45)",
        soft: "0 12px 30px -18px rgba(15,23,42,0.55)",
      },
      keyframes: {
        flipY: {
          "0%": { transform: "rotateY(0deg)" },
          "49%": { transform: "rotateY(179.9deg)" },
          "50%": { transform: "rotateY(180deg)" },
          "99%": { transform: "rotateY(359.9deg)" },
          "100%": { transform: "rotateY(360deg)" },
        },
      },
      animation: {
        flipY: "flipY 10s linear infinite", // duration overridden per-card inline
      },
    },
  },
  plugins: [],
};
