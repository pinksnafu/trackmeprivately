import { NextResponse } from 'next/server';
import { verifyAuthenticationResponse } from '@simplewebauthn/server';
import { getChallengeCookie, clearChallengeCookie, setSessionCookie } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const challengeData = await getChallengeCookie();

    if (!challengeData) {
      return NextResponse.json({ error: 'Session expired or challenge missing' }, { status: 400 });
    }

    const host = req.headers.get('host') || 'localhost';
    const rpID = host.split(':')[0];

    // Find the authenticator in the database
    const credentialId = body.id;
    const dbAuthenticator = await prisma.authenticator.findUnique({
      where: { id: credentialId },
      include: { user: true },
    });

    if (!dbAuthenticator) {
      return NextResponse.json({ error: 'Credential not registered' }, { status: 400 });
    }

    const verification = await verifyAuthenticationResponse({
      response: body,
      expectedChallenge: challengeData.challenge,
      expectedOrigin: [`http://${host}`, `https://${host}`],
      expectedRPID: rpID,
      credential: {
        id: dbAuthenticator.id,
        publicKey: Buffer.from(dbAuthenticator.publicKey, 'base64url'),
        counter: Number(dbAuthenticator.counter),
        transports: JSON.parse(dbAuthenticator.transports || '[]'),
      },
    });

    const { verified, authenticationInfo } = verification;

    if (!verified || !authenticationInfo) {
      return NextResponse.json({ error: 'Authentication failed' }, { status: 400 });
    }

    // Update counter
    await prisma.authenticator.update({
      where: { id: dbAuthenticator.id },
      data: { counter: BigInt(authenticationInfo.newCounter) },
    });

    await clearChallengeCookie();
    await setSessionCookie({ userId: dbAuthenticator.user.id, username: dbAuthenticator.user.username });

    return NextResponse.json({ verified: true });
  } catch (error) {
    console.error('Error verifying login:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
