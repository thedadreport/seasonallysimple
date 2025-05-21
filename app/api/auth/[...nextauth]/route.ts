import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth/authOptions";

// NextAuth V5 Route handler with proper export format
const handler = NextAuth(authOptions);

// Export GET and POST functions directly for Next.js App Router
export const GET = handler;
export const POST = handler;