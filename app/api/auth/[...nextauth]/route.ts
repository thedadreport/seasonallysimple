import NextAuth from "next-auth/next";
import { authOptions } from "@/lib/auth/authOptions";

// Create a handler for NextAuth v5
const handler = NextAuth(authOptions);

// Export the handler as GET and POST
export { handler as GET, handler as POST };