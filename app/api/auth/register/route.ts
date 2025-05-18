import { NextResponse } from "next/server";
import { z } from "zod";
import { hash } from "bcrypt";
import prisma from "@/lib/prisma";

// Environment flag to use mock data instead of database
// This helps with development environments without proper DB setup
const USE_MOCK_MODE = process.env.NODE_ENV === 'development';

// Registration validation schema
const registerSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Validate input data
    const result = registerSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: "Invalid input", details: result.error.format() },
        { status: 400 }
      );
    }
    
    const { firstName, lastName, email, password } = body;
    
    // In development mode, use mock data
    if (USE_MOCK_MODE) {
      console.log('Using mock registration mode for development');
      
      // Create a mock user (not saved to database)
      const mockUser = {
        id: `mock-${Date.now()}`,
        firstName,
        lastName,
        name: `${firstName} ${lastName}`,
        email,
        password: await hash(password, 10), // Still hash it for realism
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      // Return the mock user (without password)
      const { password: _, ...userWithoutPassword } = mockUser;
      
      // Write the credentials to a local file for testing
      console.log(`Mock user created: ${email}`);
      
      return NextResponse.json(
        { 
          message: "User registered successfully (DEV MODE)", 
          user: userWithoutPassword 
        },
        { status: 201 }
      );
    }
    
    let userWithoutPassword;
    
    try {
      // Check if user already exists
      const existingUser = await prisma.user.findUnique({
        where: { email },
      });
      
      if (existingUser) {
        return NextResponse.json(
          { error: "Email already in use" },
          { status: 400 }
        );
      }
      
      // Hash the password
      const hashedPassword = await hash(password, 10);
      
      // Create the user in the database
      const newUser = await prisma.user.create({
        data: {
          firstName,
          lastName,
          name: `${firstName} ${lastName}`,
          email,
          password: hashedPassword,
        },
      });
      
      // Extract user data (without password)
      const { password: _, ...userData } = newUser;
      userWithoutPassword = userData;
      
    } catch (dbError) {
      console.error("Database error during registration:", dbError);
      throw new Error(`Database error: ${dbError instanceof Error ? dbError.message : String(dbError)}`);
    }
    
    // Return a success response
    return NextResponse.json(
      { 
        message: "User registered successfully", 
        user: userWithoutPassword 
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Registration error:", error);
    
    // Return more detailed error for debugging
    return NextResponse.json(
      { 
        error: "Something went wrong during registration",
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}