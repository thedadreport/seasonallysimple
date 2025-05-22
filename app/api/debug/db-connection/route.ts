import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// This is a diagnostic endpoint to check database connectivity
export async function GET() {
  try {
    // Try to connect to the database
    const users = await prisma.user.count();
    const accounts = await prisma.account.count();
    const recipes = await prisma.recipe.count();
    
    // Return counts without exposing sensitive data
    return NextResponse.json({ 
      status: 'connected',
      counts: {
        users,
        accounts,
        recipes
      }
    });
  } catch (error) {
    console.error('Database connection error:', error);
    
    return NextResponse.json({ 
      status: 'error',
      message: error instanceof Error ? error.message : String(error),
      name: error instanceof Error ? error.name : 'Unknown error type'
    }, { status: 500 });
  }
}