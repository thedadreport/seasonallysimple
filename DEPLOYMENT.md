# Seasonally Simple Deployment Guide

This guide provides step-by-step instructions for deploying the Seasonally Simple application to production environments.

## Prerequisites

Before deploying, ensure you have:

- A GitHub account with access to the Seasonally Simple repository
- An Anthropic API key for Claude access (register at [Anthropic Console](https://console.anthropic.com))
- Basic familiarity with command line interfaces and web deployment

## Deployment Options

Seasonally Simple can be deployed using several different hosting providers. We recommend the following options:

### Option 1: Vercel (Recommended for Next.js)

Vercel provides the simplest deployment path for Next.js applications with excellent performance and reliability.

1. **Prepare your repository**
   - Ensure all changes are committed and pushed to GitHub

2. **Create a Vercel account**
   - Sign up at [vercel.com](https://vercel.com) using your GitHub account

3. **Create a new project**
   - Click "Add New" > "Project"
   - Select your Seasonally Simple repository
   - Configure the project:
     - Framework Preset: Next.js
     - Root Directory: ./
     - Build Command: `npm run build`
     - Output Directory: .next

4. **Configure environment variables**
   Add the following environment variables in Vercel's project settings:

   ```
   DATABASE_URL=postgresql://username:password@hostname:port/database?sslmode=require
   NEXTAUTH_SECRET=your-generated-secret-key
   NEXTAUTH_URL=https://your-vercel-deployment-url.vercel.app
   CLAUDE_API_KEY=your-anthropic-api-key
   CLAUDE_API_URL=https://api.anthropic.com/v1/messages
   ```

5. **Deploy the application**
   - Click "Deploy"
   - Vercel will build and deploy your application automatically

6. **Run database migrations**
   - In the Vercel dashboard, go to your project
   - Navigate to "Settings" > "Deployments" > "Functions"
   - Use the Web Terminal feature (or local terminal with Vercel CLI):
   ```bash
   npx prisma migrate deploy
   ```

### Option 2: Netlify

Netlify offers another robust option for hosting Next.js applications.

1. **Create a Netlify account**
   - Sign up at [netlify.com](https://netlify.com) using your GitHub account

2. **Import your repository**
   - Click "Add new site" > "Import an existing project"
   - Connect to GitHub and select your repository

3. **Configure build settings**
   - Build command: `npm run build`
   - Publish directory: `.next`

4. **Configure environment variables**
   - Add the same environment variables as listed in the Vercel section

5. **Deploy your site**
   - Click "Deploy site"

6. **Run database migrations**
   - Use Netlify CLI locally to run the migrations:
   ```bash
   netlify login
   netlify env:set DATABASE_URL "your-database-url"
   netlify functions:invoke --name migrate --no-identity
   ```

## Database Setup with Neon

Seasonally Simple uses PostgreSQL for production. We recommend Neon for a managed PostgreSQL service.

1. **Create a Neon account**
   - Sign up at [neon.tech](https://neon.tech)

2. **Create a new project**
   - Name your project "seasonally-simple" (or preferred name)
   - Select the closest region to your users

3. **Create a database**
   - Create a new database named "seasonally_simple"

4. **Get connection string**
   - In the Neon dashboard, find your connection string
   - It will look like: `postgresql://username:password@hostname:port/database?sslmode=require`
   - Save this for your environment variables

5. **Configure connection pooling (optional but recommended)**
   - In the Neon dashboard, enable connection pooling
   - Update your connection string to use the pooling endpoint

## Environment Variables Setup

Create a production-ready `.env.production` file with the following variables:

```
# Database
DATABASE_URL=postgresql://username:password@hostname:port/database?sslmode=require

# Authentication
NEXTAUTH_SECRET=your-generated-secret-key
NEXTAUTH_URL=https://your-production-domain.com

# Claude API
CLAUDE_API_KEY=your-anthropic-api-key
CLAUDE_API_URL=https://api.anthropic.com/v1/messages
```

For `NEXTAUTH_SECRET`, generate a secure random string:
```bash
openssl rand -base64 32
```

## Post-Deployment Steps

After your initial deployment:

1. **Verify all routes and features**
   - Test the entire application flow
   - Ensure API endpoints are working correctly
   - Verify database connections and operations

2. **Set up a custom domain (optional)**
   - In your hosting provider dashboard, add a custom domain
   - Configure DNS settings according to the provider's instructions
   - Ensure SSL is enabled for your custom domain

3. **Set up monitoring (recommended)**
   - Enable basic monitoring through your hosting provider
   - Consider setting up Sentry or similar error tracking

4. **Implement a regular backup strategy**
   - Configure automated database backups
   - Ensure you have a disaster recovery plan

## Testing in the Vercel Environment

To effectively test your application in the Vercel deployment environment before full release:

### Development-Production Parity

1. **Preview Deployments**
   - Every push to a branch creates a unique preview deployment
   - Test features in an environment identical to production
   - Share preview URLs with team members for collaborative testing

2. **Environment Variable Configuration**
   - Set up environment variables for preview deployments
   - Use separate database instances for testing if needed
   - Configure different API keys for development vs. production

### Authentication Testing

1. **Development Mode Override**
   - For testing protected routes without real authentication:
   ```typescript
   // In lib/auth/authOptions.ts
   if (isDevelopmentMode) {
     console.log('DEVELOPMENT MODE: All login credentials accepted');
     return {
       id: `dev-user-${Date.now()}`,
       email: credentials.email as string,
       name: "Development User",
     };
   }
   ```

2. **Selectively Disabling Route Protection**
   - Temporarily disable authentication for specific routes:
   ```typescript
   // In middleware.ts
   const protectedPaths = [
     '/profile',
     '/saved-recipes',
     // Comment out routes for testing
     // '/shopping-list'
   ];
   ```

### Testing Workflow Best Practices

1. **Incremental Testing**
   - Test individual components in isolation
   - Progress to integrated feature testing
   - Finish with end-to-end user flow testing

2. **Database Testing**
   - Use test database instances for preview deployments
   - Run database migrations on test instances
   - Verify data persistence across deployments

3. **Mobile and Responsive Testing**
   - Test on multiple device types using Vercel preview URLs
   - Verify responsive layouts in the actual deployment environment
   - Test touch interactions on real mobile devices

4. **Performance Testing**
   - Use Vercel Analytics to monitor page performance
   - Test load times on different network conditions
   - Verify API response times in the deployed environment

5. **Rollback Strategy**
   - Know how to quickly roll back to previous deployments
   - Test the rollback process before critical releases
   - Document the rollback procedure for emergency situations

## Troubleshooting

**Database Connection Issues**
- Verify your `DATABASE_URL` is correct
- Ensure your IP is allowed in database firewall settings
- Check that your database user has the right permissions

**Authentication Problems**
- Verify `NEXTAUTH_SECRET` and `NEXTAUTH_URL` are correctly set
- Ensure your production URL is configured correctly
- For testing: enable development mode authentication bypass

**TypeScript Build Errors**
- Run `npm run build` locally before pushing to catch type errors
- Ensure proper type definitions, especially for NextAuth and API routes
- Use explicit type assertions when TypeScript inference is ambiguous

**API Failures**
- Check your Claude API key is valid
- Verify request/response format in network logs
- Ensure you have sufficient API quota

## Scaling Considerations

As your user base grows:

1. **Database scaling**
   - Monitor database performance
   - Consider upgrading your Neon plan as needed

2. **API rate limiting**
   - Implement client-side rate limiting for Claude API calls
   - Consider caching frequent recipe requests

3. **Content Delivery Network (CDN)**
   - Both Vercel and Netlify provide built-in CDN capabilities
   - Ensure static assets are properly cached

## Resources

- [Next.js Deployment Documentation](https://nextjs.org/docs/deployment)
- [Prisma Deployment Guide](https://www.prisma.io/docs/guides/deployment)
- [NextAuth.js Production Checklist](https://next-auth.js.org/deployment)
- [Anthropic Claude API Documentation](https://docs.anthropic.com/claude/reference/getting-started-with-the-api)

## Maintenance

Regular maintenance tasks for your production deployment:

1. **Update dependencies**
   - Run `npm outdated` to check for updates
   - Update packages with security vulnerabilities immediately

2. **Monitor error logs**
   - Check hosting provider logs regularly
   - Set up alerts for critical errors

3. **Database maintenance**
   - Run database vacuuming periodically
   - Monitor database size and performance

4. **Backup verification**
   - Regularly verify that backups are working
   - Test backup restoration process periodically