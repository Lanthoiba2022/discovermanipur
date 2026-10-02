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
# - Docs-only changes since the branch's last deployment: skipped.
# - Anything else, or when the comparison cannot be made: built.

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
  ':(exclude)LICENSE'; then
  echo "Skipping: only docs changed since $base."
  exit 0
fi

echo "Building: site files changed since $base."
exit 1
