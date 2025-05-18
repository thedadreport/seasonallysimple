import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getSession } from '@/lib/auth/session';
import prisma from '@/lib/prisma';

// Define the comment schema for validation
const commentSchema = z.object({
  content: z.string().min(1, "Comment content is required"),
});

// POST handler to add a comment to a recipe
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession();
    
    if (!session?.user?.email) {
      return NextResponse.json({ 
        success: false, 
        error: { message: 'Unauthorized' } 
      }, { status: 401 });
    }
    
    const recipeId = params.id;
    
    // Get and validate the request body
    const body = await request.json();
    const validatedData = commentSchema.parse(body);
    
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
    
    // Check if recipe exists
    const recipe = await prisma.recipe.findUnique({
      where: { id: recipeId },
    });
    
    if (!recipe) {
      return NextResponse.json({ 
        success: false, 
        error: { message: 'Recipe not found' } 
      }, { status: 404 });
    }
    
    // Create the comment
    const comment = await prisma.recipeComment.create({
      data: {
        content: validatedData.content,
        user: {
          connect: { id: user.id },
        },
        recipe: {
          connect: { id: recipeId },
        },
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
      },
    });
    
    return NextResponse.json({ 
      success: true, 
      data: {
        id: comment.id,
        content: comment.content,
        createdAt: comment.createdAt,
        user: comment.user,
      }
    }, { status: 201 });
    
  } catch (error) {
    console.error('Error adding comment:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({ 
        success: false, 
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid comment data',
          details: error.errors
        }
      }, { status: 400 });
    }
    
    return NextResponse.json({ 
      success: false, 
      error: { message: 'Failed to add comment' } 
    }, { status: 500 });
  }
}

// GET handler to retrieve comments for a recipe
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const recipeId = params.id;
    
    // Get comments for the recipe
    const comments = await prisma.recipeComment.findMany({
      where: { recipeId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
    
    return NextResponse.json({ 
      success: true, 
      data: comments.map(comment => ({
        id: comment.id,
        content: comment.content,
        createdAt: comment.createdAt,
        user: comment.user,
      }))
    });
    
  } catch (error) {
    console.error('Error getting comments:', error);
    return NextResponse.json({ 
      success: false, 
      error: { message: 'Failed to get comments' } 
    }, { status: 500 });
  }
}