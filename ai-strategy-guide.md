# Seasonally Simple App
## AI Strategy & Implementation Guide

### Overview

This document outlines the strategy for implementing Claude 3.7 Sonnet as the AI engine for the Seasonally Simple app's recipe generation system. It provides technical guidelines, prompt engineering strategies, and token management approaches to create a cost-effective, high-quality AI experience.

### AI Recipe Generation System

#### Core Objectives

1. Generate unique, high-quality recipes that:
   - Match user dietary preferences and restrictions
   - Use seasonally appropriate ingredients
   - Align with specified cooking time
   - Scale correctly for different serving sizes
   - Maintain nutritional balance
   - Include clear, accurate instructions

2. Create a token-based system that:
   - Provides fair value to users
   - Protects the business from excessive API costs
   - Encourages conversion from free to paid tiers
   - Supports ongoing engagement with the platform

### Claude Integration Architecture

#### System Components

1. **Prompt Management Service**
   - Handles template creation and management
   - Maps user inputs to prompt variables
   - Maintains prompt version control
   - A/B tests prompt variations for quality

2. **AI Request Handler**
   - Manages API communication with Claude
   - Implements retry logic and error handling
   - Provides rate limiting and request queuing
   - Monitors and logs API usage and costs

3. **Response Processing Service**
   - Parses Claude's responses into structured data
   - Validates generated content against requirements
   - Formats responses for display in the application
   - Handles edge cases and error states

4. **Token Management System**
   - Tracks user token balances and usage
   - Manages token allocation and depletion
   - Handles token purchase and subscription tiers
   - Provides usage analytics for business intelligence

5. **Recipe Quality Assurance**
   - Validates recipes for completeness and accuracy
   - Checks for realistic measurements and cooking times
   - Ensures adherence to dietary restrictions
   - Flags potentially problematic recipes for review

#### System Architecture Diagram

```
┌─────────────────┐       ┌─────────────────┐
│                 │       │                 │
│  User Interface │◄─────►│  API Gateway    │
│                 │       │                 │
└────────┬────────┘       └────────┬────────┘
         │                         │
         │                         │
┌────────▼────────┐       ┌────────▼────────┐
│                 │       │                 │
│  Token Manager  │◄─────►│  Recipe Service │
│                 │       │                 │
└────────┬────────┘       └────────┬────────┘
         │                         │
         │                         │
         │               ┌─────────▼─────────┐
         │               │                   │
         └──────────────►│  Prompt Manager   │
                         │                   │
                         └─────────┬─────────┘
                                   │
                                   │
                         ┌─────────▼─────────┐
                         │                   │
                         │  Claude 3.7 API   │
                         │                   │
                         └─────────┬─────────┘
                                   │
                                   │
                         ┌─────────▼─────────┐
                         │                   │
                         │ Response Processor│
                         │                   │
                         └───────────────────┘
```

### Prompt Engineering Strategy

#### Prompt Structure

```
SYSTEM:
You are an expert chef specializing in seasonal, wholesome cooking for families. You create clear, practical recipes that use ingredients at their peak freshness while accommodating dietary needs. Your recipes are well-structured, reliable, and include helpful tips. All measurements are precise and cooking times are accurate.

USER:
Create a complete recipe that meets these requirements:

DIETARY NEEDS: {{dietary_restrictions}}
COOKING TIME: {{available_time}} minutes
SEASONAL FOCUS: {{current_season}}
SERVING SIZE: {{servings}}
SKILL LEVEL: {{skill_level}}
CUISINE TYPE: {{cuisine_preference}}
ADDITIONAL PREFERENCES: {{special_requests}}

Please format the recipe with these sections:
1. Title
2. Brief description
3. Prep time, cook time, total time
4. Ingredients with precise measurements
5. Step-by-step instructions
6. Nutritional information (approximate)
7. Chef's tips
```

#### Prompt Parameters

