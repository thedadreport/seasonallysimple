# Seasonally Simple App
## Claude 3.7 Sonnet Prompt Engineering Guide

### Overview

This document provides detailed guidance for engineering effective prompts for Claude 3.7 Sonnet in the context of the Seasonally Simple application. The primary use case is generating high-quality, customized recipes based on user preferences while maintaining consistency and accuracy.

### Claude 3.7 Sonnet Capabilities

Claude 3.7 Sonnet is well-suited for recipe generation due to the following capabilities:

1. **Knowledge of Ingredients and Cooking Techniques**
   - Understanding seasonal ingredients and their flavor profiles
   - Knowledge of cooking methods and food science
   - Awareness of nutrition and dietary restrictions

2. **Reasoning and Adaptation**
   - Ability to balance flavors and textures
   - Capability to adjust recipes based on dietary restrictions
   - Skill at scaling recipes for different serving sizes

3. **Structured Output Format**
   - Consistent, well-organized recipe formatting
   - Clear, logical step-by-step instructions
   - Precise measurements and cooking times

### Core Prompt Architecture

#### System Message

The system message sets the context and persona for Claude's responses. For recipe generation, we establish Claude as an expert chef with a focus on seasonal cooking:

```
You are an expert chef specializing in seasonal, wholesome cooking for families. You create clear, practical recipes that use ingredients at their peak freshness while accommodating dietary needs. Your recipes are well-structured, reliable, and include helpful tips. All measurements are precise and cooking times are accurate.

Focus on creating recipes that:
1. Use ingredients that are seasonal and readily available
2. Are appropriately scaled for the requested serving size
3. Strictly adhere to any dietary restrictions
4. Match the requested difficulty level and time constraints
5. Include practical tips for success and possible variations

Your recipes should be wholesome, nutritionally balanced, and family-friendly while still being flavorful and interesting.
```

#### User Message Template

The user message contains the specific parameters for recipe generation. Using a structured format ensures all necessary information is included:

```
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

### Parameter Definitions

| Parameter | Description | Example Values | Guidance |
|-----------|-------------|----------------|----------|
| dietary_restrictions | User's dietary needs | "gluten-free, dairy-free", "vegetarian", "no nuts" | Pass as comma-separated list. Include both restrictions and preferences. |
| available_time | Total minutes available | "30", "45", "60" | Ensure total time (prep + cook) doesn't exceed this value. |
| current_season | Current or selected season | "spring", "summer", "fall", "winter" | Use to guide seasonal ingredient selection. |
| servings | Number of portions | "2", "4", "6" | Affects ingredient quantities and final yield. |
| skill_level | Cooking expertise level | "beginner", "intermediate", "advanced" | Influences complexity of techniques and ingredients. |
| cuisine_preference | Desired cooking style | "Mediterranean", "Asian", "Mexican" | Guides flavor profiles and cooking methods. |
| special_requests | Additional user preferences | "kid-friendly", "one-pot meal", "using chicken" | Include specific ingredients or constraints. |

### Example Prompt

```
SYSTEM:
You are an expert chef specializing in seasonal, wholesome cooking for families. You create clear, practical recipes that use ingredients at their peak freshness while accommodating dietary needs. Your recipes are well-structured, reliable, and include helpful tips. All measurements are precise and cooking times are accurate.

Focus on creating recipes that:
1. Use ingredients that are seasonal and readily available
2. Are appropriately scaled for the requested serving size
3. Strictly adhere to any dietary restrictions
4. Match the requested difficulty level and time constraints
5. Include practical tips for success and possible variations

Your recipes should be wholesome, nutritionally balanced, and family-friendly while still being flavorful and interesting.

USER:
Create a complete recipe that meets these requirements:

DIETARY NEEDS: gluten-free, dairy-free
COOKING TIME: 30 minutes
SEASONAL FOCUS: spring
SERVING SIZE: 4
SKILL LEVEL: beginner
CUISINE TYPE: Mediterranean
ADDITIONAL PREFERENCES: kid-friendly, using chicken

Please format the recipe with these sections:
1. Title
2. Brief description
3. Prep time, cook time, total time
4. Ingredients with precise measurements
5. Step-by-step instructions
6. Nutritional information (approximate)
7. Chef's tips
```

### Expected Response Format

Claude's response should follow this structured format:

```
# Mediterranean Lemon Herb Chicken with Spring Vegetables

