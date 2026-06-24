import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  
  // Public paths that don't require authentication
  const isPublicPath = path === '/auth/login' || path === '/auth/register' || path === '/';

  // We check for accessToken cookie, which is set by the API Gateway / Auth Service
  const token = request.cookies.get('accessToken')?.value;

  // We can also check localStorage, but middleware only runs on server so we rely on cookies.
  // For role-based checks in middleware without verifying signature (since gateway does actual auth):
  let userRole = 'GUEST';
  
  if (token) {
    try {
      // Decode JWT payload (format: header.payload.signature)
      const payloadBase64 = token.split('.')[1];
      if (payloadBase64) {
        const decodedJson = Buffer.from(payloadBase64, 'base64').toString();
        const payload = JSON.parse(decodedJson);
        userRole = payload.role || 'CUSTOMER';
      }
    } catch (e) {
      console.error('Error decoding token in middleware', e);
    }
  }

  // Redirect to login if trying to access protected route without token
  if (!isPublicPath && !token) {
    // Only protect strict paths
    if (path.startsWith('/customer') || path.startsWith('/seller') || path.startsWith('/admin') || path.startsWith('/profile') || path.startsWith('/checkout')) {
       return NextResponse.redirect(new URL('/auth/login', request.url));
    }
  }

  // Role Based Routing
  if (path.startsWith('/admin') && userRole !== 'ADMIN' && userRole !== 'SUPER_ADMIN') {
    return NextResponse.redirect(new URL('/', request.url));
  }

  if (path.startsWith('/seller') && userRole !== 'SELLER' && userRole !== 'ADMIN' && userRole !== 'SUPER_ADMIN' && userRole !== 'CUSTOMER') {
    return NextResponse.redirect(new URL('/', request.url));
  }

  // If logged in, redirect away from auth pages
  if (isPublicPath && token && path !== '/') {
    if (userRole === 'ADMIN' || userRole === 'SUPER_ADMIN') return NextResponse.redirect(new URL('/admin', request.url));
    if (userRole === 'SELLER') return NextResponse.redirect(new URL('/seller', request.url));
    return NextResponse.redirect(new URL('/customer/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/customer/:path*',
    '/seller/:path*',
    '/admin/:path*',
    '/profile/:path*',
    '/checkout/:path*',
    '/auth/:path*'
  ],
};
