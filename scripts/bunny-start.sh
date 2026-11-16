#!/bin/sh
set -eu
if [ "${BUNNY_RESTORE_ONCE:-0}" = "1" ]; then
  echo "[bunny-restore] Starter content import requested"
  if ! node scripts/bunny-restore-once.js; then
    echo "[bunny-restore] Import failed. Strapi will start; check logs before retrying."
  fi
fi
exec npm run start
