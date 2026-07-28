#!/bin/sh
set -eu
cd /workspace

if curl -sf -o /dev/null --max-time 2 http://127.0.0.1:8080/api/stats/health; then
  exit 0
fi

if [ ! -f apps/api/dist/main.js ] || [ ! -d apps/web/dist/web/browser ]; then
  npm run build >>/tmp/app-startup.log 2>&1
fi

PORT=8080 npm start >>/tmp/app-startup.log 2>&1 &
