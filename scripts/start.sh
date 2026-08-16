#!/bin/bash
set -Eeuo pipefail

COZE_WORKSPACE_PATH="${COZE_WORKSPACE_PATH:-$(pwd)}"
DEPLOY_RUN_PORT="${DEPLOY_RUN_PORT:-5000}"

cd "${COZE_WORKSPACE_PATH}"

echo "Starting HTTP service on port ${DEPLOY_RUN_PORT} for deploy..."

exec ./node_modules/.bin/next start -p "${DEPLOY_RUN_PORT}"
