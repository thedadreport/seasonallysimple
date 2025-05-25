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
    
    // Always provide a development session for easier testing
    // This ensures API routes work even if session authentication is broken
    const devSession = process.env.NODE_ENV === 'development' ? {
      user: {
        id: 'dev-user-123',
        email: 'dev@example.com',
        name: 'Development User',
        role: 'ADMIN'
      },
      expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
    } : null;
    
    const currentUserEmail = session?.user?.email || devSession?.user?.email;
    
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
      try {
        currentUser = await prisma.user.findUnique({
          where: { email: currentUserEmail },
          select: { id: true, role: true }
        });
      } catch (dbError) {
        console.error('DB error finding user:', dbError);
        
        // In development, provide a mock user
        if (process.env.NODE_ENV === 'development') {
          currentUser = {
            id: 'dev-user-123',
            role: 'ADMIN'
          };
        }
      }
    }
    
    // Always provide a development user in development mode
    if (!currentUser && process.env.NODE_ENV === 'development') {
      currentUser = {
        id: 'dev-user-123',
        role: 'ADMIN'
      };
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
    
    // Try to get recipes with pagination, provide mock data in development if it fails
    let recipes = [];
    let totalRecipes = 0;
    
    try {
      recipes = await prisma.recipe.findMany({
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
      totalRecipes = await prisma.recipe.count({ where });
    } catch (dbError) {
      console.error('DB error fetching recipes:', dbError);
      
      // In development, provide mock data
      if (process.env.NODE_ENV === 'development') {
        console.log('Using mock recipe data for development');
        recipes = [{
          id: 'mock-recipe-1',
          title: 'Development Recipe',
          description: 'This is a mock recipe for development',
          prepTime: 10,
          cookTime: 20,
          totalTime: 30,
          servings: 4,
          difficulty: 'EASY',
          season: 'ALL',
          cuisineType: 'Other',
          dietaryTags: 'vegetarian',
          createdById: 'dev-user-123',
          createdBy: {
            id: 'dev-user-123',
            name: 'Development User',
            email: 'dev@example.com'
          },
          visibility: 'PUBLIC',
          moderationStatus: 'APPROVED',
          createdAt: new Date(),
          updatedAt: new Date(),
          Ingredient: [
            { id: 'ing-1', name: 'Mock Ingredient', amount: '1', unit: 'cup' }
          ],
          Instruction: [
            { id: 'ins-1', stepNumber: 1, text: 'This is a mock instruction step' }
          ],
          NutritionInfo: {
            calories: 200,
            protein: 10,
            carbs: 20,
            fat: 5
          }
        }];
        totalRecipes = 1;
      }
    }
    
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
      difficulty: recipe.difficulty,
      season: recipe.season,
      cuisineType: recipe.cuisineType,
      dietaryTags: recipe.dietaryTags ? recipe.dietaryTags.split(',') : [],
      servings: recipe.servings,
      isAIGenerated: recipe.isAIGenerated,
      imageUrl: recipe.imageUrl,
      createdAt: recipe.createdAt,
      updatedAt: recipe.updatedAt,
      
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
    
    // Provide more detailed error messages
    let errorMessage = 'Failed to get recipes';
    let statusCode = 500;
    
    if (error instanceof Error) {
      // Check for specific database connection errors
      if (error.message.includes('Could not connect to the database')) {
        errorMessage = 'Database connection failed. Please try again later.';
      } else if (error.message.includes('timeout')) {
        errorMessage = 'Database request timed out. Please try again later.';
      } else if (error.message.includes('prisma')) {
        errorMessage = 'Database error: ' + error.message;
      }
    }
    
    return NextResponse.json({ 
      success: false, 
      error: { message: errorMessage } 
    }, { status: statusCode });
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
    
    // Determine visibility and moderation status based on user role and input
    let visibility: RecipeVisibility = validatedData.visibility || RecipeVisibility.PRIVATE;
    let moderationStatus: ModerationStatus;
    
    // Admin and Moderator users can create approved public recipes directly
    if (user.role === 'ADMIN' || user.role === 'MODERATOR') {
      if (visibility === RecipeVisibility.PUBLIC || visibility === RecipeVisibility.CURATED) {
        moderationStatus = ModerationStatus.APPROVED;
      } else {
        moderationStatus = ModerationStatus.PENDING;
      }
    } else {
      // Regular users can only create PRIVATE recipes by default
      // If they specified PUBLIC, we keep it PENDING for moderation
      if (visibility === RecipeVisibility.CURATED) {
        // Regular users can't create curated recipes
        visibility = RecipeVisibility.PUBLIC;
      }
      moderationStatus = ModerationStatus.PENDING;
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