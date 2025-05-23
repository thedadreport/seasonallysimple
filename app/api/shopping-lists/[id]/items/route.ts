import { NextRequest, NextResponse } from 'next/server';
import { auth } from "@/auth";
import { PrismaClient, Prisma } from '@prisma/client';
import { z } from 'zod';

const prisma = new PrismaClient();

interface Params {
  params: {
    id: string;
  };
}

// Common food categories for smart suggestions
const commonIngredients = {
  produce: [
    'Apples', 'Bananas', 'Oranges', 'Lemons', 'Limes', 'Broccoli', 
    'Carrots', 'Celery', 'Lettuce', 'Spinach', 'Tomatoes', 'Onions',
    'Garlic', 'Potatoes', 'Sweet potatoes', 'Avocados', 'Berries',
    'Cucumber', 'Bell peppers', 'Zucchini'
  ],
  dairy: [
    'Milk', 'Butter', 'Eggs', 'Cheese', 'Yogurt', 'Sour cream',
    'Heavy cream', 'Cream cheese', 'Cottage cheese', 'Ice cream'
  ],
  meat: [
    'Chicken breast', 'Ground beef', 'Bacon', 'Sausage', 'Steak', 
    'Pork chops', 'Ham', 'Turkey', 'Ground turkey', 'Fish fillets'
  ],
  pantry: [
    'Olive oil', 'Vegetable oil', 'Salt', 'Pepper', 'Sugar', 'Flour',
    'Rice', 'Pasta', 'Bread', 'Cereal', 'Coffee', 'Tea', 'Honey',
    'Maple syrup', 'Canned beans', 'Canned tomatoes', 'Spices'
  ]
};

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

// Get suggestions based on partial input
function getSuggestions(partialName: string, limit = 5): { name: string, category: string }[] {
  if (!partialName || partialName.length < 2) return [];
  
  const lowercaseInput = partialName.toLowerCase();
  const allSuggestions: { name: string, category: string }[] = [];
  
  // Gather suggestions from all categories
  Object.entries(commonIngredients).forEach(([category, items]) => {
    items.forEach(item => {
      if (item.toLowerCase().includes(lowercaseInput)) {
        allSuggestions.push({
          name: item,
          category
        });
      }
    });
  });
  
  // Sort by relevance (items that start with the input get higher priority)
  allSuggestions.sort((a, b) => {
    const aStartsWith = a.name.toLowerCase().startsWith(lowercaseInput) ? 0 : 1;
    const bStartsWith = b.name.toLowerCase().startsWith(lowercaseInput) ? 0 : 1;
    
    if (aStartsWith !== bStartsWith) return aStartsWith - bStartsWith;
    return a.name.localeCompare(b.name);
  });
  
  // Return limited number of suggestions
  return allSuggestions.slice(0, limit);
}

// Zod schema for adding a single item
const addItemSchema = z.object({
  name: z.string().min(1, "Item name is required"),
  quantity: z.string().optional().default("1"),
  unit: z.string().optional().nullable(),
  category: z.string().optional(),
  orderPosition: z.number().int().optional(),
  checked: z.boolean().optional().default(false)
});

// Zod schema for adding multiple items
const addItemsSchema = z.object({
  items: z.array(addItemSchema).min(1, "At least one item is required")
});

// Zod schema for bulk update operations
const bulkUpdateSchema = z.object({
  operation: z.enum(["check", "uncheck", "delete", "reorder"]),
  itemIds: z.array(z.string().uuid()).optional(),
  items: z.array(
    z.object({
      id: z.string().uuid(),
      orderPosition: z.number().int().optional(),
      checked: z.boolean().optional(),
      name: z.string().optional(),
      quantity: z.string().optional(),
      unit: z.string().optional().nullable(),
      category: z.string().optional()
    })
  ).optional()
});

// Zod schema for updating specific items
const updateItemsSchema = z.object({
  items: z.array(
    z.object({
      id: z.string().uuid(),
      checked: z.boolean().optional(),
      name: z.string().optional(),
      quantity: z.string().optional(),
      unit: z.string().optional().nullable(),
      category: z.string().optional(),
      orderPosition: z.number().int().optional()
    })
  )
});

