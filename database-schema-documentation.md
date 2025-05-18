# Seasonally Simple App
## Database Schema Documentation

### Overview

This document provides detailed information about the database schema for the Seasonally Simple application. The application uses a relational database (PostgreSQL) with Prisma as the ORM layer. This schema documentation outlines the tables, relationships, and field specifications needed to support the application features.

### Entity Relationship Diagram

```
                      ┌───────────────────┐
                      │      User         │
                      ├───────────────────┤
                      │ id                │
                      │ email             │
                      │ passwordHash      │
                      │ firstName         │
                      │ lastName          │
                      │ createdAt         │
                      │ updatedAt         │
                      └─────────┬─────────┘
                                │
                ┌───────────────┼────────────────┐
                │               │                │
    ┌───────────▼───────┐   ┌───▼──────────┐  ┌──▼───────────────┐
    │   UserProfile     │   │ Subscription │  │  TokenBalance    │
    ├───────────────────┤   ├──────────────┤  ├──────────────────┤
    │ id                │   │ id           │  │ id               │
    │ userId            │   │ userId       │  │ userId           │
    │ dietaryPreferences│   │ tier         │  │ totalBalance     │
    │ householdAdults   │   │ status       │  │ monthlyAllocation│
    │ householdChildren │   │ startDate    │  │ rolloverBalance  │
    │ cuisinePreferences│   │ endDate      │  │ resetDate        │
    │ cookingTimePrefs  │   │ renewalDate  │  └──────────────────┘
    │ skillLevel        │   │ billingPeriod│          │
    └───────────────────┘   └──────────────┘          │
                                                       │
                                           ┌───────────▼────────┐
                                           │ TokenTransaction   │
                                           ├────────────────────┤
                                           │ id                 │
                                           │ userId             │
                                           │ amount             │
                                           │ type               │
                                           │ description        │
                                           │ createdAt          │
                                           │ relatedEntityId    │
                                           │ relatedEntityType  │
                                           └────────────────────┘

     ┌──────────────────┐
     │     Recipe       │
     ├──────────────────┤
     │ id               │
     │ title            │               ┌────────────────┐
     │ description      │               │  Ingredient    │
     │ prepTime         │◄──────────────┤                │
     │ cookTime         │               │ id             │
     │ servings         │               │ recipeId       │
     │ difficulty       │               │ amount         │
     │ season           │               │ unit           │
     │ cuisineType      │               │ name           │
     │ imageUrl         │               └────────────────┘
     │ isAIGenerated    │
     │ createdBy        │               ┌────────────────┐
     │ createdAt        │               │  Instruction   │
     │ updatedAt        │◄──────────────┤                │
     └───────┬──────────┘               │ id             │
             │                          │ recipeId       │
             │                          │ stepNumber     │
             │                          │ text           │
             │                          └────────────────┘
             │
             │                          ┌────────────────┐
             │                          │ NutritionInfo  │
             └─────────────────────────►│                │
                                        │ id             │
                                        │ recipeId       │
                                        │ calories       │
                                        │ protein        │
                                        │ carbs          │
                                        │ fat            │
                                        │ fiber          │
                                        │ sodium         │
                                        └────────────────┘

     ┌──────────────────┐               ┌────────────────┐
     │   SavedRecipe    │               │  MealPlan      │
     ├──────────────────┤               ├────────────────┤
     │ id               │               │ id             │
     │ userId           │               │ userId         │
     │ recipeId         │               │ startDate      │
     │ isFavorite       │               │ endDate        │
     │ personalNotes    │               │ createdAt      │
     │ savedAt          │               │ updatedAt      │
     │ updatedAt        │               └───────┬────────┘
     └──────────────────┘                       │
                                                │
                                       ┌────────▼───────┐
                                       │ MealPlanItem   │
                                       ├────────────────┤
                                       │ id             │
                                       │ mealPlanId     │
                                       │ recipeId       │
                                       │ plannedDate    │
                                       │ mealType       │
                                       │ servings       │
                                       └────────────────┘

     ┌──────────────────┐
     │  ShoppingList    │
     ├──────────────────┤
     │ id               │
     │ userId           │
     │ mealPlanId       │
     │ name             │
     │ createdAt        │
     │ updatedAt        │
     └────────┬─────────┘
              │
              │
     ┌────────▼───────┐
     │ShoppingListItem│
     ├────────────────┤
     │ id             │
     │ shoppingListId │
     │ name           │
     │ quantity       │
     │ unit           │
     │ category       │
     │ checked        │
     │ isCustom       │
     └────────────────┘
```

