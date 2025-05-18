import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { PrismaClient } from "@prisma/client";
import { compare } from "bcrypt";

// Mock users for development (when database isn't accessible)
const mockUsers = new Map();

// Flag for development mode
const isDevelopmentMode = process.env.NODE_ENV === 'development';

const prisma = new PrismaClient();

export const authOptions: NextAuthOptions = {
  // Only use adapter in production, not in development
  ...(isDevelopmentMode ? {} : { adapter: PrismaAdapter(prisma) }),
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

        // Special case for development mode - let all logins through
        if (isDevelopmentMode) {
          // Allow login with any credentials in development mode
          // This is a security risk in production!
          console.log('DEVELOPMENT MODE: All login credentials accepted');
          
          return {
            id: `dev-user-${Date.now()}`,
            email: credentials.email,
            name: "Development User",
          };
        }
        
        try {
          const user = await prisma.user.findUnique({
            where: { email: credentials.email },
          });

          if (!user || !user.password) {
            return null;
          }

          const isPasswordValid = await compare(credentials.password, user.password);

          if (!isPasswordValid) {
            return null;
          }

          return {
            id: user.id,
            email: user.email,
            name: user.name,
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
  },
  secret: process.env.NEXTAUTH_SECRET,
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async session({ session, token }) {
      if (token.sub && session.user) {
        session.user.id = token.sub;
      }
      return session;
    },
  },
};