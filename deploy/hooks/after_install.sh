#!/usr/bin/env bash
set -euo pipefail
cd /opt/shortlink/app
sudo -u ubuntu npm ci --omit=dev
sudo -u ubuntu /usr/bin/node --env-file=/etc/shortlink/shortlink.env scripts/init-db.js