#!/usr/bin/env bash
set -euo pipefail
test -s /etc/shortlink/shortlink.env
sudo -u ubuntu test -r /etc/shortlink/shortlink.env
systemctl stop shortlink-api
install -d -m 755 -o ubuntu -g ubuntu /opt/shortlink/app