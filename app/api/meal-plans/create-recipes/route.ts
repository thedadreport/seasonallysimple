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
    
    // Define the interface for recipe objects
    interface RecipeInput {
      title: string;
      description?: string;
      timings?: {
        prep?: number;
        cook?: number;
        total?: number;
      };
      servings?: number;
      cookingDifficulty?: string;
      season?: string;
      tags?: string[];
      estimatedCostPerServing?: number;
      tips?: string;
      nutritionInfo?: {
        calories: number;
        protein: number;
        carbs: number;
        fat: number;
        fiber?: number;
        sodium?: number;
      };
      ingredients?: Array<{
        amount?: string;
        unit?: string;
        name: string;
      }>;
      instructions?: Array<{
        stepNumber: number;
        text: string;
      }>;
    }
    
    for (const recipe of recipes as RecipeInput[]) {
      // Create the recipe with basic information
      const createdRecipe = await prisma.recipe.create({
        data: {
          title: recipe.title,
          description: recipe.description || '',
          prepTime: recipe.timings?.prep || 0,
          cookTime: recipe.timings?.cook || 0,
          totalTime: recipe.timings?.total || 0,
          servings: recipe.servings || 4,
          difficulty: recipe.cookingDifficulty || 'easy',
          season: recipe.season || '',
          cuisineType: recipe.tags?.find((tag: string) => 
            ['italian', 'mexican', 'asian', 'mediterranean', 'american', 'indian', 'french', 'middle eastern']
            .includes(tag.toLowerCase())
          ) || '',
          dietaryTags: recipe.tags?.join(',') || '',
          visibility: 'PUBLIC', // Make them public so they can be found by other users
          moderationStatus: 'APPROVED', // Auto-approve AI-generated recipes
          isAIGenerated: true,
          createdById: userId,
          publishedAt: new Date(), // Set publication date so they appear in search
          // Add estimated cost if available
          ...(recipe.estimatedCostPerServing ? {
            tips: `Estimated cost per serving: $${recipe.estimatedCostPerServing.toFixed(2)}. ${recipe.tips || ''}`
          } : {
            tips: recipe.tips || ''
          })
        }
      });
      
      // If the recipe has nutritional information, add it
      if (recipe.nutritionInfo) {
        try {
          await prisma.nutritionInfo.create({
            data: {
              id: `nutrition-${createdRecipe.id}`,
              recipeId: createdRecipe.id,
              calories: recipe.nutritionInfo.calories || 0,
              protein: recipe.nutritionInfo.protein || 0,
              carbs: recipe.nutritionInfo.carbs || 0,
              fat: recipe.nutritionInfo.fat || 0,
              fiber: recipe.nutritionInfo.fiber || 0,
              sodium: recipe.nutritionInfo.sodium || 0
            }
          });
        } catch (error) {
          console.error('Failed to create nutrition info:', error);
          // Continue anyway, the recipe is more important than the nutrition info
        }
      }
      
      // If the recipe has ingredients, add them
      if (recipe.ingredients && Array.isArray(recipe.ingredients)) {
        try {
          // Create ingredients for the recipe
          const ingredientsPromises = recipe.ingredients.map((ingredient: {amount?: string, unit?: string, name?: string}, index: number) => {
            return prisma.ingredient.create({
              data: {
                id: `${createdRecipe.id}-ingredient-${index}`,
                recipeId: createdRecipe.id,
                amount: ingredient.amount || '',
                unit: ingredient.unit || '',
                name: ingredient.name || ''
              }
            });
          });
          
          await Promise.all(ingredientsPromises);
        } catch (error) {
          console.error('Failed to create ingredients:', error);
          // Continue anyway, the recipe is still usable
        }
      }
      
      // If the recipe has instructions, add them
      if (recipe.instructions && Array.isArray(recipe.instructions)) {
        try {
          // Create instructions for the recipe
          const instructionsPromises = recipe.instructions.map((instruction: {stepNumber: number, text: string}) => {
            return prisma.instruction.create({
              data: {
                id: `${createdRecipe.id}-instruction-${instruction.stepNumber}`,
                recipeId: createdRecipe.id,
                stepNumber: instruction.stepNumber,
                text: instruction.text
              }
            });
          });
          
          await Promise.all(instructionsPromises);
        } catch (error) {
          console.error('Failed to create instructions:', error);
          // Continue anyway, the recipe is still usable
        }
      }
      
      createdRecipes.push({
        id: createdRecipe.id,
        title: createdRecipe.title,
        originalId: recipe.title, // Keep track of the original title for mapping
        description: createdRecipe.description,
        difficulty: createdRecipe.difficulty,
        prepTime: createdRecipe.prepTime,
        cookTime: createdRecipe.cookTime,
        totalTime: createdRecipe.totalTime,
        servings: createdRecipe.servings,
        isComplete: true // Mark as complete so UI knows it's a full recipe
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