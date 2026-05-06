import { NextRequest, NextResponse } from 'next/server';
import User from '@/models/User';
import { hashPassword } from '@/lib/password';

export async function GET() {
  try {
    const users = await User.findAll({
      where: { role: 'SURVEYOR' },
      attributes: ['id', 'nama', 'email', 'username', 'jabatanSurveyor', 'noTelp', 'jenisBank', 'noRekening', 'role'],
      order: [['id', 'DESC']],
    });

    return NextResponse.json({ success: true, data: users });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Terjadi kesalahan server.';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      nama,
      email,
      username,
      password,
      jabatanSurveyor,
      noTelp,
      jenisBank,
      noRekening,
    } = body;

    if (!nama || !email || !username || !password) {
      return NextResponse.json(
        { success: false, error: 'Nama, email, username, dan password wajib diisi.' },
        { status: 400 }
      );
    }

    if (String(password).length < 6) {
      return NextResponse.json(
        { success: false, error: 'Password minimal 6 karakter.' },
        { status: 400 }
      );
    }

    const [existingUsername, existingEmail] = await Promise.all([
      User.findOne({ where: { username } }),
      User.findOne({ where: { email } }),
    ]);

    if (existingUsername) {
      return NextResponse.json(
        { success: false, error: 'Username sudah digunakan.' },
        { status: 409 }
      );
    }

    if (existingEmail) {
      return NextResponse.json(
        { success: false, error: 'Email sudah digunakan.' },
        { status: 409 }
      );
    }

    const passwordHash = await hashPassword(String(password));

    const newUser = await User.create({
      nama,
      email,
      username,
      password: passwordHash,
      jabatanSurveyor: jabatanSurveyor || null,
      noTelp: noTelp || null,
      jenisBank: jenisBank || null,
      noRekening: noRekening || null,
      role: 'SURVEYOR',
    });

    return NextResponse.json({
      success: true,
      data: {
        id: newUser.getDataValue('id'),
        nama: newUser.getDataValue('nama'),
        email: newUser.getDataValue('email'),
        username: newUser.getDataValue('username'),
        role: newUser.getDataValue('role'),
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Terjadi kesalahan server.';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
