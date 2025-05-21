// In NextAuth v5 with the App Router, we need to properly handle requests
import { auth } from "@/auth";

// Create handler functions that call the auth() function correctly
export async function GET(request: Request) {
  return await auth(request);
}

export async function POST(request: Request) {
  return await auth(request);
}