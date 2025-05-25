import { getSession as authGetSession } from "next-auth/react";
import { auth } from "@/auth";
import { NextRequest } from "next/server";

// Define TypeScript types for session
export interface SessionUser {
  id: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
  role?: "USER" | "MODERATOR" | "ADMIN" | null;
}

export interface Session {
  user?: SessionUser;
  expires: string;
}

// Use auth() function from NextAuth v5
export async function getSession() {
  return await auth();
}

/**
 * A wrapper for NextAuth's getServerSession that works with both v4 and v5
 * This provides compatibility during the transition from v4 to v5
 * 
 * @returns Session object with user information or null if not authenticated
 */
export async function getServerSessionWrapper(): Promise<Session | null> {
  try {
    // Get session from auth() function
    const session = await auth();
    
    // If we have a valid session, return it
    if (session?.user) {
      return {
        user: {
          id: session.user.id || "",
          name: session.user.name,
          email: session.user.email,
          image: session.user.image,
          role: session.user.role,
        },
        expires: session.expires || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      };
    }
    
    // Development mode bypass (similar to authOptions.ts)
    if (process.env.NODE_ENV === 'development') {
      console.log('DEVELOPMENT MODE: Using mock session for API access');
      return {
        user: {
          id: `dev-user-${Date.now()}`,
          name: "Development User",
          email: "dev@example.com",
          role: "ADMIN", // Grant admin role in development mode
        },
        expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      };
    }
    
    // Return null if no session was found
    return null;
  } catch (error) {
    console.error('Error getting server session:', error);
    return null;
  }
}

/**
 * Helper function to get the current user from the session
 * Returns null if the user is not authenticated
 */
export async function getCurrentUser(): Promise<SessionUser | null> {
  const session = await getServerSessionWrapper();
  return session?.user || null;
}

// Declare module augmentation for NextAuth
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      role?: "USER" | "MODERATOR" | "ADMIN" | null;
    };
  }
}