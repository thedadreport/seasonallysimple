import { getSession as authGetSession } from "next-auth/react";
// Import auth() function from central auth.ts file
import { auth } from "@/auth";

// Use auth() function from NextAuth v5
export async function getSession() {
  return await auth();
}

// This is the wrapper function that's being imported in API routes
export async function getServerSessionWrapper() {
  return await auth();
}

export async function getCurrentUser() {
  const session = await getSession();
  
  if (!session?.user?.email) {
    return null;
  }
  
  return session.user;
}

// Define TypeScript types for session
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name: string;
      email: string;
      image?: string;
    };
  }
}