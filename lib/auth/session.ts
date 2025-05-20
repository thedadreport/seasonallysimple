import { getSession as authGetSession } from "next-auth/react";
import { getServerSession } from "next-auth";
import { authOptions } from "./authOptions";

export async function getSession() {
  return await getServerSession(authOptions);
}

//Remove this function as it's no longer needed

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