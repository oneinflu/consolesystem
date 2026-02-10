// eslint-disable-next-line @typescript-eslint/no-var-requires
const daisyui = require("daisyui");
const config: any = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["ui-sans-serif", "system-ui", "Inter", "sans-serif"]
      },
      boxShadow: {
        soft: "0 10px 30px rgba(0,0,0,0.06)"
      },
      borderRadius: {
        xl: "1rem"
      }
    }
  },
  plugins: [daisyui, require("@tailwindcss/typography")],
  daisyui: {
    themes: ["light","dark"]
  }
};

export default config;
