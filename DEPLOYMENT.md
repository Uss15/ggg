# SFEP Evidence Tracking System - Deployment Guide

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Local Development](#local-development)
3. [Docker Deployment](#docker-deployment)
4. [Production Deployment](#production-deployment)
5. [Environment Variables](#environment-variables)
6. [Database Setup](#database-setup)
7. [CI/CD Pipeline](#cicd-pipeline)
8. [Backup & Restore](#backup--restore)
9. [Security Checklist](#security-checklist)

---

## Prerequisites

- Node.js 20+ or Docker
- npm or yarn
- Supabase account (via Lovable Cloud)
- Git

---

## Local Development

### Setup

```bash
# Clone repository
git clone <repository-url>
cd sfep-evidence-tracking

# Install dependencies
npm install

# Configure environment variables
cp .env.example .env
# Edit .env with your Supabase credentials

# Start development server
npm run dev
```

The application will be available at `http://localhost:8080`

### Running Tests

```bash
# Run linter
npm run lint

# Type check
npm run type-check

# Build for production
npm run build
```

---

## Docker Deployment

### Build and Run with Docker

```bash
# Build Docker image
docker build -t sfep-evidence-tracking .

# Run container
docker run -p 3000:80 --env-file .env sfep-evidence-tracking
```

### Docker Compose

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

The application will be available at `http://localhost:3000`

---

## Production Deployment

### Option 1: Vercel

1. Connect your GitHub repository to Vercel
2. Configure environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

### Option 2: AWS (ECS/Fargate)

1. Build and push Docker image to ECR:
```bash
aws ecr get-login-password --region <region> | docker login --username AWS --password-stdin <account-id>.dkr.ecr.<region>.amazonaws.com
docker build -t sfep .
docker tag sfep:latest <account-id>.dkr.ecr.<region>.amazonaws.com/sfep:latest
docker push <account-id>.dkr.ecr.<region>.amazonaws.com/sfep:latest
```

2. Create ECS task definition and service
3. Configure load balancer and auto-scaling

### Option 3: Render

1. Connect GitHub repository
2. Select "Docker" as environment
3. Configure environment variables
4. Deploy

---

## Environment Variables

Required environment variables (automatically configured in Lovable Cloud):

```env
VITE_SUPABASE_URL=<your-supabase-url>
VITE_SUPABASE_PUBLISHABLE_KEY=<your-publishable-key>
VITE_SUPABASE_PROJECT_ID=<your-project-id>
```

Optional:
```env
MAPBOX_PUBLIC_TOKEN=<mapbox-token>
RESEND_API_KEY=<resend-key>
```

---

## Database Setup

### Initial Migration

The database schema is automatically managed through Supabase migrations. All tables, RLS policies, and functions are defined in `supabase/migrations/`.

### Seed Data

To populate demo data:

```sql
-- Create sample users (via Lovable Cloud dashboard)
-- Assign roles via Admin Dashboard after first login

-- Sample offices
INSERT INTO offices (code, name, city) VALUES
  ('SF-01', 'San Francisco Office', 'San Francisco'),
  ('LA-01', 'Los Angeles Office', 'Los Angeles');
```

---

## CI/CD Pipeline

### GitHub Actions

The CI pipeline (`.github/workflows/ci.yml`) runs on every push:

1. **Lint and Test**: ESLint, type checking
2. **Security Scan**: npm audit, Snyk (if configured)
3. **Docker Build**: Builds and caches Docker image

### Manual Deployment

```bash
# Build for production
npm run build

# Preview production build
npm run preview
```

---

## Backup & Restore

### Database Backup (via Lovable Cloud)

1. Navigate to Lovable Cloud backend dashboard
2. Go to Database section
3. Click "Download Backup"
4. Store securely with encryption

### Automated Backups

Configure automated backups through your hosting provider:

- **AWS RDS**: Enable automated backups with point-in-time recovery
- **Supabase**: Daily backups included, configure retention period

### Restore Procedure

```sql
-- Restore from SQL dump
psql -h <host> -U <user> -d <database> -f backup.sql

-- Or use Supabase dashboard restore feature
```

---

## Security Checklist

### Pre-Production

- [ ] Enable HTTPS/TLS 1.3
- [ ] Configure CORS policies
- [ ] Review all RLS policies
- [ ] Enable MFA for admin accounts
- [ ] Set up session timeout (30 minutes)
- [ ] Configure rate limiting
- [ ] Enable audit logging
- [ ] Review API secrets rotation policy
- [ ] Configure CSP headers (via nginx.conf)
- [ ] Enable WAF if using cloud provider

### Post-Deployment

- [ ] Verify SSL certificate
- [ ] Test authentication flows
- [ ] Verify RLS policies work correctly
- [ ] Test offline mode and sync
- [ ] Verify backup restoration
- [ ] Load testing
- [ ] Security penetration testing
- [ ] GDPR compliance review

---

## Monitoring

### Health Checks

- Endpoint: `/health`
- Returns: `200 OK` with "healthy" message

### Logs

```bash
# Docker logs
docker-compose logs -f frontend

# Application logs available in browser console (development)
# Production logs via hosting provider dashboard
```

### Metrics to Monitor

- Response time
- Error rate
- Active sessions
- Failed login attempts
- Database query performance
- Storage usage

---

## Troubleshooting

### Common Issues

**Issue**: Can't connect to database
- Check environment variables
- Verify Supabase project is active
- Check network connectivity

**Issue**: Authentication not working
- Verify email confirmation is enabled (auto-confirm in development)
- Check RLS policies
- Review audit logs

**Issue**: Offline mode not syncing
- Check service worker registration
- Verify network connectivity
- Clear browser cache

---

## Support

For technical support:
- Review documentation in `/docs`
- Check GitHub issues
- Contact: support@sfep.example.com

---

## License

Proprietary - SFEP Evidence Tracking System
