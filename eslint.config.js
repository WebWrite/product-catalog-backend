import js from "@eslint/js"
import globals from "globals"
import prettier from "eslint-plugin-prettier/recommended"

export default [
  js.configs.recommended,
  prettier,
  {
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        ...globals.node,
        ...globals.es2021
      }
    },
    rules: {
      "no-multiple-empty-lines": ["error", { max: 1, maxEOF: 0, maxBOF: 0 }],
      "no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
      "no-console": "off"
    }
  }
]
