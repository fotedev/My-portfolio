import { defineConfig } from "eslint/config";
import coreWebVitals from "eslint-config-next/core-web-vitals";
import typescriptConfig from "eslint-config-next/typescript";

/**
 * Flat ESLint config (eslint-config-next v16 ships flat configs natively —
 * no FlatCompat needed). Adds the coding-standards import order rule.
 */
export default defineConfig([
  ...coreWebVitals,
  ...typescriptConfig,
  {
    rules: {
      // coding-standards: organized imports — external, internal (@/), relative
      "import/order": [
        "error",
        {
          groups: ["builtin", "external", "internal", "parent", "sibling", "index"],
          pathGroups: [{ pattern: "@/**", group: "internal" }],
          "newlines-between": "never",
          alphabetize: { order: "asc", caseInsensitive: true },
        },
      ],
    },
  },
  {
    ignores: [".next/**", "out/**", "node_modules/**", "supabase/**", "next-env.d.ts"],
  },
]);