### Prisma Schema

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id                String              @id @default(uuid()) @db.Uuid
  email             String              @unique
  passwordHash      String
  firstName         String
  lastName          String
  createdAt         DateTime            @default(now())
  updatedAt         DateTime            @default(now()) @updatedAt
  profile           UserProfile?
  subscription      Subscription?
  tokenBalance      TokenBalance?
  tokenTransactions TokenTransaction[]
  savedRecipes      SavedRecipe[]
  mealPlans         MealPlan[]
  shoppingLists     ShoppingList[]
  createdRecipes    Recipe[]            @relation("RecipeCreator")
  refreshTokens     RefreshToken[]
  recipeFeedback    RecipeFeedback[]
  cookedRecipes     CookedRecipe[]
  paymentMethods    PaymentMethod[]
}

model UserProfile {
  id                  String   @id @default(uuid()) @db.Uuid
  userId              String   @unique @db.Uuid
  dietaryPreferences  String[] @default([])
  householdAdults     Int      @default(1)
  householdChildren   Int      @default(0)
  cuisinePreferences  String[] @default([])
  cookingTimeWeekday  CookingTime
  cookingTimeWeekend  CookingTime
  favoriteIngredients String[] @default([])
  avoidIngredients    String[] @default([])
  skillLevel          SkillLevel?
  
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model Subscription {
  id                  String          @id @default(uuid()) @db.Uuid
  userId              String          @unique @db.Uuid
  tier                SubscriptionTier
  status              SubscriptionStatus
  billingPeriod       BillingPeriod
  startDate           DateTime
  currentPeriodEnd    DateTime
  endDate             DateTime?
  autoRenew           Boolean         @default(true)
  price               Decimal         @db.Decimal(10, 2)
  stripeSubscriptionId String?
  stripeCustomerId    String?
  
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model TokenBalance {
  id                     String   @id @default(uuid()) @db.Uuid
  userId                 String   @unique @db.Uuid
  totalBalance           Int      @default(0)
  monthlyAllocation      Int      @default(3)
  rolloverBalance        Int      @default(0)
  tokensUsedThisPeriod   Int      @default(0)
  tokensPurchasedThisPeriod Int   @default(0)
  resetDate              DateTime
  createdAt              DateTime @default(now())
  updatedAt              DateTime @default(now()) @updatedAt
  
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model TokenTransaction {
  id                String            @id @default(uuid()) @db.Uuid
  userId            String            @db.Uuid
  amount            Int
  type              TransactionType
  description       String
  createdAt         DateTime          @default(now())
  relatedEntityId   String?           @db.Uuid
  relatedEntityType String?
  
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@index([createdAt])
  @@index([type])
}

model Recipe {
  id              String            @id @default(uuid()) @db.Uuid
  title           String
  description     String
  prepTime        Int
  cookTime        Int
  totalTime       Int
  servings        Int
  difficulty      RecipeDifficulty
  season          Season
  cuisineType     String
  dietaryTags     String[]
  imageUrl        String?
  isAIGenerated   Boolean           @default(false)
  tips            String?
  createdBy       String?           @db.Uuid
  createdAt       DateTime          @default(now())
  updatedAt       DateTime          @default(now()) @updatedAt
  
  ingredients     Ingredient[]
  instructions    Instruction[]
  nutritionInfo   NutritionInfo?
  savedBy         SavedRecipe[]
  mealPlanItems   MealPlanItem[]
  shoppingListItemRecipes ShoppingListItemRecipe[]
  feedback        RecipeFeedback[]
  cookedInstances CookedRecipe[]
  
  creator User? @relation("RecipeCreator", fields: [createdBy], references: [id], onDelete: SetNull)
  
  @@index([season])
  @@index([difficulty])
  @@index([cuisineType])
  @@index([isAIGenerated])
  @@index([createdAt])
}

model Ingredient {
  id          String    @id @default(uuid()) @db.Uuid
  recipeId    String    @db.Uuid
  amount      String
  unit        String?
  name        String
  
  recipe Recipe @relation(fields: [recipeId], references: [id], onDelete: Cascade)
}

model Instruction {
  id          String    @id @default(uuid()) @db.Uuid
  recipeId    String    @db.Uuid
  stepNumber  Int
  text        String
  
  recipe Recipe @relation(fields: [recipeId], references: [id], onDelete: Cascade)
  
  @@unique([recipeId, stepNumber])
}

model NutritionInfo {
  id          String    @id @default(uuid()) @db.Uuid
  recipeId    String    @unique @db.Uuid
  calories    Int
  protein     Decimal   @db.Decimal(10, 2)
  carbs       Decimal   @db.Decimal(10, 2)
  fat         Decimal   @db.Decimal(10, 2)
  fiber       Decimal?  @db.Decimal(10, 2)
  sodium      Decimal?  @db.Decimal(10, 2)
  
  recipe Recipe @relation(fields: [recipeId], references: [id], onDelete: Cascade)
}

model SavedRecipe {
  id            String    @id @default(uuid()) @db.Uuid
  userId        String    @db.Uuid
  recipeId      String    @db.Uuid
  isFavorite    Boolean   @default(false)
  personalNotes String?
  savedAt       DateTime  @default(now())
  updatedAt     DateTime  @default(now()) @updatedAt
  
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
  recipe Recipe @relation(fields: [recipeId], references: [id], onDelete: Cascade)
  
  @@unique([userId, recipeId])
  @@index([isFavorite])
}

model MealPlan {
  id        String    @id @default(uuid()) @db.Uuid
  userId    String    @db.Uuid
  startDate DateTime
  endDate   DateTime
  createdAt DateTime  @default(now())
  updatedAt DateTime  @default(now()) @updatedAt
  
  meals MealPlanItem[]
  shoppingLists ShoppingList[]
  
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@index([startDate, endDate])
}

model MealPlanItem {
  id          String    @id @default(uuid()) @db.Uuid
  mealPlanId  String    @db.Uuid
  recipeId    String    @db.Uuid
  plannedDate DateTime
  mealType    MealType
  servings    Int
  
  mealPlan MealPlan @relation(fields: [mealPlanId], references: [id], onDelete: Cascade)
  recipe Recipe @relation(fields: [recipeId], references: [id], onDelete: Cascade)
  
  @@index([plannedDate, mealType])
}

model ShoppingList {
  id          String    @id @default(uuid()) @db.Uuid
  userId      String    @db.Uuid
  mealPlanId  String?   @db.Uuid
  name        String
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @default(now()) @updatedAt
  
  items ShoppingListItem[]
  
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
  mealPlan MealPlan? @relation(fields: [mealPlanId], references: [id], onDelete: SetNull)
}

model ShoppingListItem {
  id              String    @id @default(uuid()) @db.Uuid
  shoppingListId  String    @db.Uuid
  name            String
  quantity        String?
  unit            String?
  category        String
  checked         Boolean   @default(false)
  isCustom        Boolean   @default(false)
  
  shoppingList ShoppingList @relation(fields: [shoppingListId], references: [id], onDelete: Cascade)
  recipeConnections ShoppingListItemRecipe[]
  
  @@index([category])
  @@index([checked])
}

model ShoppingListItemRecipe {
  id                 String    @id @default(uuid()) @db.Uuid
  shoppingListItemId String    @db.Uuid
  recipeId           String    @db.Uuid
  
  shoppingListItem ShoppingListItem @relation(fields: [shoppingListItemId], references: [id], onDelete: Cascade)
  recipe Recipe @relation(fields: [recipeId], references: [id], onDelete: Cascade)
  
  @@unique([shoppingListItemId, recipeId])
}

model RecipeFeedback {
  id        String    @id @default(uuid()) @db.Uuid
  userId    String    @db.Uuid
  recipeId  String    @db.Uuid
  rating    Int
  comments  String?
  tags      String[]
  createdAt DateTime  @default(now())
  
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
  recipe Recipe @relation(fields: [recipeId], references: [id], onDelete: Cascade)
  
  @@unique([userId, recipeId])
}

model CookedRecipe {
  id        String    @id @default(uuid()) @db.Uuid
  userId    String    @db.Uuid
  recipeId  String    @db.Uuid
  cookDate  DateTime
  notes     String?
  createdAt DateTime  @default(now())
  
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
  recipe Recipe @relation(fields: [recipeId], references: [id], onDelete: Cascade)
  
  @@index([cookDate])
}

model RefreshToken {
  id        String    @id @default(uuid()) @db.Uuid
  userId    String    @db.Uuid
  token     String    @unique
  expiresAt DateTime
  createdAt DateTime  @default(now())
  revokedAt DateTime?
  
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@index([expiresAt])
}

model PaymentMethod {
  id          String    @id @default(uuid()) @db.Uuid
  userId      String    @db.Uuid
  externalId  String
  type        String
  brand       String
  last4       String?
  expiryMonth Int?
  expiryYear  Int?
  isDefault   Boolean   @default(false)
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @default(now()) @updatedAt
  
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@index([externalId])
  @@index([isDefault])
}

enum CookingTime {
  FIFTEEN_MINUTES_OR_LESS
  THIRTY_MINUTES_OR_LESS
  UP_TO_1_HOUR
  MORE_THAN_1_HOUR
}

enum SkillLevel {
  BEGINNER
  INTERMEDIATE
  ADVANCED
}

enum SubscriptionTier {
  FREE
  BASIC
  PREMIUM
  FAMILY
}

enum SubscriptionStatus {
  ACTIVE
  PAST_DUE
  CANCELLED
  TRIALING
}

enum BillingPeriod {
  MONTHLY
  ANNUAL
}

enum TransactionType {
  SUBSCRIPTION_ALLOCATION
  PURCHASE
  USAGE
  REFERRAL
  BONUS
  EXPIRED
}

enum RecipeDifficulty {
  EASY
  MEDIUM
  HARD
}

enum Season {
  SPRING
  SUMMER
  FALL
  WINTER
  ALL
}

enum MealType {
  BREAKFAST
  LUNCH
  DINNER
  SNACK
}
```

### Database Migration and Seeding

#### Initial Migration Strategy

1. **Base Schema Migration**
   - Create all tables with primary keys and essential columns
   - Add foreign key constraints
   - Configure indexes for performance

2. **Enum Types Migration**
   - Create all required enum types for the database

3. **Constraints and Validation Migration**
   - Add check constraints for data validation
   - Add additional integrity constraints

#### Seeding Strategy

To provide initial data for the application, a seeding script will be implemented with the following data:

1. **Recipe Data**
   - Seasonal recipe collections (~50 per season)
   - Variety of difficulty levels, cooking times, and dietary preferences
   - Complete with ingredients, instructions, and nutrition information

2. **System User**
   - Admin user for system operations
   - Sample user accounts for testing

3. **Subscription Plans**
   - Free, Basic, Premium, and Family tier definitions
   - Token package definitions

#### Migration Scripts

```bash
# Generate migration from Prisma schema
npx prisma migrate dev --name init

# Apply migrations to production (after testing)
npx prisma migrate deploy

# Run database seeding
npx prisma db seed
```

### Performance Considerations

#### Indexes

Key indexes have been configured to optimize query performance for common operations:

1. **User Lookups**
   - Email index for authentication
   - ID indexes for relationship lookups

2. **Recipe Browsing**
   - Season, difficulty, and cuisine indexes for filtering
   - Creation date index for sorting

3. **Meal Planning**
   - Date range indexes for weekly views
   - Meal type and planned date indexes for filtering

4. **Shopping Lists**
   - Category and checked status indexes for filtering and grouping

#### Optimization Strategies

1. **JSON Column Usage**
   - Store complex arrays as JSON for dietary preferences and cuisine preferences
   - Use JSON for storing token transactions for analysis

2. **Selective Preloading**
   - Configure Prisma to selectively load relations based on view needs
   - Implement pagination for recipe browsing and shopping lists

3. **Caching Strategy**
   - Cache frequently accessed recipes and seasonal collections
   - Implement Redis for token balance and subscription data

### Backup and Recovery

#### Backup Strategy

1. **Automated Daily Backups**
   - Full database dumps at low-traffic periods
   - Transaction log backups every hour

2. **Retention Policy**
   - Daily backups retained for 7 days
   - Weekly backups retained for 1 month
   - Monthly backups retained for 1 year

#### Recovery Procedures

1. **Point-in-Time Recovery**
   - Recovery scripts for restoring from full and transaction log backups
   - Testing recovery process monthly

2. **Disaster Recovery**
   - Cross-region replication for high availability
   - Documented recovery procedure with RTO and RPO targets

### Database Security

#### Access Control

1. **User Authentication**
   - Database credentials managed through environment variables
   - Application user with limited privileges
   - Admin user with restricted access

2. **Connection Security**
   - TLS encryption for all database connections
   - IP allowlisting for production database access

#### Data Protection

1. **Sensitive Data Handling**
   - Authentication data (password hashes) secured with bcrypt
   - Payment information referenced only by token ID (actual data stored in Stripe)

2. **Auditing**
   - Transaction logging for sensitive operations
   - User action history for compliance and troubleshooting

### Development Guidelines

#### Database Access Patterns

1. **Repository Pattern**
   - Implement repository interfaces for database operations
   - Centralize data access logic for consistency

2. **Connection Pooling**
   - Configure appropriate connection pool size based on workload
   - Monitor and optimize connection usage

#### Schema Evolution

1. **Change Management**
   - Document schema changes with rationale
   - Version control for migration scripts
   - Testing migrations in development and staging before production

2. **Backward Compatibility**
   - Maintain compatibility during transitions
   - Support rollback plans for migrations

### Appendix: Common Queries

#### User Management

```sql
-- Get user profile with subscription and token balance
SELECT 
  u.*,
  up.*,
  s.*,
  tb.*
FROM "User" u
LEFT JOIN "UserProfile" up ON u.id = up.userId
LEFT JOIN "Subscription" s ON u.id = s.userId
LEFT JOIN "TokenBalance" tb ON u.id = tb.userId
WHERE u.id = '00000000-0000-0000-0000-000000000000';
```

#### Recipe Browsing

```sql
-- Get seasonal recipes with filtering
SELECT r.*
FROM "Recipe" r
WHERE 
  r.season IN ('SPRING', 'ALL')
  AND r.difficulty = 'EASY'
  AND 'vegetarian' = ANY(r.dietaryTags)
  AND r.cookTime <= 30
ORDER BY r.createdAt DESC
LIMIT 20 OFFSET 0;
```

#### Meal Planning

```sql
-- Get meal plan with recipes for a week
SELECT 
  mp.*,
  mpi.*,
  r.*
FROM "MealPlan" mp
JOIN "MealPlanItem" mpi ON mp.id = mpi.mealPlanId
JOIN "Recipe" r ON mpi.recipeId = r.id
WHERE 
  mp.userId = '00000000-0000-0000-0000-000000000000'
  AND mp.startDate <= '2025-05-19'
  AND mp.endDate >= '2025-05-13';
```

#### Shopping List Generation

```sql
-- Generate shopping list from meal plan
SELECT 
  i.name,
  i.amount,
  i.unit,
  r.title as recipe_title
FROM "MealPlanItem" mpi
JOIN "Recipe" r ON mpi.recipeId = r.id
JOIN "Ingredient" i ON r.id = i.recipeId
WHERE 
  mpi.mealPlanId = '00000000-0000-0000-0000-000000000000'
ORDER BY i.name;
```