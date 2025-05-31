import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import prisma from '@/lib/prisma';

// Force dynamic rendering to avoid static errors with request.url
export const dynamic = 'force-dynamic';

// GET handler to retrieve recipes pending moderation
export async function GET(request: Request) {
  try {
    // Get the user session
    const session = await getSession();
    
    if (!session?.user?.email) {
      return NextResponse.json({ 
        success: false, 
        error: { message: 'Unauthorized' } 
      }, { status: 401 });
    }
    
    // Get user from database and check if admin/moderator
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
    
    // Check if user has moderation privileges
    if (user.role !== 'ADMIN' && user.role !== 'MODERATOR') {
      return NextResponse.json({ 
        success: false, 
        error: { message: 'Permission denied' } 
      }, { status: 403 });
    }
    
    // Parse URL parameters
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '10');
    const search = url.searchParams.get('search') || '';
    
    // Build where clause for filtering
    const where: any = {
      moderationStatus: 'PENDING',
      visibility: 'PUBLIC'
    };
    
    // Add search filter if provided
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ];
    }
    
    // Get recipes with pagination
    const recipes = await prisma.recipe.findMany({
      where,
      orderBy: { createdAt: 'asc' }, // Oldest first
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
      difficulty: recipe.difficulty,
      season: recipe.season,
      cuisineType: recipe.cuisineType,
      dietaryTags: recipe.dietaryTags ? recipe.dietaryTags.split(',') : [],
      servings: recipe.servings,
      isAIGenerated: recipe.isAIGenerated,
      imageUrl: recipe.imageUrl,
      createdAt: recipe.createdAt,
      updatedAt: recipe.updatedAt,
      
      // Add creator info
      createdBy: recipe.createdBy ? {
        id: recipe.createdBy.id,
        name: recipe.createdBy.name,
        email: recipe.createdBy.email,
        image: recipe.createdBy.image
      } : null,
      
      // Privacy and moderation fields
      visibility: recipe.visibility,
      moderationStatus: recipe.moderationStatus,
      moderationNotes: recipe.moderationNotes,
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
    console.error('Error getting pending recipes:', error);
    return NextResponse.json({ 
      success: false, 
      error: { message: 'Failed to get pending recipes' } 
    }, { status: 500 });
  }
}