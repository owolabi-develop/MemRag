#!/bin/sh
set -e 

if [ -z "$GUARDRAILS_TOKEN" ]; then
    echo "❌ ERROR: GUARDRAILS_TOKEN is empty! Check your env_file."
    exit 1
fi

echo "==> Configuring Guardrails AI..."
guardrails configure \
  --token "$GUARDRAILS_TOKEN" \
  --enable-metrics \
  --enable-remote-inferencing

# Check if this container instance is explicitly meant to be the worker
if [ "$CONTAINER_ROLE" = "worker" ]; then
    echo "==> Guardrails configuration complete. Starting Arq Worker..."
    exec arq src.platform.worker.WorkerSettings
else
    echo "==> Guardrails configuration complete. Starting FastAPI..."
    exec "$@"
fi
