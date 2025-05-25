import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getSession } from '@/lib/auth/session';
import prisma from '@/lib/prisma';

// Define the recipe update schema for validation
const recipeUpdateSchema = z.object({
  title: z.string().min(1, "Title is required").optional(),
  description: z.string().min(1, "Description is required").optional(),
  timings: z.object({
    prep: z.number().min(0, "Prep time must be 0 or greater"),
    cook: z.number().min(0, "Cook time must be 0 or greater"),
    total: z.number().min(0, "Total time must be 0 or greater"),
  }).optional(),
  ingredients: z.array(
    z.object({
      id: z.string().optional(), // For existing ingredients
      amount: z.string(),
      unit: z.string().optional().nullable(),
      name: z.string().min(1, "Ingredient name is required"),
      _delete: z.boolean().optional(), // For marking ingredients to delete
    })
  ).optional(),
  instructions: z.array(
    z.object({
      id: z.string().optional(), // For existing instructions
      stepNumber: z.number().min(1, "Step number must be 1 or greater"),
      text: z.string().min(1, "Instruction text is required"),
      _delete: z.boolean().optional(), // For marking instructions to delete
    })
  ).optional(),
  nutritionInfo: z.object({
    calories: z.number().min(0),
    protein: z.number().min(0),
    carbs: z.number().min(0),
    fat: z.number().min(0),
    fiber: z.number().optional().nullable(),
    sodium: z.number().optional().nullable(),
  }).optional().nullable(),
  difficulty: z.string().min(1, "Difficulty is required").optional(),
  season: z.string().min(1, "Season is required").optional(),
  cuisineType: z.string().min(1, "Cuisine type is required").optional(),
  dietaryTags: z.string().optional(),
  servings: z.number().min(1, "Servings must be 1 or greater").optional(),
  tips: z.string().optional().nullable(),
  imageUrl: z.string().optional().nullable(),
  isAIGenerated: z.boolean().optional(),
  visibility: z.enum(['PRIVATE', 'PUBLIC', 'CURATED']).optional(),
});

