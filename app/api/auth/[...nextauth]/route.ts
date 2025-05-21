// Import the auth handler from our auth.ts configuration
import NextAuth from "next-auth";
import authOptions from "@/lib/auth/authOptions";

// NextAuth v5 handler
const handler = NextAuth(authOptions);

// Export the handler as GET and POST functions
export const GET = handler;
export const POST = handler;