# Zevio - Production Deployment Guide
**Date:** January 24, 2026
**Target:** Hostinger VPS

## 📋 Pre-Deployment Checklist

### ✅ Environment Setup
- [ ] Node.js v20+ installed on VPS
- [ ] MySQL 8.0+ installed and running
- [ ] PM2 installed globally (`npm install -g pm2`)
- [ ] Nginx installed and configured
- [ ] SSL certificate configured

---

## 🚀 Deployment Steps

### 1. On VPS - Initial Setup

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Install PM2
sudo npm install -g pm2

# Install MySQL
sudo apt install mysql-server -y
sudo mysql_secure_installation

# Install Nginx
sudo apt install nginx -y
```

### 2. Clone Repository

```bash
# Navigate to web directory
cd /var/www

# Clone from GitHub
git clone https://github.com/YOUR_USERNAME/zevio.git
cd zevio
```

### 3. Backend Setup

```bash
cd backend

# Install dependencies
npm install --production

# Create .env file
nano .env
```

**Backend .env Configuration:**
```env
NODE_ENV=production
PORT=5000

# Database
DB_HOST=localhost
DB_USER=zevio_user
DB_PASSWORD=YOUR_SECURE_PASSWORD
DB_NAME=zevio_production

# JWT
JWT_SECRET=YOUR_SUPER_SECRET_KEY_CHANGE_THIS
JWT_EXPIRES_IN=7d

# Email (if using)
SMTP_HOST=smtp.hostinger.com
SMTP_PORT=587
SMTP_USER=noreply@yourdomain.com
SMTP_PASS=YOUR_EMAIL_PASSWORD

# URLs
FRONTEND_URL=https://yourdomain.com
BACKEND_URL=https://api.yourdomain.com
```

```bash
# Setup MySQL Database
mysql -u root -p

# In MySQL console:
CREATE DATABASE zevio_production;
CREATE USER 'zevio_user'@'localhost' IDENTIFIED BY 'YOUR_SECURE_PASSWORD';
GRANT ALL PRIVILEGES ON zevio_production.* TO 'zevio_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;

# Import schema and data
mysql -u zevio_user -p zevio_production < Database.sql

# Run migrations
node run_migrations.js

# Start backend with PM2
pm2 start server.js --name zevio-backend
pm2 save
pm2 startup
```

### 4. Frontend Setup

```bash
cd /var/www/zevio/nextjs

# Install dependencies
npm install --production

# Create .env.local
nano .env.local
```

**Frontend .env.local Configuration:**
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
```

### 5. Nginx Configuration

```bash
sudo nano /etc/nginx/sites-available/zevio
```

**Nginx Configuration:**
```nginx
# Backend API
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
        
        # File upload size
        client_max_body_size 50M;
    }

    # Uploads directory
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

    # Static files
    location /_next/static {
        proxy_pass http://localhost:8000/_next/static;
        expires 365d;
        add_header Cache-Control "public, immutable";
    }
}
```

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/zevio /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### 6. SSL Certificate (Let's Encrypt)

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx -y

# Get SSL certificates
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
sudo certbot --nginx -d api.yourdomain.com
```

---

## 🔄 Updating Deployment

```bash
# On VPS
cd /var/www/zevio

# Pull latest changes
git pull origin main

# Update backend
cd backend
npm install --production
pm2 restart zevio-backend

# Update frontend
cd ../nextjs
npm install --production
npm run build
pm2 restart zevio-frontend
```

---

## 📊 Monitoring

```bash
# View logs
pm2 logs zevio-backend
pm2 logs zevio-frontend

# Monitor processes
pm2 monit

# Check status
pm2 status
```

---

## 🛡️ Security Checklist

- [ ] Firewall configured (UFW)
```bash
sudo ufw allow 22    # SSH
sudo ufw allow 80    # HTTP
sudo ufw allow 443   # HTTPS
sudo ufw enable
```

- [ ] MySQL secure installation completed
- [ ] Strong passwords set for all services
- [ ] JWT_SECRET changed from default
- [ ] File permissions set correctly
```bash
chmod 600 /var/www/zevio/backend/.env
chmod 600 /var/www/zevio/nextjs/.env.local
```

- [ ] Fail2ban installed
```bash
sudo apt install fail2ban -y
sudo systemctl enable fail2ban
```

---

## 📁 Directory Structure on VPS

```
/var/www/zevio/
├── backend/
│   ├── server.js
│   ├── .env (production config)
│   ├── src/
│   ├── uploads/
│   └── migrations/
├── nextjs/
│   ├── .next/
│   ├── .env.local (production config)
│   ├── app/
│   ├── components/
│   └── public/
└── Database.sql
```

---

## 🔥 Important Notes

1. **Never commit .env files to Git**
2. **Always use production mode**
3. **Keep dependencies updated**
4. **Regular database backups:**
```bash
# Add to crontab
0 2 * * * mysqldump -u zevio_user -p'PASSWORD' zevio_production > /backups/zevio-$(date +\%Y\%m\%d).sql
```

5. **Monitor disk space for uploads**
6. **Set up automatic SSL renewal** (Certbot does this automatically)

---

## 🆘 Troubleshooting

### Backend not starting:
```bash
pm2 logs zevio-backend --err
# Check database connection in .env
```

### Frontend build fails:
```bash
cd /var/www/zevio/nextjs
rm -rf .next node_modules
npm install --production
npm run build
```

### 502 Bad Gateway:
```bash
pm2 status
sudo systemctl status nginx
# Check if processes are running
```

---

**Support:** For issues, check logs first, then contact dev team.
