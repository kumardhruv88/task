import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import prettier from "eslint-config-prettier";

/**
 * ESLint flat config (ESLint v9+).
 * Order matters: prettier must come last to disable all formatting rules
 * that could conflict with Prettier's output.
 */
const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Disables ESLint rules that Prettier handles — must be last
  prettier,
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "node_modules/**",
    "prisma/generated/**",
  ]),
]);

export default eslintConfig;
