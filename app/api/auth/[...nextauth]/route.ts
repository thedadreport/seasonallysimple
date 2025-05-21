import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth/authOptions";

// NextAuth V5 API Route
const handler = NextAuth(authOptions);

// Export as default function handler
export { handler as GET, handler as POST };