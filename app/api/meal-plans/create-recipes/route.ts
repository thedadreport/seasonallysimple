import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import prisma from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    
    // Check if user is authenticated
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const userId = session.user.id;
    const body = await request.json();
    
    // Extract recipes from request body
    const { recipes } = body;
    
    if (!recipes || !Array.isArray(recipes) || recipes.length === 0) {
      return NextResponse.json(
        { error: 'Missing required parameter: recipes' },
        { status: 400 }
      );
    }
    
    // Create recipes in database
    const createdRecipes = [];
    
    for (const recipe of recipes) {
      const createdRecipe = await prisma.recipe.create({
        data: {
          title: recipe.title,
          description: recipe.description || '',
          prepTime: recipe.timings?.prep || 0,
          cookTime: recipe.timings?.cook || 0,
          totalTime: recipe.timings?.total || 0,
          servings: recipe.servings || 4,
          difficulty: recipe.cookingDifficulty || 'easy',
          season: '',
          cuisineType: '',
          dietaryTags: recipe.tags?.join(',') || '',
          visibility: 'PRIVATE',
          isAIGenerated: true,
          createdById: userId,
        }
      });
      
      createdRecipes.push({
        id: createdRecipe.id,
        title: createdRecipe.title,
        originalId: recipe.title // Keep track of the original title for mapping
      });
    }
    
    return NextResponse.json({
      message: 'Recipes created successfully',
      recipes: createdRecipes
    });
  } catch (error) {
    console.error('Error creating recipes:', error);
    return NextResponse.json(
      { error: 'Failed to create recipes' },
      { status: 500 }
    );
  }
}