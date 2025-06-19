# Deployment Guide

This guide covers deployment options for SocialSync, from development to production environments.

## Quick Start Deployment

### Replit Deployment (Recommended for Testing)

1. **Fork to Replit**
   ```bash
   # Import this repository to Replit
   # or fork from existing Replit
   ```

2. **Configure Environment Variables**
   Go to Secrets tab in Replit and add:
   ```
   DATABASE_URL=your_neon_postgres_url
   VAST_API_KEY=your_vast_api_key
   OPENAI_API_KEY=your_openai_key
   SESSION_SECRET=random_secure_string
   ```

3. **Initialize Database**
   ```bash
   npm run db:push
   ```

4. **Start Application**
   ```bash
   npm run dev
   ```

### Production Server Deployment

#### Prerequisites
- Linux server (Ubuntu 20.04+ recommended)
- Node.js 18+
- PostgreSQL 14+
- Domain name with SSL certificate
- Minimum 2GB RAM, 20GB storage

#### Step 1: Server Setup
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PostgreSQL
sudo apt install postgresql postgresql-contrib

# Install PM2 for process management
npm install -g pm2

# Install Nginx for reverse proxy
sudo apt install nginx

# Install SSL certificate (Let's Encrypt)
sudo apt install certbot python3-certbot-nginx
```

#### Step 2: Database Setup
```bash
# Create database user
sudo -u postgres createuser --interactive socialsync

# Create database
sudo -u postgres createdb socialsync

# Set password
sudo -u postgres psql
ALTER USER socialsync PASSWORD 'secure_password';
GRANT ALL PRIVILEGES ON DATABASE socialsync TO socialsync;
\q
```

#### Step 3: Application Deployment
```bash
# Clone repository
git clone <repository-url> /var/www/socialsync
cd /var/www/socialsync

# Install dependencies
npm install

# Create production environment file
sudo nano .env.production
```

Environment file content:
```env
NODE_ENV=production
DATABASE_URL=postgresql://socialsync:secure_password@localhost:5432/socialsync
VAST_API_KEY=your_vast_api_key
OPENAI_API_KEY=your_openai_key
SESSION_SECRET=very_secure_random_string_here
PORT=5000
```

```bash
# Build application
npm run build

# Setup database
npm run db:push

# Start with PM2
pm2 start ecosystem.config.js --env production
pm2 save
pm2 startup
```

#### Step 4: Nginx Configuration
```bash
sudo nano /etc/nginx/sites-available/socialsync
```

Nginx configuration:
```nginx
server {
    listen 80;
    server_name your-domain.com;
    
    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/socialsync /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx

# Setup SSL
sudo certbot --nginx -d your-domain.com
```

## Docker Deployment

### Dockerfile
```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 5000

USER node

CMD ["npm", "start"]
```

### Docker Compose
```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "5000:5000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://socialsync:password@db:5432/socialsync
    depends_on:
      - db
    restart: unless-stopped

  db:
    image: postgres:14
    environment:
      POSTGRES_DB: socialsync
      POSTGRES_USER: socialsync
      POSTGRES_PASSWORD: password
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: unless-stopped

volumes:
  postgres_data:
```

### Deploy with Docker
```bash
# Build and start
docker-compose up -d

# Check logs
docker-compose logs -f

# Stop services
docker-compose down
```

## Environment-Specific Configurations

### Development
```env
NODE_ENV=development
DATABASE_URL=postgresql://localhost:5432/socialsync_dev
DEBUG=socialsync:*
LOG_LEVEL=debug
```

### Staging
```env
NODE_ENV=staging
DATABASE_URL=postgresql://staging-db:5432/socialsync
LOG_LEVEL=info
ENABLE_METRICS=true
```

### Production
```env
NODE_ENV=production
DATABASE_URL=postgresql://prod-db:5432/socialsync
LOG_LEVEL=warn
ENABLE_METRICS=true
RATE_LIMIT_MAX=100
SESSION_TIMEOUT=86400000
```

## Monitoring Setup

### PM2 Monitoring
```bash
# Install PM2 monitoring
pm2 install pm2-server-monit

# View monitoring dashboard
pm2 monit

# Setup log rotation
pm2 install pm2-logrotate
```

### Health Check Endpoint
The application provides health checks at:
- `GET /health` - Basic health check
- `GET /health/detailed` - Detailed system status

### Log Management
```bash
# View application logs
pm2 logs socialsync

# View nginx logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log

# View system logs
journalctl -u socialsync -f
```

## Security Considerations

### Firewall Configuration
```bash
# Enable UFW
sudo ufw enable

# Allow SSH
sudo ufw allow ssh

# Allow HTTP/HTTPS
sudo ufw allow 80
sudo ufw allow 443

# Check status
sudo ufw status
```

### SSL Certificate Renewal
```bash
# Test renewal
sudo certbot renew --dry-run

# Setup automatic renewal
sudo crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet
```

### Database Security
```bash
# Edit PostgreSQL configuration
sudo nano /etc/postgresql/14/main/postgresql.conf

# Set listen_addresses = 'localhost'
# Edit pg_hba.conf for authentication
sudo nano /etc/postgresql/14/main/pg_hba.conf
```

## Backup and Recovery

### Database Backup
```bash
# Create backup script
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
pg_dump socialsync > /backups/socialsync_$DATE.sql
find /backups -name "socialsync_*.sql" -mtime +7 -delete
```

### Application Backup
```bash
# Backup application files
tar -czf /backups/app_$(date +%Y%m%d).tar.gz /var/www/socialsync

# Backup PM2 configuration
pm2 save
cp ~/.pm2/dump.pm2 /backups/pm2_$(date +%Y%m%d).json
```

### Recovery Process
```bash
# Restore database
psql socialsync < /backups/socialsync_YYYYMMDD_HHMMSS.sql

# Restore application
tar -xzf /backups/app_YYYYMMDD.tar.gz -C /

# Restart services
pm2 restart all
sudo systemctl restart nginx
```

## Troubleshooting

### Common Issues

#### Application Won't Start
```bash
# Check logs
pm2 logs socialsync

# Check port availability
sudo netstat -tlnp | grep :5000

# Check environment variables
pm2 show socialsync
```

#### Database Connection Issues
```bash
# Test database connection
psql $DATABASE_URL

# Check PostgreSQL status
sudo systemctl status postgresql

# Review PostgreSQL logs
sudo tail -f /var/log/postgresql/postgresql-14-main.log
```

#### SSL Certificate Issues
```bash
# Check certificate status
sudo certbot certificates

# Test SSL configuration
openssl s_client -connect your-domain.com:443

# Renew certificate manually
sudo certbot renew
```

### Performance Optimization

#### Node.js Optimization
```bash
# Increase Node.js memory limit
export NODE_OPTIONS="--max-old-space-size=4096"

# Enable production optimizations
export NODE_ENV=production
```

#### Database Optimization
```sql
-- Create indexes for better performance
CREATE INDEX idx_vast_servers_status ON vast_servers(status);
CREATE INDEX idx_audit_logs_timestamp ON audit_logs(timestamp);
CREATE INDEX idx_sessions_expire ON sessions(expire);
```

#### Nginx Optimization
```nginx
# Add to nginx configuration
gzip on;
gzip_types text/plain text/css application/json application/javascript;

client_max_body_size 10M;

location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}
```

This deployment guide ensures reliable, secure, and scalable deployment of SocialSync across different environments.