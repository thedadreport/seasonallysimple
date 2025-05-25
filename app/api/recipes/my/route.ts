import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import prisma from '@/lib/prisma';

// GET handler to retrieve user's own recipes
export async function GET(request: Request) {
  try {
    // Get the user session
    const session = await getSession();
    
    // Always provide a development session for easier testing
    const devSession = process.env.NODE_ENV === 'development' ? {
      user: {
        id: 'dev-user-123',
        email: 'dev@example.com',
        name: 'Development User',
        role: 'ADMIN'
      },
      expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
    } : null;
    
    const userEmail = session?.user?.email || devSession?.user?.email;
    
    if (!userEmail) {
      return NextResponse.json({ 
        success: false, 
        error: { message: 'Unauthorized' } 
      }, { status: 401 });
    }
    
    // Get user from database
    let user = null;
    try {
      user = await prisma.user.findUnique({
        where: { email: userEmail },
      });
    } catch (dbError) {
      console.error('DB error finding user:', dbError);
    }
    
    // In development, provide a mock user even if DB fails
    if (!user && process.env.NODE_ENV === 'development') {
      user = {
        id: 'dev-user-123',
        email: 'dev@example.com',
        name: 'Development User',
        role: 'ADMIN'
      };
    } else if (!user) {
      return NextResponse.json({ 
        success: false, 
        error: { message: 'User not found' } 
      }, { status: 404 });
    }
    
    // Parse URL parameters
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '10');
    const search = url.searchParams.get('search') || '';
    const status = url.searchParams.get('status'); // PRIVATE, PENDING, APPROVED, REJECTED
    
    // Build where clause for filtering
    const where: any = {
      createdById: user.id
    };
    
    // Add search filter if provided
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ];
    }
    
    // Filter by recipe status
    if (status === 'PRIVATE') {
      where.visibility = 'PRIVATE';
    } else if (status === 'PENDING') {
      where.visibility = 'PUBLIC';
      where.moderationStatus = 'PENDING';
    } else if (status === 'APPROVED') {
      where.visibility = { in: ['PUBLIC', 'CURATED'] };
      where.moderationStatus = 'APPROVED';
    } else if (status === 'REJECTED') {
      where.moderationStatus = 'REJECTED';
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
          moderatedBy: {
            select: {
              id: true,
              name: true,
              email: true,
            }
          }
        },
      });
      
      // Count total recipes matching the filter
      totalRecipes = await prisma.recipe.count({ where });
    } catch (dbError) {
      console.error('DB error fetching my recipes:', dbError);
      
      // In development, provide mock data
      if (process.env.NODE_ENV === 'development') {
        console.log('Using mock recipe data for development');
        recipes = [{
          id: 'mock-my-recipe-1',
          title: 'My Development Recipe',
          description: 'This is a mock recipe for development',
          prepTime: 15,
          cookTime: 25,
          totalTime: 40,
          servings: 2,
          difficulty: 'MEDIUM',
          season: 'SUMMER',
          cuisineType: 'Italian',
          dietaryTags: 'vegetarian,gluten-free',
          visibility: 'PRIVATE',
          moderationStatus: 'PENDING',
          createdAt: new Date(),
          updatedAt: new Date(),
          Ingredient: [
            { id: 'ing-my-1', name: 'Mock Personal Ingredient', amount: '2', unit: 'tbsp' }
          ],
          Instruction: [
            { id: 'ins-my-1', stepNumber: 1, text: 'This is a mock personal instruction step' }
          ],
          NutritionInfo: {
            calories: 300,
            protein: 15,
            carbs: 30,
            fat: 10
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
      
      // Privacy and moderation fields
      visibility: recipe.visibility,
      moderationStatus: recipe.moderationStatus,
      publishedAt: recipe.publishedAt,
      moderatedAt: recipe.moderatedAt,
      moderationNotes: recipe.moderationNotes,
      
      // Add moderator info if available
      moderatedBy: recipe.moderatedBy ? {
        id: recipe.moderatedBy.id,
        name: recipe.moderatedBy.name,
        email: recipe.moderatedBy.email,
      } : null,
      
      // Calculated fields
      isPublic: recipe.visibility === 'PUBLIC' || recipe.visibility === 'CURATED',
      isPending: recipe.moderationStatus === 'PENDING',
      isRejected: recipe.moderationStatus === 'REJECTED',
      isApproved: recipe.moderationStatus === 'APPROVED',
      isCurated: recipe.visibility === 'CURATED',
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
    console.error('Error getting user recipes:', error);
    
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