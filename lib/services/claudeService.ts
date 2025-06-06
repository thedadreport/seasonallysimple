/**
 * Service for interacting with the Claude API for recipe generation
 */

type RecipeGenerationParams = {
  dietaryRestrictions?: string[];
  cookingTime: string;
  season: string;
  servings: number;
  skillLevel: string;
  cuisineType: string;
  specialRequests?: string;
};

export type ClaudeResponse = {
  title: string;
  description: string;
  timings: {
    prep: number;
    cook: number;
    total: number;
  };
  ingredients: {
    amount: string;
    unit: string;
    name: string;
  }[];
  instructions: {
    stepNumber: number;
    text: string;
  }[];
  nutritionInfo: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    fiber: number;
    sodium: number;
  };
  tips: string;
};

export type ClaudeErrorResponse = {
  error: {
    type: string;
    message: string;
  };
};

/**
 * Generates a recipe based on user preferences using Claude API
 */
export async function generateRecipe(params: RecipeGenerationParams): Promise<ClaudeResponse> {
  // Convert cookingTime enum to actual minutes for Claude prompt
  const cookingTimeMap: Record<string, number> = {
    'FIFTEEN_MINUTES_OR_LESS': 15,
    'THIRTY_MINUTES_OR_LESS': 30,
    'UP_TO_1_HOUR': 60,
    'MORE_THAN_1_HOUR': 90
  };
  
  const cookingTimeMinutes = cookingTimeMap[params.cookingTime];
  
  // Convert skill level to user-friendly format for Claude prompt
  const skillLevelMap: Record<string, string> = {
    'BEGINNER': 'beginner',
    'INTERMEDIATE': 'intermediate',
    'ADVANCED': 'advanced'
  };
  
  const skillLevel = skillLevelMap[params.skillLevel];
  
  // Format dietary restrictions for Claude prompt
  const dietaryRestrictions = params.dietaryRestrictions?.join(', ') || 'none';
  
  // Construct the Claude prompts
  const systemPrompt = `You are an expert chef specializing in seasonal, wholesome cooking for families. You create clear, practical recipes that use ingredients at their peak freshness while accommodating dietary needs. Your recipes are well-structured, reliable, and include helpful tips. All measurements are precise and cooking times are accurate.`;
  
  const userPrompt = `Create a complete recipe that meets these requirements:
  
DIETARY NEEDS: ${dietaryRestrictions}
COOKING TIME: ${cookingTimeMinutes} minutes
SEASONAL FOCUS: ${params.season.toLowerCase()}
SERVING SIZE: ${params.servings}
SKILL LEVEL: ${skillLevel}
CUISINE TYPE: ${params.cuisineType}
ADDITIONAL PREFERENCES: ${params.specialRequests || 'none'}

IMPORTANT: Return your response in a strict JSON format with the following fields:
{
  "title": "Recipe title",
  "description": "Brief description of the recipe",
  "timings": {
    "prep": 10, // prep time in minutes
    "cook": 20, // cook time in minutes
    "total": 30 // total time in minutes
  },
  "ingredients": [
    {
      "amount": "1.5",
      "unit": "pounds",
      "name": "ingredient description"
    }
  ],
  "instructions": [
    {
      "stepNumber": 1,
      "text": "First step instructions"
    }
  ],
  "nutritionInfo": {
    "calories": 320,
    "protein": 35,
    "carbs": 10,
    "fat": 16,
    "fiber": 3,
    "sodium": 380
  },
  "tips": "Chef's tips for the recipe"
}

Ensure that your response is only valid JSON with no preamble or additional text outside the JSON structure.`;

  // DEPLOYMENT CHANGE: Only use mock data in development, always use real API in production
  if (process.env.NODE_ENV === 'development' && !process.env.CLAUDE_API_KEY) {
    console.warn('CLAUDE_API_KEY not found in environment variables. Using mock data in development.');
    return getMockRecipe(params);
  }
  
  // In production, throw error if API key is missing
  if (process.env.NODE_ENV === 'production' && !process.env.CLAUDE_API_KEY) {
    throw new Error('Claude API key is required in production environment');
  }
  
  const apiUrl = process.env.CLAUDE_API_URL || 'https://api.anthropic.com/v1/messages';
  const apiKey = process.env.CLAUDE_API_KEY;
  
  if (!apiKey) {
    throw new Error('Claude API key is not configured');
  }
  
  try {
    console.log('Calling Claude API to generate recipe...');
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-7-sonnet-20250219',
        system: systemPrompt,
        messages: [{
          role: 'user',
          content: userPrompt
        }],
        max_tokens: 4000,
        temperature: 0.7
      })
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      console.error('Claude API error:', data);
      throw new Error(data.error?.message || 'Error calling Claude API');
    }
    
    // Extract the recipe JSON from Claude's response
    try {
      const content = data.content?.[0]?.text || '';
      
      // Find JSON in the response (in case Claude adds any explanatory text)
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      
      if (!jsonMatch) {
        throw new Error('No valid JSON found in Claude response');
      }
      
      const recipeJson = jsonMatch[0];
      const recipe = JSON.parse(recipeJson) as ClaudeResponse;
      
      // Validate the recipe structure
      validateRecipeStructure(recipe);
      
      return recipe;
    } catch (parseError) {
      console.error('Error parsing Claude response:', parseError);
      throw new Error('Failed to parse recipe data from Claude response');
    }
  } catch (error) {
    console.error('Error generating recipe with Claude:', error);
    throw error;
  }
}

