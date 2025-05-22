import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { hash } from 'bcrypt';

const prisma = new PrismaClient();

export async function GET() {
  try {
    // Create a test user directly with Prisma, bypassing the registration API
    const hashedPassword = await hash('Test123', 10);
    
    // Generate a unique email to avoid conflicts
    const email = `test${Date.now()}@example.com`;
    
    // Log what we're about to do
    console.log(`Attempting to create test user with email: ${email}`);
    
    // Create the user using Prisma directly
    const user = await prisma.user.create({
      data: {
        email: email,
        name: 'Test User',
        firstName: 'Test',
        lastName: 'User',
        password: hashedPassword,
      },
    });
    
    // If we reach here, user creation succeeded
    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      }
    });
  } catch (error) {
    // Log detailed error information
    console.error('Test registration error:', error);
    
    let errorDetails;
    try {
      errorDetails = {
        message: error instanceof Error ? error.message : String(error),
        name: error instanceof Error ? error.name : 'Unknown',
        code: (error as any).code,
        meta: (error as any).meta,
      };
    } catch (e) {
      errorDetails = { parseError: String(e) };
    }
    
    return NextResponse.json({
      success: false,
      error: 'Failed to create test user',
      details: errorDetails
    }, { status: 500 });
  } finally {
    // Always disconnect the Prisma client
    await prisma.$disconnect();
  }
}