import { NextRequest, NextResponse } from 'next/server';

const SESSION_COOKIE_NAME = 'bki_session';
const SESSION_TTL_SECONDS = 60 * 30;
const SESSION_VERSION = 1;
const isProd = process.env.NODE_ENV === 'production';

export type SessionUser = {
  id: number;
  role: 'ADMIN' | 'SURVEYOR';
  nama: string;
  email: string;
  username: string;
};

type SessionPayload = SessionUser & {
  exp: number;
  v: number;
};

const encoder = new TextEncoder();

function getSessionSecret(): string {
  const secret = process.env.AUTH_SESSION_SECRET;
  if (secret && secret.trim().length >= 32) {
    return secret.trim();
  }

  if (isProd) {
    throw new Error('AUTH_SESSION_SECRET wajib diisi (minimal 32 karakter) di production.');
  }

  return 'dev-only-session-secret-change-me-min-32-chars';
}

function toBase64Url(value: string): string {
  return Buffer.from(value, 'utf8')
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');
}

function fromBase64Url(value: string): string {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
  const padded = normalized + '='.repeat((4 - (normalized.length % 4)) % 4);
  return Buffer.from(padded, 'base64').toString('utf8');
}

async function signValue(value: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(getSessionSecret()),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(value));
  return Buffer.from(signature)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');
}

export async function createSessionToken(user: SessionUser): Promise<string> {
  const payload: SessionPayload = {
    ...user,
    exp: Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS,
    v: SESSION_VERSION,
  };

  const encodedPayload = toBase64Url(JSON.stringify(payload));
  const signature = await signValue(encodedPayload);
  return `${encodedPayload}.${signature}`;
}

export async function verifySessionToken(token: string): Promise<SessionUser | null> {
  const [encodedPayload, signature] = token.split('.');
  if (!encodedPayload || !signature) {
    return null;
  }

  const expectedSignature = await signValue(encodedPayload);
  if (signature !== expectedSignature) {
    return null;
  }

  try {
    const payload = JSON.parse(fromBase64Url(encodedPayload)) as SessionPayload;
    if (!payload || payload.v !== SESSION_VERSION || payload.exp <= Math.floor(Date.now() / 1000)) {
      return null;
    }

    if (!payload.id || !payload.role || !payload.username) {
      return null;
    }

    return {
      id: Number(payload.id),
      role: payload.role,
      nama: String(payload.nama || ''),
      email: String(payload.email || ''),
      username: String(payload.username || ''),
    };
  } catch {
    return null;
  }
}

function readCookieFromHeader(cookieHeader: string, cookieName: string): string | null {
  const parts = cookieHeader.split(';');
  for (const part of parts) {
    const [rawName, ...rawValue] = part.trim().split('=');
    if (rawName === cookieName) {
      return decodeURIComponent(rawValue.join('='));
    }
  }
  return null;
}

export async function getSessionFromRequest(req: NextRequest | Request): Promise<SessionUser | null> {
  const token = req instanceof NextRequest
    ? req.cookies.get(SESSION_COOKIE_NAME)?.value
    : readCookieFromHeader(req.headers.get('cookie') || '', SESSION_COOKIE_NAME);

  if (!token) {
    return null;
  }
  return verifySessionToken(token);
}

export async function attachSessionCookie(response: NextResponse, user: SessionUser): Promise<void> {
  const token = await createSessionToken(user);
  response.cookies.set({
    name: SESSION_COOKIE_NAME,
    value: token,
    httpOnly: true,
    secure: isProd,
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_TTL_SECONDS,
  });
}

export function clearSessionCookie(response: NextResponse): void {
  response.cookies.set({
    name: SESSION_COOKIE_NAME,
    value: '',
    httpOnly: true,
    secure: isProd,
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });
}
