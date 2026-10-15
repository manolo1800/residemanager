#!/bin/sh
set -e

git config --global --add safe.directory /app 2>/dev/null || true

# Ensure dependencies are installed inside the container workspace
if [ ! -f "/app/pnpm-lock.yaml" ] || [ ! -d "/app/node_modules" ]; then
  echo "📦 Installing monorepo dependencies inside Docker container..."
  pnpm install
fi

exec "$@"
