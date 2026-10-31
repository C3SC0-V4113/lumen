#!/bin/sh
set -eu

cd "${CLAUDE_PROJECT_DIR:-$(dirname "$0")/../..}"

if [ -z "$(git status --porcelain)" ]; then
  exit 0
fi

for script in lint typecheck format:check test doctor check; do
  pnpm run "$script"
done
