import { DefaultSession } from "next-auth";

declare module "next-auth" {
  /**
   * Extend the built-in session types
   */
  interface Session {
    user: {
      id: string;
      role?: "USER" | "MODERATOR" | "ADMIN" | null;
    } & DefaultSession["user"];
  }

  /**
   * Extend the built-in user types
   */
  interface User {
    role?: "USER" | "MODERATOR" | "ADMIN" | null;
  }
}

declare module "next-auth/jwt" {
  /** Extend the built-in JWT types */
  interface JWT {
    role?: "USER" | "MODERATOR" | "ADMIN" | null;
  }
}