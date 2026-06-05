import { NextRequest, NextResponse } from 'next/server';
import {
  deleteSession,
  getExpiredSessionCookieOptions,
  SESSION_COOKIE_NAME,
} from '@/lib/session';

export async function POST(req: NextRequest) {
  await deleteSession(req.cookies.get(SESSION_COOKIE_NAME)?.value);

  const response = NextResponse.json({ success: true });
  response.cookies.set(SESSION_COOKIE_NAME, '', getExpiredSessionCookieOptions());

  return response;
}
