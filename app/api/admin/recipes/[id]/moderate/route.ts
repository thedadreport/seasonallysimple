import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getSession } from '@/lib/auth/session';
import prisma from '@/lib/prisma';

// Validation schema for moderation
const moderationSchema = z.object({
  moderationStatus: z.enum(['PENDING', 'APPROVED', 'REJECTED', 'FLAGGED']),
  moderationNotes: z.string().optional(),
  visibility: z.enum(['PRIVATE', 'PUBLIC', 'CURATED']).optional(),
});

// PUT handler for moderating a recipe
export async function PUT(
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
    
    // Get the recipe
    const recipe = await prisma.recipe.findUnique({
      where: { id: recipeId },
      include: {
        createdBy: {
          select: {
            email: true,
            name: true
          }
        }
      }
    });
    
    if (!recipe) {
      return NextResponse.json({ 
        success: false, 
        error: { message: 'Recipe not found' } 
      }, { status: 404 });
    }
    
    // Parse and validate the request body
    const body = await request.json();
    const validatedData = moderationSchema.parse(body);
    
    // Only admins can set a recipe as CURATED
    if (
      validatedData.visibility === 'CURATED' && 
      user.role !== 'ADMIN'
    ) {
      return NextResponse.json({ 
        success: false, 
        error: { message: 'Only admins can set a recipe as curated' } 
      }, { status: 403 });
    }
    
    // Default visibility to PUBLIC for approved recipes if not specified
    let visibility = validatedData.visibility || recipe.visibility;
    
    // If approved, set visibility to PUBLIC unless specified otherwise
    if (validatedData.moderationStatus === 'APPROVED' && recipe.visibility === 'PRIVATE' && !validatedData.visibility) {
      visibility = 'PUBLIC';
    }
    
    // If rejected, set visibility back to PRIVATE
    if (validatedData.moderationStatus === 'REJECTED' && (recipe.visibility === 'PUBLIC' || recipe.visibility === 'CURATED')) {
      visibility = 'PRIVATE';
    }
    
    // Update the recipe
    const updatedRecipe = await prisma.recipe.update({
      where: { id: recipeId },
      data: {
        moderationStatus: validatedData.moderationStatus,
        moderationNotes: validatedData.moderationNotes || recipe.moderationNotes,
        visibility: visibility,
        moderatedById: user.id,
        moderatedAt: new Date(),
        // Set publishedAt timestamp for newly approved recipes
        publishedAt: validatedData.moderationStatus === 'APPROVED' && !recipe.publishedAt 
          ? new Date() 
          : recipe.publishedAt
      },
    });
    
    // TODO: Send notification to recipe creator about moderation result
    
    return NextResponse.json({
      success: true,
      data: {
        id: updatedRecipe.id,
        visibility: updatedRecipe.visibility,
        moderationStatus: updatedRecipe.moderationStatus,
        moderatedAt: updatedRecipe.moderatedAt
      }
    });
    
  } catch (error) {
    console.error('Error moderating recipe:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({ 
        success: false, 
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid moderation data',
          details: error.errors
        }
      }, { status: 400 });
    }
    
    return NextResponse.json({ 
      success: false, 
      error: { message: 'Failed to moderate recipe' } 
    }, { status: 500 });
  }
}