// Zod schema for suggestion requests
const suggestionSchema = z.object({
  partialName: z.string().min(1),
  limit: z.number().int().positive().max(20).optional()
});

// POST - Add item(s) to a shopping list
export async function POST(request: NextRequest, { params }: Params) {
  try {
    // Get authenticated session
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Get shopping list ID
    const shoppingListId = params.id;
    if (!shoppingListId) {
      return NextResponse.json(
        { error: 'Shopping list ID is required' },
        { status: 400 }
      );
    }
    
    // Check if the request is for suggestions
    const contentType = request.headers.get('content-type');
    if (contentType?.includes('application/json')) {
      const requestData = await request.json();
      
      // Check if this is a suggestion request
      if ('partialName' in requestData) {
        try {
          const { partialName, limit } = suggestionSchema.parse(requestData);
          const suggestions = getSuggestions(partialName, limit);
          return NextResponse.json({ suggestions });
        } catch (error) {
          if (error instanceof z.ZodError) {
            return NextResponse.json({ 
              error: 'Invalid suggestion request', 
              details: error.format() 
            }, { status: 400 });
          }
          throw error;
        }
      }
      
      // Validate single or multiple item request
      let validatedData;
      let isMultipleItems = false;
      
      try {
        if ('items' in requestData) {
          validatedData = addItemsSchema.parse(requestData);
          isMultipleItems = true;
        } else {
          validatedData = addItemSchema.parse(requestData);
        }
      } catch (error) {
        if (error instanceof z.ZodError) {
          return NextResponse.json({ 
            error: 'Invalid item data', 
            details: error.format() 
          }, { status: 400 });
        }
        throw error;
      }
      
      // Verify shopping list exists and belongs to user
      const shoppingList = await prisma.shoppingList.findFirst({
        where: {
          id: shoppingListId,
          userId: session.user.id,
        },
      }).catch(error => {
        console.error('Database error when finding shopping list:', error);
        throw new Error(`Database error: ${error.message}`);
      });
      
      if (!shoppingList) {
        return NextResponse.json(
          { error: 'Shopping list not found or you do not have access to it' }, 
          { status: 404 }
        );
      }
      
      // Find highest order position to place new items at the end
      const highestPosition = await prisma.shoppingListItem.findFirst({
        where: { shoppingListId },
        orderBy: { orderPosition: 'desc' },
        select: { orderPosition: true }
      }).catch(error => {
        console.error('Database error when finding highest position:', error);
        throw new Error(`Database error: ${error.message}`);
      });
      
      let nextPosition = (highestPosition?.orderPosition || 0) + 1;
      
      if (isMultipleItems) {
        // Add multiple items
        const itemsToCreate = validatedData.items.map((item, index) => {
          // Auto-categorize if category is not provided
          const category = item.category || categorizeIngredient(item.name);
          
          return {
            shoppingListId,
            name: item.name,
            quantity: item.quantity || '1',
            unit: item.unit || null,
            category,
            orderPosition: item.orderPosition || nextPosition + index,
            checked: item.checked || false
          };
        });
        
        const createdItems = await prisma.shoppingListItem.createMany({
          data: itemsToCreate
        }).catch(error => {
          console.error('Database error when creating items:', error);
          throw new Error(`Database error: ${error.message}`);
        });
        
        // Fetch the created items to return them
        const items = await prisma.shoppingListItem.findMany({
          where: {
            shoppingListId,
            name: { in: itemsToCreate.map(item => item.name) }
          },
          orderBy: { orderPosition: 'asc' }
        });
        
        return NextResponse.json({
          message: `${createdItems.count} items added successfully`,
          items
        });
        
      } else {
        // Add a single item
        const { name, quantity, unit, orderPosition, checked } = validatedData;
        
        // Auto-categorize if category is not provided
        const category = validatedData.category || categorizeIngredient(name);
        
        const newItem = await prisma.shoppingListItem.create({
          data: {
            shoppingListId,
            name,
            quantity: quantity || '1',
            unit: unit || null,
            category,
            orderPosition: orderPosition || nextPosition,
            checked: checked || false
          },
        }).catch(error => {
          console.error('Database error when creating item:', error);
          throw new Error(`Database error: ${error.message}`);
        });
        
        return NextResponse.json({
          message: 'Item added successfully',
          item: newItem,
        });
      }
    }
    
    return NextResponse.json(
      { error: 'Invalid request format' },
      { status: 400 }
    );
    
  } catch (error) {
    console.error('Failed to add item(s):', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({ 
        error: 'Invalid request data', 
        details: error.format() 
      }, { status: 400 });
    }
    
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      // Handle specific Prisma errors
      return NextResponse.json(
        { 
          error: 'Database error', 
          code: error.code,
          message: error.message 
        },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { 
        error: 'Failed to add item(s) to shopping list',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// PUT - Update items in a shopping list
export async function PUT(request: NextRequest, { params }: Params) {
  try {
    // Get authenticated session
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Get shopping list ID
    const shoppingListId = params.id;
    if (!shoppingListId) {
      return NextResponse.json(
        { error: 'Shopping list ID is required' },
        { status: 400 }
      );
    }
    
    // Parse and validate request data
    const requestData = await request.json();
    
    // Check if this is a bulk operation
    if ('operation' in requestData) {
      try {
        const { operation, itemIds, items } = bulkUpdateSchema.parse(requestData);
        
        // Verify shopping list exists and belongs to user
        const shoppingList = await prisma.shoppingList.findFirst({
          where: {
            id: shoppingListId,
            userId: session.user.id,
          },
        }).catch(error => {
          console.error('Database error when finding shopping list:', error);
          throw new Error(`Database error: ${error.message}`);
        });
        
        if (!shoppingList) {
          return NextResponse.json(
            { error: 'Shopping list not found or you do not have access to it' }, 
            { status: 404 }
          );
        }
        
        // Handle different bulk operations
        switch (operation) {
          case 'check':
          case 'uncheck':
            if (!itemIds || itemIds.length === 0) {
              return NextResponse.json(
                { error: 'Item IDs are required for check/uncheck operations' },
                { status: 400 }
              );
            }
            
            // Update items to checked or unchecked
            await prisma.shoppingListItem.updateMany({
              where: {
                id: { in: itemIds },
                shoppingListId
              },
              data: {
                checked: operation === 'check'
              }
            }).catch(error => {
              console.error(`Database error during ${operation} operation:`, error);
              throw new Error(`Database error: ${error.message}`);
            });
            
            return NextResponse.json({
              message: `${itemIds.length} items ${operation === 'check' ? 'checked' : 'unchecked'} successfully`
            });
            
          case 'delete':
            if (!itemIds || itemIds.length === 0) {
              return NextResponse.json(
                { error: 'Item IDs are required for delete operation' },
                { status: 400 }
              );
            }
            
            // Delete items
            await prisma.shoppingListItem.deleteMany({
              where: {
                id: { in: itemIds },
                shoppingListId
              }
            }).catch(error => {
              console.error('Database error during delete operation:', error);
              throw new Error(`Database error: ${error.message}`);
            });
            
            return NextResponse.json({
              message: `${itemIds.length} items deleted successfully`
            });
            
          case 'reorder':
            if (!items || items.length === 0) {
              return NextResponse.json(
                { error: 'Items with order positions are required for reorder operation' },
                { status: 400 }
              );
            }
            
            // Reorder items (using transaction for consistency)
            await prisma.$transaction(
              items.map(item => 
                prisma.shoppingListItem.update({
                  where: {
                    id: item.id,
                    shoppingListId
                  },
                  data: {
                    orderPosition: item.orderPosition
                  }
                })
              )
            ).catch(error => {
              console.error('Database error during reorder operation:', error);
              throw new Error(`Database error: ${error.message}`);
            });
            
            return NextResponse.json({
              message: `${items.length} items reordered successfully`
            });
            
          default:
            return NextResponse.json(
              { error: `Unsupported operation: ${operation}` },
              { status: 400 }
            );
        }
      } catch (error) {
        if (error instanceof z.ZodError) {
          return NextResponse.json({ 
            error: 'Invalid bulk operation request', 
            details: error.format() 
          }, { status: 400 });
        }
        throw error;
      }
    }
    
    // Regular item updates
    try {
      const { items } = updateItemsSchema.parse(requestData);
      
      // Verify shopping list exists and belongs to user
      const shoppingList = await prisma.shoppingList.findFirst({
        where: {
          id: shoppingListId,
          userId: session.user.id,
        },
      }).catch(error => {
        console.error('Database error when finding shopping list:', error);
        throw new Error(`Database error: ${error.message}`);
      });
      
      if (!shoppingList) {
        return NextResponse.json(
          { error: 'Shopping list not found or you do not have access to it' }, 
          { status: 404 }
        );
      }
      
      // Update items (using transaction for consistency)
      const updates = await prisma.$transaction(
        items.map(item => {
          // Build the data to update (only include fields that are provided)
          const updateData: any = {};
          if (item.checked !== undefined) updateData.checked = item.checked;
          if (item.name) updateData.name = item.name;
          if (item.quantity) updateData.quantity = item.quantity;
          if (item.unit !== undefined) updateData.unit = item.unit;
          if (item.category) updateData.category = item.category;
          if (item.orderPosition !== undefined) updateData.orderPosition = item.orderPosition;
          
          return prisma.shoppingListItem.update({
            where: { 
              id: item.id,
              shoppingListId
            },
            data: updateData
          });
        })
      ).catch(error => {
        console.error('Database error during item updates:', error);
        throw new Error(`Database error: ${error.message}`);
      });
      
      return NextResponse.json({
        message: 'Items updated successfully',
        items: updates,
      });
      
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json({ 
          error: 'Invalid item update request', 
          details: error.format() 
        }, { status: 400 });
      }
      throw error;
    }
    
  } catch (error) {
    console.error('Failed to update items:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({ 
        error: 'Invalid request data', 
        details: error.format() 
      }, { status: 400 });
    }
    
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      // Handle specific Prisma errors
      if (error.code === 'P2025') {
        return NextResponse.json(
          { error: 'One or more items not found' },
          { status: 404 }
        );
      }
      
      return NextResponse.json(
        { 
          error: 'Database error', 
          code: error.code,
          message: error.message 
        },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { 
        error: 'Failed to update items', 
        message: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}

// DELETE - Remove an item from a shopping list
export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    // Get authenticated session
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Get shopping list ID and item ID from the URL
    const shoppingListId = params.id;
    const url = new URL(request.url);
    const itemId = url.searchParams.get('itemId');
    
    if (!shoppingListId) {
      return NextResponse.json(
        { error: 'Shopping list ID is required' },
        { status: 400 }
      );
    }
    
    if (!itemId) {
      return NextResponse.json(
        { error: 'Item ID is required' },
        { status: 400 }
      );
    }
    
    // Verify shopping list exists and belongs to user
    const shoppingList = await prisma.shoppingList.findFirst({
      where: {
        id: shoppingListId,
        userId: session.user.id,
      },
    }).catch(error => {
      console.error('Database error when finding shopping list:', error);
      throw new Error(`Database error: ${error.message}`);
    });
    
    if (!shoppingList) {
      return NextResponse.json(
        { error: 'Shopping list not found or you do not have access to it' }, 
        { status: 404 }
      );
    }
    
    // Delete the item
    await prisma.shoppingListItem.delete({
      where: {
        id: itemId,
        shoppingListId
      }
    }).catch(error => {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
        throw new Error('Item not found');
      }
      console.error('Database error when deleting item:', error);
      throw new Error(`Database error: ${error.message}`);
    });
    
    return NextResponse.json({
      message: 'Item deleted successfully'
    });
    
  } catch (error) {
    console.error('Failed to delete item:', error);
    
    if (error instanceof Error && error.message === 'Item not found') {
      return NextResponse.json(
        { error: 'Item not found' },
        { status: 404 }
      );
    }
    
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      return NextResponse.json(
        { 
          error: 'Database error', 
          code: error.code,
          message: error.message 
        },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { 
        error: 'Failed to delete item', 
        message: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}