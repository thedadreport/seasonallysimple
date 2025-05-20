import { getServerSession as nextAuthServerSession } from "next-auth/next";
import { authOptions } from "./authOptions";

export async function getSession() {
  return await nextAuthServerSession(authOptions);
}

// Export getServerSession for API routes
export async function getServerSession() {
  return await nextAuthServerSession(authOptions);
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