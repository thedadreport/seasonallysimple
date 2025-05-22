import { NextResponse } from "next/server";
import { z } from "zod";
import { hash } from "bcrypt";
import { PrismaClient } from "@prisma/client";

// Create a dedicated PrismaClient instance for this API route
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
});

// Log database connection details
console.log("Registration API: Database URL check", {
  defined: !!process.env.DATABASE_URL,
  length: process.env.DATABASE_URL?.length || 0,
  valid: process.env.DATABASE_URL?.startsWith("postgresql://") || false,
  prefix: process.env.DATABASE_URL?.substring(0, 12) + "..." || "undefined"
});

// Registration validation schema - simple version for testing
const registerSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export async function POST(request: Request) {
  console.log("=== Registration API Called ===");
  
  try {
    // Parse request body
    const body = await request.json();
    console.log("Registration request for:", body.email);

    // Validate input data
    const validation = registerSchema.safeParse(body);
    if (!validation.success) {
      console.log("Validation failed:", validation.error.format());
      return NextResponse.json({ error: "Invalid input data" }, { status: 400 });
    }

    const { email, password, firstName, lastName } = validation.data;
    
    // Check if user already exists
    try {
      console.log("Checking if email exists:", email);
      const existingUser = await prisma.user.findUnique({
        where: { email: email.toLowerCase() },
      });

      if (existingUser) {
        console.log("Email already exists");
        return NextResponse.json({ error: "Email already exists" }, { status: 400 });
      }
    } catch (findError) {
      console.error("Error checking existing user:", findError);
      return NextResponse.json(
        { error: "Database error during user lookup" },
        { status: 500 }
      );
    }

    // Hash the password
    console.log("Hashing password...");
    const hashedPassword = await hash(password, 10);

    // Create the user
    try {
      console.log("Creating new user in database");
      const user = await prisma.user.create({
        data: {
          email: email.toLowerCase(),
          password: hashedPassword,
          firstName,
          lastName,
          name: `${firstName} ${lastName}`,
        },
      });

      console.log("User created successfully with ID:", user.id);
      
      // Remove password from response
      const { password: _, ...userWithoutPassword } = user;
      
      return NextResponse.json({
        success: true,
        message: "Registration successful",
        user: userWithoutPassword,
      }, { status: 201 });
    } catch (createError) {
      console.error("Error creating user:", createError);
      return NextResponse.json(
        { error: "Failed to create user account" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Unexpected registration error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  } finally {
    // Always disconnect Prisma client
    await prisma.$disconnect();
  }
}