#!/usr/bin/env bash
# Vercel "Ignored Build Step" (vercel.json `ignoreCommand`).
# Exit 0 skips the deployment, exit 1 builds it.
#
# Every deployment Vercel keeps counts against Deployment Storage (~200 MB
# each here), and every build reads the catalogue from Neon. A push that cannot
# change the site should cost neither.
#
# - Dependabot branches: skipped. CI (.github/workflows/ci.yml) still lints,
#   typechecks and builds each one; production deploys when it merges.
# - Changes since the branch's last deployment that cannot reach the build
#   output: skipped. That is docs (*.md, docs/, LICENSE), CI config
#   (.github/), editor settings (.vscode/) and the Python generators with
#   their requirements files (scripts/*.py, scripts/requirements-*.txt: run
#   locally, their output is committed under public/ and builds on its own).
# - Anything else, or when the comparison cannot be made: built.
#   scripts/*.mjs and scripts/*.ts are NOT excluded: `prebuild` runs the .mjs
#   files and tsconfig's `**/*.ts` makes `next build` typecheck the .ts ones.
#   drizzle/ and db/ are NOT excluded either. The build never reads them, but
#   pushing a migration or research seed usually follows applying it by hand,
#   and the catalogue cache is keyed by deployment with no timed revalidate
#   (src/lib/data/cache.ts): without a new deployment the live site would keep
#   serving the old rows until some unrelated change deployed.

branch="${VERCEL_GIT_COMMIT_REF:-}"
if [[ "$branch" == dependabot/* ]]; then
  echo "Skipping: Dependabot branch ($branch). CI builds it."
  exit 0
fi

base="${VERCEL_GIT_PREVIOUS_SHA:-}"
if [[ -z "$base" ]] || ! git cat-file -e "$base^{commit}" 2>/dev/null; then
  echo "Building: no earlier deployment of this branch to compare against."
  exit 1
fi

if git diff --quiet "$base" HEAD -- . \
  ':(exclude)*.md' \
  ':(exclude)docs/**' \
  ':(exclude).github/**' \
  ':(exclude).vscode/**' \
  ':(exclude)LICENSE' \
  ':(exclude)scripts/*.py' \
  ':(exclude)scripts/requirements-*.txt'; then
  echo "Skipping: only docs, CI, migrations or local scripts changed since $base."
  exit 0
fi

echo "Building: site files changed since $base."
exit 1
