import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';

// Helper to retrieve the secret key securely, ensuring it's present at runtime in production
function getSecretKey() {
  if (process.env.NODE_ENV === 'production' && !process.env.NEXTAUTH_SECRET) {
    throw new Error('CRITICAL SECURITY ERROR: NEXTAUTH_SECRET environment variable must be set in production.');
  }
  return new TextEncoder().encode(
    process.env.NEXTAUTH_SECRET || 'dev-fallback-secret-for-privacy-tracker-jwt-key'
  );
}

export interface SessionPayload {
  userId: string;
  username: string;
}

export async function encryptSession(payload: SessionPayload): Promise<string> {
  const secret = getSecretKey();
  return await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('30d')
    .sign(secret);
}

export async function decryptSession(token: string): Promise<SessionPayload | null> {
  try {
    const secret = getSecretKey();
    const { payload } = await jwtVerify(token, secret, {
      algorithms: ['HS256'],
    });
    return payload as unknown as SessionPayload;
  } catch (error) {
    return null;
  }
}

export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get('session_token')?.value;
  if (!sessionToken) return null;
  return await decryptSession(sessionToken);
}

export async function setSessionCookie(payload: SessionPayload) {
  const token = await encryptSession(payload);
  const cookieStore = await cookies();
  cookieStore.set('session_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  });
}

export async function clearSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.delete('session_token');
}

export async function setChallengeCookie(challenge: string, username?: string) {
  const secret = getSecretKey();
  const token = await new SignJWT({ challenge, username: username || '' })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('5m') // challenges expire in 5 minutes
    .sign(secret);
  const cookieStore = await cookies();
  cookieStore.set('auth_challenge', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 300,
  });
}

export async function getChallengeCookie(): Promise<{ challenge: string; username?: string } | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth_challenge')?.value;
  if (!token) return null;
  try {
    const secret = getSecretKey();
    const { payload } = await jwtVerify(token, secret, { algorithms: ['HS256'] });
    return payload as unknown as { challenge: string; username?: string };
  } catch {
    return null;
  }
}

export async function clearChallengeCookie() {
  const cookieStore = await cookies();
  cookieStore.delete('auth_challenge');
}
