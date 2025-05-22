import { NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { PrismaClient } from '@prisma/client';

// Create a dedicated Prisma instance for this route
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
});

// Log the database URL (without showing credentials)
const dbUrl = process.env.DATABASE_URL || '';
console.log('Database URL format check:', {
  hasProtocol: dbUrl.startsWith('postgresql://') || dbUrl.startsWith('postgres://'),
  length: dbUrl.length,
  firstChars: dbUrl.slice(0, 12) + '...'
});

export async function POST(request: Request) {
  try {
    console.log("Simple registration API called");
    const body = await request.json();
    const { firstName, lastName, email, password } = body;
    
    if (!email || !password || !firstName || !lastName) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 });
    }
    
    try {
      // Check for existing user
      const existingUser = await prisma.user.findUnique({
        where: { email: email.toLowerCase() }
      });
      
      if (existingUser) {
        return NextResponse.json({ error: 'Email already exists' }, { status: 400 });
      }
    } catch (findError) {
      console.error('Error checking for existing user:', findError);
      return NextResponse.json(
        { error: 'Database connection error', details: String(findError) },
        { status: 500 }
      );
    }
    
    // Hash the password
    const hashedPassword = await hash(password, 10);
    
    // Create the user
    try {
      const user = await prisma.user.create({
        data: {
          email: email.toLowerCase(),
          name: `${firstName} ${lastName}`,
          firstName,
          lastName,
          password: hashedPassword,
        },
      });
      
      // Return success without exposing password
      const { password: _, ...userWithoutPassword } = user;
      return NextResponse.json({ 
        success: true,
        message: 'User created successfully',
        user: userWithoutPassword
      }, { status: 201 });
    } catch (createError) {
      console.error('Error creating user:', createError);
      return NextResponse.json(
        { error: 'Failed to create user', details: String(createError) },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('General registration error:', error);
    return NextResponse.json(
      { error: 'Something went wrong' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}