// GET handler to retrieve a specific recipe
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    
    // Get the user session to check permissions
    const session = await getSession();
    const currentUserEmail = session?.user?.email;
    
    // Get user data if logged in
    let currentUser = null;
    if (currentUserEmail) {
      currentUser = await prisma.user.findUnique({
        where: { email: currentUserEmail },
        select: { id: true, role: true }
      });
    }
    
    // Get recipe by ID with related data
    const recipe = await prisma.recipe.findUnique({
      where: { id },
      include: {
        Ingredient: true,
        Instruction: {
          orderBy: {
            stepNumber: 'asc',
          },
        },
        NutritionInfo: true,
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true
          }
        },
        moderatedBy: currentUser?.role === 'ADMIN' || currentUser?.role === 'MODERATOR' ? {
          select: {
            id: true,
            name: true,
            email: true
          }
        } : false
      },
    });
    
    if (!recipe) {
      return NextResponse.json({ 
        success: false, 
        error: { message: 'Recipe not found' } 
      }, { status: 404 });
    }
    
    // Check visibility permissions
    const isOwner = currentUser && recipe.createdById === currentUser.id;
    const isAdminOrModerator = currentUser && (currentUser.role === 'ADMIN' || currentUser.role === 'MODERATOR');
    
    // Private recipes are only visible to their owners and admins/moderators
    if (
      recipe.visibility === 'PRIVATE' && 
      !isOwner && 
      !isAdminOrModerator
    ) {
      return NextResponse.json({ 
        success: false, 
        error: { message: 'Recipe not found' } 
      }, { status: 404 });
    }
    
    // Public recipes with PENDING or REJECTED status are only visible to owners and admins/moderators
    if (
      recipe.visibility === 'PUBLIC' && 
      (recipe.moderationStatus === 'PENDING' || recipe.moderationStatus === 'REJECTED') && 
      !isOwner && 
      !isAdminOrModerator
    ) {
      return NextResponse.json({ 
        success: false, 
        error: { message: 'Recipe not found' } 
      }, { status: 404 });
    }
    
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
      ingredients: recipe.Ingredient.map(ingredient => ({
        id: ingredient.id,
        amount: ingredient.amount,
        unit: ingredient.unit,
        name: ingredient.name,
      })),
      instructions: recipe.Instruction.map(instruction => ({
        id: instruction.id,
        stepNumber: instruction.stepNumber,
        text: instruction.text,
      })),
      nutritionInfo: recipe.NutritionInfo ? {
        calories: recipe.NutritionInfo.calories,
        protein: recipe.NutritionInfo.protein,
        carbs: recipe.NutritionInfo.carbs,
        fat: recipe.NutritionInfo.fat,
        fiber: recipe.NutritionInfo.fiber,
        sodium: recipe.NutritionInfo.sodium,
      } : null,
      servings: recipe.servings,
      difficulty: recipe.difficulty,
      season: recipe.season,
      cuisineType: recipe.cuisineType,
      dietaryTags: recipe.dietaryTags ? recipe.dietaryTags.split(',') : [],
      tips: recipe.tips,
      imageUrl: recipe.imageUrl,
      isAIGenerated: recipe.isAIGenerated,
      createdAt: recipe.createdAt,
      updatedAt: recipe.updatedAt,
      
      // Add privacy and moderation fields
      visibility: recipe.visibility,
      moderationStatus: recipe.moderationStatus,
      publishedAt: recipe.publishedAt,
      
      // Add creator info
      createdBy: {
        id: recipe.createdBy.id,
        name: recipe.createdBy.name,
        email: recipe.createdBy.email,
        image: recipe.createdBy.image
      },
      
      // Add ownership and role-based flags
      isOwner,
      canModerate: isAdminOrModerator,
      
      // Add moderation details (only for admin/moderators and owners)
      ...(isOwner || isAdminOrModerator ? {
        moderationNotes: recipe.moderationNotes,
        moderatedAt: recipe.moderatedAt,
        moderatedBy: recipe.moderatedBy ? {
          id: recipe.moderatedBy.id,
          name: recipe.moderatedBy.name,
          email: recipe.moderatedBy.email
        } : null
      } : {})
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
      select: { id: true, role: true, email: true }
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
      include: {
        Ingredient: true,
        Instruction: true,
        NutritionInfo: true,
      },
    });
    
    if (!recipe) {
      return NextResponse.json({ 
        success: false, 
        error: { message: 'Recipe not found' } 
      }, { status: 404 });
    }
    
    // Check if user has permission to edit this recipe
    const isOwner = recipe.createdById === user.id;
    const isAdminOrModerator = user.role === 'ADMIN' || user.role === 'MODERATOR';
    
    if (!isOwner && !isAdminOrModerator) {
      return NextResponse.json({ 
        success: false, 
        error: { message: 'You do not have permission to edit this recipe' } 
      }, { status: 403 });
    }
    
    // Handle visibility changes
    let visibility = recipe.visibility;
    let moderationStatus = recipe.moderationStatus;
    let publishedAt = recipe.publishedAt;
    let moderatedAt = recipe.moderatedAt;
    let moderatedById = recipe.moderatedById;
    
    if (validatedData.visibility !== undefined && validatedData.visibility !== recipe.visibility) {
      visibility = validatedData.visibility;
      
      // Only admins/moderators can set a recipe as CURATED
      if (visibility === 'CURATED' && !isAdminOrModerator) {
        return NextResponse.json({ 
          success: false, 
          error: { message: 'Only admins and moderators can set a recipe as curated' } 
        }, { status: 403 });
      }
      
      // If changing from PRIVATE to PUBLIC, set moderation status to PENDING (unless admin/moderator)
      if (recipe.visibility === 'PRIVATE' && visibility === 'PUBLIC') {
        if (isAdminOrModerator) {
          moderationStatus = 'APPROVED';
          publishedAt = new Date();
          moderatedAt = new Date();
          moderatedById = user.id;
        } else {
          moderationStatus = 'PENDING';
        }
      }
      
      // If changing from PUBLIC to PRIVATE, reset moderation status
      if (recipe.visibility !== 'PRIVATE' && visibility === 'PRIVATE') {
        // Keep the moderation status if it's already been approved
        if (recipe.moderationStatus !== 'APPROVED') {
          moderationStatus = 'PENDING';
        }
      }
    }
    
    // Update recipe and related data in a transaction
    await prisma.$transaction(async (tx) => {
      // Update the recipe main data
      const updateData: any = {
        visibility,
        moderationStatus,
        publishedAt,
        moderatedAt,
        moderatedById,
      };
      
      if (validatedData.title) updateData.title = validatedData.title;
      if (validatedData.description) updateData.description = validatedData.description;
      if (validatedData.timings) {
        updateData.prepTime = validatedData.timings.prep;
        updateData.cookTime = validatedData.timings.cook;
        updateData.totalTime = validatedData.timings.total;
      }
      if (validatedData.difficulty) updateData.difficulty = validatedData.difficulty;
      if (validatedData.season) updateData.season = validatedData.season;
      if (validatedData.cuisineType) updateData.cuisineType = validatedData.cuisineType;
      if (validatedData.dietaryTags !== undefined) {
        updateData.dietaryTags = Array.isArray(validatedData.dietaryTags) 
          ? validatedData.dietaryTags.join(',') 
          : validatedData.dietaryTags || '';
      }
      if (validatedData.servings) updateData.servings = validatedData.servings;
      if (validatedData.tips !== undefined) updateData.tips = validatedData.tips;
      if (validatedData.imageUrl !== undefined) updateData.imageUrl = validatedData.imageUrl;
      if (validatedData.isAIGenerated !== undefined) updateData.isAIGenerated = validatedData.isAIGenerated;
      
      // If a published recipe content is changed, it may need re-moderation
      if (
        !isAdminOrModerator && 
        (recipe.visibility === 'PUBLIC' || recipe.visibility === 'CURATED') && 
        recipe.moderationStatus === 'APPROVED' &&
        (
          validatedData.title || 
          validatedData.description || 
          validatedData.ingredients || 
          validatedData.instructions || 
          validatedData.nutritionInfo
        )
      ) {
        // Set back to pending if substantial content is changed
        updateData.moderationStatus = 'PENDING';
      }
      
      // Update the recipe if there are changes
      if (Object.keys(updateData).length > 0) {
        await tx.recipe.update({
          where: { id },
          data: updateData,
        });
      }
      
      // Update ingredients if provided
      if (validatedData.ingredients) {
        // Get existing ingredient IDs
        const existingIngredientIds = recipe.Ingredient.map(ing => ing.id);
        
        // Process each ingredient
        for (const ingredient of validatedData.ingredients) {
          // If ingredient has an ID and exists, update it
          if (ingredient.id && existingIngredientIds.includes(ingredient.id)) {
            // If marked for deletion, delete it
            if (ingredient._delete) {
              await tx.ingredient.delete({
                where: { id: ingredient.id },
              });
            } else {
              // Otherwise update it
              await tx.ingredient.update({
                where: { id: ingredient.id },
                data: {
                  amount: ingredient.amount,
                  unit: ingredient.unit || null,
                  name: ingredient.name,
                },
              });
            }
          } else if (!ingredient._delete) {
            // If ingredient has no ID or doesn't exist, create a new one
            await tx.ingredient.create({
              data: {
                id: `${id}-ing-${Math.random().toString(36).substr(2, 9)}`,
                recipeId: id,
                amount: ingredient.amount,
                unit: ingredient.unit || null,
                name: ingredient.name,
              },
            });
          }
        }
      }
      
      // Update instructions if provided
      if (validatedData.instructions) {
        // Get existing instruction IDs
        const existingInstructionIds = recipe.Instruction.map(ins => ins.id);
        
        // Process each instruction
        for (const instruction of validatedData.instructions) {
          // If instruction has an ID and exists, update it
          if (instruction.id && existingInstructionIds.includes(instruction.id)) {
            // If marked for deletion, delete it
            if (instruction._delete) {
              await tx.instruction.delete({
                where: { id: instruction.id },
              });
            } else {
              // Otherwise update it
              await tx.instruction.update({
                where: { id: instruction.id },
                data: {
                  stepNumber: instruction.stepNumber,
                  text: instruction.text,
                },
              });
            }
          } else if (!instruction._delete) {
            // If instruction has no ID or doesn't exist, create a new one
            await tx.instruction.create({
              data: {
                id: `${id}-ins-${Math.random().toString(36).substr(2, 9)}`,
                recipeId: id,
                stepNumber: instruction.stepNumber,
                text: instruction.text,
              },
            });
          }
        }
      }
      
      // Update nutrition info if provided
      if (validatedData.nutritionInfo) {
        if (recipe.NutritionInfo) {
          // Update existing nutrition info
          await tx.nutritionInfo.update({
            where: { id: recipe.NutritionInfo.id },
            data: {
              calories: validatedData.nutritionInfo.calories,
              protein: validatedData.nutritionInfo.protein,
              carbs: validatedData.nutritionInfo.carbs,
              fat: validatedData.nutritionInfo.fat,
              fiber: validatedData.nutritionInfo.fiber || null,
              sodium: validatedData.nutritionInfo.sodium || null,
            },
          });
        } else {
          // Create new nutrition info
          await tx.nutritionInfo.create({
            data: {
              id: `${id}-nut-${Math.random().toString(36).substr(2, 9)}`,
              recipeId: id,
              calories: validatedData.nutritionInfo.calories,
              protein: validatedData.nutritionInfo.protein,
              carbs: validatedData.nutritionInfo.carbs,
              fat: validatedData.nutritionInfo.fat,
              fiber: validatedData.nutritionInfo.fiber || null,
              sodium: validatedData.nutritionInfo.sodium || null,
            },
          });
        }
      } else if (validatedData.nutritionInfo === null && recipe.NutritionInfo) {
        // If nutrition info is explicitly set to null, delete existing
        await tx.nutritionInfo.delete({
          where: { id: recipe.NutritionInfo.id },
        });
      }
    });
    
    return NextResponse.json({ 
      success: true, 
      data: {
        id,
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
      select: { id: true, role: true }
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
    
    // Check if user has permission to delete this recipe
    const isOwner = recipe.createdById === user.id;
    const isAdminOrModerator = user.role === 'ADMIN' || user.role === 'MODERATOR';
    
    if (!isOwner && !isAdminOrModerator) {
      return NextResponse.json({ 
        success: false, 
        error: { message: 'You do not have permission to delete this recipe' } 
      }, { status: 403 });
    }
    
    // Admins and moderators can delete any recipe
    // Owners can only delete their own recipes
    
    // Delete the recipe (cascade delete will handle related entities)
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