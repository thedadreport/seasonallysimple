import NextAuth from "next-auth";
import type { NextAuthConfig } from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { PrismaClient } from "@prisma/client";
import { compare } from "bcryptjs";

// Flag for development mode
const isDevelopmentMode = process.env.NODE_ENV === 'development';

const prisma = new PrismaClient();

// NextAuth configuration
const authConfig: NextAuthConfig = {
  // Always use adapter in production
  adapter: PrismaAdapter(prisma),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    }),
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }
        
        // Development mode authentication bypass
        if (isDevelopmentMode) {
          console.log('DEVELOPMENT MODE: All login credentials accepted');
          
          return {
            id: `dev-user-${Date.now()}`,
            email: credentials.email as string,
            name: "Development User",
            role: "ADMIN", // Grant admin role in development mode
          };
        }
        
        try {
          const email = credentials.email as string;
          const user = await prisma.user.findUnique({
            where: { email },
          });

          if (!user || !user.password) {
            return null;
          }

          const password = credentials.password as string;
          const isPasswordValid = await compare(password, user.password);

          if (!isPasswordValid) {
            return null;
          }

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
          };
        } catch (error) {
          console.error("Database error during login: ", error);
          return null;
        }
      },
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  cookies: {
    sessionToken: {
      name: process.env.NODE_ENV === 'production' ? '__Secure-next-auth.session-token' : 'next-auth.session-token',
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === 'production',
      },
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
  pages: {
    signIn: "/login",
  },
  callbacks: {
    // Ensure user ID and role are properly included in the session
    async session({ session, token }: { session: any; token: any }) {
      if (token.sub && session.user) {
        session.user.id = token.sub;
        
        // Add role to session if it exists in token
        if (token.role && 
            (token.role === "USER" || 
             token.role === "MODERATOR" || 
             token.role === "ADMIN")) {
          session.user.role = token.role;
        }
      }
      return session;
    },
    // Add user ID and role to the JWT token
    async jwt({ token, user }: { token: any; user: any }) {
      if (user) {
        token.sub = user.id;
        
        // Add user role to the token when it's available
        if (user.role && 
            (user.role === "USER" || 
             user.role === "MODERATOR" || 
             user.role === "ADMIN")) {
          token.role = user.role;
        }
      }
      return token;
    },
  },
};

// Create the auth handlers using the configuration
export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);