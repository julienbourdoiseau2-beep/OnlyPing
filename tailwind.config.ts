import type { Config } from "tailwindcss";

function withOpacity(variable: string) {
  return `rgb(var(${variable}) / <alpha-value>)`;
}

const config: Config = {
  darkMode: ["selector", '[data-theme="dark"]'],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        bg: withOpacity("--color-bg"),
        surface: withOpacity("--color-surface"),
        "surface-alt": withOpacity("--color-surface-alt"),
        line: withOpacity("--color-line"),
        ink: withOpacity("--color-ink"),
        "ink-muted": withOpacity("--color-ink-muted"),
        "ink-faint": withOpacity("--color-ink-faint"),
        accent: {
          DEFAULT: withOpacity("--color-accent"),
          deep: withOpacity("--color-accent-deep")
        },
        success: {
          DEFAULT: withOpacity("--color-success"),
          bg: withOpacity("--color-success-bg")
        },
        danger: {
          DEFAULT: withOpacity("--color-danger"),
          bg: withOpacity("--color-danger-bg")
        },
        info: {
          DEFAULT: withOpacity("--color-info"),
          bg: withOpacity("--color-info-bg")
        },
        "chip-service": {
          bg: withOpacity("--color-chip-service-bg"),
          text: withOpacity("--color-chip-service-text")
        },
        "chip-revers": {
          bg: withOpacity("--color-chip-revers-bg"),
          text: withOpacity("--color-chip-revers-text")
        },
        "chip-coupdroit": {
          bg: withOpacity("--color-chip-coupdroit-bg"),
          text: withOpacity("--color-chip-coupdroit-text")
        }
      },
      fontFamily: {
        display: ["var(--font-display)", "sans-serif"],
        body: ["var(--font-body)", "sans-serif"]
      },
      borderRadius: {
        sm: "8px",
        md: "12px",
        lg: "20px"
      },
      boxShadow: {
        resting: "0 1px 2px rgba(16,24,43,0.04), 0 1px 1px rgba(16,24,43,0.03)",
        raised: "0 12px 28px rgba(16,24,43,0.10)"
      }
    }
  },
  plugins: []
};

export default config;
