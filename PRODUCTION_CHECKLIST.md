# Zevio - Production Deployment Checklist

## 📦 Files to Push to GitHub

### ✅ Backend
- [x] server.js
- [x] package.json
- [x] src/ (all source files)
- [x] migrations/
- [x] uploads/.gitkeep files
- [x] .env.example

### ✅ Frontend (Next.js)
- [x] app/
- [x] components/
- [x] contexts/
- [x] hooks/
- [x] lib/
- [x] public/
- [x] styles/
- [x] types/
- [x] package.json
- [x] next.config.ts
- [x] tsconfig.json
- [x] tailwind.config.js
- [x] .env.example

### ✅ Database
- [x] Database.sql

### ✅ Documentation
- [x] README.md
- [x] DEPLOYMENT_GUIDE.md

---

## 🚫 Files NOT to Push (Handled by .gitignore)

- ❌ node_modules/
- ❌ .env files (create fresh on VPS)
- ❌ .next/
- ❌ uploads/* (except .gitkeep)
- ❌ test-results/
- ❌ playwright-report/
- ❌ SESSION_*.md files
- ❌ All test files

---

## 🔧 Pre-Commit Steps

```bash
cd C:\Users\ranji\Desktop\Company\Zevio

# Initialize git (if not already)
git init

# Add remote (replace with your GitHub repo URL)
git remote add origin https://github.com/YOUR_USERNAME/zevio.git

# Check what will be committed
git status

# Stage all changes
git add .

# Commit
git commit -m "Production ready - Zevio Villa & Service Apartments Platform"

# Push to GitHub
git push -u origin main
```

---

## 🌐 On Hostinger VPS

### Step 1: Clone Repository
```bash
cd /var/www
git clone https://github.com/YOUR_USERNAME/zevio.git
cd zevio
```

### Step 2: Setup Backend
```bash
cd backend

# Copy production package.json
cp package.json.production package.json

# Install dependencies
npm install --production

# Create .env file
nano .env
```

**Backend .env:**
```env
NODE_ENV=production
PORT=5000

DB_HOST=localhost
DB_USER=zevio_user
DB_PASSWORD=SECURE_PASSWORD_HERE
DB_NAME=zevio_production

JWT_SECRET=GENERATE_SECURE_KEY_HERE
JWT_EXPIRES_IN=7d

FRONTEND_URL=https://yourdomain.com
BACKEND_URL=https://api.yourdomain.com
```

```bash
# Setup database
mysql -u root -p
```

**In MySQL:**
```sql
CREATE DATABASE zevio_production CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'zevio_user'@'localhost' IDENTIFIED BY 'SECURE_PASSWORD_HERE';
GRANT ALL PRIVILEGES ON zevio_production.* TO 'zevio_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

```bash
# Import database
mysql -u zevio_user -p zevio_production < ../Database.sql

# Run migrations
node run_migrations.js

# Create upload directories
mkdir -p uploads/avatars uploads/properties
chmod 755 uploads
chmod 755 uploads/avatars
chmod 755 uploads/properties

# Start with PM2
pm2 start server.js --name zevio-backend -i max
pm2 save
```

### Step 3: Setup Frontend
```bash
cd /var/www/zevio/nextjs

# Copy production package.json
cp package.json.production package.json

# Install dependencies
npm install --production

# Create .env.local
nano .env.local
```

**Frontend .env.local:**
```env
NEXT_PUBLIC_API_URL=https://api.yourdomain.com/api
NEXT_PUBLIC_SITE_URL=https://yourdomain.com
NODE_ENV=production
```

```bash
# Build Next.js
npm run build

# Start with PM2
pm2 start npm --name zevio-frontend -- start
pm2 save
pm2 startup
```

### Step 4: Configure Nginx
```bash
sudo nano /etc/nginx/sites-available/zevio
```

**Nginx Config:**
```nginx
# API Server
server {
    listen 80;
    server_name api.yourdomain.com;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        client_max_body_size 50M;
    }

    location /uploads {
        alias /var/www/zevio/backend/uploads;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }
}

# Frontend
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    location / {
        proxy_pass http://localhost:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/zevio /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### Step 5: SSL Certificates
```bash
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
sudo certbot --nginx -d api.yourdomain.com
```

---

## ✅ Verification

1. **Backend API:** https://api.yourdomain.com/api/health
2. **Frontend:** https://yourdomain.com
3. **Check PM2:** `pm2 status`
4. **Check Logs:** `pm2 logs`

---

## 🔄 Future Updates

```bash
cd /var/www/zevio
git pull origin main

# Backend
cd backend
npm install --production
pm2 restart zevio-backend

# Frontend
cd ../nextjs
npm install --production
npm run build
pm2 restart zevio-frontend
```

---

## 🆘 Emergency Commands

```bash
# Restart all services
pm2 restart all

# View logs
pm2 logs --lines 100

# Check database
mysql -u zevio_user -p zevio_production

# Check Nginx
sudo nginx -t
sudo systemctl status nginx
```

---

## 📞 Support

- Check logs first: `pm2 logs`
- Database issues: Check .env credentials
- 502 Error: Check if PM2 processes are running
- Can't connect: Check firewall and Nginx config
