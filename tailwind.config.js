// Colors pulled directly from the 15 West Homes logo file
// (18_15west-Logo-Final-05.png) — not approximated.
module.exports = {
  content: ["./app/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#37464B", // wordmark charcoal
        teal: "#59757A", // primary brand color
        tealdark: "#46595E", // hover/active state, darker than teal
        sage: "#87B1B4", // logo ring / light accent / dividers
        olive: "#87963C", // small brand accent (the "15" mark)
        paper: "#FAF9F6",
      },
      fontFamily: {
        serif: ["Montserrat", "system-ui", "sans-serif"],
        sans: ["Montserrat", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
