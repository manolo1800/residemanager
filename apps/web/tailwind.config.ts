import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "../../packages/ui/src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "var(--color-primary, #2E6DA4)",
          hover: "var(--color-primary-hover, #245580)",
          active: "var(--color-primary-active, #1D4667)",
        },
        sidebar: "var(--color-sidebar, #64748B)",
        background: "var(--color-background, #F1F5F9)",
        surface: {
          DEFAULT: "var(--color-surface, #FFFFFF)",
          alt: "var(--color-surface-alt, #F8FAFC)",
        },
        success: "#22C55E",
        warning: "#EAB308",
        danger: "#EF4444",
        border: "var(--color-border, #E2E8F0)",
      },
    },
  },
  plugins: [],
};

export default config;
