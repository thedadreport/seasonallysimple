import { NextRequest, NextResponse } from 'next/server';
import { auth } from "@/auth";
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface Params {
  params: {
    id: string;
  };
}

interface Ingredient {
  name: string;
  quantity: string;
  unit?: string | null;
  category: string;
  recipeTitle?: string;
}

// Helper function to categorize ingredients
function categorizeIngredient(name: string): string {
  const categories = {
    produce: [
      'apple', 'banana', 'orange', 'lemon', 'lime', 'grape', 'berry', 'strawberry', 'blueberry',
      'raspberry', 'blackberry', 'melon', 'watermelon', 'cantaloupe', 'honeydew', 'pineapple',
      'kiwi', 'mango', 'papaya', 'peach', 'pear', 'plum', 'cherry', 'olive', 'avocado',
      'tomato', 'potato', 'sweet potato', 'yam', 'carrot', 'celery', 'cucumber', 'zucchini',
      'squash', 'pumpkin', 'eggplant', 'pepper', 'onion', 'garlic', 'ginger', 'shallot', 'leek',
      'broccoli', 'cauliflower', 'cabbage', 'brussels sprout', 'kale', 'spinach', 'lettuce',
      'arugula', 'chard', 'collard', 'mushroom', 'asparagus', 'green bean', 'pea', 'corn',
      'radish', 'turnip', 'beet', 'rutabaga', 'artichoke', 'fennel', 'parsnip', 'herbs',
      'basil', 'cilantro', 'mint', 'parsley', 'rosemary', 'thyme', 'sage', 'oregano', 'dill',
      'chive', 'salad', 'arugula'
    ],
    dairy: [
      'milk', 'cream', 'half-and-half', 'buttermilk', 'yogurt', 'butter', 'cheese', 'cheddar',
      'mozzarella', 'parmesan', 'gouda', 'swiss', 'brie', 'feta', 'cream cheese', 'cottage cheese',
      'ricotta', 'sour cream', 'ice cream', 'whipping cream', 'clotted cream', 'ghee', 'egg'
    ],
    meat: [
      'beef', 'steak', 'ground beef', 'pork', 'ham', 'bacon', 'sausage', 'salami', 'prosciutto',
      'lamb', 'veal', 'chicken', 'turkey', 'duck', 'goose', 'quail', 'pheasant', 'venison',
      'bison', 'filet', 'sirloin', 'rib', 'roast', 'chop', 'loin', 'breast', 'thigh', 'wing',
      'drumstick', 'ground'
    ],
    seafood: [
      'fish', 'salmon', 'tuna', 'trout', 'cod', 'halibut', 'tilapia', 'sardine', 'anchovy',
      'shrimp', 'prawn', 'crab', 'lobster', 'clam', 'mussel', 'oyster', 'scallop', 'squid',
      'octopus', 'caviar'
    ],
    grains: [
      'flour', 'bread', 'roll', 'baguette', 'tortilla', 'pita', 'naan', 'pasta', 'noodle',
      'rice', 'quinoa', 'couscous', 'barley', 'oat', 'oatmeal', 'corn', 'cornmeal', 'grits',
      'polenta', 'cereal', 'granola', 'cracker', 'chip', 'crisp', 'pretzel'
    ],
    pantry: [
      'oil', 'vinegar', 'salt', 'pepper', 'spice', 'herb', 'extract', 'vanilla', 'cinnamon',
      'nutmeg', 'paprika', 'cumin', 'coriander', 'curry', 'chili', 'bay leaf', 'sauce',
      'ketchup', 'mustard', 'mayonnaise', 'soy sauce', 'hot sauce', 'barbecue sauce',
      'salsa', 'jam', 'jelly', 'honey', 'syrup', 'sugar', 'brown sugar', 'powdered sugar',
      'stevia', 'artificial sweetener', 'molasses', 'maple', 'chocolate', 'cocoa', 'coffee',
      'tea', 'juice', 'soda', 'water', 'broth', 'stock', 'wine', 'beer', 'liquor', 'rum',
      'vodka', 'whiskey', 'brandy', 'gin', 'tequila', 'bourbon', 'canned', 'tomato paste',
      'tomato sauce', 'diced tomato', 'bean', 'chickpea', 'lentil', 'tuna', 'soup',
      'baking powder', 'baking soda', 'yeast', 'baking', 'frosting'
    ]
  };

  const lowercaseName = name.toLowerCase();
  
  // Check each category for matching words
  for (const [category, keywords] of Object.entries(categories)) {
    if (keywords.some(keyword => lowercaseName.includes(keyword))) {
      return category;
    }
  }
  
  // Default category if no match is found
  return 'other';
}

