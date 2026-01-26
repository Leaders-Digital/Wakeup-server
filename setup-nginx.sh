#!/bin/bash

# Setup script for deploying Wakeup Backend to api.wakeup-cosmetics.tn
# Run this script on your Ubuntu server

set -e

echo "🚀 Wakeup Backend Deployment Setup"
echo "===================================="

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if running as root or with sudo
if [ "$EUID" -ne 0 ]; then 
    echo -e "${RED}Please run with sudo${NC}"
    exit 1
fi

echo -e "${YELLOW}Step 1: Checking prerequisites...${NC}"

# Check if Nginx is installed
if ! command -v nginx &> /dev/null; then
    echo -e "${YELLOW}Nginx not found. Installing...${NC}"
    apt update
    apt install nginx -y
else
    echo -e "${GREEN}✓ Nginx is installed${NC}"
fi

# Check if Certbot is installed
if ! command -v certbot &> /dev/null; then
    echo -e "${YELLOW}Certbot not found. Installing...${NC}"
    apt update
    apt install certbot python3-certbot-nginx -y
else
    echo -e "${GREEN}✓ Certbot is installed${NC}"
fi

echo -e "\n${YELLOW}Step 2: Obtaining SSL certificate...${NC}"
echo -e "${YELLOW}Note: Make sure api.wakeup-cosmetics.tn DNS is already pointing to this server!${NC}"
read -p "Press Enter to continue or Ctrl+C to cancel..."

# Get SSL certificate
if [ ! -d "/etc/letsencrypt/live/api.wakeup-cosmetics.tn" ]; then
    certbot certonly --nginx -d api.wakeup-cosmetics.tn
    echo -e "${GREEN}✓ SSL certificate obtained${NC}"
else
    echo -e "${GREEN}✓ SSL certificate already exists${NC}"
fi

echo -e "\n${YELLOW}Step 3: Installing Nginx configuration...${NC}"

# Copy Nginx config
if [ -f "nginx-api.conf" ]; then
    cp nginx-api.conf /etc/nginx/sites-available/api.wakeup-cosmetics.tn
    
    # Create symlink if it doesn't exist
    if [ ! -L "/etc/nginx/sites-enabled/api.wakeup-cosmetics.tn" ]; then
        ln -s /etc/nginx/sites-available/api.wakeup-cosmetics.tn /etc/nginx/sites-enabled/
    fi
    
    echo -e "${GREEN}✓ Nginx configuration installed${NC}"
else
    echo -e "${RED}✗ nginx-api.conf not found!${NC}"
    echo "Please make sure you're running this script from the project directory."
    exit 1
fi

echo -e "\n${YELLOW}Step 4: Testing Nginx configuration...${NC}"
if nginx -t; then
    echo -e "${GREEN}✓ Nginx configuration is valid${NC}"
else
    echo -e "${RED}✗ Nginx configuration has errors!${NC}"
    exit 1
fi

echo -e "\n${YELLOW}Step 5: Reloading Nginx...${NC}"
systemctl reload nginx
echo -e "${GREEN}✓ Nginx reloaded${NC}"

echo -e "\n${YELLOW}Step 6: Checking firewall...${NC}"
if command -v ufw &> /dev/null; then
    ufw allow 80/tcp
    ufw allow 443/tcp
    ufw reload
    echo -e "${GREEN}✓ Firewall configured${NC}"
else
    echo -e "${YELLOW}⚠ UFW not found, skipping firewall configuration${NC}"
fi

echo -e "\n${GREEN}========================================${NC}"
echo -e "${GREEN}✓ Setup completed successfully!${NC}"
echo -e "${GREEN}========================================${NC}"
echo -e "\nNext steps:"
echo -e "1. Make sure your Docker container is running:"
echo -e "   ${YELLOW}cd /home/ubuntu/wakeup-backend && sudo docker compose up -d${NC}"
echo -e "\n2. Test the API endpoint:"
echo -e "   ${YELLOW}curl https://api.wakeup-cosmetics.tn/api/banner/object -H 'x-api-key: AIzaSyD-1X6JQJ3Q'${NC}"
echo -e "\n3. Check container logs:"
echo -e "   ${YELLOW}sudo docker logs -f wakeup-backend${NC}"
echo -e "\n4. View Nginx logs:"
echo -e "   ${YELLOW}sudo tail -f /var/log/nginx/api.wakeup-cosmetics.tn.access.log${NC}"

