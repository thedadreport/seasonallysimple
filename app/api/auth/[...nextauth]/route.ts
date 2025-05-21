// Import the handlers from the auth configuration
import { handlers } from "@/auth";

// Export the handler functions directly according to Next.js App Router conventions
export const GET = handlers;
export const POST = handlers;