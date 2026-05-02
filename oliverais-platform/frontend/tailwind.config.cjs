module.exports = {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        olive: {
          dark: "#2d4a1e",
          mid: "#4a7c59",
          light: "#8fb87e"
        },
        soil: {
          warm: "#c4956a"
        },
        sand: "#f5e6c8",
        sky: "#87ceeb",
        base: "#f8f5ef"
      },
      boxShadow: {
        olive: "0 22px 60px rgba(45, 74, 30, 0.18)"
      }
    }
  },
  plugins: []
};
