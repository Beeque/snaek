#!/usr/bin/env bash
set -euo pipefail

PORT="${1:-3000}"

if ! command -v python3 >/dev/null 2>&1; then
  echo "python3 not found in PATH."
  exit 1
fi

echo "Starting Snaek server on port ${PORT}..."
if [[ -n "${CODESPACE_NAME:-}" ]]; then
  echo "Open: https://${CODESPACE_NAME}-${PORT}.app.github.dev"
else
  echo "Open: http://localhost:${PORT}"
fi
echo

exec python3 -m http.server "${PORT}"
