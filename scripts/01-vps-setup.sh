#!/bin/bash
# =============================================================
# Zevio VPS First-Time Setup Script
# Run this ONCE manually when first setting up the VPS
# Target: Hostinger VPS (Ubuntu 22.04), IP: 185.199.53.224
# =============================================================
# Run on VPS: bash /tmp/01-vps-setup.sh
# =============================================================

set -e  # Exit on any error

REPO_URL="https://github.com/Royalummi/zevio.git"
APP_DIR="/var/www/zevio"

echo "======================================"
echo " Zevio VPS First-Time Setup"
echo "======================================"

# ── Step 1: System Update ──────────────────────────────────
echo "[1/10] Updating system packages..."
apt-get update -y && apt-get upgrade -y
apt-get install -y curl git build-essential ufw certbot python3-certbot-nginx

# ── Step 2: Install Node.js 20 via NVM ────────────────────
echo "[2/10] Installing Node.js 20..."
if [ ! -d "$HOME/.nvm" ]; then
  curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
fi
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
nvm install 20
nvm use 20
nvm alias default 20
# Make node/npm available system-wide for PM2
ln -sf "$(which node)" /usr/local/bin/node 2>/dev/null || true
ln -sf "$(which npm)" /usr/local/bin/npm 2>/dev/null || true
echo "Node: $(node -v) | NPM: $(npm -v)"

# ── Step 3: Install PM2 ────────────────────────────────────
echo "[3/10] Installing PM2..."
npm install -g pm2
mkdir -p /var/log/pm2
echo "PM2: $(pm2 -v)"

# ── Step 4: Install & Enable Nginx ─────────────────────────
echo "[4/10] Installing Nginx..."
apt-get install -y nginx
systemctl enable nginx
systemctl start nginx

# ── Step 5: Configure UFW Firewall ─────────────────────────
echo "[5/10] Configuring firewall..."
ufw allow ssh
ufw allow 'Nginx Full'
ufw --force enable
echo "Firewall status:"
ufw status

# ── Step 6: Clone the GitHub Repo ─────────────────────────
echo "[6/10] Cloning GitHub repository..."
echo ""
echo "  !! IMPORTANT: You need a GitHub Personal Access Token (PAT)"
echo "  Go to: https://github.com/settings/tokens"
echo "  Create token with 'repo' scope, copy it, then paste below"
echo ""
read -p "  Enter GitHub PAT (or press ENTER to skip and configure manually): " GITHUB_PAT

if [ -n "$GITHUB_PAT" ]; then
  CLONE_URL="https://${GITHUB_PAT}@github.com/Royalummi/zevio.git"
else
  CLONE_URL="$REPO_URL"
  echo "  Skipping PAT - you will need to configure git auth manually"
fi

mkdir -p /var/www
if [ -d "$APP_DIR/.git" ]; then
  echo "  Repo already exists, skipping clone"
else
  git clone "$CLONE_URL" "$APP_DIR"
fi

# Save PAT in git remote URL for future pulls
if [ -n "$GITHUB_PAT" ]; then
  cd "$APP_DIR"
  git remote set-url origin "https://${GITHUB_PAT}@github.com/Royalummi/zevio.git"
fi

# ── Step 7: Create .env files ─────────────────────────────
echo "[7/10] Creating .env files..."
echo ""
echo "  Creating backend .env - FILL IN your actual values!"

cat > "$APP_DIR/backend/.env" << 'BACKEND_ENV'
# ======================================================
# Backend Environment Variables - PRODUCTION
# Fill in all values below with your actual credentials
# ======================================================
NODE_ENV=production
PORT=5000

# Database (MySQL on same VPS or remote DB)
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=root
DB_PASSWORD=YOUR_MYSQL_PASSWORD_HERE
DB_NAME=zevio

# JWT Secrets (use strong random strings)
JWT_SECRET=REPLACE_WITH_STRONG_SECRET_32_CHARS
JWT_REFRESH_SECRET=REPLACE_WITH_ANOTHER_STRONG_SECRET
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d

