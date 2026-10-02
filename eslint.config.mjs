import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    // A plain `<Link>` prefetches its route as soon as it scrolls into view,
    // and for a dynamic route that is a function invocation per page view.
    // IntentLink prefetches on pointer/focus/touch and never for dynamic routes.
    rules: {
      "no-restricted-imports": [
        "error",
        {
          paths: [
            {
              name: "next/link",
              message:
                "Use IntentLink from @/components/shared/intent-link (prefetch on intent, never for dynamic routes)",
            },
          ],
        },
      ],
    },
  },
  {
    // The wrapper itself.
    files: ["src/components/shared/intent-link.tsx"],
    rules: { "no-restricted-imports": "off" },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // MapLibre worker, copied from node_modules by `predev`/`prebuild` (git-ignored).
    "public/maplibre/**",
    // Git-ignored local folders (see .gitignore); ESLint does not read it.
    "_private/**",
    "reference/**",
    "assets/**",
    ".claude/worktrees/**",
    // Local photo store and test scripts (git-ignored).
    ".data/**",
  ]),
]);

export default eslintConfig;
