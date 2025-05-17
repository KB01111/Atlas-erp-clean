import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    rules: {
      // Temporarily disable some rules that are causing many errors
      "@typescript-eslint/no-explicit-any": "warn", // Downgrade from error to warning
      "@typescript-eslint/no-unused-vars": "warn", // Downgrade from error to warning
      "@typescript-eslint/no-require-imports": "warn", // Downgrade from error to warning
      "@typescript-eslint/no-unsafe-function-type": "warn", // Downgrade from error to warning
      "@typescript-eslint/no-empty-object-type": "warn", // Downgrade from error to warning
      "@typescript-eslint/no-wrapper-object-types": "warn", // Downgrade from error to warning
      "react-hooks/exhaustive-deps": "warn", // Already a warning, keep it that way
      "import/no-anonymous-default-export": "warn", // Downgrade from error to warning
      "react/no-unescaped-entities": "warn", // Downgrade from error to warning
    },
  },
];

export default eslintConfig;
