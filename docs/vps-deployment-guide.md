# VPS Deployment Guide

This guide provides step-by-step instructions on how to deploy this full-stack application (React + Express + PostgreSQL + Prisma) to a Linux VPS (Virtual Private Server), such as Ubuntu.

## Prerequisites

- A VPS running Ubuntu 22.04 or later.
- SSH access to your server.
- A domain name pointed to your VPS's IP address (optional but recommended).

## Step 1: Initial Server Setup

SSH into your server:
```bash
ssh user@your_server_ip
```

Update your system packages:
```bash
sudo apt update && sudo apt upgrade -y
```

## Step 2: Install Node.js, Git, and PM2

Install Node.js (using NodeSource for newer versions, e.g., v20):
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs git
```

Install PM2 globally to keep the app running in the background:
```bash
sudo npm install -g pm2
```

## Step 3: Install and Configure PostgreSQL

If you are hosting the database on the same server:
```bash
sudo apt install -y postgresql postgresql-contrib
```

Start and enable the PostgreSQL service:
```bash
sudo systemctl enable postgresql
sudo systemctl start postgresql
```

Create a database and a user:
```bash
sudo -i -u postgres
psql
```
Inside the `psql` prompt:
```sql
CREATE DATABASE myapp_db;
CREATE USER myapp_user WITH PASSWORD 'your_strong_password';
ALTER ROLE myapp_user SET client_encoding TO 'utf8';
ALTER ROLE myapp_user SET default_transaction_isolation TO 'read committed';
ALTER ROLE myapp_user SET timezone TO 'UTC';
GRANT ALL PRIVILEGES ON DATABASE myapp_db TO myapp_user;
\q
```
Exit the postgres user:
```bash
exit
```

## Step 4: Clone the Project and Install Dependencies

```bash
git clone <your-repository-url>
cd <your-project-folder>
```

Install the dependencies:
```bash
npm install
```

## Step 5: Configure Environment Variables

Create a `.env` file in the project root:
```bash
cp .env.example .env
nano .env
```

Update the `.env` variables, especially the `DATABASE_URL` and `JWT_SECRET`:
```env
NODE_ENV="production"
PORT=3000
DATABASE_URL="postgresql://myapp_user:your_strong_password@localhost:5432/myapp_db?schema=public"
JWT_SECRET="generate_a_random_secure_string"
```

## Step 6: Setup Prisma and Build the Project

Generate the Prisma client:
```bash
npx prisma generate
```

Run database migrations to create the tables:
```bash
npx prisma migrate deploy
```

Build the application (compiles both frontend and backend):
```bash
npm run build
```

## Step 7: Start the Application with PM2

Start the compiled backend server:
```bash
pm2 start dist/server.cjs --name "myapp"
```

Set PM2 to start automatically on system reboot:
```bash
pm2 startup
pm2 save
```

## Step 8: Set Up Nginx Reverse Proxy

Install Nginx:
```bash
sudo apt install -y nginx
```

Create an Nginx configuration file for your app:
```bash
sudo nano /etc/nginx/sites-available/myapp
```

Paste the following configuration (replace `your_domain.com` with your actual domain or IP address):
```nginx
server {
    listen 80;
    server_name your_domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable the configuration and restart Nginx:
```bash
sudo ln -s /etc/nginx/sites-available/myapp /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

## Step 9: Secure with SSL (Optional but Highly Recommended)

Install Certbot for Let's Encrypt SSL:
```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d your_domain.com
```

Follow the prompts, and Certbot will automatically configure HTTPS for you.

Your application should now be live on your VPS!
