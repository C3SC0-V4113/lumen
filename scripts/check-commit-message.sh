#!/bin/sh

if [ "$#" -ne 1 ] || [ ! -f "$1" ]; then
  echo "Usage: check-commit-message.sh <message-file>" >&2
  exit 2
fi

if awk '
  index($0, "# ------------------------ >8 ------------------------") == 1 { exit }
  /^[[:space:]]*#/ { next }
  { print }
' "$1" | grep -Eiq 'co-authored-by|claude|codex|opencode|generated with'; then
  echo "Commit message contains a prohibited attribution trailer or generator credit." >&2
  exit 1
fi
