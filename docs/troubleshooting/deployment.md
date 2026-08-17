# Troubleshooting Production Deployment Issues

## 1. PM2 Process Crashing on Startup
- **Symptom**: PM2 app continuously restarts (`errored` or `stopping` state).
- **Resolution**:
```bash
pm2 logs ecommerce-server --err --lines 50
```
Check missing environment variables in `.env`, incorrect database credentials, or unbuilt `dist/server.cjs`.

## 2. Nginx 502 Bad Gateway
- **Cause**: Nginx is unable to connect to Node.js server on `127.0.0.1:3000`.
- **Resolution**: Ensure PM2 process is running (`pm2 status`) and listening on port 3000 (`netstat -tlpn | grep 3000`).
