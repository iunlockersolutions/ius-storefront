import js from "@eslint/js"
import { defineConfig, globalIgnores } from "eslint/config"
import nextVitals from "eslint-config-next/core-web-vitals"
import nextTs from "eslint-config-next/typescript"
import prettier from "eslint-plugin-prettier"
import simpleImportSort from "eslint-plugin-simple-import-sort"
import tseslint from "typescript-eslint"

export default defineConfig([
  js.configs.recommended,

  ...nextVitals,

  ...nextTs,

  ...tseslint.configs.recommended,

  globalIgnores([
    "node_modules/**",
    ".next/**",
    "out/**",
    "dist/**",
    "build/**",
    "coverage/**",
    "next-env.d.ts",
    "next.config.mjs",
  ]),

  {
    plugins: {
      prettier,
      "simple-import-sort": simpleImportSort,
    },

    rules: {
      semi: ["error", "never"],

      "prettier/prettier": ["error", { semi: false }],

      "simple-import-sort/imports": [
        "error",
        {
          groups: [
            ["^react", "^next"],
            ["^@?\\w"],
            ["^@/"],
            ["^\\."],
            ["\\.css$"],
          ],
        },
      ],
      "simple-import-sort/exports": "error",

      "no-restricted-imports": [
        "error",
        {
          name: "@base-ui/react",
          message:
            "Import from @/components/ui instead, or install the required component via shadcn/ui.",
        },
        {
          name: "radix-ui",
          message:
            "Import from @/components/ui instead, or install the required component via shadcn/ui.",
        },
      ],
    },
  },
  {
    files: ["components/ui/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": "off",
    },
  },
])