| Parameter | Description | Example Values |
|-----------|-------------|---------------|
| dietary_restrictions | User's dietary needs | "gluten-free, dairy-free", "vegetarian", "no nuts" |
| available_time | Total minutes available | "30", "45", "60" |
| current_season | Current or selected season | "spring", "summer", "fall", "winter" |
| servings | Number of portions | "2", "4", "6" |
| skill_level | Cooking expertise level | "beginner", "intermediate", "advanced" |
| cuisine_preference | Desired cooking style | "Mediterranean", "Asian", "Mexican" |
| special_requests | Additional user preferences | "kid-friendly", "one-pot meal", "using chicken" |

#### Response Format Control

To ensure consistent, structured responses, the prompt includes explicit formatting guidelines. The Claude API will be configured with the following parameters:

```json
{
  "model": "claude-3-7-sonnet-20250219",
  "max_tokens": 1500,
  "temperature": 0.7,
  "top_p": 0.9,
  "top_k": 40,
  "system": "You are an expert chef specializing in seasonal, wholesome cooking...",
  "anthropic_version": "bedrock-2023-05-31"
}
```

#### Response Parsing Logic

The application will parse Claude's responses into structured JSON for storage and display:

```javascript
function parseClaudeResponse(response) {
  const sections = {
    title: extractTitle(response),
    description: extractDescription(response),
    timings: {
      prep: extractPrepTime(response),
      cook: extractCookTime(response),
      total: extractTotalTime(response)
    },
    ingredients: extractIngredients(response),
    instructions: extractInstructions(response),
    nutrition: extractNutrition(response),
    tips: extractTips(response)
  };
  
  validateRecipeStructure(sections);
  
  return sections;
}
```

### Token Management System

#### Token Economy

| Subscription Tier | Monthly Tokens | Price | Cost per Token |
|-------------------|----------------|-------|----------------|
| Free              | 3              | $0    | $0             |
| Basic             | 10             | $7.99 | $0.80          |
| Premium           | 30             | $14.99| $0.50          |
| Family            | 60             | $24.99| $0.42          |

Additional token packs:
- Basic: 3 tokens for $0.99 ($0.33 per token)
- Premium: 5 tokens for $1.49 ($0.30 per token)
- Family: 10 tokens for $2.49 ($0.25 per token)

#### Token Database Schema

```sql
CREATE TABLE user_tokens (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  total_balance INTEGER NOT NULL DEFAULT 0,
  monthly_allocation INTEGER NOT NULL,
  rollover_balance INTEGER NOT NULL DEFAULT 0,
  tokens_used_this_period INTEGER NOT NULL DEFAULT 0,
  tokens_purchased_this_period INTEGER NOT NULL DEFAULT 0,
  reset_date TIMESTAMP NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE token_transactions (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  amount INTEGER NOT NULL,
  type ENUM('subscription_allocation', 'purchase', 'usage', 'referral', 'bonus', 'expired') NOT NULL,
  description TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  related_entity_id UUID,
  related_entity_type TEXT
);
```

#### Token Management Logic

The token system will be implemented with the following core functions:

