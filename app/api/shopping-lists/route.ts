import { NextRequest, NextResponse } from 'next/server';
import { auth } from "@/auth";
import { withAuth } from '@/lib/auth/apiAuth';
import { PrismaClient, Prisma } from '@prisma/client';
import { z } from 'zod';

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

// Zod schema for shopping list creation
const shoppingListCreateSchema = z.object({
  mealPlanId: z.string().uuid({ message: "Valid mealPlanId is required" }),
  name: z.string().optional(),
});

// Type for recipe ingredient as stored in the database JSON
type RecipeIngredient = {
  amount: string;
  unit: string;
  name: string;
};

// Normalize an ingredient name for comparison
function normalizeIngredientName(name: string): string {
  return name.toLowerCase().trim();
}

// Format the ingredient quantity
function formatQuantity(amount: string, unit: string): string {
  if (!unit) return amount;
  return `${amount} ${unit}`;
}

// POST - Create a new shopping list from meal plan
export const POST = withAuth(async (request: NextRequest) => {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse and validate request body
    const rawData = await request.json();
    const validationResult = shoppingListCreateSchema.safeParse(rawData);
    
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          error: 'Validation error', 
          details: validationResult.error.format()
        },
        { status: 400 }
      );
    }
    
    const { mealPlanId, name } = validationResult.data;
    
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
        { error: 'Meal plan not found or you do not have access to it' },
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
    }).catch((error) => {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        console.error('Database error when creating shopping list:', error);
        throw new Error(`Database error: ${error.message}`);
      }
      throw error;
    });
    
    // Extract and consolidate ingredients from the meal plan
    const ingredientsMap = new Map<string, { name: string; quantity: string; unit?: string; category: string }>();
    
    // Process each recipe in the meal plan
    for (const mealPlanItem of mealPlan.items) {
      const recipe = mealPlanItem.recipe;
      
      try {
        // Find the associated ingredients for this recipe
        const recipeIngredients = await prisma.ingredient.findMany({
          where: { recipeId: recipe.id }
        });
        
        // If we have structured ingredients in the database, use those
        if (recipeIngredients.length > 0) {
          for (const ingredient of recipeIngredients) {
            const normalizedName = normalizeIngredientName(ingredient.name);
            const category = categorizeIngredient(ingredient.name);
            const quantity = formatQuantity(ingredient.amount, ingredient.unit || '');
            
            if (ingredientsMap.has(normalizedName)) {
              // If the ingredient already exists in our map, we don't need to add it again
              // In a more advanced version, we could consolidate quantities
              continue;
            } else {
              ingredientsMap.set(normalizedName, {
                name: ingredient.name,
                quantity: quantity,
                unit: ingredient.unit || undefined,
                category: category
              });
            }
          }
        } 
      } catch (error) {
        console.error(`Error processing recipe ${recipe.id}:`, error);
        // Continue with the next recipe rather than failing the entire request
      }
    }
    
    // Create shopping list items from the consolidated ingredients
    const shoppingListItems = await Promise.all(
      Array.from(ingredientsMap.values()).map(async (ingredient) => {
        return prisma.shoppingListItem.create({
          data: {
            shoppingListId: shoppingList.id,
            name: ingredient.name,
            quantity: ingredient.quantity,
            unit: ingredient.unit,
            category: ingredient.category,
          },
        }).catch((error) => {
          console.error(`Error creating shopping list item for ${ingredient.name}:`, error);
          return null; // Return null for failed items so we can filter them out
        });
      })
    ).then(items => items.filter(item => item !== null)); // Filter out any null items
    
    return NextResponse.json({
      message: 'Shopping list created successfully',
      shoppingList: {
        ...shoppingList,
        items: shoppingListItems,
      },
    });
    
  } catch (error) {
    console.error('Failed to create shopping list:', error);
    
    // Provide different error responses based on the error type
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: 'Invalid request data',
          details: error.format() 
        },
        { status: 400 }
      );
    }
    
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      // Handle specific Prisma errors
      if (error.code === 'P2002') {
        return NextResponse.json(
          { error: 'A shopping list for this meal plan already exists' },
          { status: 409 }
        );
      }
      
      if (error.code === 'P2025') {
        return NextResponse.json(
          { error: 'Related record not found' },
          { status: 404 }
        );
      }
    }
    
    return NextResponse.json(
      { error: 'Failed to create shopping list', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
});

// Zod schema for shopping list query parameters
const shoppingListQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(50).default(10),
  sortBy: z.enum(['createdAt', 'name', 'itemCount']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  mealPlanId: z.string().uuid().optional(),
  startDate: z.string().optional().transform(val => val ? new Date(val) : undefined),
  endDate: z.string().optional().transform(val => val ? new Date(val) : undefined),
  searchTerm: z.string().optional(),
});

// Shopping list response with metadata
type ShoppingListWithMetadata = {
  id: string;
  name: string;
  userId: string;
  mealPlanId: string | null;
  createdAt: Date;
  updatedAt: Date;
  mealPlan: any | null;
  itemCounts: {
    total: number;
    checked: number;
    unchecked: number;
  };
  items?: any[];
};

