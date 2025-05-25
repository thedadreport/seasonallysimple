import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

// List of paths that require authentication
const protectedPaths = [
  '/profile',
  '/saved-recipes',
  '/settings',
  '/upload-recipe',
  '/shopping-list',
  '/pantry',
  '/meal-plan',
  '/recipes/add'
];

// List of paths that are only for unauthenticated users
const authPaths = ['/login'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // TEMPORARY FIX: Allow all routes while authentication is being fixed
  // This will allow you to access all pages without authentication
  if (process.env.NODE_ENV === 'development' || process.env.DISABLE_AUTH === 'true') {
    console.log('Authentication check disabled for development');
    return NextResponse.next();
  }
  
  // Ignore API routes
  if (pathname.startsWith('/api/')) {
    return NextResponse.next();
  }
  
  // Check if the path is protected - exact match or starts with the path followed by /
  const isProtectedPath = protectedPaths.some(path => 
    pathname === path || pathname.startsWith(`${path}/`)
  );
  
  // Check if the path is auth-only
  const isAuthPath = authPaths.some(path => 
    pathname === path || pathname.startsWith(`${path}/`)
  );
  
  // Get the session token using Next-Auth JWT
  // Include secure option to work with both HTTP and HTTPS
  const token = await getToken({ 
    req: request, 
    secret: process.env.NEXTAUTH_SECRET,
    secureCookie: process.env.NODE_ENV === 'production'
  });
  
  // Debug token information
  console.log('Middleware token check:', {
    path: pathname,
    hasToken: !!token,
    tokenId: token?.sub?.substring(0, 8)
  });
  
  const session = !!token;
  
  // Redirect logic
  if (isProtectedPath && !session) {
    // Redirect unauthenticated users trying to access protected routes to login
    const url = new URL('/login', request.url);
    url.searchParams.set('callbackUrl', encodeURI(pathname));
    return NextResponse.redirect(url);
  } 
  
  if (isAuthPath && session) {
    // Redirect authenticated users away from auth pages (like login)
    return NextResponse.redirect(new URL('/', request.url));
  }
  
  return NextResponse.next();
}

// Only run middleware on specific paths
export const config = {
  matcher: [
    '/login', 
    '/profile',
    '/profile/:path*',
    '/saved-recipes',
    '/saved-recipes/:path*',
    '/settings',
    '/settings/:path*',
    '/upload-recipe',
    '/upload-recipe/:path*',
    '/shopping-list',
    '/shopping-list/:path*',
    '/pantry',
    '/pantry/:path*',
    '/meal-plan',
    '/meal-plan/:path*',
    '/recipes/add',
    '/api/debug/:path*'
  ]
};