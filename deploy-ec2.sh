#!/usr/bin/env bash
# ==============================================================================
# ClubSync — Automated AWS EC2 (Ubuntu) One-Click Deployment Script
# ==============================================================================
set -e

echo "🚀 [1/6] Configuring System & 2GB Swap Memory (Prevents Free-Tier OOM)..."
if [ ! -f /swapfile ]; then
    sudo fallocate -l 2G /swapfile || sudo dd if=/dev/zero of=/swapfile bs=1M count=2048
    sudo chmod 600 /swapfile
    sudo mkswap /swapfile
    sudo swapon /swapfile
    echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
fi

echo "📦 [2/6] Installing Node.js 20 LTS, Nginx, and Git..."
sudo apt update -y
sudo apt install -y curl git nginx build-essential
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt install -y nodejs
fi
sudo npm install -g pm2

PUBLIC_IP=$(curl -s http://checkip.amazonaws.com || curl -s ifconfig.me || echo "localhost")
echo "🌐 Detected Public IP: $PUBLIC_IP"

echo "📂 [3/6] Setting up ClubSync Codebase in /var/www/clubsync..."
sudo mkdir -p /var/www
sudo chown -R $USER:$USER /var/www

if [ -d "/var/www/clubsync/.git" ]; then
    echo "Updating existing repository..."
    cd /var/www/clubsync
    git fetch origin main
    git reset --hard origin/main
else
    echo "Cloning repository..."
    git clone https://github.com/Vedant1442/ClubSync.git /var/www/clubsync
    cd /var/www/clubsync
fi

echo "⚙️ [4/6] Configuring Backend & Starting PM2..."
cd /var/www/clubsync/server

# Prompt or use supplied DATABASE_URL
if [ -z "$DATABASE_URL" ]; then
    read -rp "Enter Neon DATABASE_URL: " DATABASE_URL
fi

cat << EOF > .env
DATABASE_URL="${DATABASE_URL}"
PORT=5000
NODE_ENV=production
CLIENT_URL=http://$PUBLIC_IP
JWT_SECRET=clubsync-super-secret-jwt-key-pict-2026-production
GROQ_API_KEY="${GROQ_API_KEY:-}"
GROQ_MODEL=openai/gpt-oss-120b
EOF

npm install --production=false
pm2 delete clubsync-api || true
pm2 start index.js --name clubsync-api
pm2 save
pm2 startup systemd -u $USER --hp /home/$USER | sudo bash || true

echo "🎨 [5/6] Building React Frontend..."
cd /var/www/clubsync
echo "VITE_API_URL=http://$PUBLIC_IP" > .env.production
npm install
npm run build

echo "🛡️ [6/6] Configuring Nginx Reverse Proxy..."
sudo tee /etc/nginx/sites-available/clubsync > /dev/null << EOF
server {
    listen 80 default_server;
    listen [::]:80 default_server;

    root /var/www/clubsync/dist;
    index index.html;

    server_name _;

    client_max_body_size 20M;

    # Backend API Reverse Proxy
    location /api/ {
        proxy_pass http://127.0.0.1:5000/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    # React Router SPA Fallback
    location / {
        try_files \$uri \$uri/ /index.html;
    }
}
EOF

sudo rm -f /etc/nginx/sites-enabled/default
sudo ln -sf /etc/nginx/sites-available/clubsync /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
sudo systemctl enable nginx

echo ""
echo "=========================================================================="
echo "🎉 SUCCESS: ClubSync is LIVE on AWS EC2!"
echo "👉 Public URL: http://$PUBLIC_IP"
echo "👉 Health Check: http://$PUBLIC_IP/api/health"
echo "👉 PM2 Status: pm2 status"
echo "=========================================================================="
