# Seasonally Simple
## API Specification Document

### Overview
This document provides a detailed specification for the Seasonally Simple API, which will serve as the backend for the web application. The API follows RESTful principles and uses JSON for data exchange.

### Base URL
- Development: `https://api-dev.seasonallysimple.com/v1`
- Production: `https://api.seasonallysimple.com/v1`

### Authentication
All API requests (except for authentication endpoints) require authentication using JWT (JSON Web Token) bearer tokens.

**Headers**:
```
Authorization: Bearer {access_token}
```

### Rate Limiting
- Free tier: 60 requests per minute
- Paid tiers: 120 requests per minute
- Token generation endpoints have additional constraints based on subscription plan

### Response Formats

#### Success Response Format
```json
{
  "success": true,
  "data": { ... },
  "meta": { ... }
}
```

#### Error Response Format
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": { ... }
  }
}
```

### Common Error Codes
- `UNAUTHORIZED`: Authentication required or token invalid
- `FORBIDDEN`: Authenticated but insufficient permissions
- `NOT_FOUND`: Resource not found
- `VALIDATION_ERROR`: Request validation failed
- `RATE_LIMITED`: Rate limit exceeded
- `INSUFFICIENT_TOKENS`: Not enough tokens for the requested operation
- `SERVER_ERROR`: Internal server error

### API Endpoints

#### Authentication

##### Register User
- **URL**: `/auth/register`
- **Method**: `POST`
- **Request Body**:
  ```json
  {
    "email": "user@example.com",
    "password": "securepassword",
    "firstName": "Jane",
    "lastName": "Smith"
  }
  ```
- **Response**:
  ```json
  {
    "success": true,
    "data": {
      "user": {
        "id": "user_uuid",
        "email": "user@example.com",
        "firstName": "Jane",
        "lastName": "Smith",
        "createdAt": "2025-05-16T10:30:00Z"
      },
      "tokens": {
        "accessToken": "jwt_access_token",
        "refreshToken": "jwt_refresh_token"
      }
    }
  }
  ```

##### Login
- **URL**: `/auth/login`
- **Method**: `POST`
- **Request Body**:
  ```json
  {
    "email": "user@example.com",
    "password": "securepassword"
  }
  ```
- **Response**:
  ```json
  {
    "success": true,
    "data": {
      "user": {
        "id": "user_uuid",
        "email": "user@example.com",
        "firstName": "Jane",
        "lastName": "Smith"
      },
      "tokens": {
        "accessToken": "jwt_access_token",
        "refreshToken": "jwt_refresh_token"
      }
    }
  }
  ```

##### Social Login
- **URL**: `/auth/social/{provider}`
- **Method**: `POST`
- **Supported Providers**: `google`, `apple`
- **Request Body**:
  ```json
  {
    "token": "oauth_token_from_provider"
  }
  ```
- **Response**: Same as regular login

##### Refresh Token
- **URL**: `/auth/refresh`
- **Method**: `POST`
- **Request Body**:
  ```json
  {
    "refreshToken": "jwt_refresh_token"
  }
  ```
- **Response**:
  ```json
  {
    "success": true,
    "data": {
      "accessToken": "new_jwt_access_token",
      "refreshToken": "new_jwt_refresh_token"
    }
  }
  ```

##### Logout
- **URL**: `/auth/logout`
- **Method**: `POST`
- **Request Body**:
  ```json
  {
    "refreshToken": "jwt_refresh_token"
  }
  ```
- **Response**:
  ```json
  {
    "success": true,
    "data": {
      "message": "Successfully logged out"
    }
  }
  ```

#### User Profile

##### Get Current User
- **URL**: `/users/me`
- **Method**: `GET`
- **Response**:
  ```json
  {
    "success": true,
    "data": {
      "id": "user_uuid",
      "email": "user@example.com",
      "firstName": "Jane",
      "lastName": "Smith",
      "createdAt": "2025-05-16T10:30:00Z",
      "profile": {
        "dietaryPreferences": ["gluten-free", "low-dairy"],
        "householdAdults": 2,
        "householdChildren": 2,
        "cuisinePreferences": ["mediterranean", "japanese", "mexican"],
        "cookingTimeWeekday": "30_MINUTES_OR_LESS",
        "cookingTimeWeekend": "UP_TO_1_HOUR"
      },
      "subscription": {
        "tier": "PREMIUM",
        "status": "ACTIVE",
        "startDate": "2025-05-01T00:00:00Z",
        "renewalDate": "2025-06-01T00:00:00Z"
      }
    }
  }
  ```

##### Update User Profile
- **URL**: `/users/profile`
- **Method**: `PUT`
- **Request Body**:
  ```json
  {
    "dietaryPreferences": ["gluten-free", "low-dairy"],
    "householdAdults": 2,
    "householdChildren": 2,
    "cuisinePreferences": ["mediterranean", "japanese", "mexican"],
    "cookingTimeWeekday": "30_MINUTES_OR_LESS", 
    "cookingTimeWeekend": "UP_TO_1_HOUR",
    "favoriteIngredients": ["chicken", "olive oil", "garlic"],
    "avoidIngredients": ["mushrooms", "bell peppers"]
  }
  ```
- **Response**:
  ```json
  {
    "success": true,
    "data": {
      "profile": {
        "dietaryPreferences": ["gluten-free", "low-dairy"],
        "householdAdults": 2,
        "householdChildren": 2,
        "cuisinePreferences": ["mediterranean", "japanese", "mexican"],
        "cookingTimeWeekday": "30_MINUTES_OR_LESS",
        "cookingTimeWeekend": "UP_TO_1_HOUR",
        "favoriteIngredients": ["chicken", "olive oil", "garlic"],
        "avoidIngredients": ["mushrooms", "bell peppers"]
      }
    }
  }
  ```

#### Subscription Management

##### Get Available Subscription Plans
- **URL**: `/subscriptions/plans`
- **Method**: `GET`
- **Response**:
  ```json
  {
    "success": true,
    "data": {
      "plans": [
        {
          "id": "free",
          "name": "Free",
          "description": "Basic access with limited features",
          "monthlyPrice": 0,
          "annualPrice": 0,
          "features": [
            "3 AI recipe generations per month",
            "Basic meal planning",
            "Shopping list generation"
          ],
          "tokenAllocation": 3
        },
        {
          "id": "basic",
          "name": "Basic",
          "description": "Perfect for individual cooks",
          "monthlyPrice": 7.99,
          "annualPrice": 79.99,
          "features": [
            "10 AI recipe generations per month",
            "Advanced meal planning",
            "Shopping list export options",
            "Priority support"
          ],
          "tokenAllocation": 10
        },
        {
          "id": "premium",
          "name": "Premium",
          "description": "Ideal for serious home cooks",
          "monthlyPrice": 14.99,
          "annualPrice": 149.99,
          "features": [
            "30 AI recipe generations per month",
            "Nutritional analysis",
            "Recipe customization",
            "Priority support"
          ],
          "tokenAllocation": 30
        },
        {
          "id": "family",
          "name": "Family",
          "description": "Complete solution for families",
          "monthlyPrice": 24.99,
          "annualPrice": 249.99,
          "features": [
            "60 AI recipe generations per month",
            "All Premium features",
            "Multiple household profiles",
            "Advanced nutritional planning",
            "Priority support"
          ],
          "tokenAllocation": 60
        }
      ],
      "tokenPackages": [
        {
          "id": "basic_3",
          "name": "Basic 3 Pack",
          "tokens": 3,
          "price": 0.99,
          "requiredPlan": "basic"
        },
        {
          "id": "premium_5",
          "name": "Premium 5 Pack",
          "tokens": 5,
          "price": 1.49,
          "requiredPlan": "premium"
        },
        {
          "id": "family_10",
          "name": "Family 10 Pack",
          "tokens": 10,
          "price": 2.49,
          "requiredPlan": "family"
        }
      ]
    }
  }
  ```

##### Get Current Subscription
- **URL**: `/subscriptions/current`
- **Method**: `GET`
- **Response**:
  ```json
  {
    "success": true,
    "data": {
      "id": "subscription_uuid",
      "plan": "premium",
      "status": "ACTIVE",
      "billingPeriod": "MONTHLY",
      "startDate": "2025-05-01T00:00:00Z",
      "currentPeriodEnd": "2025-06-01T00:00:00Z",
      "autoRenew": true,
      "price": 14.99,
      "paymentMethod": {
        "id": "pm_card_visa",
        "type": "card",
        "brand": "visa",
        "last4": "4242",
        "expiryMonth": 12,
        "expiryYear": 2026
      }
    }
  }
  ```

##### Create/Update Subscription
- **URL**: `/subscriptions`
- **Method**: `POST`
- **Request Body**:
  ```json
  {
    "planId": "premium",
    "billingPeriod": "MONTHLY",
    "paymentMethodId": "pm_card_visa"
  }
  ```
- **Response**:
  ```json
  {
    "success": true,
    "data": {
      "id": "subscription_uuid",
      "plan": "premium",
      "status": "ACTIVE",
      "billingPeriod": "MONTHLY",
      "startDate": "2025-05-16T16:50:00Z",
      "currentPeriodEnd": "2025-06-16T16:50:00Z",
      "autoRenew": true,
      "price": 14.99,
      "paymentMethod": {
        "id": "pm_card_visa",
        "type": "card",
        "brand": "visa",
        "last4": "4242",
        "expiryMonth": 12,
        "expiryYear": 2026
      },
      "tokenTransaction": {
        "id": "transaction_uuid",
        "amount": 30,
        "type": "subscription_allocation",
        "description": "Initial token allocation for Premium subscription",
        "createdAt": "2025-05-16T16:50:00Z"
      },
      "receiptUrl": "https://pay.stripe.com/receipts/..."
    }
  }
  ```

##### Cancel Subscription
- **URL**: `/subscriptions/cancel`
- **Method**: `POST`
- **Request Body**:
  ```json
  {
    "reason": "COST",
    "feedback": "Too expensive for my needs"
  }
  ```
- **Response**:
  ```json
  {
    "success": true,
    "data": {
      "id": "subscription_uuid",
      "plan": "premium",
      "status": "CANCELLED",
      "billingPeriod": "MONTHLY",
      "startDate": "2025-05-01T00:00:00Z",
      "currentPeriodEnd": "2025-06-01T00:00:00Z",
      "endDate": "2025-06-01T00:00:00Z",
      "autoRenew": false,
      "message": "Your subscription will remain active until the end of the current billing period."
    }
  }
  ```

##### Add Payment Method
- **URL**: `/payment-methods`
- **Method**: `POST`
- **Request Body**:
  ```json
  {
    "paymentMethodId": "pm_card_visa"
  }
  ```
- **Response**:
  ```json
  {
    "success": true,
    "data": {
      "id": "pm_card_visa",
      "type": "card",
      "brand": "visa",
      "last4": "4242",
      "expiryMonth": 12,
      "expiryYear": 2026,
      "isDefault": true
    }
  }
  ```

##### List Payment Methods
- **URL**: `/payment-methods`
- **Method**: `GET`
- **Response**:
  ```json
  {
    "success": true,
    "data": {
      "paymentMethods": [
        {
          "id": "pm_card_visa",
          "type": "card",
          "brand": "visa",
          "last4": "4242",
          "expiryMonth": 12,
          "expiryYear": 2026,
          "isDefault": true
        },
        {
          "id": "pm_card_mastercard",
          "type": "card",
          "brand": "mastercard",
          "last4": "5555",
          "expiryMonth": 10,
          "expiryYear": 2025,
          "isDefault": false
        }
      ]
    }
  }
  ```

##### Set Default Payment Method
- **URL**: `/payment-methods/{paymentMethodId}/default`
- **Method**: `POST`
- **Response**:
  ```json
  {
    "success": true,
    "data": {
      "id": "pm_card_mastercard",
      "type": "card",
      "brand": "mastercard",
      "last4": "5555",
      "expiryMonth": 10,
      "expiryYear": 2025,
      "isDefault": true
    }
  }
  ```

##### Remove Payment Method
- **URL**: `/payment-methods/{paymentMethodId}`
- **Method**: `DELETE`
- **Response**:
  ```json
  {
    "success": true,
    "data": {
      "message": "Payment method removed successfully"
    }
  }
  ```

#### Analytics & Feedback

##### Submit Recipe Feedback
- **URL**: `/recipes/{recipeId}/feedback`
- **Method**: `POST`
- **Request Body**:
  ```json
  {
    "rating": 4,
    "comments": "Delicious recipe! I had to adjust the cooking time slightly.",
    "tags": ["tasty", "family-approved", "would-make-again"]
  }
  ```
- **Response**:
  ```json
  {
    "success": true,
    "data": {
      "id": "feedback_uuid",
      "recipeId": "recipe_uuid",
      "rating": 4,
      "comments": "Delicious recipe! I had to adjust the cooking time slightly.",
      "tags": ["tasty", "family-approved", "would-make-again"],
      "createdAt": "2025-05-16T17:00:00Z"
    }
  }
  ```

##### Track Recipe Cooked
- **URL**: `/recipes/{recipeId}/cooked`
- **Method**: `POST`
- **Request Body**:
  ```json
  {
    "cookDate": "2025-05-16T00:00:00Z",
    "notes": "Added extra garlic"
  }
  ```
- **Response**:
  ```json
  {
    "success": true,
    "data": {
      "id": "cooked_recipe_uuid",
      "recipeId": "recipe_uuid",
      "cookDate": "2025-05-16T00:00:00Z",
      "notes": "Added extra garlic",
      "createdAt": "2025-05-16T17:05:00Z"
    }
  }
  ```

##### Get Cooked Recipes History
- **URL**: `/recipes/cooked`
- **Method**: `GET`
- **Query Parameters**:
  - `from`: Start date (ISO format)
  - `to`: End date (ISO format)
  - `page`: Page number (default: 1)
  - `limit`: Results per page (default: 20, max: 100)
- **Response**:
  ```json
  {
    "success": true,
    "data": {
      "cookedRecipes": [
        {
          "id": "cooked_recipe_uuid",
          "recipeId": "recipe_uuid",
          "recipe": {
            "title": "Spring Asparagus Risotto",
            "imageUrl": "https://assets.seasonallysimple.com/recipes/spring-asparagus-risotto.jpg"
          },
          "cookDate": "2025-05-16T00:00:00Z",
          "notes": "Added extra garlic",
          "createdAt": "2025-05-16T17:05:00Z"
        },
        // Additional cooked recipes...
      ]
    },
    "meta": {
      "total": 15,
      "page": 1,
      "limit": 20,
      "pages": 1
    }
  }
  ```

##### Submit App Feedback
- **URL**: `/feedback`
- **Method**: `POST`
- **Request Body**:
  ```json
  {
    "rating": 5,
    "category": "FEATURE_REQUEST",
    "message": "I'd love to see a pantry management feature!",
    "email": "user@example.com",
    "allowContact": true
  }
  ```
- **Response**:
  ```json
  {
    "success": true,
    "data": {
      "id": "feedback_uuid",
      "rating": 5,
      "category": "FEATURE_REQUEST",
      "createdAt": "2025-05-16T17:10:00Z",
      "message": "Thank you for your feedback! We've recorded your suggestion."
    }
  }
  ```

#### System

##### Get App Status
- **URL**: `/status`
- **Method**: `GET`
- **Authentication**: Not required
- **Response**:
  ```json
  {
    "success": true,
    "data": {
      "status": "operational",
      "version": "1.0.5",
      "apiVersion": "1.0.2",
      "currentSeason": "SPRING",
      "maintenanceScheduled": false
    }
  }
  ```

##### Get Seasonal Information
- **URL**: `/seasons/current`
- **Method**: `GET`
- **Response**:
  ```json
  {
    "success": true,
    "data": {
      "season": "SPRING",
      "startDate": "2025-03-20T00:00:00Z",
      "endDate": "2025-06-20T23:59:59Z",
      "featuredIngredients": [
        {
          "name": "Asparagus",
          "imageUrl": "https://assets.seasonallysimple.com/ingredients/asparagus.jpg",
          "peak": true,
          "description": "Tender spring asparagus with bright, grassy flavor."
        },
        {
          "name": "Strawberries",
          "imageUrl": "https://assets.seasonallysimple.com/ingredients/strawberries.jpg",
          "peak": true,
          "description": "Sweet, juicy strawberries at the height of their season."
        },
        // Additional ingredients...
      ],
      "featuredCollections": [
        {
          "id": "collection_uuid",
          "title": "Spring Greens",
          "description": "Fresh, vibrant dishes featuring spring's best greens.",
          "imageUrl": "https://assets.seasonallysimple.com/collections/spring-greens.jpg"
        },
        // Additional collections...
      ]
    }
  }
  ```

### Data Types

#### User
```typescript
{
  id: string; // UUID
  email: string;
  firstName: string;
  lastName: string;
  createdAt: string; // ISO date
  updatedAt: string; // ISO date
  profile?: UserProfile;
  subscription?: Subscription;
}
```

#### UserProfile
```typescript
{
  dietaryPreferences: string[]; // e.g. ["gluten-free", "vegetarian"]
  householdAdults: number;
  householdChildren: number;
  cuisinePreferences: string[];
  cookingTimeWeekday: "15_MINUTES_OR_LESS" | "30_MINUTES_OR_LESS" | "UP_TO_1_HOUR" | "MORE_THAN_1_HOUR";
  cookingTimeWeekend: "15_MINUTES_OR_LESS" | "30_MINUTES_OR_LESS" | "UP_TO_1_HOUR" | "MORE_THAN_1_HOUR";
  favoriteIngredients?: string[];
  avoidIngredients?: string[];
  skillLevel?: "BEGINNER" | "INTERMEDIATE" | "ADVANCED";
}
```

#### Recipe
```typescript
{
  id: string; // UUID
  title: string;
  description: string;
  prepTime: number; // minutes
  cookTime: number; // minutes
  totalTime: number; // minutes
  servings: number;
  difficulty: "EASY" | "MEDIUM" | "HARD";
  season: "SPRING" | "SUMMER" | "FALL" | "WINTER" | "ALL";
  cuisineType: string;
  dietaryTags: string[];
  imageUrl: string;
  isAIGenerated: boolean;
  ingredients: Ingredient[];
  instructions: Instruction[];
  nutritionInfo: NutritionInfo;
  tips?: string;
  createdAt?: string; // ISO date
  updatedAt?: string; // ISO date
  createdBy?: string; // User UUID, nullable for system recipes
}
```

#### Ingredient
```typescript
{
  amount: string; // e.g. "1", "1/2"
  unit: string; // e.g. "cup", "tablespoon"
  name: string;
}
```

#### Instruction
```typescript
{
  stepNumber: number;
  text: string;
}
```

#### NutritionInfo
```typescript
{
  calories: number;
  protein: number; // grams
  carbs: number; // grams
  fat: number; // grams
  fiber?: number; // grams
  sodium?: number; // milligrams
}
```

#### SavedRecipe
```typescript
{
  id: string; // UUID
  userId: string; // UUID
  recipeId: string; // UUID
  isFavorite: boolean;
  personalNotes?: string;
  savedAt: string; // ISO date
  updatedAt?: string; // ISO date
}
```

#### MealPlan
```typescript
{
  id: string; // UUID
  userId: string; // UUID
  startDate: string; // ISO date
  endDate: string; // ISO date
  meals: MealPlanItem[];
  createdAt: string; // ISO date
  updatedAt: string; // ISO date
}
```

#### MealPlanItem
```typescript
{
  id: string; // UUID
  mealPlanId: string; // UUID
  recipeId: string; // UUID
  plannedDate: string; // ISO date
  mealType: "BREAKFAST" | "LUNCH" | "DINNER" | "SNACK";
  servings: number;
}
```

#### ShoppingList
```typescript
{
  id: string; // UUID
  userId: string; // UUID
  mealPlanId?: string; // UUID, nullable for manual lists
  name: string;
  items: ShoppingListItem[];
  createdAt: string; // ISO date
  updatedAt: string; // ISO date
}
```

#### ShoppingListItem
```typescript
{
  id: string; // UUID
  shoppingListId: string; // UUID
  name: string;
  quantity?: string;
  unit?: string;
  category: string; // e.g. "Produce", "Dairy", "Pantry"
  checked: boolean;
  recipeIds: string[]; // Array of Recipe UUIDs
  isCustom?: boolean; // true for manually added items
}
```

#### Subscription
```typescript
{
  id: string; // UUID
  userId: string; // UUID
  plan: "free" | "basic" | "premium" | "family";
  status: "ACTIVE" | "PAST_DUE" | "CANCELLED" | "TRIALING";
  billingPeriod: "MONTHLY" | "ANNUAL";
  startDate: string; // ISO date
  currentPeriodEnd: string; // ISO date
  endDate?: string; // ISO date, set when cancelled
  autoRenew: boolean;
  price: number;
  stripeSubscriptionId?: string;
  stripeCustomerId?: string;
}
```

#### TokenBalance
```typescript
{
  totalBalance: number;
  monthlyAllocation: number;
  rolloverBalance: number;
  tokensUsedThisPeriod: number;
  tokensPurchasedThisPeriod: number;
  resetDate: string; // ISO date
}
```

#### TokenTransaction
```typescript
{
  id: string; // UUID
  userId: string; // UUID
  amount: number; // positive for additions, negative for usage
  type: "subscription_allocation" | "purchase" | "usage" | "referral" | "bonus" | "expired";
  description: string;
  createdAt: string; // ISO date
  relatedEntityId?: string; // UUID of related entity (e.g., recipe, purchase)
  relatedEntityType?: string; // Type of related entity
}
```

### Webhook Endpoints

#### Payment Webhook
- **URL**: `/webhooks/payment`
- **Method**: `POST`
- **Authentication**: Stripe signature verification
- **Purpose**: Handles Stripe payment webhooks for subscription events

#### Admin Notification Webhook
- **URL**: `/webhooks/admin-notification`
- **Method**: `POST`
- **Authentication**: API key header
- **Purpose**: Receives administrative notifications for system events

### Implementation Notes

1. **Authentication Strategy**
   - JWT tokens with short-lived access tokens (15 minutes) and long-lived refresh tokens (7 days)
   - Refresh token rotation for security
   - Token blacklisting for logged out refresh tokens

2. **API Versioning**
   - Version prefix in URL path (`/v1/`)
   - Content negotiation with Accept header for future versions

3. **Error Handling**
   - Consistent error format across all endpoints
   - Detailed validation errors for form submissions
   - Appropriate HTTP status codes (400, 401, 403, 404, 429, 500)

4. **Performance Considerations**
   - Response pagination for list endpoints
   - Caching headers for static resources
   - Rate limiting to prevent abuse

5. **Security Measures**
   - HTTPS for all communications
   - CSRF protection for authenticated requests
   - Input validation and sanitization
   - Rate limiting for authentication attempts
   - Secure header configuration

This API specification document serves as a reference for frontend and backend developers to ensure consistent implementation and integration of the Seasonally Simple application.