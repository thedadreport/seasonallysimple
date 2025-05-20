import { auth } from "next-auth";
import { authOptions } from "@/lib/auth/authOptions";

export async function getSession() {
  return await auth(authOptions);
}

// Export getServerSession for API routes
export async function getServerSession() {
  return await auth(authOptions);
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