```javascript
// Check if user has sufficient tokens
async function canGenerateRecipe(userId) {
  const userTokens = await getUserTokenBalance(userId);
  return userTokens.total_balance >= 1;
}

// Deduct token when recipe is generated
async function consumeToken(userId, recipeData) {
  const userTokens = await getUserTokenBalance(userId);
  
  if (userTokens.total_balance < 1) {
    throw new Error('Insufficient tokens');
  }
  
  // Update balance
  await updateUserTokenBalance(userId, userTokens.total_balance - 1);
  
  // Record transaction
  await createTokenTransaction({
    userId,
    amount: -1,
    type: 'usage',
    description: `Generated recipe: "${recipeData.title}"`,
    relatedEntityId: recipeData.id,
    relatedEntityType: 'recipe'
  });
  
  return true;
}

// Monthly token refresh logic
async function refreshMonthlyTokens() {
  const usersToRefresh = await getUsersWithTokenRefreshDue();
  
  for (const user of usersToRefresh) {
    // Calculate rollover (capped at monthly allocation)
    const rolloverTokens = Math.min(
      user.total_balance, 
      user.monthly_allocation
    );
    
    // Record expired tokens if any
    const expiredTokens = Math.max(0, user.total_balance - rolloverTokens);
    if (expiredTokens > 0) {
      await createTokenTransaction({
        userId: user.id,
        amount: -expiredTokens,
        type: 'expired',
        description: 'Monthly token expiration'
      });
    }
    
    // Add new monthly allocation
    await updateUserTokenBalance(
      user.id, 
      rolloverTokens + user.monthly_allocation
    );
    
    // Record allocation transaction
    await createTokenTransaction({
      userId: user.id,
      amount: user.monthly_allocation,
      type: 'subscription_allocation',
      description: 'Monthly token allocation'
    });
    
    // Update next reset date
    await updateNextResetDate(user.id);
  }
}
```

### API Cost Management

#### Cost Analysis

Based on Claude 3.7 Sonnet API pricing:

- Input cost: ~$10 per million tokens
- Output cost: ~$25 per million tokens
- Average tokens per recipe generation:
  - Input: ~300 tokens (~$0.003)
  - Output: ~1000 tokens (~$0.025)
- Total cost per recipe: ~$0.028

With margin calculations:

| Subscription | Monthly Cost | API Cost (max) | Gross Margin |
|--------------|--------------|----------------|--------------|
| Basic (10)   | $7.99        | $0.28          | 96.5%        |
| Premium (30) | $14.99       | $0.84          | 94.4%        |
| Family (60)  | $24.99       | $1.68          | 93.3%        |

#### Cost Optimization Strategies

1. **Prompt Optimization**
   - Streamline system prompts to reduce token count
   - Use parameter templates instead of lengthy descriptions
   - Implement prompt versioning to track token usage changes

2. **Response Optimization**
   - Limit max token output to control costs
   - Cache similar recipe requests
   - Implement fuzzy matching for common recipe types

3. **Usage Limits**
   - Rate limiting for free tier users
   - Implement concurrent request limits
   - Add cooldown periods between generations

4. **Monitoring and Alerting**
   - Real-time cost tracking dashboard
   - Anomaly detection for unusual API usage
   - Budget alerts at 50%, 75%, and 90% of monthly projections

### AI Feature Roadmap

#### Phase 1: Core Recipe Generation

- Basic recipe generation with user preferences
- Simple token management system
- Manual quality review process
- Limited dietary restriction options

#### Phase 2: Enhanced Recipe Intelligence

- Ingredient substitution suggestions
- Scaling recipes up/down with proper adjustments
- Alternative cooking method suggestions
- Expanded dietary preference handling

#### Phase 3: Advanced Personalization

- Learning from user feedback and preferences
- Seasonal ingredient awareness based on location
- Difficulty adaptation based on user skill
- Pantry-based recipe suggestions

#### Phase 4: Meal Planning Intelligence

- Nutritionally balanced weekly meal suggestions
- Leftover ingredient utilization
- Budget-conscious meal planning
- Time-optimized prep suggestions

### Quality Assurance System

#### Automated Recipe Validation

The system will implement automated checks to ensure recipe quality:

