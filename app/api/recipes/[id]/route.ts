import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getSession } from '@/lib/auth/session';
import prisma from '@/lib/prisma';

// Define the recipe update schema for validation
const recipeUpdateSchema = z.object({
  title: z.string().min(1, "Title is required").optional(),
  description: z.string().optional(),
  timings: z.object({
    prep: z.number(),
    cook: z.number(),
    total: z.number(),
  }).optional(),
  ingredients: z.array(
    z.object({
      amount: z.string(),
      unit: z.string(),
      name: z.string().min(1, "Ingredient name is required"),
    })
  ).optional(),
  instructions: z.array(
    z.object({
      stepNumber: z.number(),
      text: z.string().min(1, "Instruction text is required"),
    })
  ).optional(),
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
  servings: z.number().min(1).optional(),
  userNotes: z.string().optional(),
  estimatedCostPerServing: z.number().optional(),
  tags: z.array(z.string()).optional(),
});

// GET handler to retrieve a specific recipe
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    
    // Get recipe by ID
    const recipe = await prisma.recipe.findUnique({
      where: { id },
      include: {
        tags: true,
        comments: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                image: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    });
    
    if (!recipe) {
      return NextResponse.json({ 
        success: false, 
        error: { message: 'Recipe not found' } 
      }, { status: 404 });
    }
    
    // Parse JSON strings
    const ingredients = JSON.parse(recipe.ingredients);
    const instructions = JSON.parse(recipe.instructions);
    const nutritionInfo = recipe.nutritionInfo ? JSON.parse(recipe.nutritionInfo) : null;
    
    // Transform the data for the frontend
    const transformedRecipe = {
      id: recipe.id,
      title: recipe.title,
      description: recipe.description,
      timings: {
        prep: recipe.prepTime,
        cook: recipe.cookTime,
        total: recipe.totalTime,
      },
      ingredients,
      instructions,
      nutritionInfo,
      servings: recipe.servings,
      cuisineType: recipe.cuisineType,
      tips: recipe.tips,
      userNotes: recipe.userNotes,
      estimatedCostPerServing: recipe.estimatedCostPerServing,
      isAIGenerated: recipe.isAIGenerated,
      tags: recipe.tags.map(tag => tag.name),
      createdAt: recipe.createdAt,
      updatedAt: recipe.updatedAt,
      comments: recipe.comments.map(comment => ({
        id: comment.id,
        content: comment.content,
        createdAt: comment.createdAt,
        user: comment.user,
      })),
    };
    
    return NextResponse.json({ 
      success: true, 
      data: transformedRecipe 
    });
    
  } catch (error) {
    console.error('Error getting recipe:', error);
    return NextResponse.json({ 
      success: false, 
      error: { message: 'Failed to get recipe' } 
    }, { status: 500 });
  }
}

// PATCH handler to update a recipe
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession();
    
    if (!session?.user?.email) {
      return NextResponse.json({ 
        success: false, 
        error: { message: 'Unauthorized' } 
      }, { status: 401 });
    }
    
    const id = params.id;
    
    // Get and validate the request body
    const body = await request.json();
    const validatedData = recipeUpdateSchema.parse(body);
    
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
    
    // Get recipe by ID
    const recipe = await prisma.recipe.findUnique({
      where: { id },
    });
    
    if (!recipe) {
      return NextResponse.json({ 
        success: false, 
        error: { message: 'Recipe not found' } 
      }, { status: 404 });
    }
    
    // Build update data
    const updateData: any = {};
    
    if (validatedData.title) updateData.title = validatedData.title;
    if (validatedData.description !== undefined) updateData.description = validatedData.description;
    if (validatedData.timings) {
      updateData.prepTime = validatedData.timings.prep;
      updateData.cookTime = validatedData.timings.cook;
      updateData.totalTime = validatedData.timings.total;
    }
    if (validatedData.ingredients) updateData.ingredients = JSON.stringify(validatedData.ingredients);
    if (validatedData.instructions) updateData.instructions = JSON.stringify(validatedData.instructions);
    if (validatedData.nutritionInfo) updateData.nutritionInfo = JSON.stringify(validatedData.nutritionInfo);
    if (validatedData.tips !== undefined) updateData.tips = validatedData.tips;
    if (validatedData.cuisineType) updateData.cuisineType = validatedData.cuisineType;
    if (validatedData.servings) updateData.servings = validatedData.servings;
    if (validatedData.userNotes !== undefined) updateData.userNotes = validatedData.userNotes;
    if (validatedData.estimatedCostPerServing) updateData.estimatedCostPerServing = validatedData.estimatedCostPerServing;
    
    // Update the recipe
    const updatedRecipe = await prisma.recipe.update({
      where: { id },
      data: updateData,
    });
    
    // Update tags if present
    if (validatedData.tags) {
      // Delete existing tags
      await prisma.recipeTag.deleteMany({
        where: { recipeId: id },
      });
      
      // Create new tags
      for (const tagName of validatedData.tags) {
        await prisma.recipeTag.create({
          data: {
            name: tagName,
            recipe: {
              connect: { id },
            },
          },
        });
      }
    }
    
    return NextResponse.json({ 
      success: true, 
      data: {
        id: updatedRecipe.id,
        message: 'Recipe updated successfully',
      }
    });
    
  } catch (error) {
    console.error('Error updating recipe:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({ 
        success: false, 
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid recipe update data',
          details: error.errors
        }
      }, { status: 400 });
    }
    
    return NextResponse.json({ 
      success: false, 
      error: { message: 'Failed to update recipe' } 
    }, { status: 500 });
  }
}

// DELETE handler to delete a recipe
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession();
    
    if (!session?.user?.email) {
      return NextResponse.json({ 
        success: false, 
        error: { message: 'Unauthorized' } 
      }, { status: 401 });
    }
    
    const id = params.id;
    
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
    
    // Get recipe by ID to check ownership
    const recipe = await prisma.recipe.findUnique({
      where: { id },
    });
    
    if (!recipe) {
      return NextResponse.json({ 
        success: false, 
        error: { message: 'Recipe not found' } 
      }, { status: 404 });
    }
    
    // Check if the user is the owner of the recipe or an admin
    if (recipe.userId !== user.id) {
      return NextResponse.json({ 
        success: false, 
        error: { message: 'Not authorized to delete this recipe' } 
      }, { status: 403 });
    }
    
    // Delete the recipe
    await prisma.recipe.delete({
      where: { id },
    });
    
    return NextResponse.json({ 
      success: true, 
      data: {
        message: 'Recipe deleted successfully',
      }
    });
    
  } catch (error) {
    console.error('Error deleting recipe:', error);
    return NextResponse.json({ 
      success: false, 
      error: { message: 'Failed to delete recipe' } 
    }, { status: 500 });
  }
}