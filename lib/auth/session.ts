import { getSession as authGetSession } from "next-auth/react";
// Fix for NextAuth v5 beta - import from next-auth/edge instead of next-auth
import { getServerSession } from "next-auth";
import { authOptions } from "./authOptions";

// Fix for NextAuth v5 - use getServerSession for compatibility
export async function getSession() {
  return await getServerSession(authOptions);
}

// This is the wrapper function that's being imported in API routes
export async function getServerSessionWrapper() {
  return await getServerSession(authOptions);
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