import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

// List of paths that require authentication
const protectedPaths = [
  '/profile',
  '/saved-recipes',
  '/settings',
  '/upload-recipe',
  // Comment out shopping-list for testing
  // '/shopping-list'
];

// List of paths that are only for unauthenticated users
const authPaths = ['/login'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Check if the path is protected
  const isProtectedPath = protectedPaths.some(path => 
    pathname === path || pathname.startsWith(`${path}/`)
  );
  
  // Check if the path is auth-only
  const isAuthPath = authPaths.some(path => 
    pathname === path || pathname.startsWith(`${path}/`)
  );
  
  // Get the session token
  const token = await getToken({ 
    req: request,
    secret: process.env.NEXTAUTH_SECRET
  });
  
  // Redirect logic
  if (isProtectedPath && !token) {
    // Redirect unauthenticated users trying to access protected routes to login
    const url = new URL('/login', request.url);
    url.searchParams.set('callbackUrl', encodeURI(pathname));
    return NextResponse.redirect(url);
  } 
  
  if (isAuthPath && token) {
    // Redirect authenticated users away from auth pages (like login)
    return NextResponse.redirect(new URL('/', request.url));
  }
  
  return NextResponse.next();
}

// Only run middleware on specific paths
export const config = {
  matcher: [
    '/login', 
    '/profile/:path*',
    '/saved-recipes/:path*',
    '/settings/:path*',
    '/upload-recipe/:path*'
    // Comment out for testing
    // '/shopping-list/:path*'
  ]
};