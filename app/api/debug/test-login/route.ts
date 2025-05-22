import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { compare } from 'bcryptjs';

// Create a dedicated Prisma instance
const prisma = new PrismaClient();

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const email = searchParams.get('email');
  const password = searchParams.get('password');
  
  if (!email || !password) {
    return NextResponse.json({
      success: false,
      error: 'Email and password parameters are required'
    }, { status: 400 });
  }
  
  try {
    console.log(`Attempting to authenticate user: ${email}`);
    
    // Find the user by email
    const user = await prisma.user.findUnique({
      where: { email },
    });
    
    if (!user) {
      return NextResponse.json({
        success: false,
        error: 'User not found',
        debug: { emailSearched: email }
      }, { status: 404 });
    }
    
    if (!user.password) {
      // Check if there are OAuth accounts - we need to fetch them separately
      const accounts = await prisma.account.findMany({
        where: { userId: user.id }
      });
      
      return NextResponse.json({
        success: false,
        error: 'User has no password set',
        debug: { hasOAuth: accounts.length > 0 }
      }, { status: 400 });
    }
    
    // Check password
    const isPasswordValid = await compare(password, user.password);
    
    if (!isPasswordValid) {
      return NextResponse.json({
        success: false,
        error: 'Invalid password',
        debug: { passwordLength: password.length }
      }, { status: 401 });
    }
    
    // Success! Return user without password
    const { password: _, ...userWithoutPassword } = user;
    
    return NextResponse.json({
      success: true,
      message: 'Authentication successful',
      user: userWithoutPassword
    });
  } catch (error) {
    console.error('Login test error:', error);
    
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