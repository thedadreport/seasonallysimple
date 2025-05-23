import { NextRequest, NextResponse } from 'next/server';
import { Session } from '@/lib/auth/session';
import { withAuth, validateRequiredFields } from '@/lib/auth/apiAuth';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET - Get meal plans for the current user
export const GET = withAuth(async (request: NextRequest, session: Session) => {
  try {
    // Get query parameters for date range
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // Build where clause based on provided parameters
    const where: any = {
      userId: session.user?.id,
    };

    // Add date filters if provided
    if (startDate) {
      where.startDate = {
        gte: new Date(startDate),
      };
    }

    if (endDate) {
      where.endDate = {
        lte: new Date(endDate),
      };
    }

    // Fetch meal plans
    const mealPlans = await prisma.mealPlan.findMany({
      where,
      include: {
        items: {
          include: {
            recipe: true,
          },
          orderBy: {
            date: 'asc',
          },
        },
      },
      orderBy: {
        startDate: 'desc',
      },
    });

    return NextResponse.json(mealPlans);
  } catch (error) {
    console.error('Failed to fetch meal plans:', error);
    return NextResponse.json(
      { error: 'Failed to fetch meal plans' },
      { status: 500 }
    );
  }
});

// POST - Create or update a meal plan
export const POST = withAuth(async (request: NextRequest, session: Session) => {
  try {
    const data = await request.json();
    const { startDate, endDate, name, meals } = data;

    // Validate required fields
    const validationError = validateRequiredFields(data, ['startDate', 'endDate', 'name', 'meals']);
    if (validationError) return validationError;

    // Check if meal plan already exists for this date range
    const existingMealPlan = await prisma.mealPlan.findFirst({
      where: {
        userId: session.user?.id,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
      },
    });

    // Create or update the meal plan
    let mealPlan;
    if (existingMealPlan) {
      // Update existing meal plan
      mealPlan = await prisma.mealPlan.update({
        where: {
          id: existingMealPlan.id,
        },
        data: {
          name,
          updatedAt: new Date(),
        },
      });

      // Delete existing meal plan items
      await prisma.mealPlanItem.deleteMany({
        where: {
          mealPlanId: mealPlan.id,
        },
      });
    } else {
      // Create new meal plan
      mealPlan = await prisma.mealPlan.create({
        data: {
          userId: session.user?.id as string,
          name,
          startDate: new Date(startDate),
          endDate: new Date(endDate),
        },
      });
    }

    // Create meal plan items
    const mealPlanItems = [];
    for (const day of meals) {
      for (const meal of day.meals) {
        if (meal.recipe) {
          mealPlanItems.push(
            await prisma.mealPlanItem.create({
              data: {
                mealPlanId: mealPlan.id,
                recipeId: meal.recipe.id,
                date: new Date(day.date),
                mealType: meal.type,
              },
            })
          );
        }
      }
    }

    return NextResponse.json({
      message: 'Meal plan saved successfully',
      mealPlan: {
        ...mealPlan,
        items: mealPlanItems,
      },
    });
  } catch (error) {
    console.error('Failed to save meal plan:', error);
    return NextResponse.json(
      { error: 'Failed to save meal plan' },
      { status: 500 }
    );
  }
});