# Cloudflare R2 Storage
R2_ACCOUNT_ID=YOUR_R2_ACCOUNT_ID
R2_ACCESS_KEY_ID=YOUR_R2_ACCESS_KEY
R2_SECRET_ACCESS_KEY=YOUR_R2_SECRET_KEY
R2_BUCKET_NAME=YOUR_R2_BUCKET_NAME
R2_PUBLIC_URL=https://YOUR_R2_PUBLIC_URL

# Cashfree Payments
CASHFREE_ENV=production
CASHFREE_APP_ID=YOUR_CASHFREE_APP_ID
CASHFREE_SECRET_KEY=YOUR_CASHFREE_SECRET_KEY

# Email (Gmail)
EMAIL_SERVICE=gmail
EMAIL_USER=shashank.zevio@gmail.com
EMAIL_PASS=YOUR_GMAIL_APP_PASSWORD
EMAIL_FROM=Zevio Villa Booking <noreply@zevio.com>

# CORS URLs
FRONTEND_URL=https://admin.zevio.cloud
NEXTJS_URL=https://zevio.cloud
CORS_ORIGINS=https://zevio.cloud,https://admin.zevio.cloud
UPLOAD_DIR=uploads
MAX_FILE_SIZE=5242880
BACKEND_ENV

echo "  Creating nextjs .env.production..."
cat > "$APP_DIR/nextjs/.env.production" << 'NEXTJS_ENV'
NODE_ENV=production
PORT=8000
NEXT_PUBLIC_API_URL=https://api.zevio.cloud/api
NEXT_PUBLIC_SITE_URL=https://zevio.cloud
NEXT_PUBLIC_REACT_APP_URL=https://zevio.cloud
NEXT_PUBLIC_RAZORPAY_KEY_ID=YOUR_RAZORPAY_LIVE_KEY
NEXTJS_ENV

echo "  .env files created — EDIT THEM before starting apps!"
echo "  Backend: nano $APP_DIR/backend/.env"
echo "  Next.js: nano $APP_DIR/nextjs/.env.production"

# ── Step 8: Install Dependencies & Build ──────────────────
echo "[8/10] Installing dependencies & building apps..."
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

echo "  Installing backend deps..."
cd "$APP_DIR/backend" && npm ci --omit=dev

echo "  Installing & building Next.js..."
cd "$APP_DIR/nextjs" && npm ci && npm run build

echo "  Installing & building Frontend (Vite)..."
cd "$APP_DIR/frontend" && npm ci && npm run build

# ── Step 9: Configure Nginx ───────────────────────────────
echo "[9/10] Configuring Nginx..."
cp "$APP_DIR/nginx/zevio.conf" /etc/nginx/sites-available/zevio
ln -sf /etc/nginx/sites-available/zevio /etc/nginx/sites-enabled/zevio
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl reload nginx

# ── Step 10: Start Apps with PM2 ──────────────────────────
echo "[10/10] Starting apps with PM2..."
cd "$APP_DIR"
pm2 start ecosystem.config.cjs --env production
pm2 save
pm2 startup systemd -u root --hp /root | bash || pm2 startup | tail -1 | bash

echo ""
echo "======================================"
echo " Setup Complete!"
echo "======================================"
echo ""
echo "NEXT STEPS:"
echo "  1. Edit env files:"
echo "     nano $APP_DIR/backend/.env"
echo "     nano $APP_DIR/nextjs/.env.production"
echo ""
echo "  2. After editing .env, reload PM2:"
echo "     pm2 reload all --update-env"
echo ""
echo "  3. Get SSL certificates:"
echo "     certbot --nginx -d zevio.cloud -d www.zevio.cloud -d admin.zevio.cloud -d api.zevio.cloud"
echo ""
echo "  4. Check app status:"
echo "     pm2 list"
echo "     pm2 logs"
echo ""
echo "  5. Add GitHub Secrets (Settings > Secrets > Actions):"
echo "     VPS_HOST     = 185.199.53.224"
echo "     VPS_PASSWORD = <your root password>"
echo ""