// GET - Get all ingredients from a meal plan's recipes
export async function GET(
  request: NextRequest,
  { params }: Params
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const mealPlanId = params.id;
    
    // Validate mealPlanId is a valid UUID
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(mealPlanId)) {
      return NextResponse.json(
        { error: 'Invalid meal plan ID format' },
        { status: 400 }
      );
    }
    
    // Verify the meal plan exists and belongs to the user
    const mealPlan = await prisma.mealPlan.findFirst({
      where: {
        id: mealPlanId,
        userId: session.user.id,
      },
      include: {
        items: {
          include: {
            recipe: true,
          },
        },
      },
    });
    
    if (!mealPlan) {
      console.log(`Meal plan ${mealPlanId} not found for user ${session.user.id}`);
      return NextResponse.json(
        { error: 'Meal plan not found or you do not have access to it' },
        { status: 404 }
      );
    }
    
    console.log(`Found meal plan: ${mealPlan.name} with ${mealPlan.items.length} items`);
    
    // Check if this meal plan has any recipes
    if (mealPlan.items.length === 0) {
      console.log(`Meal plan ${mealPlanId} has no items`);
      return NextResponse.json({ 
        ingredients: [],
        mealPlanName: mealPlan.name,
        error: 'This meal plan has no recipes' 
      });
    }
    
    // Create an array to store all ingredients
    const ingredients: Ingredient[] = [];
    
    // Process each meal plan item to extract ingredients
    for (const item of mealPlan.items) {
      if (!item.recipe) {
        console.log(`Skipping item with no recipe`);
        continue;
      }
      
      try {
        console.log(`Processing recipe ${item.recipe.id}: ${item.recipe.title}`);
        
        // Find all ingredients for this recipe
        const recipeIngredients = await prisma.ingredient.findMany({
          where: {
            recipeId: item.recipe.id,
          },
        });
        
        console.log(`Found ${recipeIngredients.length} ingredients for recipe ${item.recipe.id}`);
        
        // Check if there are no ingredients
        if (recipeIngredients.length === 0) {
          console.log(`No ingredients found for recipe: ${item.recipe.title}`);
          
          // Add a fallback ingredient with the recipe name if no ingredients are found
          ingredients.push({
            name: `${item.recipe.title} (ingredients not specified)`,
            quantity: "1",
            unit: "serving",
            category: "other",
            recipeTitle: item.recipe.title,
          });
          continue;
        }
        
        // Process each ingredient
        for (const ingredient of recipeIngredients) {
          // Skip null or invalid ingredients
          if (!ingredient.name) {
            console.log(`Skipping ingredient with no name for recipe ${item.recipe.id}`);
            continue;
          }
          
          console.log(`Adding ingredient: ${ingredient.name} (${ingredient.amount || '1'} ${ingredient.unit || ''})`);
          ingredients.push({
            name: ingredient.name,
            quantity: ingredient.amount || "1",
            unit: ingredient.unit,
            category: categorizeIngredient(ingredient.name),
            recipeTitle: item.recipe.title,
          });
        }
        
        if (recipeIngredients.length === 0) {
          console.warn(`No ingredients found for recipe ID ${item.recipe.id} (${item.recipe.title}). This is likely a data issue.`);
          
          // Additional debugging to check if the recipe exists in the Ingredient table
          const ingredientCount = await prisma.ingredient.count({
            where: { recipeId: item.recipe.id }
          });
          console.log(`Ingredient count in database for recipe ${item.recipe.id}: ${ingredientCount}`);
        }
      } catch (error) {
        console.error(`Error fetching ingredients for recipe ${item.recipe.id}:`, error);
        // Continue processing other recipes even if one fails
      }
    }
    
    console.log(`Returning ${ingredients.length} ingredients for meal plan ${mealPlanId}`);
    
    // Special case - if no ingredients were found after all processing, provide a clear error
    if (ingredients.length === 0) {
      console.log(`No ingredients found for any recipes in meal plan ${mealPlanId}`);
      return NextResponse.json({
        ingredients: [],
        mealPlanName: mealPlan.name,
        error: 'No ingredients found in any of the recipes in this meal plan',
        mealPlanDetails: {
          id: mealPlan.id,
          recipeCount: mealPlan.items.length,
          startDate: mealPlan.startDate,
          endDate: mealPlan.endDate,
        }
      });
    }
    
    return NextResponse.json({
      ingredients,
      mealPlanName: mealPlan.name,
      mealPlanDetails: {
        id: mealPlan.id,
        recipeCount: mealPlan.items.length,
        startDate: mealPlan.startDate,
        endDate: mealPlan.endDate,
      },
      debug: {
        ingredientCount: ingredients.length,
        recipeIds: mealPlan.items.map(item => item.recipe?.id || 'no-recipe')
      }
    });
    
  } catch (error) {
    console.error('Failed to fetch meal plan ingredients:', error);
    return NextResponse.json(
      { error: 'Failed to fetch meal plan ingredients', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}