#!/usr/bin/env bash
set -euo pipefail
if ! test -f /etc/systemd/system/shortlink-api.service.before-codedeploy; then
  cp -p /etc/systemd/system/shortlink-api.service /etc/systemd/system/shortlink-api.service.before-codedeploy
fi
cat > /etc/systemd/system/shortlink-api.service <<'UNIT'
[Unit]
Description=ShortLink API
After=network.target

[Service]
Type=simple
User=ubuntu
WorkingDirectory=/opt/shortlink/app
ExecStart=/usr/bin/node --env-file=/etc/shortlink/shortlink.env src/server.js
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
UNIT
systemctl daemon-reload
systemctl enable shortlink-api
systemctl restart shortlink-api