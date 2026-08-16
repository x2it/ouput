#!/bin/bash
set -Eeuo pipefail

PORT="${DEPLOY_RUN_PORT:-5000}"
NODE_ENV=development

cd "${COZE_WORKSPACE_PATH:-$(pwd)}"

echo "Starting Next.js dev on :${PORT} (HTTP)..."
exec pnpm next dev --webpack --port "${PORT}"