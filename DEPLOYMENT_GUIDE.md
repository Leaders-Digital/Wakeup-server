# Deployment Guide for api.wakeup-cosmetics.tn

This guide will help you deploy the Wakeup backend to `https://api.wakeup-cosmetics.tn/`

## Prerequisites

- Ubuntu server with Docker and Docker Compose installed
- Nginx installed
- Domain DNS configured to point to your server
- SSL certificate (via Certbot/Let's Encrypt)

## Step 1: Configure DNS

Add an A record in your DNS settings:

```
Type: A
Name: api
Value: YOUR_SERVER_IP
TTL: 300 (or Auto)
```

**Verify DNS propagation:**
```bash
nslookup api.wakeup-cosmetics.tn
# or
ping api.wakeup-cosmetics.tn
```

## Step 2: Set up SSL Certificate

Install Certbot if not already installed:
```bash
sudo apt update
sudo apt install certbot python3-certbot-nginx -y
```

Get SSL certificate for the API subdomain:
```bash
sudo certbot certonly --nginx -d api.wakeup-cosmetics.tn
```

The certificates will be saved at:
- Certificate: `/etc/letsencrypt/live/api.wakeup-cosmetics.tn/fullchain.pem`
- Private Key: `/etc/letsencrypt/live/api.wakeup-cosmetics.tn/privkey.pem`

## Step 3: Configure Nginx

Copy the Nginx configuration:
```bash
sudo cp nginx-api.conf /etc/nginx/sites-available/api.wakeup-cosmetics.tn
```

Create a symbolic link:
```bash
sudo ln -s /etc/nginx/sites-available/api.wakeup-cosmetics.tn /etc/nginx/sites-enabled/
```

Test Nginx configuration:
```bash
sudo nginx -t
```

If successful, reload Nginx:
```bash
sudo systemctl reload nginx
```

## Step 4: Prepare Environment Variables

Create a `.env` file in `/home/ubuntu/wakeup-backend/` with:

```env
# MongoDB Connection
MONGODB_URI=mongodb+srv://leadersdev1:eeYrZtYTykpEvZoB@cluster0.xpa7e.mongodb.net/wakeup-db?retryWrites=true&w=majority

# Server Configuration
PORT=7000
NODE_ENV=production

# Security
JWT_SECRET=leader@leader@degital2023@@?
API_KEY=AIzaSyD-1X6JQJ3Q

# Email Configuration
EMAIL_USER=noreply@leaders-makeup.com
EMAIL_PASS=SiteWeb@MakeUp@2024

# Frontend URLs (for CORS)
FRONTEND_URL=https://www.wakeup-cosmetics.tn
```

## Step 5: Deploy with GitHub Actions

The GitHub Actions workflow (`.github/workflows/deploy.yml`) will automatically:

1. ✅ Build Docker image
2. ✅ Push to DockerHub as `bangov2/wakeup-backend:latest`
3. ✅ Copy `docker-compose.yml` to server
4. ✅ Deploy to `/home/ubuntu/wakeup-backend/`
5. ✅ Start container on port 3007

### Manual Deployment (if needed)

If you want to deploy manually:

```bash
# SSH into your server
ssh ubuntu@YOUR_SERVER_IP

# Navigate to the backend directory
cd /home/ubuntu/wakeup-backend

# Pull the latest image
sudo docker compose pull

# Stop and remove old container
sudo docker compose down

# Start new container
sudo docker compose up -d

# Check logs
sudo docker logs -f wakeup-backend
```

## Step 6: Verify Deployment

### Check Container Status
```bash
sudo docker ps | grep wakeup-backend
```

Expected output:
```
wakeup-backend   bangov2/wakeup-backend:latest   Up X minutes (healthy)   0.0.0.0:3007->7000/tcp
```

### Check Container Logs
```bash
sudo docker logs wakeup-backend
```

Should show:
```
Our server is running on port 7000
```

### Test API Endpoint
```bash
# From your local machine
curl https://api.wakeup-cosmetics.tn/api/banner/object \
  -H "x-api-key: AIzaSyD-1X6JQJ3Q"
```

Should return banner data (not a CORS error).

## Step 7: Test from Frontend

1. **Clear browser cache**: `Ctrl + Shift + Delete`
2. **Hard refresh**: `Ctrl + F5`
3. **Open DevTools**: `F12` → Network tab
4. **Visit**: https://www.wakeup-cosmetics.tn
5. **Verify**: No CORS errors in Network tab ✅

## Troubleshooting

### Issue: 502 Bad Gateway

**Check if container is running:**
```bash
sudo docker ps | grep wakeup-backend
```

**Check container logs:**
```bash
sudo docker logs wakeup-backend
```

**Restart container:**
```bash
cd /home/ubuntu/wakeup-backend
sudo docker compose restart
```

### Issue: Still CORS Errors

**Verify allowed origins in backend:**
The backend allows these origins:
- ✅ `https://www.wakeup-cosmetics.tn`
- ✅ `https://api.wakeup-cosmetics.tn`
- ✅ `https://admin.wakeup-cosmetics.tn`

**Check browser console:**
```javascript
// Should show the correct API URL
console.log(process.env.NEXT_PUBLIC_API_KEY);
// Should output: https://api.wakeup-cosmetics.tn/
```

### Issue: SSL Certificate Errors

**Renew certificate:**
```bash
sudo certbot renew --dry-run
```

**Check certificate expiry:**
```bash
sudo certbot certificates
```

### Issue: Port Already in Use

**Check what's using port 3007:**
```bash
sudo lsof -i :3007
```

**Kill the process if needed:**
```bash
sudo kill -9 <PID>
```

## Monitoring

### View Real-time Logs
```bash
sudo docker logs -f wakeup-backend
```

### Check Container Health
```bash
sudo docker inspect wakeup-backend | grep -A 10 Health
```

### Restart on Failure
The container has `restart: unless-stopped` policy, so it will automatically restart if it crashes.

## Firewall Configuration

Make sure ports are open:
```bash
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 3007/tcp  # For direct access if needed
sudo ufw reload
```

## Auto-renewal for SSL

Certbot automatically creates a cron job for renewal. Verify:
```bash
sudo systemctl status certbot.timer
```

## Summary

After following these steps:

✅ Backend accessible at: `https://api.wakeup-cosmetics.tn/`
✅ Docker container running on port: `3007`
✅ Nginx proxying requests to container
✅ SSL certificate configured
✅ CORS properly configured
✅ Frontend can make API calls without errors

## Support

If you encounter issues:
1. Check container logs: `sudo docker logs wakeup-backend`
2. Check Nginx logs: `sudo tail -f /var/log/nginx/api.wakeup-cosmetics.tn.error.log`
3. Verify DNS: `nslookup api.wakeup-cosmetics.tn`
4. Test health endpoint: `curl https://api.wakeup-cosmetics.tn/health`

