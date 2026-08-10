# Database Backup & Restoration Guide

This document outlines automated PostgreSQL database backup procedures, rotation policies, and restoration instructions.

## 1. Automated Backup Script (`/home/deployuser/scripts/backup_db.sh`)

```bash
#!/bin/bash
BACKUP_DIR="/var/backups/postgres"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
DATABASE_NAME="ecommerce_prod"
DATABASE_USER="ecommerce_admin"
BACKUP_FILE="${BACKUP_DIR}/db_backup_${TIMESTAMP}.sql.gz"

mkdir -p $BACKUP_DIR

echo "[$(date)] Starting PostgreSQL Backup..."
PGPASSWORD="StrongProdPassword2026!" pg_dump -U $DATABASE_USER -h localhost $DATABASE_NAME | gzip > $BACKUP_FILE

if [ $? -eq 0 ]; then
  echo "[$(date)] Backup successful: $BACKUP_FILE"
  # Delete backups older than 14 days
  find $BACKUP_DIR -type f -name "db_backup_*.sql.gz" -mtime +14 -delete
else
  echo "[$(date)] Backup failed!" >&2
  exit 1
fi
```

Add script to system crontab (`crontab -e`) to run daily at 2:00 AM:
```cron
0 2 * * * /home/deployuser/scripts/backup_db.sh >> /var/log/db_backup.log 2>&1
```

## 2. Database Restoration Workflow

To restore a compressed SQL backup file into PostgreSQL:
```bash
# 1. Decompress backup file
gunzip -k /var/backups/postgres/db_backup_20260810_020000.sql.gz

# 2. Terminate active database connections & drop database
sudo -u postgres psql -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = 'ecommerce_prod';"
sudo -u postgres psql -c "DROP DATABASE IF EXISTS ecommerce_prod;"
sudo -u postgres psql -c "CREATE DATABASE ecommerce_prod OWNER ecommerce_admin;"

# 3. Restore database schema and data
PGPASSWORD="StrongProdPassword2026!" psql -U ecommerce_admin -h localhost -d ecommerce_prod < /var/backups/postgres/db_backup_20260810_020000.sql
```
