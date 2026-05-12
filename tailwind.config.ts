import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        // Oasis v5 — DM Sans is default body
        body: ["var(--font-body)", "DM Sans", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "Bricolage Grotesque", "sans-serif"],
        serif: ["var(--font-serif)", "Newsreader", "Georgia", "serif"],
        mono: ["var(--font-mono)", "Geist Mono", "ui-monospace", "monospace"],
        // legacy aliases kept temporarily until callers migrate
        headline: ["var(--font-display)", "Bricolage Grotesque", "sans-serif"],
        code: ["var(--font-mono)", "Geist Mono", "ui-monospace", "monospace"],
      },
      colors: {
        // === Oasis v5 raw tokens (use these for new components) ===
        cream: {
          DEFAULT: "var(--cream)",
          deep: "var(--cream-deep)",
        },
        peach: "var(--peach)",
        apricot: "var(--apricot)",
        ink: {
          DEFAULT: "var(--ink)",
          soft: "var(--ink-soft)",
          mute: "var(--ink-mute)",
        },
        dune: {
          DEFAULT: "var(--dune)",
          deep: "var(--dune-deep)",
        },
        ember: "var(--ember)",
        flame: "var(--flame)",
        "sand-warm": "var(--sand-warm)",

        // === Shadcn (v4) semantic tokens — preserved for /painel + ui primitives ===
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        success: {
          DEFAULT: "hsl(var(--success))",
          foreground: "hsl(var(--success-foreground))",
        },
        warning: {
          DEFAULT: "hsl(var(--warning))",
          foreground: "hsl(var(--warning-foreground))",
        },
        border: "hsl(var(--border))",
        "border-strong": "hsl(var(--border-strong))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        surface: {
          DEFAULT: "hsl(var(--surface))",
          elevated: "hsl(var(--surface-elevated))",
        },
        chart: {
          "1": "hsl(var(--chart-1))",
          "2": "hsl(var(--chart-2))",
          "3": "hsl(var(--chart-3))",
          "4": "hsl(var(--chart-4))",
          "5": "hsl(var(--chart-5))",
        },
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
      },
      borderRadius: {
        // Oasis v5
        btn: "var(--radius-btn)",
        card: "var(--radius-card)",
        // Shadcn v4
        xl: "var(--radius-xl)",
        lg: "var(--radius-lg)",
        DEFAULT: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "var(--radius-sm)",
      },
      maxWidth: {
        content: "1400px",
      },
      boxShadow: {
        xs: "0 1px 2px rgba(26, 22, 18, 0.04)",
        sm: "0 2px 6px rgba(26, 22, 18, 0.06)",
        md: "0 8px 24px -12px rgba(26, 22, 18, 0.12)",
        lg: "0 16px 40px -16px rgba(26, 22, 18, 0.16)",
        brand: "0 16px 48px -20px rgba(155, 28, 28, 0.25)",
        card: "0 1px 2px rgba(26, 22, 18, 0.04), 0 8px 24px -12px rgba(26, 22, 18, 0.08)",
        warm: "0 8px 30px var(--shadow-warm), 0 1px 0 rgba(255,255,255,0.6) inset",
        "warm-lg": "0 30px 60px var(--shadow-deep)",
      },
      transitionTimingFunction: {
        "out-expo": "cubic-bezier(0.22, 1, 0.36, 1)",
        oasis: "cubic-bezier(0.16, 1, 0.3, 1)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
