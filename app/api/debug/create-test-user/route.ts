import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { hash } from 'bcrypt';

// Create a dedicated instance for this request
const prisma = new PrismaClient();

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const password = searchParams.get('password') || 'TestPassword123';
  const email = searchParams.get('email') || `test${Date.now()}@example.com`;
  const firstName = searchParams.get('firstName') || 'Test';
  const lastName = searchParams.get('lastName') || 'User';
  
  try {
    console.log(`Creating test user with email: ${email}`);
    
    const hashedPassword = await hash(password, 10);
    
    const newUser = await prisma.user.create({
      data: {
        email,
        firstName,
        lastName,
        name: `${firstName} ${lastName}`,
        password: hashedPassword,
      },
    });
    
    const { password: _, ...userWithoutPassword } = newUser;
    
    return NextResponse.json({
      success: true,
      message: 'Test user created successfully',
      user: userWithoutPassword
    });
  } catch (error) {
    console.error('Error creating test user:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : String(error),
      code: (error as any)?.code,
      meta: (error as any)?.meta
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}