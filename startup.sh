#!/bin/sh
set -eu
cd /workspace

if curl -sf -o /dev/null --max-time 2 http://127.0.0.1:8080/api/stats/health; then
  exit 0
fi

# Ensure builds exist
if [ ! -d apps/web/dist/web/browser ]; then
  npm run build:web >>/tmp/app-startup.log 2>&1
fi
if [ ! -f apps/api/dist/main.js ]; then
  npm run build:api >>/tmp/app-startup.log 2>&1
fi

PORT=8080 npm run start:api >>/tmp/app-startup.log 2>&1 &
