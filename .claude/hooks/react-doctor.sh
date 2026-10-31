#!/bin/sh
set -eu

cd "${CLAUDE_PROJECT_DIR:-$(dirname "$0")/../..}"

exec pnpm exec react-doctor --verbose --diff --blocking warning --no-score
