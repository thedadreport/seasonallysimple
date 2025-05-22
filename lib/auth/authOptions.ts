// Skip the type import entirely and use 'any' for now to fix the build
// We can properly type this later
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { PrismaClient } from "@prisma/client";
import { compare } from "bcryptjs";

// Mock users for development (when database isn't accessible)
const mockUsers = new Map();

// Flag for development mode
const isDevelopmentMode = process.env.NODE_ENV === 'development';

const prisma = new PrismaClient();

// NextAuth configuration
const authOptions: any = {
  // DEPLOYMENT CHANGE: Always use adapter in production
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

        // DEPLOYMENT CHANGE: Disabled development mode authentication bypass
        // In production, we always validate against the database
        // Development mode bypass was commented out for production deployment
        /*
        if (isDevelopmentMode) {
          console.log('DEVELOPMENT MODE: All login credentials accepted');
          
          return {
            id: `dev-user-${Date.now()}`,
            email: credentials.email,
            name: "Development User",
          };
        }
        */
        
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
    async session({ session, token }: { session: any; token: any }) {
      if (token.sub && session.user) {
        session.user.id = token.sub;
      }
      return session;
    },
  },
};

export default authOptions;