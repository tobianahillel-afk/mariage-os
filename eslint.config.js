import js from "@eslint/js";
import tseslint from "typescript-eslint";

const maintainabilityRules = {
  complexity: ["error", 8],
  "max-depth": ["error", 3],
  "max-lines": ["error", { max: 400, skipBlankLines: true, skipComments: true }],
  "max-lines-per-function": [
    "error",
    { max: 60, skipBlankLines: true, skipComments: true, IIFEs: true },
  ],
  "max-params": ["error", 4],
  "no-warning-comments": [
    "error",
    { terms: ["todo", "fixme", "hack", "temp"], location: "anywhere" },
  ],
};

export default [
  {
    ignores: ["dist/**", "coverage/**", "node_modules/**"],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ["**/*.ts"],
    rules: {
      ...maintainabilityRules,
      "no-undef": "off",
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/no-non-null-assertion": "error",
      "@typescript-eslint/ban-ts-comment": "error",
    },
  },
  {
    files: ["scripts/**/*.mjs", "*.config.mjs"],
    languageOptions: {
      globals: {
        console: "readonly",
        process: "readonly",
      },
    },
    rules: maintainabilityRules,
  },
];
