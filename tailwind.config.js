/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        "primary-color": "var(--primary-color)",
        "global-font-size": "var(--global-font-size)",
        "global-line-height": "var(--global-line-height)",
        "global-space": "var(--global-space)",
        "font-stack": "var(--font-stack)",
        "mono-font-stack": "var(--mono-font-stack)",
        "background-color": "var(--background-color)",
        "page-width": "var(--page-width)",
        "font-color": "var(--font-color)",
        "invert-font-color": "var(--invert-font-color)",
        "secondary-color": "var(--secondary-color)",
        "tertiary-color": "var(--tertiary-color)",
        "primary-color": "var(--primary-color)",
        "primary-color-hover": "var(--primary-color-hover)",
        "error-color": "var(--error-color)",
        "error-color-hover": "var(--error-color-hover)",
        "success-color": "var(--success-color)",
        "progress-bar-background": "var(--progress-bar-background)",
        "progress-bar-fill": "var(--progress-bar-fill)",
        "code-bg-color": "var(--code-bg-color)",
        "input-style": "var(--input-style)",
        "display-h1-decoration": "var(--display-h1-decoration)",
      },
    },
  },
  plugins: [],
}

