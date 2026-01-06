#!/bin/bash

# ============================================================================
# TOMODACHI DATA PLATFORM - Complete Fix & Deploy Script
# ============================================================================

set -e

echo "🔧 Starting Fix & Deployment..."
echo "================================"

cd /root/data-platform-app/data-platform-app/frontend-new

# Step 1: Fix package.json (remove --https flag)
echo "📝 Fixing package.json..."
cat > package.json << 'EOF'
{
  "name": "tomodachi-data-platform",
  "private": true,
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite --host 0.0.0.0 --port 3000",
    "build": "vite build",
    "preview": "vite preview --host 0.0.0.0 --port 3000",
    "start": "vite preview --host 0.0.0.0 --port 3000"
  },
  "dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "react-router-dom": "^6.21.1",
    "axios": "^1.6.5",
    "framer-motion": "^10.18.0",
    "lucide-react": "^0.309.0",
    "recharts": "^2.10.3",
    "clsx": "^2.1.0",
    "tailwind-merge": "^2.2.0"
  },
  "devDependencies": {
    "@types/react": "^18.2.48",
    "@types/react-dom": "^18.2.18",
    "@vitejs/plugin-react": "^4.2.1",
    "autoprefixer": "^10.4.16",
    "postcss": "^8.4.33",
    "tailwindcss": "^3.4.1",
    "vite": "^5.0.11"
  }
}
EOF

# Step 2: Fix vite.config.js
echo "📝 Fixing vite.config.js..."
cat > vite.config.js << 'EOF'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

export default defineConfig({
  plugins: [react()],
  server: {
    https: {
      key: fs.readFileSync(path.resolve(__dirname, './ssl/server-key.pem')),
      cert: fs.readFileSync(path.resolve(__dirname, './ssl/server-cert.pem')),
    },
    host: '0.0.0.0',
    port: 3000,
    proxy: {
      '/api': {
        target: 'https://dataplatform.tomodachis.org:2221',
        changeOrigin: true,
        secure: false,
      }
    }
  },
  preview: {
    https: {
      key: fs.readFileSync(path.resolve(__dirname, './ssl/server-key.pem')),
      cert: fs.readFileSync(path.resolve(__dirname, './ssl/server-cert.pem')),
    },
    host: '0.0.0.0',
    port: 3000,
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
EOF

# Step 3: Update systemd service
echo "⚙️  Updating systemd service..."
sudo cat > /etc/systemd/system/frontend-new.service << 'EOF'
[Unit]
Description=TOMODACHI Data Platform - Modern Frontend (Vite + React)
After=network.target backend-app.service
Requires=backend-app.service

[Service]
Type=simple
User=root
WorkingDirectory=/root/data-platform-app/data-platform-app/frontend-new
ExecStart=/usr/bin/npm run start
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal

Environment=NODE_ENV=production
Environment=PORT=3000

[Install]
WantedBy=multi-user.target
EOF

# Step 4: Setup Nginx reverse proxy
echo "🌐 Setting up Nginx..."
sudo cat > /etc/nginx/conf.d/dataplatform.conf << 'EOF'
server {
    listen 443 ssl http2;
    server_name dataplatform.tomodachis.org;

    ssl_certificate     /root/data-platform-app/data-platform-app/frontend/ssl/server-cert.pem;
    ssl_certificate_key /root/data-platform-app/data-platform-app/frontend/ssl/server-key.pem;
    
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    location / {
        proxy_pass https://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_ssl_verify off;
    }

    location /api/ {
        proxy_pass https://127.0.0.1:2221/api/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_ssl_verify off;
    }
}

server {
    listen 80;
    server_name dataplatform.tomodachis.org;
    return 301 https://$server_name$request_uri;
}
EOF

# Step 5: Test Nginx config
echo "🧪 Testing Nginx configuration..."
sudo nginx -t

# Step 6: Reload services
echo "🔄 Reloading services..."
sudo systemctl daemon-reload
sudo systemctl reload nginx
sudo systemctl restart frontend-new

# Step 7: Check status
echo ""
echo "================================"
echo "✅ Deployment Complete!"
echo "================================"
echo ""
echo "📊 Service Status:"
sudo systemctl status frontend-new --no-pager -l | head -15

echo ""
echo "🌐 Access: https://dataplatform.tomodachis.org"
echo ""
echo "📝 Useful Commands:"
echo "  - Check logs: journalctl -u frontend-new -f"
echo "  - Restart: systemctl restart frontend-new"
echo "  - Check Nginx: nginx -t && systemctl reload nginx"
echo ""
