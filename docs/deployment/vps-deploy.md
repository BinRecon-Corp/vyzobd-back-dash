# VPS Deployment Guide (Ubuntu 24.04 LTS)

This guide provides a production deployment procedure for provisioning the eCommerce platform on a bare-metal Ubuntu 24.04 LTS Virtual Private Server (VPS).

---

## 1. Server System Requirements

| Spec | Minimum Requirement | Recommended Production |
| :--- | :--- | :--- |
| **OS** | Ubuntu 24.04 LTS | Ubuntu 24.04 LTS |
| **CPU** | 2 vCPU | 4 vCPU |
| **RAM** | 4 GB | 8 GB+ |
| **Storage** | 32 GB NVMe SSD | 80 GB+ NVMe SSD |

---

## 2. Step 1: System Provisioning & Dependencies

Update system packages and install required tools:
```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y curl git build-essential nginx certbot python3-certbot-nginx postgresql postgresql-contrib ufw
```

Install Node.js 22 LTS via NodeSource:
```bash
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs
sudo npm install -g pm2
```

---

## 3. Step 2: Database Setup (PostgreSQL)

Start PostgreSQL service and create production database & credentials:
```bash
sudo systemctl enable postgresql
sudo systemctl start postgresql

sudo -u postgres psql -c "CREATE DATABASE ecommerce_prod;"
sudo -u postgres psql -c "CREATE USER ecommerce_admin WITH PASSWORD 'StrongProdPassword2026!';"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE ecommerce_prod TO ecommerce_admin;"
```

---

## 4. Step 3: Application Setup & Environment Config

Create dedicated deploy user and clone project repository:
```bash
sudo adduser --disabled-password --gecos "" deployuser
sudo usermod -aG sudo deployuser
sudo su - deployuser

git clone https://github.com/your-org/ecommerce-platform.git /home/deployuser/app
cd /home/deployuser/app
npm install --production=false
```

Create production `.env` configuration file:
```bash
cat << 'ENV' > /home/deployuser/app/.env
NODE_ENV=production
PORT=3000
DATABASE_URL=postgresql://ecommerce_admin:StrongProdPassword2026!@localhost:5432/ecommerce_prod?schema=public
JWT_SECRET=production-jwt-secret-key-at-least-64-characters-long-hash
JWT_EXPIRES_IN=1h
JWT_REFRESH_EXPIRES_IN=7d
COOKIE_SECRET=production-cookie-signing-secret-key
ADMIN_EMAIL=admin@yourdomain.com
ADMIN_PASSWORD=ProductionSuperAdminPassword123!
ALLOWED_ORIGINS=https://yourdomain.com,https://admin.yourdomain.com
APP_URL=https://yourdomain.com
ENV
```

---

## 5. Step 4: Database Migration & Build Process

Run database migrations, seed data, and execute production build:
```bash
npx prisma migrate deploy
npx prisma db seed
npm run build
```

---

## 6. Step 5: PM2 Process Management Setup

Create PM2 ecosystem file `ecosystem.config.cjs`:
```bash
cat << 'ECO' > ecosystem.config.cjs
module.exports = {
  apps: [
    {
      name: 'ecommerce-backend',
      script: 'dist/server.cjs',
      instances: 'max',
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      max_memory_restart: '1G',
      error_file: './logs/err.log',
      out_file: './logs/out.log',
      merge_logs: true
    }
  ]
};
ECO

mkdir -p logs
pm2 start ecosystem.config.cjs
pm2 save
sudo env PATH=$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u deployuser --hp /home/deployuser
```

---

## 7. Step 6: Firewall & Nginx Configuration

Configure UFW firewall:
```bash
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw enable
```

Setup Nginx site configuration (`/etc/nginx/sites-available/ecommerce.conf`):
```nginx
server {
    listen 80;
    server_name yourdomain.com admin.yourdomain.com;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Enable configuration and reload Nginx:
```bash
sudo ln -s /etc/nginx/sites-available/ecommerce.conf /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

---

## 8. Step 7: SSL Certificate (Certbot)

Provision Let's Encrypt TLS/SSL certificates:
```bash
sudo certbot --nginx -d yourdomain.com -d admin.yourdomain.com --non-interactive --agree-tos -m admin@yourdomain.com
```

Verify auto-renewal:
```bash
sudo certbot renew --dry-run
```