// GET - Get all shopping lists for the current user with pagination and filtering
export const GET = withAuth(async (request: NextRequest) => {
  try {
    // Get the session using NextAuth
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Parse and validate query parameters
    const url = new URL(request.url);
    const queryParams = Object.fromEntries(url.searchParams.entries());
    
    const validationResult = shoppingListQuerySchema.safeParse(queryParams);
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          error: 'Invalid query parameters', 
          details: validationResult.error.format() 
        },
        { status: 400 }
      );
    }
    
    const {
      page,
      limit,
      sortBy,
      sortOrder,
      mealPlanId,
      startDate,
      endDate,
      searchTerm
    } = validationResult.data;
    
    // Calculate pagination values
    const skip = (page - 1) * limit;
    
    // Build filter conditions
    const whereConditions: Prisma.ShoppingListWhereInput = {
      userId: session.user.id,
    };
    
    // Add optional filters
    if (mealPlanId) {
      whereConditions.mealPlanId = mealPlanId;
    }
    
    if (startDate) {
      whereConditions.createdAt = {
        ...whereConditions.createdAt,
        gte: startDate
      };
    }
    
    if (endDate) {
      whereConditions.createdAt = {
        ...whereConditions.createdAt,
        lte: endDate
      };
    }
    
    if (searchTerm) {
      whereConditions.name = {
        contains: searchTerm,
        mode: 'insensitive' as Prisma.QueryMode
      };
    }
    
    // Determine the order by condition
    // For itemCount sorting, we need to handle it in-memory after fetching
    // since it's not a direct database field
    const orderBy: any = {};
    if (sortBy !== 'itemCount') {
      orderBy[sortBy] = sortOrder;
    } else {
      // Default to createdAt when sorting by itemCount (we'll sort later)
      orderBy['createdAt'] = 'desc';
    }
    
    // First get the total count for pagination metadata
    const totalCount = await prisma.shoppingList.count({
      where: whereConditions
    }).catch((error) => {
      console.error('Database error when counting shopping lists:', error);
      throw new Error(`Database error: ${error.message}`);
    });
    
    // Then fetch the actual shopping lists with items
    const shoppingLists = await prisma.shoppingList.findMany({
      where: whereConditions,
      include: {
        mealPlan: {
          select: {
            id: true,
            name: true,
            startDate: true,
            endDate: true
          }
        },
        items: {
          orderBy: {
            category: 'asc',
          },
        },
        _count: {
          select: { items: true }
        }
      },
      orderBy,
      skip,
      take: limit,
    }).catch((error) => {
      console.error('Database error when fetching shopping lists:', error);
      throw new Error(`Database error: ${error.message}`);
    });
    
    // Enhance the shopping lists with metadata
    let enhancedLists: ShoppingListWithMetadata[] = shoppingLists.map(list => {
      // Calculate item counts
      const totalItems = list.items.length;
      const checkedItems = list.items.filter(item => item.checked).length;
      
      return {
        id: list.id,
        name: list.name,
        userId: list.userId,
        mealPlanId: list.mealPlanId,
        createdAt: list.createdAt,
        updatedAt: list.updatedAt,
        mealPlan: list.mealPlan,
        itemCounts: {
          total: totalItems,
          checked: checkedItems,
          unchecked: totalItems - checkedItems
        },
        items: list.items
      };
    });
    
    // Apply itemCount sorting if requested
    if (sortBy === 'itemCount') {
      enhancedLists = enhancedLists.sort((a, b) => {
        const aCount = a.itemCounts.total;
        const bCount = b.itemCounts.total;
        return sortOrder === 'asc' ? aCount - bCount : bCount - aCount;
      });
    }
    
    // Calculate pagination metadata
    const totalPages = Math.ceil(totalCount / limit);
    const hasNextPage = page < totalPages;
    const hasPreviousPage = page > 1;
    
    // Return the enhanced response
    return NextResponse.json({
      lists: enhancedLists,
      pagination: {
        currentPage: page,
        totalPages,
        totalItems: totalCount,
        itemsPerPage: limit,
        hasNextPage,
        hasPreviousPage
      }
    });
    
  } catch (error) {
    console.error('Failed to fetch shopping lists:', error);
    
    // Handle validation errors
    if (error instanceof z.ZodError) {
      return NextResponse.json({ 
        error: 'Invalid request parameters',
        details: error.format() 
      }, { status: 400 });
    }
    
    // Handle database errors
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      // Handle specific Prisma error codes
      if (error.code === 'P2025') {
        return NextResponse.json(
          { error: 'Resource not found', message: error.message },
          { status: 404 }
        );
      }
      
      return NextResponse.json(
        { error: 'Database error', message: error.message },
        { status: 500 }
      );
    }
    
    // Handle other errors
    return NextResponse.json(
      { 
        error: 'Failed to fetch shopping lists', 
        message: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
});