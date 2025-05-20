import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth/authOptions";

// NextAuth v5 route handlers
const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };