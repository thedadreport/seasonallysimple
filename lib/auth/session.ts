import { getSession as authGetSession } from "next-auth/react";
import { auth } from "next-auth"; // Import from next-auth for v5
import { authOptions } from "./authOptions";

// Fix for NextAuth v5 - use auth() instead of getServerSession
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