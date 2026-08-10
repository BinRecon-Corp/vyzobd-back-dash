# PM2 Process Manager Configuration Guide

PM2 is utilized in non-containerized Node.js deployments to manage runtime processes, clustering, auto-restarts, zero-downtime reloads, and logging.

## 1. Ecosystem Configuration (`ecosystem.config.cjs`)

```javascript
module.exports = {
  apps: [
    {
      name: 'ecommerce-server',
      script: 'dist/server.cjs',
      instances: 'max', // Utilizes all available CPU cores
      exec_mode: 'cluster',
      autorestart: true,
      watch: false,
      max_memory_restart: '1G', // Restarts worker if RAM exceeds 1GB
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      error_file: './logs/pm2-error.log',
      out_file: './logs/pm2-out.log',
      merge_logs: true
    }
  ]
};
```

## 2. Common Management Commands

```bash
# Start processes using ecosystem config
pm2 start ecosystem.config.cjs --env production

# Restart process with zero-downtime
pm2 reload ecommerce-server

# Stop all instances
pm2 stop ecommerce-server

# List status and resource metrics
pm2 list
pm2 monit

# Stream application logs
pm2 logs ecommerce-server --lines 100
```
