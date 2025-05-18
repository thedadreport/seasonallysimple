# Seasonally Simple App
## Technical Requirements Document

### Project Overview
Seasonally Simple is a web-based application that helps users plan and cook seasonal, wholesome meals for their families. The application leverages Claude 3.7 Sonnet to generate custom recipes based on user preferences, dietary restrictions, and seasonal ingredients. The business model is based on a freemium approach with a token system for AI-generated content.

### Target Platforms
- **Primary**: Web application (responsive design for all devices)
- **Browser Support**: Latest 2 versions of Chrome, Firefox, Safari, Edge
- **Minimum Screen Size**: 320px width (iPhone SE)
- **Recommended Screen Size**: 375px+ (mobile), 768px+ (tablet), 1024px+ (desktop)

### Core Technology Stack
- **Frontend**:
  - Framework: Next.js 14+
  - UI Library: React 18+
  - Styling: Tailwind CSS
  - State Management: React Context API with hooks
  - Data Fetching: React Query
  - Forms: React Hook Form + Zod validation

- **Backend**:
  - API: Node.js with Express
  - Database: PostgreSQL
  - ORM: Prisma
  - Authentication: NextAuth.js
  - File Storage: AWS S3
  - Hosting: Vercel (frontend), Railway or Render (backend)

- **AI Integration**:
  - Claude 3.7 Sonnet API
  - Custom prompt engineering system
  - Token management system

### Key Functional Requirements

#### User Management
1. User registration and authentication
   - Email/password registration
   - Social login (Google, Apple)
   - Email verification
   - Password reset

2. User profiles
   - Dietary preferences/restrictions
   - Household composition (adults/children)
   - Cooking time preferences
   - Cuisine preferences

3. Subscription management
   - Free tier (3 AI generations/month)
   - Basic tier (10 AI generations/month)
   - Premium tier (30 AI generations/month)
   - Family tier (60 AI generations/month)
   - Payment processing (Stripe integration)
   - Token purchase and management

#### Recipe Management
1. Recipe browsing and discovery
   - Seasonal collections
   - Filter by dietary needs, cooking time, cuisine
   - Search functionality
   - Save favorite recipes

2. AI recipe generation
   - Input preferences (cuisine, ingredients, time, etc.)
   - Token deduction system
   - Recipe customization options
   - Save generated recipes

3. Recipe display
   - Ingredients list with measurements
   - Step-by-step instructions
   - Nutritional information
   - Cooking time and servings
   - Difficulty level

#### Meal Planning
1. Weekly meal calendar
   - Add recipes to specific days
   - View week at a glance
   - Modify plan as needed
   - Nutritional balance visualization

2. Shopping list generation
   - Automatic list from meal plan
   - Categorize by department
   - Quantity consolidation
   - Mark items as purchased

### Non-Functional Requirements

#### Performance
- Page load time: < 2 seconds on broadband, < 4 seconds on 3G
- Time to interactive: < 3 seconds on broadband
- API response time: < 500ms for standard requests
- AI generation time: < 15 seconds for recipe generation

#### Security
- HTTPS for all connections
- JWT-based authentication
- CSRF protection
- Input sanitization
- Secure password hashing (bcrypt)
- Rate limiting for API endpoints
- Regular security audits

#### Scalability
- Support for up to 50,000 registered users
- Handle 1,000 concurrent users
- Up to 10,000 AI recipe generations daily
- Database designed for efficient scaling

#### Accessibility
- WCAG 2.1 AA compliance
- Keyboard navigation support
- Screen reader compatibility
- Color contrast ratios (minimum 4.5:1)
- Alternative text for images

### Token System Specifications

#### Token Management
- Tokens represent AI recipe generations
- Each generation consumes one token
- Tokens reset on billing cycle
- Option to purchase additional tokens
- Token transaction history

#### Token Distribution
| Subscription Tier | Monthly Tokens | Price | Additional Token Packs |
|-------------------|----------------|-------|------------------------|
| Free              | 3              | $0    | N/A                    |
| Basic             | 10             | $7.99 | 3 tokens for $0.99     |
| Premium           | 30             | $14.99| 5 tokens for $1.49     |
| Family            | 60             | $24.99| 10 tokens for $2.49    |

