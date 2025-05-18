import { NextResponse } from 'next/server';
import { z } from 'zod';
import { generateRecipe } from '@/lib/services/claudeService';

// Define the input schema
const recipeGenerationSchema = z.object({
  dietaryRestrictions: z.array(z.string()).optional(),
  cookingTime: z.enum(['FIFTEEN_MINUTES_OR_LESS', 'THIRTY_MINUTES_OR_LESS', 'UP_TO_1_HOUR', 'MORE_THAN_1_HOUR']),
  season: z.enum(['SPRING', 'SUMMER', 'FALL', 'WINTER']),
  servings: z.number().min(1).max(12),
  skillLevel: z.enum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED']),
  cuisineType: z.string().min(1),
  specialRequests: z.string().optional(),
});

export async function POST(request: Request) {
  try {
    // Parse and validate the request body
    const body = await request.json();
    const validatedData = recipeGenerationSchema.parse(body);
    
    // Log the request parameters for debugging
    console.log('Recipe generation request:', validatedData);
    
    // Generate recipe using the Claude service
    const recipe = await generateRecipe(validatedData);
    
    // Return the generated recipe
    return NextResponse.json({ 
      success: true, 
      data: recipe
    });
    
  } catch (error) {
    console.error('Error generating recipe:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({ 
        success: false, 
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid recipe generation parameters',
          details: error.errors
        }
      }, { status: 400 });
    }
    
    // Handle specific Claude API errors
    if (error instanceof Error) {
      if (error.message.includes('Claude API')) {
        return NextResponse.json({ 
          success: false, 
          error: {
            code: 'CLAUDE_API_ERROR',
            message: 'Error calling Claude API for recipe generation',
            details: error.message
          }
        }, { status: 502 }); // Bad Gateway for external API issues
      }
      
      if (error.message.includes('parse')) {
        return NextResponse.json({ 
          success: false, 
          error: {
            code: 'PARSING_ERROR',
            message: 'Error parsing recipe from Claude response',
            details: error.message
          }
        }, { status: 500 });
      }
    }
    
    // Generic error handler as fallback
    return NextResponse.json({ 
      success: false, 
      error: {
        code: 'SERVER_ERROR',
        message: 'An error occurred during recipe generation',
        details: error instanceof Error ? error.message : 'Unknown error'
      }
    }, { status: 500 });
  }
}