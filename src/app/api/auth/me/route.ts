import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth-session';
import User from '@/models/User';

export async function GET(req: NextRequest) {
  const session = await getSessionFromRequest(req);

  if (!session) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const user = await User.findByPk(session.id);
  if (!user) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  return NextResponse.json({
    success: true,
    user: {
      id: user.getDataValue('id'),
      nama: user.getDataValue('nama'),
      email: user.getDataValue('email'),
      username: user.getDataValue('username'),
      role: user.getDataValue('role'),
    },
  });
}
