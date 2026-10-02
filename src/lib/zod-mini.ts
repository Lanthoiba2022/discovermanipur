/**
 * `zod/mini`, with zod's English messages registered: import this module, as
 * `import * as z from "@/lib/zod-mini"`, instead of `zod/mini` itself.
 *
 * Why mini rather than classic `zod` for the client forms: classic zod's entry
 * point re-exports every locale and the method-chaining API, about 95 KB gzip
 * on each page with a form. Mini has the same `safeParse` and issue shapes.
 *
 * Mini registers no locale of its own, so without this every built-in message
 * (for checks that set none) would be zod's bare fallback. Setting English
 * here, once, keeps those messages worded exactly as classic zod words them,
 * including the ones a Server Action returns to its form. `config` writes a
 * process-wide (or page-wide) setting, so the first import applies it for all.
 *
 * It re-exports with `export *` rather than a `z` object so callers keep
 * using the namespace, which the bundler can still tree-shake per member.
 */
import { config } from "zod/mini";
import en from "zod/v4/locales/en.js";

config(en());

export * from "zod/mini";
