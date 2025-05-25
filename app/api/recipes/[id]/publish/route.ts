import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getSession } from '@/lib/auth/session';
import prisma from '@/lib/prisma';

// Validation schema for publish request
const publishRequestSchema = z.object({
  notes: z.string().optional(),
});

// POST handler for publishing a recipe
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const recipeId = params.id;
    
    // Get the user session
    const session = await getSession();
    
    if (!session?.user?.email) {
      return NextResponse.json({ 
        success: false, 
        error: { message: 'Unauthorized' } 
      }, { status: 401 });
    }
    
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
    
    // Get the recipe
    const recipe = await prisma.recipe.findUnique({
      where: { id: recipeId },
    });
    
    if (!recipe) {
      return NextResponse.json({ 
        success: false, 
        error: { message: 'Recipe not found' } 
      }, { status: 404 });
    }
    
    // Check ownership
    if (recipe.createdById !== user.id && user.role !== 'ADMIN' && user.role !== 'MODERATOR') {
      return NextResponse.json({ 
        success: false, 
        error: { message: 'You do not have permission to publish this recipe' } 
      }, { status: 403 });
    }
    
    // Parse and validate the request body
    const body = await request.json();
    const validatedData = publishRequestSchema.parse(body);
    
    // Check if recipe can be published
    if (recipe.visibility === 'CURATED' && user.role !== 'ADMIN' && user.role !== 'MODERATOR') {
      return NextResponse.json({ 
        success: false, 
        error: { message: 'Only admins and moderators can set a recipe as curated' } 
      }, { status: 403 });
    }
    
    // Determine the new moderation status
    let newModerationStatus = recipe.moderationStatus;
    
    // Admins and moderators can publish directly
    if (user.role === 'ADMIN' || user.role === 'MODERATOR') {
      newModerationStatus = 'APPROVED';
    } else if (recipe.visibility === 'PRIVATE') {
      // User is publishing a private recipe - needs moderation
      newModerationStatus = 'PENDING';
    }
    
    // Update the recipe
    const updatedRecipe = await prisma.recipe.update({
      where: { id: recipeId },
      data: {
        visibility: 'PUBLIC',
        moderationStatus: newModerationStatus,
        moderationNotes: validatedData.notes || recipe.moderationNotes,
        
        // If approved by admin/moderator, set the timestamps
        ...(newModerationStatus === 'APPROVED' ? {
          publishedAt: new Date(),
          moderatedAt: new Date(),
          moderatedById: user.id
        } : {})
      },
    });
    
    return NextResponse.json({
      success: true,
      data: {
        id: updatedRecipe.id,
        visibility: updatedRecipe.visibility,
        moderationStatus: updatedRecipe.moderationStatus,
        needsReview: newModerationStatus === 'PENDING',
      }
    });
    
  } catch (error) {
    console.error('Error publishing recipe:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({ 
        success: false, 
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid request data',
          details: error.errors
        }
      }, { status: 400 });
    }
    
    return NextResponse.json({ 
      success: false, 
      error: { message: 'Failed to publish recipe' } 
    }, { status: 500 });
  }
}