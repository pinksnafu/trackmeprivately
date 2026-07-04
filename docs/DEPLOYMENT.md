# VPS Deployment Guide

This guide details how to self-host the **Privacy Tracker** on a standard Ubuntu Linux VPS (such as the one running `mathiaskoeppel.com`) using **Caddy**, **Node.js**, and **PM2**.

## Prerequisites

- An Ubuntu VPS (Ubuntu 22.04 LTS or newer)
- Node.js (v18+ recommended)
- Caddy Server installed and running as a reverse proxy
- A domain or subdomain pointed to your VPS (e.g. `analytics.yourdomain.com`)

---

## Step 1: Clone and Set Up Code

On the VPS, clone the repository to your preferred web root directory (e.g. `/var/www/privacy-tracker`):

```bash
git clone https://github.com/your-username/privacy-tracker.git /var/www/privacy-tracker
cd /var/www/privacy-tracker
npm install
```

---

## Step 2: Configure Environment Variables

Create and edit the `.env` file:

```bash
nano .env
```

Populate the `.env` file with the SQLite database URL and NextAuth SMTP variables to enable passwordless magic links:

```env
DATABASE_URL="file:./dev.db"
NEXTAUTH_URL="https://analytics.yourdomain.com"
NEXTAUTH_SECRET="choose-a-strong-random-key"

EMAIL_SERVER_HOST="smtp.mailgun.org" # Or AWS SES, SendGrid, etc.
EMAIL_SERVER_PORT=587
EMAIL_SERVER_USER="postmaster@yourdomain.com"
EMAIL_SERVER_PASSWORD="your-smtp-password"
EMAIL_FROM="noreply@yourdomain.com"
```

---

## Step 3: Run Database Migrations

Apply the Prisma schema to build your local SQLite database:

```bash
npx prisma db push
```

---

## Step 4: Run with PM2

Install **PM2** globally to manage the Node.js process and ensure it starts up automatically after server reboots:

```bash
sudo npm install -g pm2
```

Build the Next.js production server:

```bash
npm run build
```

Start the application with PM2:

```bash
pm2 start npm --name "privacy-tracker" -- start
```

Save the process list and configure PM2 startup script:

```bash
pm2 save
pm2 startup
```
*(Follow any system commands printed by `pm2 startup` to configure the system service)*

---

## Step 5: Configure Caddy Reverse Proxy

Edit your VPS Caddyfile (usually in `/etc/caddy/Caddyfile`):

```caddy
analytics.yourdomain.com {
    reverse_proxy localhost:3000
}
```

Reload Caddy to apply changes:

```bash
sudo systemctl reload caddy
```

---

## Step 6: Create the First Website

To start tracking, add a Website record using the Next.js dashboard, copy the tracking script tag, and embed it into your static website.
