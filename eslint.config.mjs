import js from "@eslint/js";
import tseslint from "typescript-eslint";
import reactHooks from "eslint-plugin-react-hooks";

// Flat config nativo (typescript-eslint) — evita o bug de estrutura circular do
// FlatCompat + eslint-config-next. Cobre unused-vars, TS e rules-of-hooks.
// Corre com `npm run lint` (o build do Next 16 já não corre eslint).
export default tseslint.config(
  { ignores: [".next/**", "node_modules/**", "scripts/**", "public/**", "*.config.*"] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    plugins: { "react-hooks": reactHooks },
    rules: {
      ...reactHooks.configs.recommended.rules,
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      "@typescript-eslint/no-explicit-any": "warn",
    },
  }
);
