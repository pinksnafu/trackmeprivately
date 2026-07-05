'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { startRegistration, startAuthentication } from '@simplewebauthn/browser';
import '../globals.css';

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error && error.message ? error.message : fallback;
}

export default function LoginPage() {
  const router = useRouter();
  const [needSetup, setNeedSetup] = useState<boolean | null>(null);
  const [username, setUsername] = useState('');
  const [setupToken, setSetupToken] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Check if system requires setup on mount
  useEffect(() => {
    async function checkStatus() {
      try {
        const res = await fetch('/api/auth/login/options', { method: 'POST' });
        const data = await res.json();
        
        if (res.status === 400 && data.error?.includes('setup')) {
          setNeedSetup(true);
        } else {
          setNeedSetup(false);
        }
      } catch (err) {
        console.error('Failed checking status', err);
        setNeedSetup(false);
      }
    }
    checkStatus();
  }, []);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // 1. Get registration options from server
      const optionsRes = await fetch('/api/auth/register/options', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, token: setupToken }),
      });

      const options = await optionsRes.json();
      if (!optionsRes.ok) {
        throw new Error(options.error || 'Failed to fetch registration options');
      }

      // 2. Trigger browser passkey registration (Touch ID, Face ID, etc.)
      const credential = await startRegistration({ optionsJSON: options });

      // 3. Send verification back to server
      const verifyRes = await fetch('/api/auth/register/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credential),
      });

      const verifyResult = await verifyRes.json();
      if (!verifyRes.ok) {
        throw new Error(verifyResult.error || 'Verification failed');
      }

      // 4. Redirect to dashboard
      router.push('/');
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'Passkey registration failed'));
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async () => {
    setError('');
    setLoading(true);

    try {
      // 1. Get login options
      const optionsRes = await fetch('/api/auth/login/options', {
        method: 'POST',
      });

      const options = await optionsRes.json();
      if (!optionsRes.ok) {
        throw new Error(options.error || 'Failed to fetch login options');
      }

      // 2. Trigger browser authentication challenge
      const assertion = await startAuthentication({ optionsJSON: options });

      // 3. Verify assertion
      const verifyRes = await fetch('/api/auth/login/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(assertion),
      });

      const verifyResult = await verifyRes.json();
      if (!verifyRes.ok) {
        throw new Error(verifyResult.error || 'Authentication verification failed');
      }

      // 4. Redirect to dashboard
      router.push('/');
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'Login failed. Ensure Passkey device is connected.'));
    } finally {
      setLoading(false);
    }
  };

  if (needSetup === null) {
    return (
      <div className="container" style={{ textAlign: 'center', marginTop: '15%' }}>
        <p className="subtitle">Checking platform status...</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
      <div className="card" style={{ width: '400px', padding: '2.5rem' }}>
        <h1 className="title" style={{ textAlign: 'center', marginBottom: '0.5rem' }}>Privacy Tracker</h1>
        <p className="subtitle" style={{ textAlign: 'center', marginBottom: '2rem' }}>
          {needSetup ? 'First-time Admin Setup' : 'Secure Admin Sign In'}
        </p>

        {error && (
          <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', color: '#f87171', padding: '0.75rem', borderRadius: '8px', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
            {error}
          </div>
        )}

        {needSetup ? (
          <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Admin Username</label>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="e.g. admin"
                style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-color)', padding: '0.75rem', borderRadius: '8px', color: '#fff', outline: 'none' }}
              />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Setup Token (From server logs)</label>
              <input
                type="text"
                required
                value={setupToken}
                onChange={(e) => setSetupToken(e.target.value)}
                placeholder="XXXXXXXX"
                style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-color)', padding: '0.75rem', borderRadius: '8px', color: '#fff', outline: 'none' }}
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              style={{ background: 'var(--accent-color)', color: '#fff', border: 'none', padding: '0.75rem', borderRadius: '8px', fontWeight: 600, cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', transition: 'background 0.2s', marginTop: '0.5rem' }}
            >
              {loading ? 'Registering...' : 'Register Passkey'}
            </button>
          </form>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <button
              onClick={handleLogin}
              disabled={loading}
              style={{ background: 'var(--accent-color)', color: '#fff', border: 'none', padding: '0.9rem', borderRadius: '8px', fontWeight: 600, cursor: 'pointer', transition: 'background 0.2s', fontSize: '1rem' }}
            >
              {loading ? 'Authenticating...' : 'Sign In with Passkey'}
            </button>
            <p className="subtitle" style={{ textAlign: 'center', fontSize: '0.8rem', marginTop: '0.5rem' }}>
              Uses standard FIDO2/WebAuthn biometrics (Touch ID, Face ID, or Windows Hello)
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
