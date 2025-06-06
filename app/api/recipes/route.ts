import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getSession } from '@/lib/auth/session';
import prisma from '@/lib/prisma';
import { ModerationStatus, RecipeVisibility } from '@prisma/client';

// Define the recipe schema for validation
const recipeSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  timings: z.object({
    prep: z.number().min(0, "Prep time must be 0 or greater"),
    cook: z.number().min(0, "Cook time must be 0 or greater"),
    total: z.number().min(0, "Total time must be 0 or greater"),
  }),
  ingredients: z.array(
    z.object({
      amount: z.string(),
      unit: z.string().optional().nullable(),
      name: z.string().min(1, "Ingredient name is required"),
    })
  ).min(1, "At least one ingredient is required"),
  instructions: z.array(
    z.object({
      stepNumber: z.number().min(1, "Step number must be 1 or greater"),
      text: z.string().min(1, "Instruction text is required"),
    })
  ).min(1, "At least one instruction is required"),
  nutritionInfo: z.object({
    calories: z.number().min(0),
    protein: z.number().min(0),
    carbs: z.number().min(0),
    fat: z.number().min(0),
    fiber: z.number().optional().nullable(),
    sodium: z.number().optional().nullable(),
  }).optional(),
  difficulty: z.string().min(1, "Difficulty is required"),
  season: z.string().min(1, "Season is required"),
  cuisineType: z.string().min(1, "Cuisine type is required"),
  dietaryTags: z.string().default(""),
  servings: z.number().min(1, "Servings must be 1 or greater").default(4),
  tips: z.string().optional().nullable(),
  imageUrl: z.string().optional().nullable(),
  isAIGenerated: z.boolean().default(false),
  visibility: z.nativeEnum(RecipeVisibility).optional().default(RecipeVisibility.PRIVATE),
});

