#!/bin/bash

# Fix 413 Request Entity Too Large Error
# This script updates Nginx configuration to allow larger file uploads

set -e

echo "🔧 Fixing 413 Request Entity Too Large Error"
echo "=============================================="

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    echo -e "${RED}Please run with sudo${NC}"
    exit 1
fi

echo -e "${YELLOW}Step 1: Updating Nginx configuration...${NC}"

# Update the Nginx config file
CONFIG_FILE="/etc/nginx/sites-available/api.wakeup-cosmetics.tn"

if [ -f "$CONFIG_FILE" ]; then
    # Backup original config
    cp "$CONFIG_FILE" "${CONFIG_FILE}.backup.$(date +%Y%m%d_%H%M%S)"
    echo -e "${GREEN}✓ Backup created${NC}"
    
    # Copy new config
    if [ -f "nginx-api.conf" ]; then
        cp nginx-api.conf "$CONFIG_FILE"
        echo -e "${GREEN}✓ Configuration updated${NC}"
    else
        echo -e "${RED}✗ nginx-api.conf not found in current directory!${NC}"
        exit 1
    fi
else
    echo -e "${RED}✗ Nginx config file not found at $CONFIG_FILE${NC}"
    exit 1
fi

echo -e "\n${YELLOW}Step 2: Testing Nginx configuration...${NC}"
if nginx -t; then
    echo -e "${GREEN}✓ Configuration is valid${NC}"
else
    echo -e "${RED}✗ Configuration has errors!${NC}"
    echo "Restoring backup..."
    cp "${CONFIG_FILE}.backup."* "$CONFIG_FILE"
    exit 1
fi

echo -e "\n${YELLOW}Step 3: Reloading Nginx...${NC}"
systemctl reload nginx
echo -e "${GREEN}✓ Nginx reloaded${NC}"

echo -e "\n${YELLOW}Step 4: Restarting Docker container...${NC}"
if [ -d "/home/ubuntu/wakeup-backend" ]; then
    cd /home/ubuntu/wakeup-backend
    docker compose restart
    echo -e "${GREEN}✓ Container restarted${NC}"
else
    echo -e "${YELLOW}⚠ /home/ubuntu/wakeup-backend not found, skipping container restart${NC}"
fi

echo -e "\n${GREEN}========================================${NC}"
echo -e "${GREEN}✓ Fix applied successfully!${NC}"
echo -e "${GREEN}========================================${NC}"
echo -e "\nNew limits:"
echo -e "  • Client max body size: ${GREEN}50MB${NC}"
echo -e "  • Proxy timeouts: ${GREEN}300s (5 minutes)${NC}"
echo -e "  • Express JSON limit: ${GREEN}50MB${NC}"
echo -e "\nYou can now upload files up to 50MB!"
echo -e "\nTest with:"
echo -e "  ${YELLOW}curl -X PUT https://api.wakeup-cosmetics.tn/api/product/update/variant \\${NC}"
echo -e "  ${YELLOW}    -H 'x-api-key: AIzaSyD-1X6JQJ3Q' \\${NC}"
echo -e "  ${YELLOW}    -F 'file=@your-image.jpg'${NC}"

