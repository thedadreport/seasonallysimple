import { NextResponse } from "next/server";
import { hash } from "bcrypt";

// This is a simplified mock registration endpoint that doesn't use a database
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { firstName, lastName, email, password } = body;
    
    if (!email || !password || !firstName || !lastName) {
      return NextResponse.json({ 
        error: 'All fields are required' 
      }, { status: 400 });
    }
    
    // Mock successful registration
    console.log(`MOCK REGISTRATION - New user: ${email}`);
    
    // Simulate hashing for realistic timing
    await hash(password, 10);
    
    // Return mock successful response
    return NextResponse.json({ 
      success: true,
      message: 'User registered successfully (MOCK)',
      user: {
        id: `mock-${Date.now()}`,
        name: `${firstName} ${lastName}`,
        email: email.toLowerCase(),
        firstName,
        lastName,
        createdAt: new Date().toISOString()
      }
    }, { status: 201 });
    
  } catch (error) {
    console.error('Mock registration error:', error);
    return NextResponse.json({
      error: 'Something went wrong during registration'
    }, { status: 500 });
  }
}