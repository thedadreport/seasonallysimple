import { NextResponse } from "next/server";
import { z } from "zod";

// Simple login validation schema
const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

// Development mode login endpoint for direct access
export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Validate input data
    const result = loginSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: "Invalid input", details: result.error.format() },
        { status: 400 }
      );
    }
    
    // We no longer support direct login - all auth should go through NextAuth
    return NextResponse.json(
      { error: "This endpoint is deprecated. Please use NextAuth for authentication." },
      { status: 400 }
    );
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "Something went wrong during login" },
      { status: 500 }
    );
  }
}