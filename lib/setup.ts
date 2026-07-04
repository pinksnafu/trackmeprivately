import { prisma } from './prisma';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const TOKEN_FILE = path.join(process.cwd(), 'prisma', 'setup_token.txt');

export async function checkAndGenerateSetupToken(): Promise<string | null> {
  try {
    const userCount = await prisma.user.count();
    if (userCount > 0) {
      // Admin already exists, cleanup if token file somehow remains
      if (fs.existsSync(TOKEN_FILE)) {
        fs.unlinkSync(TOKEN_FILE);
      }
      return null;
    }

    // If file exists, return the existing token
    if (fs.existsSync(TOKEN_FILE)) {
      return fs.readFileSync(TOKEN_FILE, 'utf-8').trim();
    }

    // Otherwise, generate a new random 8-character token
    const token = crypto.randomBytes(4).toString('hex').toUpperCase(); // 8 characters hex
    fs.writeFileSync(TOKEN_FILE, token, 'utf-8');

    console.log('\n==================================================');
    console.log(`[SECURITY] First-time setup required.`);
    console.log(`Enter the Setup Token to register your Passkey:`);
    console.log(`Token: ${token}`);
    console.log('==================================================\n');

    return token;
  } catch (error) {
    console.error('Failed to handle setup token:', error);
    return null;
  }
}

export async function verifySetupToken(token: string): Promise<boolean> {
  const activeToken = await checkAndGenerateSetupToken();
  return activeToken !== null && activeToken === token.toUpperCase();
}

export function clearSetupToken() {
  if (fs.existsSync(TOKEN_FILE)) {
    fs.unlinkSync(TOKEN_FILE);
    console.log('[SECURITY] First-time setup completed. Setup token deleted.');
  }
}
