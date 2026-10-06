#!/usr/bin/env bash
set -euo pipefail
for attempt in $(seq 1 12); do
  if curl --fail --silent --show-error --max-time 3 \
      http://127.0.0.1:3000/health | grep -q '"database":"up"'; then
    exit 0
  fi
  sleep 5
done
exit 1