# SSL / TLS Configuration with Certbot

This guide outlines obtaining and automatically renewing Let's Encrypt SSL/TLS certificates using Certbot for Nginx.

## 1. Installation & Certificate Generation
```bash
sudo apt update
sudo apt install -y certbot python3-certbot-nginx

# Obtain SSL Certificate
sudo certbot --nginx -d yourdomain.com -d admin.yourdomain.com
```

## 2. Automated Renewal & Verification
Certbot automatically installs a systemd timer (`certbot.timer`). Verify auto-renewal timer state:
```bash
sudo systemctl status certbot.timer
```

Perform a dry-run renewal test:
```bash
sudo certbot renew --dry-run
```
