# Atlas-ERP Production Deployment Guide

This guide provides instructions for deploying Atlas-ERP to production environments.

## Prerequisites

- Node.js 20.x or later
- Docker and Docker Compose (for containerized deployment)
- Access to a hosting platform (Render, Railway, VPS, etc.)
- Domain name (optional but recommended)

## Deployment Options

Atlas-ERP can be deployed in several ways:

1. **Docker Deployment**: Deploy using Docker and Docker Compose
2. **Platform Deployment**: Deploy to Render, Railway, or similar platforms
3. **VPS Deployment**: Deploy to a Virtual Private Server

## 1. Docker Deployment

### 1.1 Prepare Environment Variables

1. Copy the template environment file:
   ```bash
   cp .env.production.template .env.production
   ```

2. Edit `.env.production` and fill in your production values:
   ```bash
   nano .env.production
   ```

### 1.2 Build and Run with Docker Compose

1. Create a production `docker-compose.yml` file:
   ```yaml
   version: '3.8'
   services:
     app:
       build:
         context: .
         dockerfile: Dockerfile.production
       ports:
         - "3000:3000"
       environment:
         - NODE_ENV=production
         - DOCKER_COMPOSE=true
       env_file:
         - .env.production
       depends_on:
         - surrealdb
         - arangodb
         - minio
         - temporal
       restart: always

     surrealdb:
       image: surrealdb/surrealdb:latest
       ports:
         - "8001:8000"
       volumes:
         - surrealdb_data:/data
       command: start --log trace --user root --pass root file:/data/atlas-erp.db
       healthcheck:
         test: ["CMD", "wget", "--no-verbose", "--tries=1", "--spider", "http://localhost:8000/health"]
         interval: 10s
         timeout: 5s
         retries: 5
       restart: always

     arangodb:
       image: arangodb:3.11
       ports:
         - "8529:8529"
       environment:
         - ARANGO_ROOT_PASSWORD=${ARANGO_ROOT_PASSWORD}
       volumes:
         - arangodb_data:/var/lib/arangodb3
       healthcheck:
         test: ["CMD", "wget", "--no-verbose", "--tries=1", "--spider", "http://localhost:8529/_api/version"]
         interval: 10s
         timeout: 5s
         retries: 5
       restart: always

     minio:
       image: minio/minio:latest
       ports:
         - "9000:9000"
         - "9001:9001"
       environment:
         - MINIO_ROOT_USER=${MINIO_ACCESS_KEY}
         - MINIO_ROOT_PASSWORD=${MINIO_SECRET_KEY}
       volumes:
         - minio_data:/data
       command: server /data --console-address ":9001"
       healthcheck:
         test: ["CMD", "wget", "--no-verbose", "--tries=1", "--spider", "http://localhost:9000/minio/health/live"]
         interval: 10s
         timeout: 5s
         retries: 5
       restart: always

     temporal:
       image: temporalio/auto-setup:1.22.4
       ports:
         - "7233:7233"
         - "8088:8088"
       environment:
         - DB=postgresql
         - DB_PORT=5432
         - POSTGRES_USER=temporal
         - POSTGRES_PWD=temporal
         - POSTGRES_SEEDS=postgres
       depends_on:
         - postgres
       healthcheck:
         test: ["CMD", "wget", "--no-verbose", "--tries=1", "--spider", "http://localhost:7233/health"]
         interval: 10s
         timeout: 5s
         retries: 5
       restart: always

     postgres:
       image: postgres:14
       ports:
         - "5432:5432"
       environment:
         - POSTGRES_USER=temporal
         - POSTGRES_PASSWORD=temporal
       volumes:
         - postgres_data:/var/lib/postgresql/data
       restart: always

   volumes:
     surrealdb_data:
     arangodb_data:
     minio_data:
     postgres_data:
   ```

2. Build and start the containers:
   ```bash
   docker-compose -f docker-compose.yml up -d
   ```

## 2. Platform Deployment (Render, Railway)

### 2.1 Render Deployment

1. Create a new Web Service on Render
2. Connect your GitHub repository
3. Configure the service:
   - **Name**: atlas-erp
   - **Environment**: Node.js
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
   - **Environment Variables**: Add all variables from `.env.production`

### 2.2 Railway Deployment

1. Create a new project on Railway
2. Connect your GitHub repository
3. Add the required services:
   - **Web Service**: Your Next.js app
   - **Database Services**: Add PostgreSQL for Temporal
4. Configure environment variables from `.env.production`

## 3. VPS Deployment

### 3.1 Prepare the Server

1. Update the system:
   ```bash
   sudo apt update && sudo apt upgrade -y
   ```

2. Install Node.js:
   ```bash
   curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
   sudo apt-get install -y nodejs
   ```

3. Install Docker and Docker Compose:
   ```bash
   sudo apt install docker.io docker-compose -y
   sudo systemctl enable docker
   sudo systemctl start docker
   ```

### 3.2 Deploy the Application

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/atlas-erp.git
   cd atlas-erp
   ```

2. Set up environment variables:
   ```bash
   cp .env.production.template .env.production
   nano .env.production
   ```

3. Build and start with Docker Compose:
   ```bash
   docker-compose -f docker-compose.yml up -d
   ```

## 4. Setting Up HTTPS

For production deployments, HTTPS is strongly recommended:

### 4.1 Using Nginx as a Reverse Proxy

1. Install Nginx:
   ```bash
   sudo apt install nginx -y
   ```

2. Configure Nginx:
   ```bash
   sudo nano /etc/nginx/sites-available/atlas-erp
   ```

3. Add the following configuration:
   ```nginx
   server {
       listen 80;
       server_name your-domain.com;
       return 301 https://$host$request_uri;
   }

   server {
       listen 443 ssl;
       server_name your-domain.com;

       ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
       ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;

       location / {
           proxy_pass http://localhost:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

4. Enable the site:
   ```bash
   sudo ln -s /etc/nginx/sites-available/atlas-erp /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl restart nginx
   ```

### 4.2 Setting Up SSL with Let's Encrypt

1. Install Certbot:
   ```bash
   sudo apt install certbot python3-certbot-nginx -y
   ```

2. Obtain SSL certificate:
   ```bash
   sudo certbot --nginx -d your-domain.com
   ```

## 5. Monitoring and Maintenance

### 5.1 Monitoring

1. Set up basic monitoring with PM2:
   ```bash
   npm install -g pm2
   pm2 start npm --name "atlas-erp" -- start
   pm2 save
   pm2 startup
   ```

### 5.2 Backups

1. Set up regular backups for your data volumes:
   ```bash
   # Example backup script for Docker volumes
   docker run --rm -v surrealdb_data:/source -v /path/to/backup:/backup alpine tar -czf /backup/surrealdb_backup_$(date +%Y%m%d).tar.gz -C /source .
   ```

## Troubleshooting

- **Connection Issues**: Ensure all services are running and accessible
- **Database Errors**: Check database logs and connection strings
- **Performance Issues**: Monitor resource usage and scale as needed

## Support

For additional help, refer to the documentation or contact support.
