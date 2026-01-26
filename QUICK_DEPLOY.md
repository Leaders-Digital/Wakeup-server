# 🚀 Quick Deployment Guide - Wakeup Backend

## 📋 Summary

Deploy your Wakeup backend to: **https://api.wakeup-cosmetics.tn/**

**Port Configuration:**
- Internal (Docker): `7000`
- External (Host): `3007`
- Nginx proxies: `443` → `3007`

---

## ⚡ Quick Deploy Commands

### On Your Server (Ubuntu)

```bash
# 1. SSH into your server
ssh ubuntu@YOUR_SERVER_IP

# 3. Verify Nginx Configuration
# Make sure your existing Nginx is configured to proxy to localhost:3007
# (Nginx configuration is managed separately on your VPS)

# 4. Your GitHub Actions will automatically deploy when you push to main
# Or manually deploy:
cd /home/ubuntu/wakeup-backend
sudo docker compose down
sudo docker compose pull
sudo docker compose up -d

# 5. Check status
sudo docker ps | grep wakeup-backend
sudo docker logs -f wakeup-backend
```

---

## 🔧 Configuration Files

### ✅ Files Created:
1. **`docker-compose.yml`** - Updated port mapping (3007:7000)
2. **`index.js`** - CORS configuration updated
3. **`setup-nginx.sh`** - Automated setup script (nginx config not included)
5. **`DEPLOYMENT_GUIDE.md`** - Full deployment documentation

### ✅ Backend Changes:
- ✅ Removed S3, now using local storage
- ✅ CORS configured for:
  - `https://www.wakeup-cosmetics.tn`
  - `https://api.wakeup-cosmetics.tn`
  - `https://admin.wakeup-cosmetics.tn`
- ✅ API key middleware fixed for OPTIONS requests
- ✅ Static uploads served from `/uploads/`

---

## 🌐 DNS Configuration

**Before deploying**, add this DNS record:

| Type | Name | Value | TTL |
|------|------|-------|-----|
| A | api | YOUR_SERVER_IP | 300 |

**Verify DNS:**
```bash
nslookup api.wakeup-cosmetics.tn
# Should return your server IP
```

---

## 📦 Environment Variables

Your `.env` file on the server should contain:

```env
MONGODB_URI=mongodb+srv://leadersdev1:eeYrZtYTykpEvZoB@cluster0.xpa7e.mongodb.net/wakeup-db
PORT=7000
NODE_ENV=production
JWT_SECRET=leader@leader@degital2023@@?
API_KEY=AIzaSyD-1X6JQJ3Q
EMAIL_USER=noreply@leaders-makeup.com
EMAIL_PASS=SiteWeb@MakeUp@2024
FRONTEND_URL=https://www.wakeup-cosmetics.tn
```

---

## 🧪 Testing

### 1. Test API Endpoint
```bash
curl https://api.wakeup-cosmetics.tn/api/banner/object \
  -H "x-api-key: AIzaSyD-1X6JQJ3Q"
```

Expected: JSON response (not 502 or CORS error)

### 2. Test from Browser
1. Open: https://www.wakeup-cosmetics.tn
2. Open DevTools (F12) → Network tab
3. Refresh page
4. Check: No CORS errors ✅

### 3. Test Health Check
```bash
curl https://api.wakeup-cosmetics.tn/health
```

---

## 📊 Monitoring Commands

```bash
# View container status
sudo docker ps | grep wakeup-backend

# View real-time logs
sudo docker logs -f wakeup-backend

# View Nginx access logs
sudo tail -f /var/log/nginx/api.wakeup-cosmetics.tn.access.log

# View Nginx error logs
sudo tail -f /var/log/nginx/api.wakeup-cosmetics.tn.error.log

# Check container health
sudo docker inspect wakeup-backend | grep -A 10 Health

# Restart container
cd /home/ubuntu/wakeup-backend
sudo docker compose restart
```

---

## 🔥 Troubleshooting

### Issue: 502 Bad Gateway
```bash
# Check if container is running
sudo docker ps | grep wakeup-backend

# If not running, check logs
sudo docker logs wakeup-backend

# Restart
cd /home/ubuntu/wakeup-backend
sudo docker compose restart
```

### Issue: CORS Errors Still Happening
```bash
# 1. Verify backend is accessible
curl http://localhost:3007/api/banner/object -H "x-api-key: AIzaSyD-1X6JQJ3Q"

# 2. Check Nginx is running
sudo systemctl status nginx

# 3. Check Nginx config
sudo nginx -t

# 4. Reload Nginx
sudo systemctl reload nginx

# 5. Clear browser cache and hard refresh (Ctrl+F5)
```

### Issue: SSL Certificate Error
```bash
# Check certificate
sudo certbot certificates

# Renew if needed
sudo certbot renew

# Reload Nginx
sudo systemctl reload nginx
```

---

## 🎯 Current Architecture

```
┌─────────────────────────────────────────────────────┐
│  https://www.wakeup-cosmetics.tn                    │
│  (Frontend - Next.js)                                │
└──────────────────┬──────────────────────────────────┘
                   │
                   │ API Calls with x-api-key header
                   ▼
┌─────────────────────────────────────────────────────┐
│  https://api.wakeup-cosmetics.tn (Nginx)            │
│  Port 443 (SSL)                                      │
└──────────────────┬──────────────────────────────────┘
                   │
                   │ Proxy to localhost:3007
                   ▼
┌─────────────────────────────────────────────────────┐
│  Docker Container: wakeup-backend                    │
│  External Port: 3007                                 │
│  Internal Port: 7000                                 │
│  Image: bangov2/wakeup-backend:latest                │
└──────────────────┬──────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────┐
│  MongoDB Atlas                                       │
│  cluster0.xpa7e.mongodb.net                          │
└─────────────────────────────────────────────────────┘
```

---

## ✅ Deployment Checklist

Before deploying:
- [ ] DNS configured (`api.wakeup-cosmetics.tn` → Server IP)
- [ ] Nginx installed on server
- [ ] Certbot installed on server
- [ ] SSL certificate obtained
- [ ] Nginx config uploaded and linked
- [ ] `.env` file created in `/home/ubuntu/wakeup-backend/`
- [ ] Docker and Docker Compose installed
- [ ] Ports 80, 443, and 3007 open in firewall

After deploying:
- [ ] Container is running (`docker ps`)
- [ ] Container is healthy (check health status)
- [ ] API responds to curl test
- [ ] No CORS errors in browser console
- [ ] Uploads are working
- [ ] Frontend can fetch data successfully

---

## 📞 Support

If issues persist:

1. **Check logs:** `sudo docker logs wakeup-backend`
2. **Check Nginx:** `sudo nginx -t`
3. **Test locally:** `curl http://localhost:3007/api/banner/object -H "x-api-key: AIzaSyD-1X6JQJ3Q"`
4. **Verify DNS:** `nslookup api.wakeup-cosmetics.tn`
5. **Check firewall:** `sudo ufw status`

---

## 🎉 Success Indicators

✅ Container status: `Up X minutes (healthy)`
✅ Nginx test: `configuration file /etc/nginx/nginx.conf syntax is ok`
✅ curl test: Returns JSON (not error)
✅ Browser: No CORS errors in console
✅ Frontend: Data loads successfully

**Your backend is now live at: https://api.wakeup-cosmetics.tn/** 🚀

