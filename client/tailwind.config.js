/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        ink: {
          950: "#0a0a0f",
          900: "#101016",
          850: "#15151d",
          800: "#1a1a24",
          700: "#23232f",
          600: "#2e2e3d"
        },
        accent: {
          DEFAULT: "#6d7cff",
          soft: "#8b96ff",
          violet: "#9d7bff"
        }
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "-apple-system", "Segoe UI", "sans-serif"]
      },
      animation: {
        "fade-up": "fadeUp 0.25s ease-out",
        blink: "blink 1s step-start infinite"
      },
      keyframes: {
        fadeUp: {
          "0%": { opacity: "0", transform: "translateY(6px)" },
          "100%": { opacity: "1", transform: "translateY(0)" }
        },
        blink: {
          "50%": { opacity: "0" }
        }
      }
    }
  },
  plugins: []
};
