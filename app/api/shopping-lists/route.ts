import { NextRequest, NextResponse } from 'next/server';
import { getServerSessionWrapper } from '@/lib/auth/session';
import { authOptions } from '@/lib/auth/authOptions';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

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
      'ricotta', 'sour cream', 'ice cream', 'whipping cream', 'clotted cream', 'ghee'
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

// POST - Create a new shopping list from meal plan
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSessionWrapper();
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const data = await request.json();
    const { mealPlanId, name } = data;
    
    if (!mealPlanId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
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
      return NextResponse.json(
        { error: 'Meal plan not found' },
        { status: 404 }
      );
    }
    
    // Create a new shopping list
    const shoppingList = await prisma.shoppingList.create({
      data: {
        name: name || `Shopping List for ${mealPlan.name}`,
        userId: session.user.id,
        mealPlanId: mealPlanId,
      },
    });
    
    // Extract and consolidate ingredients from the meal plan
    const ingredientsMap = new Map();
    
    // For demo purposes, let's create some mock ingredients since we're using mock data
    // In a real implementation, we would parse the recipe.ingredients JSON string
    const mockIngredients = [
      { name: 'Chicken breast', quantity: '2 lbs', category: 'meat' },
      { name: 'Brown rice', quantity: '1 cup', category: 'grains' },
      { name: 'Broccoli', quantity: '1 head', category: 'produce' },
      { name: 'Olive oil', quantity: '2 tbsp', category: 'pantry' },
      { name: 'Garlic', quantity: '3 cloves', category: 'produce' },
      { name: 'Salt', quantity: '1 tsp', category: 'pantry' },
      { name: 'Black pepper', quantity: '1/2 tsp', category: 'pantry' },
      { name: 'Asparagus', quantity: '1 bunch', category: 'produce' },
      { name: 'Arborio rice', quantity: '1 1/2 cups', category: 'grains' },
      { name: 'Parmesan cheese', quantity: '1/2 cup', category: 'dairy' },
      { name: 'Avocado', quantity: '2', category: 'produce' },
      { name: 'Eggs', quantity: '4', category: 'dairy' },
      { name: 'Bread', quantity: '1 loaf', category: 'grains' },
      { name: 'Spring vegetables', quantity: '2 cups mixed', category: 'produce' },
    ];
    
    // Create shopping list items
    const shoppingListItems = await Promise.all(
      mockIngredients.map(async (ingredient) => {
        return prisma.shoppingListItem.create({
          data: {
            shoppingListId: shoppingList.id,
            name: ingredient.name,
            quantity: ingredient.quantity,
            category: ingredient.category,
          },
        });
      })
    );
    
    return NextResponse.json({
      message: 'Shopping list created successfully',
      shoppingList: {
        ...shoppingList,
        items: shoppingListItems,
      },
    });
    
  } catch (error) {
    console.error('Failed to create shopping list:', error);
    return NextResponse.json(
      { error: 'Failed to create shopping list' },
      { status: 500 }
    );
  }
}

// GET - Get all shopping lists for the current user
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSessionWrapper();
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const shoppingLists = await prisma.shoppingList.findMany({
      where: {
        userId: session.user.id,
      },
      include: {
        mealPlan: true,
        items: {
          orderBy: {
            category: 'asc',
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
    
    return NextResponse.json(shoppingLists);
    
  } catch (error) {
    console.error('Failed to fetch shopping lists:', error);
    return NextResponse.json(
      { error: 'Failed to fetch shopping lists' },
      { status: 500 }
    );
  }
}