## Description
A bright, family-friendly dish featuring tender chicken and seasonal spring vegetables with Mediterranean herbs. This one-pan meal is perfect for busy weeknights while still delivering fresh flavors that celebrate the season.

## Timing
- Prep time: 10 minutes
- Cook time: 20 minutes
- Total time: 30 minutes

## Ingredients
- 1.5 pounds (680g) boneless, skinless chicken breasts, cut into 1-inch pieces
- 3 tablespoons olive oil, divided
- 2 tablespoons fresh lemon juice
- 2 cloves garlic, minced
- 1 teaspoon dried oregano
- 1 teaspoon paprika
- 1/2 teaspoon salt
- 1/4 teaspoon black pepper
- 1 bunch asparagus (about 1 pound/450g), tough ends removed, cut into 2-inch pieces
- 1 cup (150g) cherry tomatoes, halved
- 1 medium zucchini, diced into 1/2-inch pieces
- 1/4 cup (15g) fresh parsley, chopped
- 1 lemon, cut into wedges for serving

## Instructions
1. In a large bowl, combine 2 tablespoons olive oil, lemon juice, garlic, oregano, paprika, salt, and pepper.
2. Add chicken pieces to the bowl and toss to coat evenly. Let marinate while you prepare the vegetables.
3. Heat the remaining 1 tablespoon olive oil in a large skillet over medium-high heat.
4. Add the chicken to the skillet and cook for 5-6 minutes, stirring occasionally, until almost cooked through.
5. Add the asparagus and zucchini to the skillet and continue cooking for 3-4 minutes until vegetables begin to soften.
6. Add the cherry tomatoes and cook for an additional 2 minutes, just until they begin to burst.
7. Remove from heat and sprinkle with fresh parsley.
8. Serve immediately with lemon wedges on the side.

## Nutritional Information (per serving)
- Calories: 320
- Protein: 35g
- Carbohydrates: 10g
- Fat: 16g
- Fiber: 3g
- Sodium: 380mg

