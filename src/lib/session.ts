import crypto from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { Model } from 'sequelize';
import Session from '@/models/Session';
import User from '@/models/User';

export const SESSION_COOKIE_NAME = 'bki_session';
export const SESSION_IDLE_TIMEOUT_MS = 60 * 60 * 1000;

export type AuthUser = {
  id: number;
  nama: string;
  email: string;
  username: string;
  noTelp: string | null;
  jenisBank: string | null;
  noRekening: string | null;
  jabatanSurveyor: string | null;
  role: 'ADMIN' | 'SURVEYOR';
};

export type AuthSession = {
  sessionId: string;
  user: AuthUser;
};

let sessionSchemaReady: Promise<void> | null = null;

export function getSessionCookieOptions(expiresAt?: Date) {
  return {
    httpOnly: true,
    sameSite: 'lax' as const,
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    ...(expiresAt ? { expires: expiresAt } : {}),
  };
}

export function getExpiredSessionCookieOptions() {
  return {
    ...getSessionCookieOptions(),
    maxAge: 0,
  };
}

export function sessionUnauthorized(message = 'Session tidak valid. Silakan login ulang.') {
  return NextResponse.json({ success: false, message }, { status: 401 });
}

export function sessionForbidden(message = 'Tidak memiliki akses.') {
  return NextResponse.json({ success: false, message }, { status: 403 });
}

export async function ensureSessionSchema() {
  sessionSchemaReady ??= Session.sync().then(() => undefined);
  return sessionSchemaReady;
}

export async function createSession(userId: number) {
  await ensureSessionSchema();

  const sessionId = crypto.randomBytes(32).toString('hex');
  const now = new Date();
  const expiresAt = new Date(now.getTime() + SESSION_IDLE_TIMEOUT_MS);

  await Session.create({
    id: sessionId,
    userId,
    expiresAt,
    lastSeenAt: now,
  });

  return { sessionId, expiresAt };
}

export async function deleteSession(sessionId?: string | null) {
  if (!sessionId) return;
  await ensureSessionSchema();
  await Session.destroy({ where: { id: sessionId } });
}

export function toAuthUser(user: Model): AuthUser {
  return {
    id: Number(user.getDataValue('id')),
    nama: String(user.getDataValue('nama')),
    email: String(user.getDataValue('email')),
    username: String(user.getDataValue('username')),
    noTelp: user.getDataValue('noTelp'),
    jenisBank: user.getDataValue('jenisBank'),
    noRekening: user.getDataValue('noRekening'),
    jabatanSurveyor: user.getDataValue('jabatanSurveyor'),
    role: user.getDataValue('role') as AuthUser['role'],
  };
}

export async function getAuthSession(req: NextRequest | Request): Promise<AuthSession | null> {
  await ensureSessionSchema();

  const sessionId =
    req instanceof NextRequest
      ? req.cookies.get(SESSION_COOKIE_NAME)?.value
      : readCookieFromHeader(req.headers.get('cookie'), SESSION_COOKIE_NAME);

  if (!sessionId) return null;

  const session = await Session.findByPk(sessionId);
  if (!session) return null;

  const now = new Date();
  const expiresAt = new Date(session.getDataValue('expiresAt'));
  if (expiresAt.getTime() <= now.getTime()) {
    await session.destroy();
    return null;
  }

  const user = await User.findByPk(session.getDataValue('userId'));
  if (!user) {
    await session.destroy();
    return null;
  }

  const nextExpiresAt = new Date(now.getTime() + SESSION_IDLE_TIMEOUT_MS);
  session.setDataValue('lastSeenAt', now);
  session.setDataValue('expiresAt', nextExpiresAt);
  await session.save();

  return {
    sessionId,
    user: toAuthUser(user),
  };
}

export async function requireAuth(req: NextRequest | Request) {
  const auth = await getAuthSession(req);
  if (!auth) return { auth: null, response: sessionUnauthorized() };

  return { auth, response: null };
}

export async function requireAdmin(req: NextRequest | Request) {
  const { auth, response } = await requireAuth(req);
  if (response || !auth) return { auth: null, response };
  if (auth.user.role !== 'ADMIN') return { auth: null, response: sessionForbidden() };

  return { auth, response: null };
}

function readCookieFromHeader(cookieHeader: string | null, name: string) {
  if (!cookieHeader) return null;

  const cookie = cookieHeader
    .split(';')
    .map((item) => item.trim())
    .find((item) => item.startsWith(`${name}=`));

  return cookie ? decodeURIComponent(cookie.slice(name.length + 1)) : null;
}
