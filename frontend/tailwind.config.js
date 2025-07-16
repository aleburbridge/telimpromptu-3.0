/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}", "./index.html"],
  theme: {
    extend: {
      colors: {
        text: "#f0f4ff",
        background: "rgb(2, 2, 24)",
        "background-light": "rgb(15, 15, 35)",
        primary: "#443cbd",
        "primary-light": "#6366f1",
        "primary-dark": "#3730a3",
        secondary: "#1e1b4b",
        "secondary-light": "#312e81",
        "secondary-dark": "#0f0c29",
        accentpink: "rgb(225, 74, 119)",
        accent: "#d4af00",
        "accent-light": "#f4d100",
      },
      backgroundImage: {
        "gradient-main":
          "linear-gradient(180deg, rgb(15, 15, 35) 0%, rgb(2, 2, 24) 100%)",
        "gradient-card":
          "linear-gradient(135deg, rgba(78, 70, 229, 0.1) 0%, rgba(30, 27, 75, 0.3) 100%)",
      },
      animation: {
        text: "text 5s ease infinite",
        "bounce-gentle": "bounceGentle 2s ease-in-out infinite",
        "pulse-glow": "pulseGlow 2s ease-in-out infinite",
        "slide-up": "slideUp 0.3s ease-out",
        wiggle: "wiggle 0.5s ease-in-out",
      },
      keyframes: {
        text: {
          "0%, 100%": {
            "background-size": "200% 200%",
            "background-position": "left center",
          },
          "50%": {
            "background-size": "200% 200%",
            "background-position": "right center",
          },
        },
        bounceGentle: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-4px)" },
        },
        pulseGlow: {
          "0%, 100%": {
            boxShadow: "0 0 10px rgba(78, 70, 229, 0.3)",
            transform: "scale(1)",
          },
          "50%": {
            boxShadow: "0 0 20px rgba(78, 70, 229, 0.6)",
            transform: "scale(1.02)",
          },
        },
        slideUp: {
          "0%": { transform: "translateY(10px)", opacity: "0" },
          "100%": { transform: "translateY(0px)", opacity: "1" },
        },
        wiggle: {
          "0%, 100%": { transform: "rotate(0deg)" },
          "25%": { transform: "rotate(-3deg)" },
          "75%": { transform: "rotate(3deg)" },
        },
      },
      boxShadow: {
        glow: "0 0 20px rgba(78, 70, 229, 0.3)",
        "glow-lg": "0 0 30px rgba(78, 70, 229, 0.4)",
      },
    },
  },
  plugins: [],
};