## Chef's Tips
- For extra flavor, marinate the chicken for up to 30 minutes before cooking if time allows.
- This dish pairs well with cooked quinoa or rice for a more filling meal (add 15 minutes to preparation time).
- Leftovers can be stored in an airtight container in the refrigerator for up to 3 days.
- For pickier eaters, you can serve the components separately on the plate.
- Swap asparagus for green beans if preferred, keeping the cooking time the same.
```

### Response Parsing Strategy

To convert Claude's text response into structured data for storage in the database, we implement a parsing function. This function identifies each section and extracts the relevant information:

```javascript
function parseClaudeResponse(response) {
  // Extract title (Heading level 1)
  const title = response.match(/# (.+)/)?.[1]?.trim() || '';
  
  // Extract description (Between ## Description and the next ##)
  const description = response.match(/## Description\s+([\s\S]*?)(?=\s*##|$)/)?.[1]?.trim() || '';
  
  // Extract timing information
  const prepTime = parseInt(response.match(/Prep time: (\d+)/)?.[1] || '0');
  const cookTime = parseInt(response.match(/Cook time: (\d+)/)?.[1] || '0');
  const totalTime = parseInt(response.match(/Total time: (\d+)/)?.[1] || '0');
  
  // Extract ingredients list
  const ingredientsSection = response.match(/## Ingredients\s+([\s\S]*?)(?=\s*##|$)/)?.[1] || '';
  const ingredients = ingredientsSection
    .split('\n')
    .filter(line => line.trim().startsWith('-'))
    .map(line => {
      // Remove leading dash and trim
      const ingredientText = line.replace(/^-\s*/, '').trim();
      
      // Parse amount, unit, and name
      // Format: "1.5 pounds (680g) boneless, skinless chicken breasts"
      const match = ingredientText.match(/^([\d\/\.\s]+)(?:\s+([a-zA-Z]+))?\s+(?:\(.*?\))?\s*(.+)$/);
      
      if (match) {
        return {
          amount: match[1].trim(),
          unit: match[2] || '',
          name: match[3].trim()
        };
      }
      
      // Fallback for ingredients that don't match the pattern
      return {
        amount: '',
        unit: '',
        name: ingredientText
      };
    });
  
  // Extract instructions
  const instructionsSection = response.match(/## Instructions\s+([\s\S]*?)(?=\s*##|$)/)?.[1] || '';
  const instructions = instructionsSection
    .split('\n')
    .filter(line => /^\d+\./.test(line.trim()))
    .map((line, index) => {
      // Remove leading number and period, then trim
      const text = line.replace(/^\d+\.\s*/, '').trim();
      return {
        stepNumber: index + 1,
        text
      };
    });
  
  // Extract nutritional information
  const nutritionSection = response.match(/## Nutritional Information[^#]*?(?=\s*##|$)/)?.[0] || '';
  const nutritionInfo = {
    calories: parseInt(nutritionSection.match(/Calories:\s*(\d+)/)?.[1] || '0'),
    protein: parseInt(nutritionSection.match(/Protein:\s*(\d+)g/)?.[1] || '0'),
    carbs: parseInt(nutritionSection.match(/Carbohydrates:\s*(\d+)g/)?.[1] || '0'),
    fat: parseInt(nutritionSection.match(/Fat:\s*(\d+)g/)?.[1] || '0'),
    fiber: parseInt(nutritionSection.match(/Fiber:\s*(\d+)g/)?.[1] || '0'),
    sodium: parseInt(nutritionSection.match(/Sodium:\s*(\d+)mg/)?.[1] || '0')
  };
  
  // Extract chef's tips
  const tipsSection = response.match(/## Chef's Tips\s+([\s\S]*?)(?=\s*##|$)/)?.[1]?.trim() || '';
  
  // Construct and return the parsed recipe
  return {
    title,
    description,
    timings: {
      prep: prepTime,
      cook: cookTime,
      total: totalTime
    },
    ingredients,
    instructions,
    nutritionInfo,
    tips: tipsSection
  };
}
```

### Prompt Parameter Tuning

#### API Parameters

For optimal recipe generation, we recommend the following Claude API parameter settings:

```json
{
  "model": "claude-3-7-sonnet-20250219",
  "max_tokens": 1500,
  "temperature": 0.7,
  "top_p": 0.9,
  "top_k": 40,
  "anthropic_version": "bedrock-2023-05-31"
}
```

These settings balance creativity with consistency:

- **Temperature (0.7)**: Provides some creative variation while maintaining reliability
- **Max Tokens (1500)**: Sufficient for detailed recipes without excessive verbosity
- **Top_p (0.9) and Top_k (40)**: Balanced settings for diverse language while avoiding unusual outputs

### Seasonal Ingredient Awareness

To enhance Claude's awareness of seasonal ingredients, we can supplement the prompt with seasonal ingredient lists when appropriate:

#### Spring Ingredients Prompt Enhancement

```
When creating spring recipes, prioritize these seasonal ingredients:
- Asparagus
- Artichokes
- Peas
- Strawberries
- Rhubarb
- Spring onions
- Baby spinach
- Fava beans
- Fresh herbs (mint, dill, chives)
- Radishes
```

Similar enhancements can be created for other seasons, and injected into the system prompt when relevant to the user's selection.

### Dietary Restriction Handling

For complex dietary restrictions, we can provide Claude with more detailed guidelines:

#### Gluten-Free Guidelines

```
For gluten-free recipes, strictly avoid:
- Wheat, barley, rye, and triticale
- Regular flour, pasta, couscous, and most bread products
- Many sauces and condiments that may contain wheat as a thickener

Safe alternatives to include:
- Rice, quinoa, millet, buckwheat, and certified gluten-free oats
- Cornstarch, rice flour, almond flour, or coconut flour as thickeners
- Pure spices and herbs (without additives)
- Fresh fruits, vegetables, meat, fish, and dairy
```

#### Dairy-Free Guidelines

```
For dairy-free recipes, strictly avoid:
- Milk, cream, butter, cheese, and yogurt
- Many sauces, dressings, and baked goods containing dairy
- Whey and casein ingredients

Safe alternatives to include:
- Plant-based milks (almond, oat, coconut, soy)
- Coconut cream or cashew cream for creamy textures
- Olive oil, coconut oil, or plant-based butter alternatives
- Nutritional yeast for cheesy flavor
- Coconut yogurt or other plant-based yogurts
```

### Prompt Augmentation Techniques

#### User Profile Integration

To personalize recipes further, we can incorporate user profile data into the prompt:

```
Additional user preferences based on profile:
- Household: Family with young children (ages 5 and 8)
- Cooking skill: Beginner to intermediate
- Kitchen equipment: Standard, has slow cooker and blender
- Frequently cooked proteins: Chicken, tofu
- Favorite cuisines: Mediterranean, Mexican
- Disliked ingredients: Bell peppers, olives
```

#### Previous Recipe Awareness

To avoid repetition for returning users, we can include information about recently generated recipes:

```
Please create a recipe that differs from these recently generated dishes:
1. "Lemon Herb Chicken with Spring Vegetables" (Mediterranean, chicken main)
2. "Spring Vegetable Risotto" (Italian, vegetarian main)
3. "Strawberry Spinach Salad" (American, side dish)

Consider different primary ingredients, cooking techniques, or meal types.
```

### Quality Assurance Checks

To ensure recipe quality and adherence to user requirements, implement these validation checks on Claude's output:

1. **Time Constraints**: Verify that total time (prep + cook) doesn't exceed specified available time
2. **Dietary Compliance**: Check ingredients against restricted items for dietary needs
3. **Instruction Completeness**: Ensure all ingredients mentioned are used in instructions
4. **Nutritional Balance**: Verify protein, carbs, and fats are in reasonable ranges
5. **Seasonal Alignment**: Confirm primary ingredients align with specified season

### Common Issues and Solutions

#### Issue: Recipe Too Complex for Skill Level

**Solution**: Add specific guidance for skill levels:

```
For BEGINNER skill level:
- Limit techniques to basic chopping, mixing, and single-pot cooking
- Avoid specialized equipment or techniques
- Use fewer than 10 ingredients total
- Include extra detail in instructions for potentially unfamiliar steps
```

#### Issue: Unrealistic Cooking Times

**Solution**: Add time constraints with buffers:

```
For a 30-minute total time constraint:
- Prep time should be 10 minutes or less
- Cooking time should be 15 minutes or less
- Include 5 minutes of buffer time for reality
- Avoid techniques requiring marinade time unless specified as separate
```

#### Issue: Inconsistent Measurements

**Solution**: Specify measurement standards:

```
Use these measurement standards:
- Provide both US and metric measurements for all ingredients
- Use specific volume or weight measures (avoid "1 medium onion")
- For small amounts, use teaspoons/tablespoons rather than fractions of cups
- Be precise with cooking times and temperatures
```

### Advanced Prompt Engineering Techniques

#### Technique: Few-Shot Examples

Provide examples of ideal recipes to improve Claude's understanding of the desired format and style:

```
Here's an example of a well-structured recipe in the desired format:

# Quick Lemon Garlic Shrimp with Spring Vegetables

## Description
A bright, fresh seafood dish featuring succulent shrimp and seasonal spring vegetables in a light lemon-garlic sauce. Perfect for a quick weeknight dinner that's both nutritious and flavorful.

## Timing
- Prep time: 10 minutes
- Cook time: 8 minutes
- Total time: 18 minutes

[Rest of example recipe...]

Now create a different recipe following this same format that meets the requirements I specified.
```

#### Technique: Chain-of-Thought Prompting

Guide Claude through reasoning about recipe development:

```
When creating this recipe, please follow this thought process:
1. First, identify the main protein or base ingredient that fits the dietary restrictions and cuisine
2. Next, select 3-4 seasonal vegetables or accompaniments that pair well
3. Then, determine the key spices and aromatics for the selected cuisine
4. Consider cooking techniques appropriate for the skill level and time constraint
5. Plan the step sequence for efficiency within the time constraint
6. Finally, create the complete recipe with all required sections
```

### Prisma Schema Integration

The parsed recipe data maps directly to our database schema:

```javascript
async function saveGeneratedRecipe(parsedRecipe, userId) {
  // Save the recipe to the database using Prisma
  const recipe = await prisma.recipe.create({
    data: {
      title: parsedRecipe.title,
      description: parsedRecipe.description,
      prepTime: parsedRecipe.timings.prep,
      cookTime: parsedRecipe.timings.cook,
      totalTime: parsedRecipe.timings.total,
      servings: 4, // From the original request
      difficulty: 'BEGINNER', // From the original request
      season: 'SPRING', // From the original request
      cuisineType: 'Mediterranean', // From the original request
      dietaryTags: ['gluten-free', 'dairy-free'], // From the original request
      isAIGenerated: true,
      tips: parsedRecipe.tips,
      createdBy: userId,
      
      // Create nested ingredients
      ingredients: {
        create: parsedRecipe.ingredients.map(ingredient => ({
          amount: ingredient.amount,
          unit: ingredient.unit,
          name: ingredient.name
        }))
      },
      
      // Create nested instructions
      instructions: {
        create: parsedRecipe.instructions.map(instruction => ({
          stepNumber: instruction.stepNumber,
          text: instruction.text
        }))
      },
      
      // Create nutritional information
      nutritionInfo: {
        create: {
          calories: parsedRecipe.nutritionInfo.calories,
          protein: parsedRecipe.nutritionInfo.protein,
          carbs: parsedRecipe.nutritionInfo.carbs,
          fat: parsedRecipe.nutritionInfo.fat,
          fiber: parsedRecipe.nutritionInfo.fiber,
          sodium: parsedRecipe.nutritionInfo.sodium
        }
      }
    }
  });
  
  return recipe;
}
```

### Performance Optimization

To optimize API usage and response times:

1. **Caching Similar Requests**
   - Implement fuzzy matching for similar recipe requests
   - Store previously generated recipes with their input parameters
   - Return cached recipes for similar requests (with user permission)

2. **Batch Processing**
   - Pre-generate common recipe combinations during low-traffic periods
   - Create a recipe pool that can be quickly delivered to users

3. **Progressive Loading**
   - Display recipe title and basic info immediately
   - Load full instructions and details progressively

### Claude API Cost Management

Based on current Claude 3.7 Sonnet pricing (as of May 2025):

- Input tokens: ~300 tokens per recipe request (~$0.003)
- Output tokens: ~1000 tokens per recipe response (~$0.025)
- Total cost per recipe: ~$0.028

Cost optimizations:

1. **Prompt Compression**: Minimize system prompt size by removing redundant information
2. **Response Truncation**: Set max_tokens to the minimum needed for complete recipes
3. **Batch Discounts**: Negotiate volume pricing with Anthropic for production usage

### Continuous Improvement System

To continuously improve recipe quality:

1. **Feedback Integration**
   - Collect user ratings and feedback on generated recipes
   - Identify patterns in low-rated recipes
   - Use feedback to refine prompts for problem categories

2. **A/B Testing**
   - Test alternative prompt structures with small user groups
   - Compare engagement metrics across variants
   - Adopt prompts with higher user satisfaction and engagement

3. **Seasonal Updates**
   - Regularly update seasonal ingredient lists
   - Refresh cuisine and cooking trend information
   - Adjust to emerging dietary preferences

### Advanced Recipe Features

These prompt modifications can enable additional recipe features:

#### Substitution Suggestions

```
For each recipe, please include a "Substitutions" section with:
- 2-3 ingredient alternatives for common allergens or hard-to-find items
- Alternative cooking methods if the primary method requires specialized equipment
- Suggestions for making the recipe vegan, gluten-free, or lower-calorie when applicable
```

#### Scaling Logic

```
This recipe should serve 4 people. Please include a "Scaling Notes" section with:
- Clear guidance on how to halve the recipe for 2 servings
- Notes on adjusting cooking times for different quantities
- Any ingredients that don't scale linearly (e.g., spices)
```

#### Wine Pairing

```
If appropriate for the cuisine and dish type, include a brief "Wine Pairing" suggestion that:
- Recommends a specific wine varietal that complements the flavors
- Explains why the pairing works with the dish
- Suggests a non-alcoholic alternative beverage
```

### Conclusion

Effective prompt engineering for Claude 3.7 Sonnet in the Seasonally Simple app involves:

1. Clear, structured prompts that define all requirements
2. Comprehensive parameter validation and error handling
3. Robust parsing to transform text responses into structured data
4. Continuous refinement based on user feedback and performance metrics

By following these guidelines, the application can leverage Claude's capabilities to generate high-quality, personalized recipes that meet users' specific needs and preferences.