#### Token Economy Rules
- Unused tokens roll over (max 2x monthly allocation)
- Referral bonus: Give 3, get 3 tokens
- Welcome bonus: 5 tokens for new paid subscribers
- Retention offer: 5 bonus tokens after 3 months

### AI Integration Requirements

#### Claude 3.7 Sonnet Integration
- API connectivity with error handling and retry logic
- Response validation and formatting
- Caching system for similar requests
- Fallback mechanism for API unavailability

#### Prompt Engineering
- Structured prompts based on user preferences
- Context inclusion for dietary restrictions
- Seasonal ingredient awareness
- Template system for consistent results
- Response parsing and formatting

#### Recipe Generation Parameters
- Cuisine type
- Dietary restrictions
- Available cooking time
- Skill level
- Seasonal preferences
- Household size
- Available ingredients (optional)

### Data Model (Core Entities)

#### User
- id (UUID)
- email (String)
- passwordHash (String)
- firstName (String)
- lastName (String)
- createdAt (DateTime)
- updatedAt (DateTime)
- subscription (Relation to Subscription)
- profile (Relation to Profile)
- recipes (Relation to SavedRecipe)
- mealPlans (Relation to MealPlan)

#### Profile
- id (UUID)
- userId (UUID)
- dietaryPreferences (Array of Strings)
- householdAdults (Integer)
- householdChildren (Integer)
- cookingTimeWeekday (String)
- cookingTimeWeekend (String)
- favoriteIngredients (Array of Strings)
- avoidIngredients (Array of Strings)
- cuisinePreferences (Array of Strings)

#### Subscription
- id (UUID)
- userId (UUID)
- tier (Enum: FREE, BASIC, PREMIUM, FAMILY)
- status (Enum: ACTIVE, CANCELED, PAST_DUE)
- startDate (DateTime)
- endDate (DateTime)
- tokensRemaining (Integer)
- tokensPurchased (Integer)
- tokensRollover (Integer)
- stripeCustomerId (String)
- stripeSubscriptionId (String)

#### Recipe
- id (UUID)
- title (String)
- description (String)
- ingredients (JSON)
- instructions (JSON)
- prepTime (Integer)
- cookTime (Integer)
- totalTime (Integer)
- servings (Integer)
- difficulty (Enum: EASY, MEDIUM, HARD)
- season (Enum: SPRING, SUMMER, FALL, WINTER, ALL)
- cuisineType (String)
- dietaryTags (Array of Strings)
- nutritionInfo (JSON)
- imageUrl (String)
- isAIGenerated (Boolean)
- generatedBy (UUID, nullable)
- createdAt (DateTime)
- popularity (Float)

#### SavedRecipe
- id (UUID)
- userId (UUID)
- recipeId (UUID)
- isFavorite (Boolean)
- personalNotes (String)
- savedAt (DateTime)

#### MealPlan
- id (UUID)
- userId (UUID)
- startDate (DateTime)
- endDate (DateTime)
- meals (Relation to MealPlanItem)
- createdAt (DateTime)
- updatedAt (DateTime)

#### MealPlanItem
- id (UUID)
- mealPlanId (UUID)
- recipeId (UUID)
- plannedDate (DateTime)
- mealType (Enum: BREAKFAST, LUNCH, DINNER, SNACK)
- servings (Integer)

#### ShoppingList
- id (UUID)
- userId (UUID)
- mealPlanId (UUID, nullable)
- name (String)
- createdAt (DateTime)
- updatedAt (DateTime)
- items (Relation to ShoppingListItem)

#### ShoppingListItem
- id (UUID)
- shoppingListId (UUID)
- name (String)
- quantity (String)
- unit (String, nullable)
- category (String)
- checked (Boolean)
- recipeId (UUID, nullable)

### API Endpoints

#### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login existing user
- `POST /api/auth/logout` - Logout user
- `POST /api/auth/reset-password` - Request password reset
- `POST /api/auth/verify-email` - Verify email address

#### User & Profile
- `GET /api/user/me` - Get current user info
- `PUT /api/user/me` - Update user info
- `GET /api/user/profile` - Get user profile
- `PUT /api/user/profile` - Update user profile

