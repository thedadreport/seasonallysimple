# Seasonally Simple - Claude Notes

## Project Description
Seasonally Simple is an AI-powered recipe app that uses Claude 3.7 Sonnet to generate personalized recipes based on seasonal ingredients and user preferences.

## Current Development Status
- Added shopping list functionality with database models, API endpoints, and UI
- Modified authentication for easy family testing with mock data
- Created comprehensive deployment guide in DEPLOYMENT.md

## Next Development Tasks
- Deploy application to live environment using instructions in DEPLOYMENT.md
- Restore real authentication after family testing is complete
- Implement user feedback from testing into UI improvements
- Enhance shopping list with additional features (sorting, favorites, etc.)
- Add recipe rating and review functionality
- Improve mobile responsiveness for shopping list interface
- Optimize Claude API usage with caching for common recipes

## Important Commands

### Development
```bash
# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm run start

# Run linting
npm run lint
```

### Prisma Database Commands
```bash
# Generate Prisma client after schema changes
npx prisma generate

# Create a migration
npx prisma migrate dev --name [migration-name]

# Reset database (DEV ONLY - this will clear all data)
npx prisma migrate reset --force

# Open Prisma Studio
npx prisma studio
```

## Code Style Preferences
- Use TypeScript for type safety
- Follow functional component patterns with React hooks
- Use Tailwind CSS for styling
- Prefer async/await over Promise chains
- Use React Query for data fetching
- Component file naming: PascalCase.tsx
- Utility/hook file naming: camelCase.ts
- API route file naming: route.ts in appropriate folders

## Project Structure
- `/app` - Next.js app router pages and components
- `/app/api` - API routes
- `/app/components` - Shared components
- `/lib` - Utility functions and services
- `/prisma` - Database schema and migrations

## Authentication
- Uses NextAuth.js for authentication
- Full email/password registration and login is now implemented
- Google OAuth is configured and ready to use
- Users can create accounts and save their preferences

### Setting Up Google OAuth
To enable Google login:
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Navigate to "APIs & Services" > "Credentials"
4. Click "Create Credentials" and select "OAuth client ID"
5. Select "Web application" as the application type
6. Add the following authorized redirect URI:
   - http://localhost:3000/api/auth/callback/google (for development)
   - https://yourdomain.com/api/auth/callback/google (for production)
7. Copy the Client ID and Client Secret
8. Add them to your .env.local file:
   ```
   GOOGLE_CLIENT_ID="your-google-client-id"
   GOOGLE_CLIENT_SECRET="your-google-client-secret"
   ```

## Database
- PostgreSQL is now configured for both development and production
- Database hosted on Neon (https://neon.tech)
- Connection string format: postgresql://username:password@hostname:port/database?sslmode=require

### PostgreSQL Commands
```bash
# Apply migrations in production
npx prisma migrate deploy

# Create new PostgreSQL migration
DATABASE_URL="postgresql://..." npx prisma migrate dev --name [migration-name]
```

## Claude API Integration
The app uses Claude 3.7 Sonnet for recipe generation. The integration is configured through:

- `/lib/services/claudeService.ts` - Core service for Claude API calls
- `/app/api/recipes/generate/route.ts` - API endpoint that uses the service
- `/CLAUDE-API-SETUP.md` - Detailed setup guide for developers

### Claude API Configuration
To use the Claude API, you need to set the following environment variables:
```
CLAUDE_API_KEY="your-api-key-here"
CLAUDE_API_URL="https://api.anthropic.com/v1/messages"
```

During development without an API key, the app will use mock recipe data automatically.

### Recipe Generation Features
- Personalized recipes based on user preferences
- Support for dietary restrictions
- Season-specific ingredients
- Adjustable cooking time and skill level
- Nutritional information calculation
- Estimated cost per serving
- Detailed step-by-step instructions

## Deployment
A comprehensive deployment guide has been created in DEPLOYMENT.md with:
- Step-by-step instructions for Vercel and Netlify
- Database setup with Neon
- Environment variable configuration
- Post-deployment verification steps
- Troubleshooting common issues
- Scaling and maintenance recommendations