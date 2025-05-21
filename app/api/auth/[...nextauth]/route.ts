// Standard NextAuth API route handler for Next.js App Router
import { handlers } from "@/auth";

// These are ready-to-use API route handlers that NextAuth provides
export const { GET, POST } = handlers;