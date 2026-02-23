import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function proxy(request: NextRequest) {
  const authToken = request.cookies.get('auth_token')?.value;
  const { pathname } = request.nextUrl;

  const isLoginPage = pathname === '/login';
  const isProtectedPage = pathname === '/' || pathname.startsWith('/dashboard') || pathname.startsWith('/city') || pathname.startsWith('/profile');

  if (isLoginPage && authToken) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  if (isProtectedPage && !authToken) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/', '/login', '/dashboard/:path*', '/city/:path*', '/profile/:path*'],
};
