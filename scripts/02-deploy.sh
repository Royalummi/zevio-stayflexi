#!/bin/bash
# =============================================================
# Zevio Deploy Script
# Called automatically by GitHub Actions on every push to main
# Can also be run manually: bash /var/www/zevio/scripts/02-deploy.sh
# =============================================================

set -e
APP_DIR="/var/www/zevio"

export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
export PATH="$PATH:/usr/local/bin"

echo "======================================"
echo " Zevio Deploy - $(date '+%Y-%m-%d %H:%M:%S')"
echo "======================================"

cd "$APP_DIR"
echo ">>> Pulling latest code..."
git pull origin main

# ── Backend ────────────────────────────────────────────────
echo ">>> Backend: installing dependencies..."
cd "$APP_DIR/backend"
npm ci --omit=dev

echo ">>> Backend: reloading PM2..."
pm2 reload backend --update-env \
  || pm2 start "$APP_DIR/ecosystem.config.cjs" --only backend --env production

# ── Next.js ────────────────────────────────────────────────
echo ">>> Next.js: installing dependencies..."
cd "$APP_DIR/nextjs"
npm ci

echo ">>> Next.js: building..."
npm run build

echo ">>> Next.js: reloading PM2..."
pm2 reload nextjs --update-env \
  || pm2 start "$APP_DIR/ecosystem.config.cjs" --only nextjs --env production

# ── Frontend (Vite → static) ───────────────────────────────
echo ">>> Frontend: installing dependencies..."
cd "$APP_DIR/frontend"
npm ci

echo ">>> Frontend: building..."
npm run build
# Nginx serves frontend/dist directly, no restart needed

pm2 save

echo ""
echo "======================================"
echo " Deploy Done! $(date '+%H:%M:%S')"
echo " Status:"
pm2 list --no-color
echo "======================================"