```javascript
function validateRecipe(recipe) {
  const validationResults = {
    isValid: true,
    issues: [],
    warnings: []
  };
  
  // Check for reasonable cooking times
  if (recipe.timings.total > recipe.parameters.available_time) {
    validationResults.isValid = false;
    validationResults.issues.push('Total time exceeds requested time');
  }
  
  // Check for ingredient completeness
  if (recipe.ingredients.length < 3) {
    validationResults.isValid = false;
    validationResults.issues.push('Too few ingredients');
  }
  
  // Check for instruction completeness
  if (recipe.instructions.length < 3) {
    validationResults.isValid = false;
    validationResults.issues.push('Instructions incomplete');
  }
  
  // Check for dietary compliance
  if (!checkDietaryCompliance(recipe)) {
    validationResults.isValid = false;
    validationResults.issues.push('Recipe contains restricted ingredients');
  }
  
  // Check for reasonable nutrition values
  if (!checkNutritionValues(recipe)) {
    validationResults.warnings.push('Nutrition values seem unusual');
  }
  
  return validationResults;
}
```

#### Human Review Process

For quality control, a percentage of generated recipes will undergo human review:

1. **Review Selection**
   - 100% of recipes during beta phase
   - 25% of recipes during initial launch
   - 10% of recipes after 3 months
   - 5% ongoing monitoring

2. **Review Criteria**
   - Accuracy of instructions
   - Realistic cooking times
   - Adherence to dietary restrictions
   - Seasonal appropriateness
   - Overall recipe quality

3. **Feedback Loop**
   - Issues identified in review feed back into prompt improvements
   - Problematic patterns trigger automated validation updates
   - Monthly review of quality metrics

### Implementation Roadmap

#### Month 1: Foundation
- Establish basic prompt templates
- Implement token database schema
- Build simple API integration with Claude
- Create basic response parsing

#### Month 2: Core Functionality
- Develop complete token management system
- Implement response validation
- Build recipe storage and retrieval
- Create basic recipe rendering

#### Month 3: Quality Refinement
- Implement advanced prompt optimization
- Build comprehensive validation system
- Develop subscription tier connection
- Create admin monitoring tools

#### Month 4: Launch Preparation
- Conduct extensive testing with sample users
- Optimize API usage and costs
- Implement token purchase flow
- Finalize recipe presentation UI

### Performance Metrics

#### Key AI Metrics to Track

1. **Quality Metrics**
   - Recipe success rate (user reported)
   - Recipe save rate
   - Recipe sharing rate
   - Rating of generated recipes

2. **Technical Metrics**
   - Average generation time
   - Claude API error rate
   - Parsing success rate
   - Validation pass rate

3. **Usage Metrics**
   - Tokens consumed per user
   - Recipe generations per user
   - Popular recipe parameters
   - User token purchase rate

4. **Business Metrics**
   - Cost per recipe generation
   - Margin per subscription tier
   - Conversion rate from free to paid
   - Revenue per AI-generated recipe

### Risk Management

#### Potential Challenges

1. **API Reliability**
   - **Risk**: Claude API downtime or performance issues
   - **Mitigation**: Implement fallback system with caching of popular recipe types
   - **Contingency**: Manual recipe suggestion system during extended outages

2. **Cost Overruns**
   - **Risk**: Higher than anticipated API usage or costs
   - **Mitigation**: Strict token limits and usage monitoring
   - **Contingency**: Adjust subscription pricing or token allocation

3. **Quality Issues**
   - **Risk**: Recipes with errors or impractical instructions
   - **Mitigation**: Comprehensive validation system
   - **Contingency**: Human review process for flagged recipes

4. **User Comprehension**
   - **Risk**: Users don't understand the token system
   - **Mitigation**: Clear onboarding and UI for token management
   - **Contingency**: Simplify system or provide additional onboarding

### Conclusion

This AI strategy provides a comprehensive framework for implementing Claude 3.7 Sonnet as the engine for Seasonally Simple's recipe generation system. By focusing on quality, cost management, and user value, this approach creates a sustainable AI feature that differentiates the product while maintaining strong business margins. The token system both protects the business economics and creates a clear monetization path for the unique AI capabilities of the application.

The phased implementation approach allows for gradual refinement and expansion of AI capabilities, ensuring quality while managing development complexity. By closely monitoring performance metrics and user feedback, the system can continuously improve to better meet user needs and business objectives.