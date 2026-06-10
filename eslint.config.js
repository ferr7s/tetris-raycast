const js = require("@eslint/js");
const prettier = require("eslint-config-prettier/flat");
const globals = require("globals");
const raycast = require("@raycast/eslint-plugin");
const typescript = require("typescript-eslint");

module.exports = [
  {
    ignores: ["dist/**", "node_modules/**", "coverage/**"]
  },
  js.configs.recommended,
  ...typescript.configs.recommended,
  {
    languageOptions: {
      ecmaVersion: 2022,
      globals: {
        ...globals.node
      }
    }
  },
  ...raycast.configs.recommended,
  prettier
];
