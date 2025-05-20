import { getServerSession as authGetServerSession } from "next-auth";
import { authOptions } from "./authOptions";

export async function getSession() {
  return await authGetServerSession(authOptions);
}

// Export getServerSession wrapper for API routes
export async function getServerSessionWrapper() {
  return await authGetServerSession(authOptions);
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