# Zevio VPS Deployment Guide

## Architecture

| App                | Domain           | Method             | Port |
| ------------------ | ---------------- | ------------------ | ---- |
| User Next.js       | `zevio.in`       | PM2 -> Nginx proxy | 8000 |
| Admin/Vendor React | `admin.zevio.in` | Nginx static files | —    |
| Backend API        | `api.zevio.in`   | PM2 -> Nginx proxy | 5000 |

**Auto-deploy:** Every push to `main` triggers GitHub Actions → SSH into VPS → pulls code → rebuilds → reloads.

---

## One-Time VPS Setup (Do This Once)

### Step 1 — Add GitHub Secrets

Go to: **GitHub Repo → Settings → Secrets and variables → Actions → New repository secret**

Add these 2 secrets:

| Secret Name    | Value              |
| -------------- | ------------------ |
| `VPS_HOST`     | `185.199.53.224`   |
| `VPS_PASSWORD` | your root password |

---

### Step 2 — Get a GitHub Personal Access Token (PAT)

Needed so the VPS can clone your private repo.

1. Go to: https://github.com/settings/tokens
2. Click **"Generate new token (classic)"**
3. Give it a name: `zevio-vps-deploy`
4. Check the **`repo`** scope only
5. Set expiration: **No expiration** (or 1 year)
6. Click **Generate token** → copy it immediately

---

### Step 3 — SSH Into VPS and Run Setup Script

From your Windows terminal:

```powershell
ssh root@185.199.53.224
```

Password: your root password

Once inside the VPS, run:

```bash
# Upload the setup script (option A: copy-paste content of scripts/01-vps-setup.sh)
# OR upload via SCP from your Windows machine:
# In a NEW Windows terminal:
# scp C:\Users\ranji\Desktop\Company\Zevio\scripts\01-vps-setup.sh root@185.199.53.224:/tmp/

bash /tmp/01-vps-setup.sh
```

The script will:

- Install Node.js 20, PM2, Nginx, Certbot
- Ask for your GitHub PAT to clone the private repo
- Create `.env` placeholder files
- Build all 3 apps
- Start PM2 processes
- Configure Nginx

---

### Step 4 — Fill in Production Environment Variables

After the script runs, edit the env files on the VPS:

```bash
nano /var/www/zevio/backend/.env
```

Fill in these values (replace placeholders):

- `DB_PASSWORD` — your MySQL root password
- `JWT_SECRET` — generate: `openssl rand -hex 32`
- `JWT_REFRESH_SECRET` — generate: `openssl rand -hex 32`
- `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_NAME`, `R2_PUBLIC_URL` — from your Cloudflare R2 dashboard
- `CASHFREE_APP_ID`, `CASHFREE_SECRET_KEY` — from Cashfree dashboard
- `EMAIL_PASS` — Gmail app password (not your Gmail password)

Then reload:

```bash
pm2 reload all --update-env
```

---

### Step 5 — Install MySQL (if not already running)

```bash
apt-get install -y mysql-server
mysql_secure_installation

# Create database and user
mysql -u root -p
```

Inside MySQL:

```sql
CREATE DATABASE zevio_production;
-- If using root user, just set the password:
ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY 'YOUR_MYSQL_PASSWORD';
FLUSH PRIVILEGES;
EXIT;
```

Import your schema only for a fresh environment:

```bash
mysql -u root -p zevio_production < /var/www/zevio/Database.sql
```

For an existing live environment, do **not** import `Database.sql` blindly. Production may contain forward-only schema changes that are not present in the dump.

---

### Step 6 — Get SSL Certificates (HTTPS)

```bash
certbot --nginx -d zevio.in -d www.zevio.in -d admin.zevio.in -d api.zevio.in
```

Follow the prompts, enter your email when asked.  
Certbot auto-renews certificates — no manual renewal needed.

---

### Step 7 — Verify Everything Works

```bash
# Check PM2 processes
pm2 list

# View logs
pm2 logs backend --lines 20
pm2 logs nextjs --lines 20

# Test Nginx
nginx -t

# Test URLs (should return HTTP 200 or appropriate response)
curl -I https://zevio.in
curl -I https://admin.zevio.in
curl https://api.zevio.in/health
```

---

## Auto-Deploy Verification

After completing setup, test the CI/CD pipeline:

1. Make any small change locally
2. `git add . && git commit -m "test deploy" && git push origin main`
3. Go to **GitHub → Actions tab** → watch the workflow run
4. Should complete in ~3-5 minutes
5. Check live site is updated

---

## Useful Commands on VPS

```bash
# Process management
pm2 list                    # View all processes
pm2 logs                    # View all logs
pm2 logs backend            # Backend logs only
pm2 logs nextjs             # Next.js logs only
pm2 restart backend         # Restart backend
pm2 reload nextjs           # Zero-downtime reload Next.js
pm2 monit                   # Live process monitor

# Manual deploy (without pushing to GitHub)
bash /var/www/zevio/scripts/02-deploy.sh

# Nginx
nginx -t                    # Test config
systemctl reload nginx      # Reload without downtime
cat /var/log/nginx/error.log | tail -50

# Check which ports are listening
ss -tlnp | grep -E '5000|8000|80|443'
```

---

## Troubleshooting

| Problem                                  | Solution                                                                       |
| ---------------------------------------- | ------------------------------------------------------------------------------ |
| GitHub Action fails with "SSH key error" | Check VPS_PASSWORD secret matches exactly                                      |
| Site shows 502 Bad Gateway               | App crashed → run `pm2 logs` to see error                                      |
| Site shows 404                           | Nginx config issue → run `nginx -t`                                            |
| Build fails in GitHub Actions            | Check if `.env` files exist on VPS                                             |
| Git pull fails (private repo)            | Re-run: `git remote set-url origin https://PAT@github.com/Royalummi/zevio.git` |
| Port already in use                      | `pm2 delete all && pm2 start ecosystem.config.cjs --env production`            |