/**
 * Validates that the parsed recipe has the expected structure
 */
function validateRecipeStructure(recipe: any): void {
  const requiredFields = [
    'title', 
    'description', 
    'timings', 
    'ingredients', 
    'instructions', 
    'nutritionInfo',
    'tips'
  ];
  
  for (const field of requiredFields) {
    if (!recipe[field]) {
      throw new Error(`Missing required field in recipe: ${field}`);
    }
  }
  
  // Validate timings structure
  if (!recipe.timings.prep || !recipe.timings.cook || !recipe.timings.total) {
    throw new Error('Recipe timings are incomplete');
  }
  
  // Validate ingredients array
  if (!Array.isArray(recipe.ingredients) || recipe.ingredients.length === 0) {
    throw new Error('Recipe ingredients must be a non-empty array');
  }
  
  // Validate instructions array
  if (!Array.isArray(recipe.instructions) || recipe.instructions.length === 0) {
    throw new Error('Recipe instructions must be a non-empty array');
  }
}

/**
 * Gets a mock recipe for development/testing purposes
 */
function getMockRecipe(params: RecipeGenerationParams): ClaudeResponse {
  // Choose a different recipe based on cuisine
  if (params.cuisineType === 'Mediterranean') {
    return {
      title: "Mediterranean Lemon Herb Chicken with Spring Vegetables",
      description: "A bright, family-friendly dish featuring tender chicken and seasonal spring vegetables with Mediterranean herbs. This one-pan meal is perfect for busy weeknights while still delivering fresh flavors that celebrate the season.",
      timings: {
        prep: 10,
        cook: 20,
        total: 30
      },
      ingredients: [
        { amount: "1.5", unit: "pounds", name: "boneless, skinless chicken breasts, cut into 1-inch pieces" },
        { amount: "3", unit: "tablespoons", name: "olive oil, divided" },
        { amount: "2", unit: "tablespoons", name: "fresh lemon juice" },
        { amount: "2", unit: "cloves", name: "garlic, minced" },
        { amount: "1", unit: "teaspoon", name: "dried oregano" },
        { amount: "1", unit: "teaspoon", name: "paprika" },
        { amount: "1/2", unit: "teaspoon", name: "salt" },
        { amount: "1/4", unit: "teaspoon", name: "black pepper" },
        { amount: "1", unit: "bunch", name: "asparagus (about 1 pound), tough ends removed, cut into 2-inch pieces" },
        { amount: "1", unit: "cup", name: "cherry tomatoes, halved" },
        { amount: "1", unit: "medium", name: "zucchini, diced into 1/2-inch pieces" },
        { amount: "1/4", unit: "cup", name: "fresh parsley, chopped" },
        { amount: "1", unit: "", name: "lemon, cut into wedges for serving" }
      ],
      instructions: [
        { stepNumber: 1, text: "In a large bowl, combine 2 tablespoons olive oil, lemon juice, garlic, oregano, paprika, salt, and pepper." },
        { stepNumber: 2, text: "Add chicken pieces to the bowl and toss to coat evenly. Let marinate while you prepare the vegetables." },
        { stepNumber: 3, text: "Heat the remaining 1 tablespoon olive oil in a large skillet over medium-high heat." },
        { stepNumber: 4, text: "Add the chicken to the skillet and cook for 5-6 minutes, stirring occasionally, until almost cooked through." },
        { stepNumber: 5, text: "Add the asparagus and zucchini to the skillet and continue cooking for 3-4 minutes until vegetables begin to soften." },
        { stepNumber: 6, text: "Add the cherry tomatoes and cook for an additional 2 minutes, just until they begin to burst." },
        { stepNumber: 7, text: "Remove from heat and sprinkle with fresh parsley." },
        { stepNumber: 8, text: "Serve immediately with lemon wedges on the side." }
      ],
      nutritionInfo: {
        calories: 320,
        protein: 35,
        carbs: 10,
        fat: 16,
        fiber: 3,
        sodium: 380
      },
      tips: "For extra flavor, marinate the chicken for up to 30 minutes before cooking if time allows. This dish pairs well with cooked quinoa or rice for a more filling meal (add 15 minutes to preparation time). Leftovers can be stored in an airtight container in the refrigerator for up to 3 days."
    };
  } else if (params.cuisineType === 'Italian') {
    return {
      title: "Spring Asparagus Risotto",
      description: "A creamy Italian risotto highlighting fresh spring asparagus. This comforting dish balances rich creaminess with the bright flavors of seasonal vegetables.",
      timings: {
        prep: 15,
        cook: 30,
        total: 45
      },
      ingredients: [
        { amount: "6", unit: "cups", name: "vegetable broth" },
        { amount: "2", unit: "tablespoons", name: "olive oil" },
        { amount: "1", unit: "medium", name: "onion, finely diced" },
        { amount: "2", unit: "cloves", name: "garlic, minced" },
        { amount: "1.5", unit: "cups", name: "Arborio rice" },
        { amount: "1/2", unit: "cup", name: "dry white wine" },
        { amount: "1", unit: "bunch", name: "asparagus, woody ends removed, cut into 1-inch pieces" },
        { amount: "1", unit: "cup", name: "fresh or frozen peas" },
        { amount: "1/2", unit: "cup", name: "grated Parmesan cheese" },
        { amount: "2", unit: "tablespoons", name: "butter" },
        { amount: "2", unit: "tablespoons", name: "fresh lemon juice" },
        { amount: "1", unit: "tablespoon", name: "lemon zest" },
        { amount: "1/4", unit: "cup", name: "fresh basil, chopped" },
        { amount: "", unit: "", name: "Salt and pepper to taste" }
      ],
      instructions: [
        { stepNumber: 1, text: "In a saucepan, bring the vegetable broth to a simmer, then keep warm over low heat." },
        { stepNumber: 2, text: "In a large, heavy-bottomed pot, heat olive oil over medium heat. Add onion and cook until translucent, about 3-4 minutes." },
        { stepNumber: 3, text: "Add garlic and cook for 30 seconds until fragrant. Add Arborio rice and stir to coat with oil, toasting for 1-2 minutes." },
        { stepNumber: 4, text: "Pour in white wine and stir until absorbed." },
        { stepNumber: 5, text: "Begin adding warm broth, one ladle at a time, stirring frequently. Wait until each addition is absorbed before adding more." },
        { stepNumber: 6, text: "After about 15 minutes, add the asparagus pieces. Continue adding broth and stirring." },
        { stepNumber: 7, text: "When rice is nearly done (about 5 minutes later), add the peas and cook until rice is creamy but still al dente." },
        { stepNumber: 8, text: "Remove from heat and stir in Parmesan, butter, lemon juice, and zest. Season with salt and pepper to taste." },
        { stepNumber: 9, text: "Let rest for 2 minutes, then serve garnished with fresh basil." }
      ],
      nutritionInfo: {
        calories: 380,
        protein: 10,
        carbs: 52,
        fat: 14,
        fiber: 4,
        sodium: 290
      },
      tips: "For a vegan version, omit the Parmesan and use additional nutritional yeast or vegan cheese. The key to perfect risotto is adding the broth slowly and stirring frequently. Don't rush this process!"
    };
  } else {
    // Default mock recipe for any other cuisine
    return {
      title: `${params.season} ${params.cuisineType} Recipe with Seasonal Ingredients`,
      description: `A delicious ${params.cuisineType} recipe perfect for ${params.season.toLowerCase()} cooking that fits your dietary preferences and skill level.`,
      timings: {
        prep: 15,
        cook: 25,
        total: 40
      },
      ingredients: [
        { amount: "2", unit: "cups", name: "main seasonal ingredient" },
        { amount: "1", unit: "tablespoon", name: `${params.cuisineType} seasoning blend` },
        { amount: "3", unit: "cloves", name: "garlic, minced" },
        { amount: "1/4", unit: "cup", name: "fresh herbs, chopped" },
        { amount: "2", unit: "tablespoons", name: "olive oil" },
        { amount: "1", unit: "teaspoon", name: "salt" },
        { amount: "1/2", unit: "teaspoon", name: "freshly ground black pepper" }
      ],
      instructions: [
        { stepNumber: 1, text: "Prepare all ingredients as listed, washing and chopping as needed." },
        { stepNumber: 2, text: "Heat oil in a large pan over medium heat." },
        { stepNumber: 3, text: "Add garlic and cook until fragrant, about 30 seconds." },
        { stepNumber: 4, text: "Add main ingredients and cook according to their specific requirements." },
        { stepNumber: 5, text: "Season with salt, pepper, and cuisine-specific seasonings." },
        { stepNumber: 6, text: "Finish with fresh herbs and serve immediately." }
      ],
      nutritionInfo: {
        calories: 350,
        protein: 20,
        carbs: 30,
        fat: 15,
        fiber: 5,
        sodium: 300
      },
      tips: "This is a customizable recipe template. Feel free to adjust seasonings and ingredients based on local availability and personal preferences."
    };
  }
}