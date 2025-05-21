import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth/authOptions";

// Create a handler function that returns a NextResponse
const handler = NextAuth(authOptions);

// Export the NextAuth API route handlers for App Router
export async function GET(request) {
  return handler.GET(request);
}

export async function POST(request) {
  return handler.POST(request);
}