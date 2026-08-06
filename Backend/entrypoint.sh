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

echo "==> Guardrails configuration complete. Starting FastAPI..."
exec "$@"
