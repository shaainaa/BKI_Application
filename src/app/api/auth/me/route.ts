import { NextRequest, NextResponse } from 'next/server';
import {
  getSessionCookieOptions,
  requireAuth,
  SESSION_COOKIE_NAME,
} from '@/lib/session';

export async function GET(req: NextRequest) {
  const { auth, response } = await requireAuth(req);
  if (response || !auth) return response;

  const res = NextResponse.json({ success: true, user: auth.user });
  res.cookies.set(SESSION_COOKIE_NAME, auth.sessionId, getSessionCookieOptions());

  return res;
}
