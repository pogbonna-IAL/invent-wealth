# Deployment Guide - Railway & VPS Development

This guide covers deploying to Railway (production) and setting up a VPS development environment with proper database migration management.

## Table of Contents

1. [Railway Deployment (Production)](#railway-deployment-production)
2. [VPS Development Environment Setup](#vps-development-environment-setup)
3. [Database Migration Strategy](#database-migration-strategy)
4. [Environment Variables](#environment-variables)
5. [Troubleshooting](#troubleshooting)

---

## Railway Deployment (Production)

### Prerequisites

- GitHub account with repository access
- Railway account (sign up at [railway.app](https://railway.app))
- Railway CLI (optional, for advanced usage)

### Step 1: Prepare Your Repository

1. **Ensure your code is committed and pushed to GitHub:**

```bash
git add .
git commit -m "Prepare for Railway deployment"
git push origin main
```

2. **Verify your `package.json` has the correct build scripts:**

```json
{
  "scripts": {
    "build": "next build",
    "start": "next start",
    "db:generate": "prisma generate",
    "db:migrate:deploy": "prisma migrate deploy"
  }
}
```

### Step 2: Create Railway Project

1. **Log in to Railway:**
   - Go to [railway.app](https://railway.app)
   - Sign in with GitHub

2. **Create a New Project:**
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Choose your `invent-wealth` repository
   - Railway will automatically detect it's a Next.js project

### Step 3: Add PostgreSQL Database

1. **Add PostgreSQL Service:**
   - In your Railway project, click "+ New"
   - Select "Database" → "Add PostgreSQL"
   - Railway will automatically create a PostgreSQL database

2. **Note the Database Connection String:**
   - Railway will provide a `DATABASE_URL` environment variable
   - This will be automatically linked to your app service

### Step 4: Configure Environment Variables

In your Railway project, go to your app service → Variables tab and add:

```bash
# Database (automatically provided by Railway PostgreSQL service)
DATABASE_URL=<provided-by-railway>

# NextAuth
NEXTAUTH_URL=https://your-app-name.up.railway.app
NEXTAUTH_SECRET=<generate-a-secure-random-string>

# SMTP Configuration (for email authentication & notifications)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
SMTP_FROM=noreply@inventwealth.com

# Environment
NODE_ENV=production

# Application URL for email links
NEXT_PUBLIC_APP_URL=https://your-app-name.up.railway.app

# Push Notifications (VAPID) - Optional but recommended
# Generate VAPID keys with: npm install -g web-push && web-push generate-vapid-keys
VAPID_PUBLIC_KEY=<generate-with-web-push-generate-vapid-keys>
VAPID_PRIVATE_KEY=<generate-with-web-push-generate-vapid-keys>
VAPID_SUBJECT=mailto:admin@inventwealth.com
NEXT_PUBLIC_VAPID_PUBLIC_KEY=<same-as-VAPID_PUBLIC_KEY>

# System user email for unsold shares (optional)
UNDER_WRITER_EMAIL=under_writer@system.inventwealth.com

# Optional: Seed database on first deploy
SEED_DATABASE=false
```

**Generate NEXTAUTH_SECRET:**
```bash
openssl rand -base64 32
```

### Step 5: Configure Build Settings

1. **Set Build Command:**
   - Go to your app service → Settings
   - Build Command: `npm install && npx prisma generate && npm run build`
   - Start Command: `npm start`

2. **Or use Railway's automatic detection** (it should detect Next.js automatically)

### Step 6: Add Migration Script

Create a `railway.json` file in your project root:

```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS",
    "buildCommand": "npm install && npx prisma generate && npm run build"
  },
  "deploy": {
    "startCommand": "npx prisma migrate deploy && npm start",
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

**Alternative: Use Railway's Deploy Hooks**

Create a `package.json` script for Railway:

```json
{
  "scripts": {
    "railway:deploy": "npx prisma migrate deploy && npm start"
  }
}
```

Then set Start Command in Railway to: `npm run railway:deploy`

### Step 7: Deploy

1. **Railway will automatically deploy** when you push to your main branch
2. **Monitor the deployment:**
   - Go to your app service → Deployments
   - Watch the build logs
   - Check for any errors

3. **Verify migrations ran:**
   - Check the deployment logs for: `"Applying migration"`
   - If migrations fail, check the error logs

### Step 8: Verify Deployment

1. **Check your app URL:**
   - Railway provides a URL like: `https://your-app-name.up.railway.app`
   - Visit the URL to verify the app is running

2. **Test database connection:**
   - Try signing up/logging in
   - Check Railway logs for any database errors

---

## VPS Development Environment Setup

### Prerequisites

- VPS with Ubuntu 22.04+ (or similar Linux distribution)
- SSH access to your VPS
- Domain name (optional, for easier access)

### Step 1: Initial VPS Setup

1. **Connect to your VPS:**

```bash
ssh user@your-vps-ip
```

2. **Update system packages:**

```bash
sudo apt update && sudo apt upgrade -y
```

3. **Install Node.js 20+:**

```bash
# Using NodeSource repository
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Verify installation
node --version
npm --version
```

4. **Install PostgreSQL:**

```bash
sudo apt install -y postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

5. **Install Git:**

```bash
sudo apt install -y git
```

6. **Install PM2 (for process management):**

```bash
sudo npm install -g pm2
```

### Step 2: Setup PostgreSQL Database

1. **Create database and user:**

```bash
sudo -u postgres psql
```

2. **In PostgreSQL prompt:**

```sql
CREATE DATABASE inventwealth_dev;
CREATE USER inventwealth_user WITH PASSWORD 'your-secure-password';
GRANT ALL PRIVILEGES ON DATABASE inventwealth_dev TO inventwealth_user;
ALTER USER inventwealth_user CREATEDB;
\q
```

3. **Update PostgreSQL config for remote access (if needed):**

```bash
sudo nano /etc/postgresql/*/main/postgresql.conf
# Set: listen_addresses = '*'

sudo nano /etc/postgresql/*/main/pg_hba.conf
# Add: host all all 0.0.0.0/0 md5
```

4. **Restart PostgreSQL:**

```bash
sudo systemctl restart postgresql
```

### Step 3: Clone and Setup Project

1. **Create app directory:**

```bash
mkdir -p ~/apps
cd ~/apps
```

2. **Clone your repository:**

```bash
git clone https://github.com/your-username/invent-wealth.git
cd invent-wealth
```

3. **Install dependencies:**

```bash
npm install
```

### Step 4: Configure Environment Variables

1. **Create `.env` file:**

```bash
cp .env.example .env
nano .env
```

2. **Add development environment variables:**

```bash
# Database
DATABASE_URL="postgresql://inventwealth_user:your-secure-password@localhost:5432/inventwealth_dev?schema=public"

# NextAuth
NEXTAUTH_URL="http://your-vps-ip:3000"
# Or if using domain:
# NEXTAUTH_URL="http://dev.yourdomain.com"
NEXTAUTH_SECRET="your-development-secret-key"

# SMTP (use a development email service or your own)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-dev-email@gmail.com
SMTP_PASSWORD=your-app-password
SMTP_FROM=noreply@inventwealth.com

# Environment
NODE_ENV=development

# Application URL for email links
NEXT_PUBLIC_APP_URL=http://your-vps-ip:3000
# Or if using domain:
# NEXT_PUBLIC_APP_URL=http://dev.yourdomain.com

# Push Notifications (VAPID) - Optional
VAPID_PUBLIC_KEY=
VAPID_PRIVATE_KEY=
VAPID_SUBJECT=mailto:admin@inventwealth.com
NEXT_PUBLIC_VAPID_PUBLIC_KEY=

# System user email (optional)
UNDER_WRITER_EMAIL=under_writer@system.inventwealth.com

# Optional
SEED_DATABASE=true
```

### Step 5: Run Database Migrations

1. **Generate Prisma Client:**

```bash
npx prisma generate
```

2. **Run migrations:**

```bash
# For fresh database
npx prisma migrate dev

# Or if migrations already exist
npx prisma migrate deploy
```

3. **Verify database schema:**

```bash
npx prisma studio
# This will open Prisma Studio at http://localhost:5555
```

4. **Seed database (optional):**

```bash
npm run db:seed
```

### Step 6: Setup PM2 for Process Management

1. **Create PM2 ecosystem file:**

```bash
nano ecosystem.config.js
```

2. **Add configuration:**

```javascript
module.exports = {
  apps: [{
    name: 'invent-wealth-dev',
    script: 'npm',
    args: 'run dev',
    cwd: '/home/your-user/apps/invent-wealth',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'development',
      PORT: 3000
    },
    error_file: './logs/pm2-error.log',
    out_file: './logs/pm2-out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z'
  }]
};
```

3. **Create logs directory:**

```bash
mkdir -p logs
```

4. **Start with PM2:**

```bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

### Step 7: Setup Nginx Reverse Proxy (Optional but Recommended)

1. **Install Nginx:**

```bash
sudo apt install -y nginx
```

2. **Create Nginx config:**

```bash
sudo nano /etc/nginx/sites-available/invent-wealth-dev
```

3. **Add configuration:**

```nginx
server {
    listen 80;
    server_name your-vps-ip;  # Or dev.yourdomain.com

    location / {
        proxy_pass http://localhost:3000;
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

4. **Enable site:**

```bash
sudo ln -s /etc/nginx/sites-available/invent-wealth-dev /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### Step 8: Setup SSL with Let's Encrypt (Optional)

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d dev.yourdomain.com
```

---

## Database Migration Strategy

### Development Workflow

1. **Make schema changes in `prisma/schema.prisma`**

2. **Create migration:**

```bash
npx prisma migrate dev --name descriptive_migration_name
```

3. **Test locally:**

```bash
npm run dev
```

4. **Commit migration files:**

```bash
git add prisma/migrations
git commit -m "Add migration: descriptive_migration_name"
git push
```

### Production Deployment (Railway)

Railway will automatically run migrations on deploy if you've configured it:

**Option 1: Using railway.json (Recommended)**

The `railway.json` file we created earlier includes:
```json
"deploy": {
  "startCommand": "npx prisma migrate deploy && npm start"
}
```

**Option 2: Manual Migration**

If you need to run migrations manually on Railway:

1. **Use Railway CLI:**

```bash
railway run npx prisma migrate deploy
```

2. **Or use Railway's web console:**
   - Go to your app service
   - Click "Deployments" → "Run Command"
   - Run: `npx prisma migrate deploy`

### VPS Development Environment Migrations

1. **Pull latest changes:**

```bash
cd ~/apps/invent-wealth
git pull origin main
```

2. **Install dependencies (if needed):**

```bash
npm install
```

3. **Generate Prisma Client:**

```bash
npx prisma generate
```

4. **Run migrations:**

```bash
npx prisma migrate deploy
```

5. **Restart application:**

```bash
pm2 restart invent-wealth-dev
```

### Migration Best Practices

1. **Always test migrations locally first**
2. **Never modify existing migration files** - create new ones
3. **Use descriptive migration names**
4. **Backup production database before major migrations**
5. **Run migrations during low-traffic periods (if possible)**
6. **Monitor application logs after migration**

### Handling Migration Failures

**If migration fails on Railway:**

1. Check deployment logs
2. Identify the failing migration
3. Fix the migration locally
4. Create a new migration to fix the issue
5. Redeploy

**If migration fails on VPS:**

1. Check PM2 logs: `pm2 logs invent-wealth-dev`
2. Check Prisma logs
3. Connect to database and check schema state
4. Rollback if needed: `npx prisma migrate resolve --rolled-back <migration_name>`
5. Fix and reapply

---

## Environment Variables

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@host:5432/db` |
| `NEXTAUTH_URL` | Your app's public URL | `https://app.railway.app` |
| `NEXTAUTH_SECRET` | Secret for JWT signing | Generate with `openssl rand -base64 32` |
| `SMTP_HOST` | SMTP server hostname | `smtp.gmail.com` |
| `SMTP_PORT` | SMTP server port | `587` |
| `SMTP_USER` | SMTP username | `your-email@gmail.com` |
| `SMTP_PASSWORD` | SMTP password/app password | `your-app-password` |
| `SMTP_FROM` | From email address | `noreply@inventwealth.com` |

### Optional Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_ENV` | Environment mode | `development` or `production` |
| `SEED_DATABASE` | Seed database on startup | `false` |
| `PORT` | Application port | `3000` |
| `NEXT_PUBLIC_APP_URL` | Public URL for email links | Same as `NEXTAUTH_URL` |
| `UNDER_WRITER_EMAIL` | System user email for unsold shares | `under_writer@system.inventwealth.com` |
| `VAPID_PUBLIC_KEY` | VAPID public key for push notifications | - |
| `VAPID_PRIVATE_KEY` | VAPID private key for push notifications | - |
| `VAPID_SUBJECT` | VAPID subject (contact email) | `mailto:admin@inventwealth.com` |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | Public VAPID key exposed to client | Same as `VAPID_PUBLIC_KEY` |

---

## Troubleshooting

### Railway Deployment Issues

**Issue: Migrations not running**

- Check `railway.json` startCommand includes `prisma migrate deploy`
- Verify `DATABASE_URL` is set correctly
- Check deployment logs for Prisma errors

**Issue: Build fails**

- Check Node.js version compatibility
- Verify all dependencies are in `package.json`
- Check build logs for specific errors

**Issue: Database connection errors**

- Verify `DATABASE_URL` format is correct
- Check Railway PostgreSQL service is running
- Ensure database credentials are correct

### VPS Development Issues

**Issue: PM2 app not starting**

```bash
pm2 logs invent-wealth-dev
pm2 restart invent-wealth-dev
```

**Issue: Database connection refused**

- Check PostgreSQL is running: `sudo systemctl status postgresql`
- Verify `DATABASE_URL` in `.env`
- Check PostgreSQL is listening: `sudo netstat -tlnp | grep 5432`

**Issue: Port 3000 already in use**

```bash
# Find process using port 3000
sudo lsof -i :3000
# Kill the process or change PORT in .env
```

**Issue: Prisma Client not generated**

```bash
npx prisma generate
```

### Migration Issues

**Issue: Migration drift detected**

```bash
# On development
npx prisma migrate reset  # ⚠️ Deletes all data
npx prisma migrate dev

# On production (Railway)
# Use Railway CLI to run:
railway run npx prisma migrate resolve --applied <migration_name>
```

**Issue: Column already exists**

- This usually means migration was partially applied
- Mark migration as applied: `npx prisma migrate resolve --applied <migration_name>`
- Or rollback and reapply

---

## Quick Reference Commands

### Railway

```bash
# Install Railway CLI
npm i -g @railway/cli

# Login
railway login

# Link project
railway link

# Run migrations
railway run npx prisma migrate deploy

# View logs
railway logs

# Open shell
railway shell
```

### VPS Development

```bash
# Start app
pm2 start ecosystem.config.js

# Stop app
pm2 stop invent-wealth-dev

# Restart app
pm2 restart invent-wealth-dev

# View logs
pm2 logs invent-wealth-dev

# Run migrations
cd ~/apps/invent-wealth
npx prisma migrate deploy

# Seed database
npm run db:seed

# Open Prisma Studio
npx prisma studio
```

---

## Next Steps

1. ✅ Deploy to Railway
2. ✅ Setup VPS development environment
3. ✅ Configure CI/CD (optional - GitHub Actions)
4. ✅ Setup monitoring (optional - Sentry, LogRocket)
5. ✅ Configure backups (Railway PostgreSQL backups)

For questions or issues, check the [main README.md](./README.md) or open an issue on GitHub.

