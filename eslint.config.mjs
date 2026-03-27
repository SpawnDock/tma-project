import { fileURLToPath } from "node:url"

import nextCoreWebVitals from "eslint-config-next/core-web-vitals"
import nextTypeScript from "eslint-config-next/typescript"
import suggestMembers from "@prover-coder-ai/eslint-plugin-suggest-members"

const tsconfigRootDir = fileURLToPath(new URL(".", import.meta.url))

const config = [
  ...nextCoreWebVitals,
  ...nextTypeScript,
  {
    ...suggestMembers.configs.recommended,
    files: ["**/*.{js,jsx,mjs,ts,tsx,mts,cts}"]
  },
  {
    files: ["**/*.{ts,tsx,mts,cts}"],
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir
      }
    }
  },
  {
    files: ["**/*.{ts,tsx,mts,cts}"],
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unused-expressions": "off",
      "react-hooks/set-state-in-effect": "off"
    }
  },
  {
    ignores: ["scripts/**"]
  }
]

export default config
