# Seasonally Simple Deployment Checklist

Use this checklist to ensure all steps are completed before and after deploying the application to Vercel.

## Pre-Deployment Tasks

### 1. Database Setup
- [ ] Create a PostgreSQL database with Neon (https://neon.tech)
- [ ] Create a database named "seasonally_simple"
- [ ] Get connection string in this format: `postgresql://username:password@hostname:port/database?sslmode=require`
- [ ] Enable connection pooling (recommended for production)

### 2. Environment Variables
- [ ] Generate NEXTAUTH_SECRET: `openssl rand -base64 32`
- [ ] Prepare all required environment variables:
  - [ ] DATABASE_URL
  - [ ] NEXTAUTH_SECRET
  - [ ] NEXTAUTH_URL (will be your Vercel deployment URL)
  - [ ] CLAUDE_API_KEY (from Anthropic Console)
  - [ ] CLAUDE_API_URL
  - [ ] GOOGLE_CLIENT_ID (optional)
  - [ ] GOOGLE_CLIENT_SECRET (optional)

### 3. Code Preparation
- [x] Disable development-mode authentication bypass
- [x] Always use PrismaAdapter in all environments
- [x] Enable authentication protection for all routes
- [x] Ensure Claude API service is properly configured for production
- [x] Create Vercel configuration file

## Vercel Deployment

### 1. Create Project
- [ ] Login to Vercel dashboard
- [ ] Create a new project from the GitHub repository
- [ ] Configure build settings:
  - Framework: Next.js
  - Root Directory: ./
  - Build Command: npm run build
  - Output Directory: .next

### 2. Environment Configuration
- [ ] Add all environment variables from step 2 above
- [ ] Set NODE_ENV to "production"

### 3. Deploy
- [ ] Trigger deployment
- [ ] Wait for build and deployment to complete

## Post-Deployment Tasks

### 1. Database Migration
- [ ] Run database migrations:
  ```
  npm run post-deployment
  ```
  or
  ```
  npx prisma migrate deploy
  ```

### 2. Testing
- [ ] Test user registration and login
- [ ] Test recipe generation with Claude API
- [ ] Test all protected routes
- [ ] Test shopping list functionality
- [ ] Test meal planning functionality
- [ ] Verify database operations are working correctly

### 3. Monitoring Setup
- [ ] Set up error monitoring (Sentry or similar)
- [ ] Configure performance monitoring
- [ ] Set up database monitoring

### 4. Custom Domain (Optional)
- [ ] Add a custom domain in Vercel settings
- [ ] Configure DNS records
- [ ] Verify SSL certificate
- [ ] Update NEXTAUTH_URL with custom domain

## Troubleshooting Common Issues

### Database Connection
- Check database connection string format
- Ensure IP is allowed in database firewall
- Verify database credentials

### Authentication
- Check NEXTAUTH_SECRET and NEXTAUTH_URL values
- Ensure session configuration is correct
- Test login flow with multiple providers

### Claude API
- Verify API key is valid
- Check request/response format
- Monitor API usage and rate limits