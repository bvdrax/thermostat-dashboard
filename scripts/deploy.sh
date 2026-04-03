#!/usr/bin/env bash
# Deploy thermostat-dashboard to NAS and optionally rebuild the Docker container.
# Run from Git Bash: bash scripts/deploy.sh [--rebuild]

set -e

NAS_HOST="10.0.0.240"
NAS_USER="bvdrax"
NAS_PORT="8022"
NAS_PATH="/volume1/docker/thermostat-dashboard"
SSH="ssh -p ${NAS_PORT} -o KexAlgorithms=+diffie-hellman-group14-sha256"

echo "==> Syncing files to NAS..."
tar \
  --exclude='./.next' \
  --exclude='./node_modules' \
  --exclude='./.git' \
  --exclude='./*.log' \
  -czf - . \
  | ${SSH} "${NAS_USER}@${NAS_HOST}" "mkdir -p ${NAS_PATH} && tar -xzf - -C ${NAS_PATH}"

echo "==> Removing stale PIDPanel.tsx if present..."
${SSH} "${NAS_USER}@${NAS_HOST}" "rm -f ${NAS_PATH}/components/PIDPanel.tsx"

if [[ "$1" == "--rebuild" ]]; then
  echo "==> Rebuilding Docker container on NAS..."
  ${SSH} "${NAS_USER}@${NAS_HOST}" "bash -l -c 'cd ${NAS_PATH} && docker-compose up -d --build'"
  echo "==> Done. App available at http://${NAS_HOST}:3090"
else
  echo "==> Sync complete. Run with --rebuild to also restart the container."
fi
