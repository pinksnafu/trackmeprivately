# Data Retention & Maintenance

This document explains the data retention pruning mechanics and SQLite database maintenance strategies for **Privacy Tracker**.

---

## 📅 Configurable Retention Window

By default, Privacy Tracker keeps all analytics event data indefinitely. For higher-traffic self-hosted instances, database sizes on small VPS disks can be managed by setting a data retention limit.

Pruning is configured via the environment variable in `.env`:

```env
ANALYTICS_RETENTION_DAYS="90"
```

*   **Unset or Empty**: Retention is disabled (keep all data).
*   **Positive Integer**: Deletes all events older than this number of days when the prune script is executed.

---

## 🧹 The Maintenance Command

To run a pruning cycle, execute the following npm script:

```bash
npm run prune
```

This script:
1. Checks the configured `ANALYTICS_RETENTION_DAYS`.
2. Deletes events older than the calculated cutoff date from the `Event` table.
3. **Runs SQLite `VACUUM`**: Reclaims unused disk space from deleted rows and releases it back to the host operating system. Without `VACUUM`, SQLite database file size on disk will never decrease, even if millions of rows are deleted.

---

## ⏱️ Scheduling Automatic Pruning (Cron)

To keep your database clean automatically, schedule `npm run prune` to run daily or weekly.

### 1. Standard VPS Deployment (Linux Crontab)

Open the crontab editor:

```bash
crontab -e
```

Add a daily job to run at 2:00 AM (replace `/path/to/trackmeprivately` with the absolute path to your project):

```cron
0 2 * * * cd /path/to/trackmeprivately && DATABASE_URL="file:./prisma/dev.db" ANALYTICS_RETENTION_DAYS="90" /usr/bin/npm run prune >> /var/log/tracker-prune.log 2>&1
```

### 2. Docker Compose Deployment

If running in a Docker container, run the prune script inside the running container context.

Create a cron job on the host machine targeting the container:

```cron
0 2 * * * docker exec -e ANALYTICS_RETENTION_DAYS="90" trackmeprivately npm run prune >> /var/log/tracker-docker-prune.log 2>&1
```

*(Ensure the container name matches the container name in your `docker-compose.yml`)*

---

## ⚠️ Backup Considerations & Tradeoffs

1.  **Vacuum Defragmentation Lock**: Running `VACUUM` rebuilds the database file. For very large databases (tens of gigabytes), this operation can take several minutes and will lock the database, blocking incoming pageview logging. Schedule the cron job at low-traffic times.
2.  **Backups**: Always take a database backup (copying your `.db` file) before running pruning or database vacuum operations, particularly the first time.
3.  **Dashboard Impacts**: Deleting old event rows will adjust the total counts and historic views displayed on the charts when viewing wide date ranges (like the 30D view). It does not affect active website entries or administrative WebAuthn credentials.
