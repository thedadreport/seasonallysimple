import { NextRequest, NextResponse } from 'next/server';
import { generateWeeklyMealPlan } from '@/lib/services/claudeService';
import prisma from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Extract parameters from request body
    const {
      dietaryRestrictions,
      servings,
      season,
      weeklyBudget,
      quickMealsNeeded,
      familyFriendly,
      preferredCuisines,
      includeBreakfast,
      includeLunch,
      includeDinner,
      mealPrepFriendly,
    } = body;
    
    // Validate required parameters
    if (!servings || !season) {
      return NextResponse.json(
        { error: 'Missing required parameters: servings and season are required' },
        { status: 400 }
      );
    }
    
    // Call the Claude service to generate a meal plan
    const mealPlan = await generateWeeklyMealPlan({
      dietaryRestrictions,
      servings,
      season,
      weeklyBudget,
      quickMealsNeeded,
      familyFriendly,
      preferredCuisines,
      includeBreakfast,
      includeLunch,
      includeDinner,
      mealPrepFriendly,
    });
    
    // Return the generated meal plan
    return NextResponse.json(mealPlan);
  } catch (error) {
    console.error('Error generating meal plan:', error);
    return NextResponse.json(
      { error: 'Failed to generate meal plan' },
      { status: 500 }
    );
  }
}