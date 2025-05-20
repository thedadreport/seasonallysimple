import { getServerSession } from "next-auth/next";
import { authOptions } from "./authOptions";

export async function getSession() {
  return await getServerSession(authOptions);
}

// Export getServerSession for API routes
export async function getServerSession() {
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