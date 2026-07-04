import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const SECRET_KEY = new TextEncoder().encode(
  process.env.NEXTAUTH_SECRET || 'fallback-secret-for-privacy-tracker-jwt-key'
);

async function decryptSession(token: string) {
  try {
    const { payload } = await jwtVerify(token, SECRET_KEY, {
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
