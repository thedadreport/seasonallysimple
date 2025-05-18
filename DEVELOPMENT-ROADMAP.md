# Seasonally Simple Development Roadmap

## Current Status
- The app has a complete UI with mock data
- Basic pages are implemented (home, recipe browsing, recipe generation, meal planning)
- Authentication with NextAuth is implemented (email/password)
- SQLite database is set up with Prisma for local development

## Completed Tasks
1. ✅ Implement real authentication with NextAuth.js
   - User registration and login
   - Session management
   - Protected routes

## Next Steps

### 2. Connect to PostgreSQL Database for Production ✅
- [x] Set up a PostgreSQL database (Neon)
- [x] Update the Prisma schema to use PostgreSQL
- [x] Create necessary environment variables for database connection
- [x] Create migration scripts
- [x] Test database connection and CRUD operations

### 3. Integrate with Claude 3.7 Sonnet API ✅
- [x] Set up Claude API credentials
- [x] Create an API client service
- [x] Update the recipe generation endpoint to use Claude
- [x] Develop Claude prompting strategy based on user preferences
- [x] Implement response parsing for structured recipe data
- [x] Add error handling and fallbacks

### 4. Implement Token Management System
- [ ] Create a token tracking system
- [ ] Set up user quotas and limits
- [ ] Add token usage monitoring
- [ ] Implement UI components to display token usage

### 5. Add Recipe Saving Functionality ✅
- [x] Create API endpoints for saving/unsaving recipes
- [x] Enable user-uploaded recipes with detailed form
- [x] Update recipe detail page with save button
- [x] Enhance saved recipes page with real data
- [x] Add filtering and sorting options

### 6. Create Shopping List Generation ✅
- [x] Design shopping list data model
- [x] Create endpoints for generating lists from meal plans
- [x] Build UI for viewing and managing shopping lists
- [x] Add export/share functionality

### 7. Implement Subscription Management with Stripe
- [ ] Set up Stripe account and API credentials
- [ ] Create subscription tiers and products
- [ ] Implement payment flow
- [ ] Build subscription management UI
- [ ] Handle webhook events for subscription lifecycle

## Technical Debt and Improvements
- Improve error handling throughout the application
- Add comprehensive input validation
- Implement better loading states
- Add automated testing (unit, integration, E2E)
- Optimize image handling and storage
- Improve accessibility compliance
- Enhance mobile responsiveness
- Set up logging and monitoring

## Environment Setup Instructions
1. Clone the repository
2. Install dependencies: `npm install`
3. Copy `.env.local.example` to `.env.local` and fill in values
4. Run the development server: `npm run dev`
5. Access the app at `http://localhost:3000`

## Database Migrations
- Generate Prisma client: `npx prisma generate`
- Create migration: `npx prisma migrate dev --name [migration-name]`
- Reset database (DEV ONLY): `npx prisma migrate reset --force`

## Authentication Notes
- NextAuth is configured with credentials provider
- Google OAuth is prepared but not yet configured
- Protected routes: `/profile`, `/saved-recipes`, `/settings`
- JWT strategy is used for session management