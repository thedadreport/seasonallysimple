import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// This endpoint is used by a Vercel cron job to check database health
export async function GET(request: Request) {
  try {
    // Verify DB connection
    await prisma.$queryRaw`SELECT 1`;
    
    // Get some basic stats
    const userCount = await prisma.user.count();
    const recipeCount = await prisma.recipe.count();
    
    return NextResponse.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      database: {
        connected: true,
        stats: {
          users: userCount,
          recipes: recipeCount
        }
      }
    });
  } catch (error) {
    console.error('Database health check failed:', error);
    return NextResponse.json({
      status: 'error',
      message: 'Database health check failed',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}