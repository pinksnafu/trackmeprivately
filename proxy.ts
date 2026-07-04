import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

async function decryptSession(token: string) {
  if (process.env.NODE_ENV === 'production' && !process.env.NEXTAUTH_SECRET) {
    throw new Error('CRITICAL SECURITY ERROR: NEXTAUTH_SECRET environment variable must be set in production.');
  }
  const secret = new TextEncoder().encode(
    process.env.NEXTAUTH_SECRET || 'dev-fallback-secret-for-privacy-tracker-jwt-key'
  );
  try {
    const { payload } = await jwtVerify(token, secret, {
      algorithms: ['HS256'],
    });
    return payload;
  } catch (error) {
    return null;
  }
}

export async function proxy(req: NextRequest) {
  const sessionToken = req.cookies.get('session_token')?.value;
  const session = sessionToken ? await decryptSession(sessionToken) : null;
  const { pathname } = req.nextUrl;

  // Paths requiring auth
  if (pathname === '/' || pathname.startsWith('/dashboard')) {
    if (!session) {
      return NextResponse.redirect(new URL('/login', req.url));
    }
  }

  // Paths requiring NO auth
  if (pathname === '/login') {
    if (session) {
      return NextResponse.redirect(new URL('/', req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/collect (analytics ingest)
     * - tracker.js (tracker script)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api/collect|tracker.js|_next/static|_next/image|favicon.ico).*)',
  ],
};