#### Subscription & Tokens
- `GET /api/subscription` - Get subscription details
- `POST /api/subscription` - Create/update subscription
- `DELETE /api/subscription` - Cancel subscription
- `GET /api/tokens` - Get token balance
- `POST /api/tokens/purchase` - Purchase additional tokens
- `GET /api/tokens/history` - Get token transaction history

#### Recipes
- `GET /api/recipes` - List recipes (with filters)
- `GET /api/recipes/:id` - Get recipe details
- `POST /api/recipes/generate` - Generate new AI recipe
- `GET /api/recipes/saved` - Get user's saved recipes
- `POST /api/recipes/:id/save` - Save recipe
- `DELETE /api/recipes/:id/save` - Unsave recipe

#### Meal Planning
- `GET /api/meal-plans` - Get user's meal plans
- `POST /api/meal-plans` - Create new meal plan
- `GET /api/meal-plans/:id` - Get meal plan details
- `PUT /api/meal-plans/:id` - Update meal plan
- `DELETE /api/meal-plans/:id` - Delete meal plan
- `POST /api/meal-plans/:id/items` - Add recipe to meal plan
- `DELETE /api/meal-plans/:id/items/:itemId` - Remove recipe from meal plan

#### Shopping
- `GET /api/shopping-lists` - Get user's shopping lists
- `POST /api/shopping-lists` - Create shopping list (manual or from meal plan)
- `GET /api/shopping-lists/:id` - Get shopping list details
- `PUT /api/shopping-lists/:id` - Update shopping list
- `DELETE /api/shopping-lists/:id` - Delete shopping list
- `PUT /api/shopping-lists/:id/items/:itemId` - Update item (e.g., mark as purchased)

### Development & Deployment Guidelines

#### Development Environment
- Node.js v18+
- npm or yarn package manager
- PostgreSQL 14+
- Git version control
- VSCode with recommended extensions
- Environment variables management with dotenv
- ESLint and Prettier for code formatting

#### CI/CD Pipeline
- GitHub Actions for CI/CD
- Automated testing on pull requests
- Linting and type checking
- Deployment to staging on merge to develop
- Deployment to production on merge to main

#### Monitoring & Analytics
- Error tracking with Sentry
- Performance monitoring with New Relic
- User analytics with Mixpanel or Amplitude
- A/B testing capabilities with GrowthBook

#### Database Management
- Migrations managed with Prisma
- Regular backups (daily)
- Seeding scripts for development environments
- Indexing strategy for performance optimization

### Launch Strategy

#### MVP Features for Initial Launch
1. User registration and profile creation
2. Basic recipe browsing and filtering
3. AI recipe generation with token system
4. Simple meal planning functionality
5. Basic shopping list generation
6. Subscription management

#### Beta Testing Phase
- Invite-only beta: 500 users
- Duration: 4 weeks
- Focus on user feedback collection
- Key metrics: usability, token usage, conversion rate
- Bug fixing and performance optimization

#### Public Launch
- Freemium model with promotional tokens
- Referral system activation
- Content marketing campaign
- Food blogger partnerships
- Search engine optimization
- Limited-time launch discount

### Success Metrics

#### User Acquisition
- Target: 10,000 registered users within 6 months
- Conversion rate: 5-10% free to paid
- Customer acquisition cost: $5-15 per free user
- Channel effectiveness tracking

#### Engagement
- DAU/MAU ratio target: >30%
- Average session duration: 7+ minutes
- Weekly active users: >25% of total registered
- AI recipe generations per active user: 3+ monthly

#### Retention
- 30-day retention: >50%
- 90-day retention: >40%
- Annual churn rate target: <25%
- Reactivation campaign effectiveness

#### Revenue
- Average revenue per user: $10-15 monthly
- Lifetime value target: $120+
- Token purchase rate: 15% of paid subscribers
- Renewal rate target: >80%

### Exit Strategy Preparation
- Data collection focused on user preferences and behavior
- Clean, documented code for technical due diligence
- Comprehensive analytics dashboard for business metrics
- Strategic partnerships with potential acquirers
- IP protection for AI prompt engineering system
- Customer testimonials and case studies