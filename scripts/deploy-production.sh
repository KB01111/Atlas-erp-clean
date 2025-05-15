#!/bin/bash
# Production Deployment Script for Atlas-ERP
# This script automates the deployment process for Atlas-ERP in production

set -e

# Configuration
APP_NAME="atlas-erp"
REPO_URL="https://github.com/KB01111/Atlas-erp-clean.git"
DEPLOY_DIR="/opt/atlas-erp"
BACKUP_DIR="/opt/backups/atlas-erp"
ENV_FILE=".env.production"
COMPOSE_FILE="docker-compose.production.yml"
BRANCH="main"

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Print header
echo -e "${GREEN}=========================================${NC}"
echo -e "${GREEN}   Atlas-ERP Production Deployment       ${NC}"
echo -e "${GREEN}=========================================${NC}"

# Check if running as root
if [ "$EUID" -ne 0 ]; then
  echo -e "${RED}Please run as root or with sudo${NC}"
  exit 1
fi

# Create directories if they don't exist
mkdir -p $DEPLOY_DIR
mkdir -p $BACKUP_DIR

# Backup current deployment if it exists
if [ -d "$DEPLOY_DIR/.git" ]; then
  echo -e "${YELLOW}Backing up current deployment...${NC}"
  BACKUP_NAME="atlas-erp-backup-$(date +%Y%m%d-%H%M%S)"
  
  # Backup volumes
  echo -e "${YELLOW}Backing up Docker volumes...${NC}"
  cd $DEPLOY_DIR
  docker-compose -f $COMPOSE_FILE down || true
  
  # Create backup directory
  mkdir -p $BACKUP_DIR/$BACKUP_NAME
  
  # Backup Docker volumes
  docker run --rm -v atlas-erp_surreal-data:/source -v $BACKUP_DIR/$BACKUP_NAME:/backup alpine tar -czf /backup/surreal-data.tar.gz -C /source .
  docker run --rm -v atlas-erp_minio-data:/source -v $BACKUP_DIR/$BACKUP_NAME:/backup alpine tar -czf /backup/minio-data.tar.gz -C /source .
  docker run --rm -v atlas-erp_postgres-data:/source -v $BACKUP_DIR/$BACKUP_NAME:/backup alpine tar -czf /backup/postgres-data.tar.gz -C /source .
  
  # Backup environment file
  if [ -f "$DEPLOY_DIR/$ENV_FILE" ]; then
    cp $DEPLOY_DIR/$ENV_FILE $BACKUP_DIR/$BACKUP_NAME/
  fi
  
  echo -e "${GREEN}Backup completed: $BACKUP_DIR/$BACKUP_NAME${NC}"
fi

# Clone or update repository
if [ -d "$DEPLOY_DIR/.git" ]; then
  echo -e "${YELLOW}Updating repository...${NC}"
  cd $DEPLOY_DIR
  git fetch --all
  git reset --hard origin/$BRANCH
else
  echo -e "${YELLOW}Cloning repository...${NC}"
  git clone -b $BRANCH $REPO_URL $DEPLOY_DIR
  cd $DEPLOY_DIR
fi

# Check if environment file exists
if [ ! -f "$ENV_FILE" ]; then
  if [ -f "$ENV_FILE.template" ]; then
    echo -e "${YELLOW}Creating environment file from template...${NC}"
    cp $ENV_FILE.template $ENV_FILE
    echo -e "${RED}Please edit $ENV_FILE with your production values${NC}"
    echo -e "${RED}Then run this script again${NC}"
    exit 1
  else
    echo -e "${RED}Environment file $ENV_FILE not found and no template available${NC}"
    exit 1
  fi
fi

# Build and start containers
echo -e "${YELLOW}Building and starting containers...${NC}"
docker-compose -f $COMPOSE_FILE build
docker-compose -f $COMPOSE_FILE up -d

# Wait for services to be ready
echo -e "${YELLOW}Waiting for services to be ready...${NC}"
sleep 10

# Check if services are running
echo -e "${YELLOW}Checking service status...${NC}"
docker-compose -f $COMPOSE_FILE ps

# Setup Nginx if available
if command -v nginx &> /dev/null; then
  echo -e "${YELLOW}Setting up Nginx...${NC}"
  
  # Check if Nginx config exists
  if [ -f "config/nginx/atlas-erp.conf" ]; then
    # Create Nginx config
    cp config/nginx/atlas-erp.conf /etc/nginx/sites-available/atlas-erp
    
    # Enable site if not already enabled
    if [ ! -f "/etc/nginx/sites-enabled/atlas-erp" ]; then
      ln -s /etc/nginx/sites-available/atlas-erp /etc/nginx/sites-enabled/
    fi
    
    # Test Nginx configuration
    nginx -t
    
    # Reload Nginx
    systemctl reload nginx
    
    echo -e "${GREEN}Nginx configured successfully${NC}"
  else
    echo -e "${YELLOW}Nginx configuration not found, skipping...${NC}"
  fi
fi

# Setup SSL with Certbot if available
if command -v certbot &> /dev/null; then
  echo -e "${YELLOW}Do you want to set up SSL with Certbot? (y/n)${NC}"
  read -r setup_ssl
  
  if [ "$setup_ssl" = "y" ]; then
    echo -e "${YELLOW}Enter your domain name:${NC}"
    read -r domain_name
    
    # Update Nginx config with domain name
    sed -i "s/your-domain.com/$domain_name/g" /etc/nginx/sites-available/atlas-erp
    
    # Obtain SSL certificate
    certbot --nginx -d $domain_name
    
    echo -e "${GREEN}SSL certificate obtained successfully${NC}"
  fi
fi

# Print success message
echo -e "${GREEN}=========================================${NC}"
echo -e "${GREEN}   Atlas-ERP deployed successfully!      ${NC}"
echo -e "${GREEN}=========================================${NC}"
echo -e "${YELLOW}Access the application at:${NC}"
echo -e "${YELLOW}http://localhost:3000${NC}"
echo -e "${YELLOW}or your domain if configured${NC}"
echo -e "${GREEN}=========================================${NC}"

# Make the script executable
chmod +x $0