// GET handler to retrieve all recipes
export async function GET(request: Request) {
  try {
    // Get the user session to check permissions
    const session = await getSession();
    const currentUserEmail = session?.user?.email;
    
    // Parse URL parameters
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '10');
    const search = url.searchParams.get('search') || '';
    const difficulty = url.searchParams.get('difficulty');
    const season = url.searchParams.get('season');
    const cuisine = url.searchParams.get('cuisine');
    const dietary = url.searchParams.get('dietary');
    const maxTime = url.searchParams.get('maxTime') ? parseInt(url.searchParams.get('maxTime') || '0') : null;
    const visibility = url.searchParams.get('visibility');
    const myRecipes = url.searchParams.get('myRecipes') === 'true';
    
    // Build where clause for filtering
    const where: any = {};
    
    // Add search filter if provided
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ];
    }
    
    // Add other filters if provided
    if (difficulty) where.difficulty = difficulty;
    if (season) where.season = season;
    if (cuisine) where.cuisineType = cuisine;
    if (dietary) where.dietaryTags = { contains: dietary };
    if (maxTime) where.totalTime = { lte: maxTime };
    
    // Get user data if logged in
    let currentUser = null;
    if (currentUserEmail) {
      currentUser = await prisma.user.findUnique({
        where: { email: currentUserEmail },
        select: { id: true, role: true }
      });
    }
    
    // Handle visibility filtering
    if (visibility) {
      where.visibility = visibility;
    } else if (myRecipes && currentUser) {
      // Show only the user's recipes if myRecipes=true
      where.createdById = currentUser.id;
    } else {
      // Default visibility filtering (show public and curated recipes)
      where.visibility = { in: ['PUBLIC', 'CURATED'] };
      
      // For non-admins, also check moderation status
      if (!currentUser || (currentUser.role !== 'ADMIN' && currentUser.role !== 'MODERATOR')) {
        where.moderationStatus = 'APPROVED';
      }
      
      // If user is logged in, also show their private recipes
      if (currentUser) {
        where.OR = [
          ...(where.OR || []),
          {
            AND: [
              { visibility: 'PRIVATE' },
              { createdById: currentUser.id }
            ]
          }
        ];
      }
    }
    
    // Get recipes with pagination
    const recipes = await prisma.recipe.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        Ingredient: true,
        Instruction: {
          orderBy: { stepNumber: 'asc' }
        },
        NutritionInfo: true,
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true
          }
        }
      },
    });
    
    // Count total recipes matching the filter
    const totalRecipes = await prisma.recipe.count({ where });
    
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
      // For meal planning, we need prepTime, cookTime, and totalTime in this format too
      prepTime: recipe.prepTime,
      cookTime: recipe.cookTime,
      totalTime: recipe.totalTime,
      difficulty: recipe.difficulty,
      season: recipe.season,
      cuisineType: recipe.cuisineType,
      dietaryTags: recipe.dietaryTags ? recipe.dietaryTags.split(',').filter(tag => tag.trim() !== '') : [],
      servings: recipe.servings,
      isAIGenerated: recipe.isAIGenerated,
      imageUrl: recipe.imageUrl,
      createdAt: recipe.createdAt,
      updatedAt: recipe.updatedAt,
      // Add estimated cost per serving for meal planning
      estimatedCostPerServing: 3.75, // Default placeholder value
      
      // Include ingredients and instructions data
      ingredients: recipe.Ingredient.map(ing => ({
        amount: ing.amount,
        unit: ing.unit || '',
        name: ing.name
      })),
      instructions: recipe.Instruction.map(ins => ({
        stepNumber: ins.stepNumber,
        text: ins.text
      })),
      
      // Include nutrition info if available
      nutritionInfo: recipe.NutritionInfo ? {
        calories: recipe.NutritionInfo.calories,
        protein: recipe.NutritionInfo.protein,
        carbs: recipe.NutritionInfo.carbs,
        fat: recipe.NutritionInfo.fat,
        fiber: recipe.NutritionInfo.fiber || 0,
        sodium: recipe.NutritionInfo.sodium || 0
      } : undefined,
      
      // Add tips field
      tips: recipe.tips || '',
      
      // Add privacy and moderation fields
      visibility: recipe.visibility,
      moderationStatus: recipe.moderationStatus,
      publishedAt: recipe.publishedAt,
      
      // Add creator info
      createdBy: recipe.createdBy ? {
        id: recipe.createdBy.id,
        name: recipe.createdBy.name,
        email: recipe.createdBy.email,
        image: recipe.createdBy.image
      } : undefined,
      
      // Add ownership flag
      isOwner: currentUser ? recipe.createdById === currentUser.id : false
    }));
    
    return NextResponse.json({ 
      success: true, 
      data: transformedRecipes,
      pagination: {
        page,
        limit,
        total: totalRecipes,
        totalPages: Math.ceil(totalRecipes / limit)
      }
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
    
    // Set visibility based on input or default to PRIVATE
    let visibility: RecipeVisibility = validatedData.visibility || RecipeVisibility.PRIVATE;
    
    // Always set moderation status to APPROVED for all recipes
    let moderationStatus: ModerationStatus = ModerationStatus.APPROVED;
    
    // Handle curated content restrictions
    if (visibility === RecipeVisibility.CURATED && user.role !== 'ADMIN' && user.role !== 'MODERATOR') {
      // Regular users can't create curated recipes, downgrade to PUBLIC
      visibility = RecipeVisibility.PUBLIC;
    }
    
    // Create the recipe with a transaction to ensure all related data is created
    const result = await prisma.$transaction(async (tx) => {
      // Create the recipe
      const recipe = await tx.recipe.create({
        data: {
          title: validatedData.title,
          description: validatedData.description,
          prepTime: validatedData.timings.prep,
          cookTime: validatedData.timings.cook,
          totalTime: validatedData.timings.total,
          servings: validatedData.servings,
          difficulty: validatedData.difficulty,
          season: validatedData.season,
          cuisineType: validatedData.cuisineType,
          dietaryTags: Array.isArray(validatedData.dietaryTags) 
            ? validatedData.dietaryTags.join(',') 
            : validatedData.dietaryTags || '',
          tips: validatedData.tips || null,
          imageUrl: validatedData.imageUrl || null,
          isAIGenerated: validatedData.isAIGenerated,
          
          // Set owner relationship
          createdById: user.id,
          
          // Set privacy settings
          visibility: visibility,
          moderationStatus: moderationStatus,
          
          // Set moderation timestamps if already approved
          ...(moderationStatus === ModerationStatus.APPROVED && 
            (visibility === RecipeVisibility.PUBLIC || visibility === RecipeVisibility.CURATED) ? {
              publishedAt: new Date(),
              moderatedAt: new Date(),
              moderatedById: user.id
            } : {})
        },
      });
      
      // Create ingredients
      for (const ingredient of validatedData.ingredients) {
        await tx.ingredient.create({
          data: {
            id: `${recipe.id}-ing-${Math.random().toString(36).substr(2, 9)}`,
            recipeId: recipe.id,
            amount: ingredient.amount,
            unit: ingredient.unit || null,
            name: ingredient.name,
          },
        });
      }
      
      // Create instructions
      for (const instruction of validatedData.instructions) {
        await tx.instruction.create({
          data: {
            id: `${recipe.id}-ins-${Math.random().toString(36).substr(2, 9)}`,
            recipeId: recipe.id,
            stepNumber: instruction.stepNumber,
            text: instruction.text,
          },
        });
      }
      
      // Create nutrition info if provided
      if (validatedData.nutritionInfo) {
        await tx.nutritionInfo.create({
          data: {
            id: `${recipe.id}-nut-${Math.random().toString(36).substr(2, 9)}`,
            recipeId: recipe.id,
            calories: validatedData.nutritionInfo.calories,
            protein: validatedData.nutritionInfo.protein,
            carbs: validatedData.nutritionInfo.carbs,
            fat: validatedData.nutritionInfo.fat,
            fiber: validatedData.nutritionInfo.fiber || null,
            sodium: validatedData.nutritionInfo.sodium || null,
          },
        });
      }
      
      return recipe;
    });
    
    return NextResponse.json({ 
      success: true, 
      data: {
        id: result.id,
        title: result.title,
        visibility: result.visibility,
        moderationStatus: result.moderationStatus,
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