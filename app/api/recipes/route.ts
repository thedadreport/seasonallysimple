import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getSession } from '@/lib/auth/session';
import prisma from '@/lib/prisma';

// Define the recipe schema for validation
const recipeSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  timings: z.object({
    prep: z.number(),
    cook: z.number(),
    total: z.number(),
  }),
  ingredients: z.array(
    z.object({
      amount: z.string(),
      unit: z.string(),
      name: z.string().min(1, "Ingredient name is required"),
    })
  ),
  instructions: z.array(
    z.object({
      stepNumber: z.number(),
      text: z.string().min(1, "Instruction text is required"),
    })
  ),
  nutritionInfo: z.object({
    calories: z.number(),
    protein: z.number(),
    carbs: z.number(),
    fat: z.number(),
    fiber: z.number(),
    sodium: z.number(),
  }).optional(),
  tips: z.string().optional(),
  cuisineType: z.string().optional(),
  servings: z.number().min(1).default(4),
  estimatedCostPerServing: z.number().optional(),
  tags: z.array(z.string()).optional(),
  userNotes: z.string().optional(),
});

// GET handler to retrieve all recipes for a user
export async function GET(request: Request) {
  try {
    const session = await getSession();
    
    if (!session?.user?.email) {
      return NextResponse.json({ 
        success: false, 
        error: { message: 'Unauthorized' } 
      }, { status: 401 });
    }
    
    // Get user from database
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });
    
    if (!user) {
      return NextResponse.json({ 
        success: false, 
        error: { message: 'User not found' } 
      }, { status: 404 });
    }
    
    // Get recipes for the user
    const recipes = await prisma.recipe.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      include: {
        tags: true,
      },
    });
    
    // Transform the data for the frontend
    const transformedRecipes = recipes.map(recipe => ({
      id: recipe.id,
      title: recipe.title,
      description: recipe.description,
      timings: {
        prep: recipe.prepTime,
        cook: recipe.cookTime,
        total: recipe.totalTime,
      },
      servings: recipe.servings,
      estimatedCostPerServing: recipe.estimatedCostPerServing,
      tags: recipe.tags.map(tag => tag.name),
      createdAt: recipe.createdAt,
      updatedAt: recipe.updatedAt,
    }));
    
    return NextResponse.json({ 
      success: true, 
      data: transformedRecipes 
    });
    
  } catch (error) {
    console.error('Error getting recipes:', error);
    return NextResponse.json({ 
      success: false, 
      error: { message: 'Failed to get recipes' } 
    }, { status: 500 });
  }
}

// POST handler to create a new recipe
export async function POST(request: Request) {
  try {
    const session = await getSession();
    
    if (!session?.user?.email) {
      return NextResponse.json({ 
        success: false, 
        error: { message: 'Unauthorized' } 
      }, { status: 401 });
    }
    
    // Get and validate the request body
    const body = await request.json();
    const validatedData = recipeSchema.parse(body);
    
    // Get user from database
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });
    
    if (!user) {
      return NextResponse.json({ 
        success: false, 
        error: { message: 'User not found' } 
      }, { status: 404 });
    }
    
    // Process tags if present
    const tags = validatedData.tags || [];
    
    // Create the recipe
    const recipe = await prisma.recipe.create({
      data: {
        title: validatedData.title,
        description: validatedData.description || '',
        prepTime: validatedData.timings.prep,
        cookTime: validatedData.timings.cook,
        totalTime: validatedData.timings.total,
        servings: validatedData.servings,
        estimatedCostPerServing: validatedData.estimatedCostPerServing,
        cuisineType: validatedData.cuisineType,
        ingredients: JSON.stringify(validatedData.ingredients),
        instructions: JSON.stringify(validatedData.instructions),
        nutritionInfo: validatedData.nutritionInfo ? JSON.stringify(validatedData.nutritionInfo) : null,
        tips: validatedData.tips || '',
        user: {
          connect: { id: user.id },
        },
        tags: {
          create: tags.map(tag => ({
            name: tag,
          })),
        },
      },
    });
    
    return NextResponse.json({ 
      success: true, 
      data: {
        id: recipe.id,
        title: recipe.title,
      }
    }, { status: 201 });
    
  } catch (error) {
    console.error('Error creating recipe:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({ 
        success: false, 
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid recipe data',
          details: error.errors
        }
      }, { status: 400 });
    }
    
    return NextResponse.json({ 
      success: false, 
      error: { message: 'Failed to create recipe' } 
    }, { status: 500 });
  }
}