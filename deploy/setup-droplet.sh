#!/bin/bash
# ═══════════════════════════════════════════════════════════════════
#  DigitalOcean Droplet Setup Script
#  OS: Ubuntu 22.04 / 24.04 LTS
# ═══════════════════════════════════════════════════════════════════

set -e

DOMAIN="gamejam2026.com"
EMAIL="admin@gamejam2026.com"

echo "🚀 Starting Droplet Provisioning for Karadeniz Game Jam 2026..."

# 1. Update and Install Prerequisites
echo "📦 Updating repositories..."
apt-get update && apt-get upgrade -y
apt-get install -y apt-transport-https ca-certificates curl software-properties-common ufw nginx certbot python3-certbot-nginx git

# 2. Setup UFW Firewall
echo "🛡️ Configuring Firewall..."
ufw allow OpenSSH
ufw allow 'Nginx Full'
ufw --force enable

# 3. Install Docker Engine & Compose
echo "🐳 Installing Docker..."
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | apt-key add -
add-apt-repository "deb [arch=amd64] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" -y
apt-get update
apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

# 4. Clone Repository (Requires SSH key setup previously)
echo "📂 Setting up project directory..."
mkdir -p /var/www/gamejam
cd /var/www/gamejam

# Placeholder for real git clone
# git clone git@github.com:ktu-oyun/gamejam-platform.git .

# 5. Environment Variables
if [ ! -f .env ]; then
  echo "🔑 Generating .env template..."
  cp .env.example .env
  echo "SESSION_SECRET=$(openssl rand -hex 32)" >> .env
fi

# 6. Setup NGINX
echo "🌐 Configuring NGINX..."
cp deploy/nginx.conf /etc/nginx/sites-available/gamejam
ln -s /etc/nginx/sites-available/gamejam /etc/nginx/sites-enabled/ || true
rm /etc/nginx/sites-enabled/default || true

# Check NGINX config and reload
nginx -t
systemctl reload nginx

# 7. Provision SSL (Let's Encrypt)
echo "🔒 Requesting SSL Certificate via Certbot..."
# Note: Ensure DNS A-records are pointing to this Droplet IP before running this step!
# certbot --nginx -d $DOMAIN -d www.$DOMAIN --non-interactive --agree-tos -m $EMAIL

# 8. Boot Containers
echo "🚢 Deploying Docker stack..."
docker compose up -d --build

echo "✅ Setup Complete. Application should be binding to internal port 3000 and proxying out via NGINX."
