import { NextResponse } from 'next/server';
import { verifyRegistrationResponse } from '@simplewebauthn/server';
import { getChallengeCookie, clearChallengeCookie, setSessionCookie } from '@/lib/auth';
import { clearSetupToken } from '@/lib/setup';
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

    const verification = await verifyRegistrationResponse({
      response: body,
      expectedChallenge: challengeData.challenge,
      expectedOrigin: [`http://${host}`, `https://${host}`],
      expectedRPID: rpID,
    });

    const { verified, registrationInfo } = verification;

    if (!verified || !registrationInfo) {
      return NextResponse.json({ error: 'Verification failed' }, { status: 400 });
    }

    const { credential, credentialDeviceType, credentialBackedUp } = registrationInfo;
    const { id, publicKey, counter, transports } = credential;

    // Create user and store authenticator
    const user = await prisma.user.create({
      data: {
        username: challengeData.username!,
        authenticators: {
          create: {
            id,
            publicKey: Buffer.from(publicKey).toString('base64url'),
            counter: BigInt(counter),
            credentialDeviceType,
            credentialBackedUp,
            transports: JSON.stringify(transports || []),
          },
        },
      },
    });

    // Cleanup and issue session
    clearSetupToken();
    await clearChallengeCookie();
    await setSessionCookie({ userId: user.id, username: user.username });

    return NextResponse.json({ verified: true });
  } catch (error) {
    console.error('Error verifying registration:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
